# BuryMyProject.dev — Plan technique

Oct 17, 2026 · @Clement · Mis à jour après implémentation des Milestones 0 à 4

## Vue d'ensemble

BuryMyProject.dev est une app web où les développeurs créent des "tombes" pour leurs projets abandonnés — avec épitaphe, cause de mort, stack technique, et un lien public partageable.

**Périmètre v1**

- Authentification email/password via Supabase Auth, + Google OAuth (en cours de finalisation, cf. Milestone 1)
- CRUD sur les tombes (table `graves` — pas de notion de cimetières multiples, cf. section Architecture)
- Affichage public d'une tombe via lien partageable (`/graves/:slug`)
- Cimetière global public (`/cemetery`) et cimetière personnel (`/my-graves`)
- Pas de paiement, pas d'upload de fichiers, pas de notifications

## Stack technique (réelle)

| Couche | Technologie | Notes |
| --- | --- | --- |
| Framework | **Vite + React 19 (CSR)** | Pas de Next.js, pas de SSR. Routing via `react-router-dom` v7 |
| Langage | TypeScript strict | `strict: true` dans `tsconfig.app.json` |
| Auth + BDD | Supabase | Auth, PostgreSQL, RLS, client JS v2 (`@supabase/supabase-js`) |
| Styling | **CSS Modules** (pas de Tailwind) | Tokens définis dans `src/index.css` (`--color-*`, `--font-*`) |
| Formulaires | react-hook-form + zod + `@hookform/resolvers` | Validation côté client ; RLS fait office de garde-fou serveur |
| Hosting | À définir (Vercel/Netlify/Cloudflare Pages en mode SPA statique) | Voir section Scaling |

**Variables d'environnement** (`.env.local`, non committé — voir `.env.example`)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
```

Pas de `SUPABASE_SERVICE_ROLE_KEY` côté app : toute la sécurité repose sur les policies RLS, il n'y a pas de backend custom.

## Base de données (état réel, Supabase projet `bibzxeryywqvjwoejgwz`)

### Table `graves`

```sql
create table public.graves (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references auth.users(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 100),
  description  text,
  epitaph      text,
  born         date,
  died         date,
  cause        text,
  tech_stack   text[] not null default '{}',
  public_slug  text unique not null default translate(encode(gen_random_bytes(6), 'base64'), '+/=', '-_'),
  is_public    boolean not null default true,
  tombstone_bg text not null default 'grave_bg_01.webp',  -- assigned once at creation, fixed forever (not user-editable yet)
  tombstone_fg text not null default 'grave_01.webp',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.graves
  add constraint died_after_born check (died is null or born is null or died >= born);
```

**Pas de table `graveyards`** : un utilisateur n'a qu'un seul "cimetière" implicite (toutes ses tombes). Le "cimetière global" (`/cemetery`) est une vue sur toutes les tombes publiques de tous les utilisateurs — pas une table séparée.

### Index

```sql
create index graves_author_id_idx on public.graves (author_id);
create index graves_public_slug_idx on public.graves (public_slug);
create index graves_created_at_idx on public.graves (created_at desc);
```

### Trigger `updated_at`

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_graves_updated_at
  before update on public.graves
  for each row execute function public.set_updated_at();
```

### Row Level Security

```sql
alter table public.graves enable row level security;

create policy "public can view public graves"
  on public.graves for select
  using (is_public = true or auth.uid() = author_id);

create policy "authenticated users can create graves"
  on public.graves for insert
  with check (auth.uid() = author_id);

create policy "author can update own graves"
  on public.graves for update
  using (auth.uid() = author_id);

create policy "author can delete own graves"
  on public.graves for delete
  using (auth.uid() = author_id);
```

### Types TypeScript

`src/types/database.types.ts` est écrit à la main (pas de CLI Supabase liée au projet). Si la CLI est liée un jour : `npx supabase gen types typescript --project-id bibzxeryywqvjwoejgwz > src/types/database.types.ts`, puis vérifier que `src/features/grave/types.ts` reste aligné.

## Sécurité

- RLS activé et complet (SELECT/INSERT/UPDATE/DELETE) sur `graves` — voir ci-dessus.
- Validation des inputs côté client via zod (`src/lib/schemas/grave.ts`) ; pas de validation serveur additionnelle (pas de backend custom) — **la RLS est la seule barrière d'autorisation réelle**, donc toute nouvelle requête Supabase doit être pensée en gardant ça à l'esprit.
- Pas de `SUPABASE_SERVICE_ROLE_KEY` dans le code client (uniquement la clé `anon`/`publishable`).
- `public_slug` généré côté BDD (`default` SQL), jamais côté client.
- Headers de sécurité (`X-Frame-Options`, `X-Content-Type-Options`, etc.) : **pas encore configurés**, à faire au niveau de l'hébergeur au moment du déploiement (pas de `next.config.js` ici, voir config Vercel/Netlify `_headers`).
- `.env.local` et tout `.env.*` (sauf `.env.example`) sont ignorés par git.

## Architecture des routes (réelle)

### Structure fichiers

```
src/
├── routes/
│   └── index.tsx                      # AppRouter : BrowserRouter + AuthProvider + Routes
├── features/
│   ├── auth/
│   │   ├── AuthContext.ts             # Contexte React (session/user/loading)
│   │   ├── AuthProvider.tsx           # Provider : écoute supabase.auth.onAuthStateChange
│   │   ├── useAuth.ts                 # Hook de consommation du contexte
│   │   ├── ProtectedRoute.tsx         # Wrapper de route, redirige vers /login?redirectTo=...
│   │   ├── AuthLayout.tsx / .module.css
│   │   ├── LoginPage.tsx
│   │   └── SignUpPage.tsx
│   ├── grave/
│   │   ├── types.ts                   # Type Grave (aligné sur le schéma SQL)
│   │   ├── GraveForm.tsx / .module.css
│   │   ├── NewGravePage.tsx           # /graves/new (protégé)
│   │   └── GravePage.tsx / .module.css # /graves/:slug (public)
│   ├── graveyard/
│   │   ├── MyGravesPage.tsx           # /my-graves (protégé)
│   │   └── CemeteryPage.tsx           # /cemetery (public)
│   └── landing/
│       ├── LandingPage.tsx / .module.css
│       └── Hero.tsx / .module.css
├── shared/
│   ├── components/
│   │   ├── Navbar.tsx                 # dynamique selon session
│   │   ├── LinkButton.tsx / Button.tsx
│   │   ├── TombstoneCard.tsx          # carte tombe réutilisable (landing, my-graves, cemetery, grave page)
│   │   ├── TagInput.tsx               # input de tags pour tech_stack
│   │   ├── GraveGrid.module.css       # layout partagé des grilles (my-graves, cemetery)
│   │   └── NotFoundPage.tsx           # 404 thématique, catch-all
│   └── lib/
│       └── randomGrave.ts             # pairing aléatoire des images de tombes
├── lib/
│   ├── supabase.ts                    # client Supabase typé
│   ├── schemas/
│   │   └── grave.ts                   # schema zod
│   └── constants/
│       └── graveContent.ts            # listes statiques d'epitaphs/causes pour le bouton "✨ Generate"
└── types/
    └── database.types.ts
```

### Routes et accès

| Route | Accès | Description |
| --- | --- | --- |
| `/` | Public | Landing page, "Recently Buried" = 6 dernières tombes publiques |
| `/login` | Public | Connexion (redirige vers `redirectTo` ou `/my-graves`) |
| `/signup` | Public | Inscription (email de confirmation géré par Supabase Auth) |
| `/cemetery` | Public | Cimetière global, toutes les tombes publiques |
| `/graves/:slug` | Public | Tombe individuelle, 404 thématique si non trouvée/non publique |
| `/my-graves` | Authentifié (`ProtectedRoute`) | Mes tombes (publiques + privées), suppression, empty state |
| `/graves/new` | Authentifié (`ProtectedRoute`) | Création d'une tombe |
| `*` | Public | 404 thématique générique |

Pas de middleware serveur (CSR pur) : la protection de route est gérée par `ProtectedRoute` côté client (redirection si pas de session), la sécurité réelle des données reste portée par la RLS Supabase.

## UX Guidelines (toujours valables, en grande partie implémentées)

- Labels explicites au-dessus des champs, `(optional)` dans le label pour les champs non requis — fait dans `GraveForm`, `LoginPage`, `SignUpPage`.
- Erreurs de validation inline + `aria-describedby` — fait.
- État de chargement sur les boutons submit ("Logging in...", "Burying in progress...") — fait.
- Redirection post-création vers `/graves/:slug` — fait.
- Tech stack en tags (ajout/suppression) — fait (`TagInput`).
- 404 thématique sur `/graves/:slug` et catch-all — fait.
- Empty state sur `/my-graves` — fait ("No projects buried here... yet.").
- Redirect post-login vers la page d'origine (`redirectTo`) — fait.
- Messages d'erreur humains (pas de code technique affiché) — fait.
- `<html lang="en">` — fait (tout le texte UI est en anglais, cf. section Localisation).
- Zones tactiles ≥44×44px sur les inputs/boutons de formulaire — fait.
- **Restant à faire** : vérification a11y approfondie (contraste, navigation clavier complète), responsive fin sur tous les breakpoints, métadonnées Open Graph dynamiques par tombe (nécessite une solution serveur/edge, cf. Scaling).

## État d'avancement — Milestones

### Milestone 0 — Base de données ✅ fait

- [x] Migration de la table `graves` existante (renommage colonnes, champs optionnels, `is_public`, `updated_at`)
- [x] Contrainte `died >= born`
- [x] Index (`author_id`, `public_slug`, `created_at`)
- [x] Trigger `updated_at`
- [x] RLS complet (SELECT/INSERT/UPDATE/DELETE)
- [x] Types TypeScript manuels alignés (`src/types/database.types.ts`, `src/features/grave/types.ts`)

### Milestone 1 — Auth ✅ fait (⚠️ email non fiable, cf. ci-dessous)

- [x] `AuthProvider`/`useAuth`/`ProtectedRoute`
- [x] `LoginPage` / `SignUpPage` stylées, validées (zod + react-hook-form)
- [x] Logout + redirect `/`
- [x] `Navbar` dynamique selon session
- [x] `emailRedirectTo` explicite dans `signUp()` (origin + base path, robuste multi-environnement)
- [x] Config Supabase Auth : `site_url` + `uri_allow_list` pointent vers GitHub Pages (+ localhost dev/e2e)
- [x] `GoogleSignInButton` ajouté sur Login/SignUp (code prêt, cf. "Google OAuth — reste à faire")
- [x] **Test manuel** : signup, login, création de tombe publique/privée, RLS (lecture/update/delete croisés entre utilisateurs) — tout validé via script contre le vrai projet Supabase le 17/10/2026. Seul point non testable automatiquement : le vrai flow d'email de confirmation (bloqué par le rate limit du mailer par défaut, cf. Milestone 1) — contourné via `mailer_autoconfirm` temporaire pour le test, remis à `false` immédiatement après.

#### ⚠️ Problème connu : emails de confirmation peu fiables

Le projet Supabase n'a **pas de SMTP personnalisé configuré** (`smtp_host` vide). Il utilise le service email par défaut de Supabase, limité à **2 emails/heure** et prévu uniquement pour du test — pas pour de la prod. Conséquence observée : signup sans réception d'email, lien de confirmation expiré/invalide.

Décision prise : **mettre Resend de côté pour l'instant** (nécessite un nom de domaine vérifié pour envoyer vers de vrais utilisateurs — `coleim.github.io` ne peut pas être vérifié, la zone DNS appartient à GitHub). On contourne via Google OAuth en attendant.

**Reste à faire plus tard** : trouver une vraie solution d'envoi d'email (acheter un petit domaine dédié type `burymyproject.dev` chez un registrar, le vérifier sur Resend/un autre fournisseur SMTP transactionnel, puis reconfigurer `smtp_host`/`smtp_user`/`smtp_pass` via l'API Management Supabase) pour que l'auth email/password redevienne pleinement fiable en plus de Google OAuth.

#### Google OAuth — reste à faire

Code front déjà en place (`GoogleSignInButton.tsx`, intégré sur `LoginPage` et `SignUpPage`, appelle `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: origin + BASE_URL } })`). Il manque la configuration :

- [ ] **Google Cloud Console** : créer un projet (ou réutiliser), configurer l'OAuth consent screen (type External), créer des identifiants **OAuth client ID** (type Web application)
- [ ] **Authorized redirect URI** à renseigner exactement : `https://bibzxeryywqvjwoejgwz.supabase.co/auth/v1/callback`
- [ ] Récupérer le **Client ID** et le **Client Secret**
- [ ] Activer le provider côté Supabase via l'API Management (`PATCH /v1/projects/{ref}/config/auth` avec `external_google_enabled: true`, `external_google_client_id`, `external_google_secret`)
- [ ] **Test** : bouton "Continue with Google" sur `/login` et `/signup`, vérifier la redirection complète (Google → Supabase callback → retour sur l'app, session créée, redirection vers `/my-graves`)

### Milestone 2 — Créer une tombe ✅ fait

- [x] `lib/schemas/grave.ts` (zod)
- [x] `GraveForm` (name, epitaph, description, born, died, cause, tech_stack en tags, is_public)
- [x] `/graves/new` protégée, insert Supabase, redirection vers `/graves/:slug`
- [x] **Test manuel** : création de tombe validée en conditions réelles (cf. Milestone 1)

### Milestone 3 — Afficher les tombes ✅ fait

- [x] `TombstoneCard` partagé
- [x] `/graves/:slug` (SSR non applicable en CSR ; fetch client + 404 thématique)
- [x] `/my-graves` (grille, suppression, empty state)
- [x] `/cemetery` (grille publique, limite 24, pas encore de pagination infinie)
- [x] Landing : "Recently Buried" branché sur les vraies données
- [x] **Test manuel** : confirmé qu'une tombe privée n'est accessible ni par un visiteur anonyme ni par un autre utilisateur authentifié (cf. Milestone 1)

### Milestone 4 — Polish UX & a11y ⚠️ partiel

- [x] `lang="en"`, labels, erreurs inline, messages humains, tailles tactiles
- [x] Localisation : tout le texte UI repassé en anglais (cf. section Localisation)
- [x] Tests unitaires (Vitest + RTL) et E2E (Playwright) — cf. section Tests locaux
- [x] Déploiement GitHub Pages (CI + hack SPA) — cf. section GitHub Pages
- [ ] Vérification a11y approfondie (contraste réel mesuré, navigation clavier complète sur tous les composants interactifs)
- [ ] Responsive fin sur petits écrans (actuellement hérité du CSS existant, pas re-testé composant par composant)
- [ ] Métadonnées Open Graph dynamiques par tombe (voir Scaling, Phase 2)
- [ ] Headers de sécurité (`X-Frame-Options`, etc.) — à ajouter en meta tags ou via un futur hébergeur supportant les headers custom (GitHub Pages ne permet pas de headers custom nativement)
- [ ] Verification d'architecture et scalabilités
- [x] Review du project : Good practices a verifier, tels que KISS, YAGNI, DRY, etc ... — fait un premier passage DRY : le pattern fond+overlay (`.page::before`/`.page::after`) était dupliqué à l'identique dans 7 fichiers CSS, factorisé via `composes` (`src/shared/styles/pageBackground.module.css`). Note technique : les `@keyframes` ne peuvent **pas** être partagées de la même façon (CSS Modules localise le nom utilisé dans `animation:` même sans `@keyframes` local correspondant dans le fichier — testé, ça casse l'animation en silence) ; elles restent dupliquées intentionnellement (3 occurrences identiques, `TombstoneCard`/`LandingPage`/`GravePage`).
## Mise en production et scaling (1 → 1 000 → 10 000 users)

### Phase 0 — Mise en production initiale

- [x] Déploiement statique sur **GitHub Pages** (CI via GitHub Actions, cf. section GitHub Pages ci-dessus)
- [x] Variables d'env en prod (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`) injectées via secrets GitHub Actions au build
- [ ] Domaine custom + HTTPS (optionnel, GitHub Pages fournit déjà HTTPS sur `coleim.github.io`)
- [ ] Headers de sécurité (non supportés nativement par GitHub Pages — à revoir si migration vers un hébergeur avec contrôle des headers, cf. Phase 2)
- [ ] Monitoring erreurs front (Sentry free tier ou équivalent)
- [ ] Vérifier le plan Supabase Free (backups, quotas) et activer un export manuel périodique si besoin
- [ ] Analytics simple (Plausible/Umami) pour mesurer l'usage réel
- [ ] Test de securité (pentests)

### Phase 1 — Jusqu'à ~1 000 users

- [ ] Surveiller les quotas Supabase Free (500 MB DB, 50k MAU auth) ; passer en Pro si besoin
- [ ] Pagination réelle sur `/cemetery` (actuellement limité à 24 lignes, pas de `range()`/curseur)
- [ ] Cache client (`@tanstack/react-query` ou équivalent) pour éviter les refetchs inutiles
- [ ] Sitemap + meta tags statiques basiques pour le SEO
- [ ] Rate limiting applicatif sur signup/création de tombe (abuse prevention)
- [ ] Tests automatisés sur les flows critiques (Playwright ou Vitest + Testing Library)

### Phase 2 — Jusqu'à ~10 000 users

- [ ] Reconsidérer le rendu des pages publiques : SSR/prerendering (migration partielle vers Next.js/Remix ou prerendering Vite) pour le SEO et les meta OG dynamiques par tombe
- [ ] Alternative plus légère : fonction serverless (Vercel/Supabase Edge Function) servant un HTML minimal avec meta OG pour les bots, SPA pour le reste
- [ ] Index supplémentaires selon requêtes observées, `explain analyze` sur `/cemetery`
- [ ] Cache (Redis/Upstash) pour les stats globales (nb de tombes, cause la plus fréquente)
- [ ] CDN pour les assets (`grave_*.png`), conversion WebP/AVIF si pas déjà fait
- [ ] Observabilité : logs structurés, alerting, dashboard Supabase
- [x] Tests automatisés contre les policies RLS (pas seulement manuels) — cf. `scripts/rls-integration-test.mjs`
- [ ] Rate limiting renforcé (Edge Functions / WAF Cloudflare)
- [ ] Dimensionner les plans Supabase/hosting selon la charge réelle

## Localisation

Tout le texte UI est en **anglais en dur dans le JSX** (pas de dictionnaire i18n pour l'instant, KISS). `PLAN.MD` reste en français (doc interne équipe). Une vraie localisation multi-langue sera traitée plus tard, à la demande.

## GitHub Pages — déploiement

L'app est déployée en continu sur GitHub Pages (project page `coleim.github.io/burymyproject.dev/`) :

- `vite.config.ts` : `base: "/burymyproject.dev/"`
- `src/routes/index.tsx` : `BrowserRouter basename={import.meta.env.BASE_URL}`
- `public/404.html` : hack SPA standard (pattern `rafgraph/spa-github-pages`) pour que les reloads sur des routes profondes (`/my-graves`, `/graves/:slug`, etc.) ne retournent pas un 404 brut
- `index.html` : script de restauration d'URL correspondant, exécuté avant le montage de React Router
- `.github/workflows/deploy.yml` : à chaque push sur `main` — job `test` (lint, tsc, unit, e2e) → job `build` (avec les secrets `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`) → job `deploy` (`actions/deploy-pages`). Le déploiement ne se déclenche que si les tests passent.
- **Reste à faire côté GitHub** : activer Pages dans Settings (source : GitHub Actions) et renseigner les secrets de repo `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.

## Tests locaux

### Unitaire — Vitest + React Testing Library

- Config : `vitest.config.ts` (environnement `jsdom`, alias `@`, exclut `e2e/**`)
- Scripts : `npm run test:unit` / `npm run test:unit:watch`
- Couverture actuelle (15 tests, 4 fichiers) :
  - `src/lib/schemas/grave.test.ts` — règles zod (`died >= born`, champs optionnels, limite `tech_stack`)
  - `src/shared/components/TagInput.test.tsx` — ajout/suppression de tags, anti-doublon, limite `max`
  - `src/shared/components/TombstoneCard.test.tsx` — rendu des props, lien conditionnel vers `/graves/:slug`
  - `src/features/auth/ProtectedRoute.test.tsx` — loading/redirection/rendu selon la session (mock de `useAuth`)

### E2E — Playwright (interception réseau native, pas de MSW)

Note : le plan initial prévoyait MSW, mais l'interception native de Playwright (`page.route()`) s'est avérée suffisante et plus simple (pas de service worker à gérer sous un `basename`) — même objectif atteint (aucune dépendance à un vrai backend Supabase pendant les tests).

- Config : `playwright.config.ts` (serveur `vite dev` sur le port 4300, `baseURL` incluant le `base` GitHub Pages)
- Mocks réseau : `e2e/mocks/supabase.ts` (signup, login, liste de tombes, insertion)
- Scripts : `npm run test:e2e`
- Couverture actuelle (12 tests, 5 fichiers) :
  - `e2e/landing.spec.ts` — landing + navigation
  - `e2e/auth.spec.ts` — validation signup, confirmation email, email déjà utilisé, erreur login, redirection après login
  - `e2e/protected-routes.spec.ts` — redirection `/login?redirectTo=...` sur `/my-graves` et `/graves/new`, retour à la page d'origine après connexion
  - `e2e/create-grave.spec.ts` — connexion → création d'une tombe → redirection vers `/graves/:slug`
  - `e2e/404.spec.ts` — route inconnue et slug de tombe inexistant

### Intégration — RLS contre le vrai Supabase

- `scripts/rls-integration-test.mjs` (`npm run test:rls`) : contrairement aux tests unitaires/E2E (mockés), ce script tourne contre le **vrai projet Supabase**
- Utilise la clé `service_role` **uniquement** pour créer/supprimer 2 utilisateurs de test déjà confirmés (`auth.admin.createUser({ email_confirm: true })`, bypass du mailer — pas de dépendance au rate limit d'envoi d'email)
- Toutes les assertions utilisent ensuite des clients **anon** connectés normalement (comme un vrai navigateur), pour valider réellement les policies RLS : lecture publique/privée, cross-user read/update/delete
- Nettoyage systématique en `finally` (users + graves supprimés), même si une assertion échoue
- Nécessite le secret `SUPABASE_SERVICE_ROLE_KEY` en plus des deux secrets existants

### CI

Intégré dans `.github/workflows/deploy.yml` (job `test`), bloque le déploiement si lint/tsc/unit/rls/e2e échouent.

## Features à venir (non prioritaires)

- **Choisir sa tombe** : actuellement, l'image de tombe (fond + premier plan) est assignée aléatoirement à la création et fixée définitivement (colonnes `tombstone_bg`/`tombstone_fg` sur `graves`). Un bouton désactivé "🔒 Choose your tombstone" est déjà présent dans `/graves/new` pour montrer que cette fonctionnalité arrivera. Prévu comme **feature payante** : permettre à l'utilisateur de choisir manuellement son image de tombe parmi la collection (ou en débloquer plus).
- **Génération IA d'epitaph/cause** : le bouton "✨ Generate" pioche actuellement dans des listes statiques (`src/lib/constants/graveContent.ts`, ~20 phrases chacune). Prévu à terme : remplacer par un vrai appel à un modèle IA pour générer une phrase contextuelle (basée sur le nom du projet, la stack technique, etc.), sans changer l'UX du bouton.
- **Éditer une tombe existante** (cf. `FEATURES.MD`) : actuellement une tombe créée ne peut plus être modifiée après coup (seulement supprimée). À concevoir : formulaire d'édition réutilisant `GraveForm`, policy RLS `UPDATE` déjà en place côté BDD.

## Rappel de méthode

- Les Milestones sont à valider dans l'ordre ; les cases non cochées ci-dessus sont les prochaines actions à mener.
- Toute évolution de la BDD en production doit passer par une migration SQL explicite et versionnée (envisager `supabase/migrations/` si la CLI est liée un jour), pas uniquement par le Dashboard.




