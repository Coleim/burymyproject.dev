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
  project_url  text check (project_url is null or (char_length(project_url) <= 500 and project_url ~* '^https?://[^\s]+$')),  -- migration supabase/migrations/20261020120000_add_project_url.sql
  public_slug  text unique not null default translate(encode(gen_random_bytes(6), 'base64'), '+/=', '-_'),
  is_public    boolean not null default true,  -- SUPPRIMÉE le 20/10/2026 (20261020220000_drop_is_public.sql) ; les tombes sont toutes publiques
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
-- graves_public_slug_idx supprimé (doublon de l'index de la contrainte UNIQUE graves_public_slug_unique)
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

> Ces policies sont l'état **initial**. L'état actuel (rôles, `(select auth.uid())`, `hidden`, plus de tombes privées) est décrit dans « Durcissement », « Avant l'ouverture au public » et « Tombes publiques uniquement » ci-dessous ; les migrations de `supabase/migrations/` font foi.

### Types TypeScript

`src/types/database.types.ts` est écrit à la main (pas de CLI Supabase liée au projet). Si la CLI est liée un jour : `npx supabase gen types typescript --project-id bibzxeryywqvjwoejgwz > src/types/database.types.ts`, puis vérifier que `src/features/grave/types.ts` reste aligné.

## Sécurité

- RLS activé et complet (SELECT/INSERT/UPDATE/DELETE) sur `graves` — voir ci-dessus.
- Validation des inputs côté client via zod (`src/lib/schemas/grave.ts`) ; pas de validation serveur additionnelle (pas de backend custom) — **la RLS est la seule barrière d'autorisation réelle**, donc toute nouvelle requête Supabase doit être pensée en gardant ça à l'esprit.
- Pas de `SUPABASE_SERVICE_ROLE_KEY` dans le code client (uniquement la clé `anon`/`publishable`).
- `public_slug` généré côté BDD (`default` SQL), jamais côté client.
- **Content-Security-Policy** : livrée en `<meta>` dans le build de production (plugin `cspMetaPlugin` de `vite.config.ts`, hash sha256 du script inline calculé automatiquement ; origine Supabase prise dans `VITE_SUPABASE_URL`). `script-src 'self'` sans `unsafe-inline`/`unsafe-eval` (zod passe en `jitless`, cf. `src/lib/zodConfig.ts`), `style-src` sans `unsafe-inline`, `object-src 'none'`, `base-uri`/`form-action 'self'`. Vérifiée en navigateur réel sur le build de prod et par `e2e/csp.spec.ts` (projet Playwright `production-build`). **Limites GitHub Pages** : pas de vrais en-têtes HTTP, donc ni `X-Frame-Options`/`frame-ancestors` (clickjacking), ni `X-Content-Type-Options`, ni `Permissions-Policy` ; à revoir avec un hébergeur qui permet des headers (Cloudflare Pages/Netlify/Vercel).
- `.env.local` et tout `.env.*` (sauf `.env.example`) sont ignorés par git.

### Performance (audit Lighthouse du 20/10/2026)

**Site en ligne** (mobile = profil réseau 4G lent + CPU ×4 ; desktop) : accessibilité **100**, SEO **100**, bonnes pratiques 96-100, performance desktop 99-100 ; mobile 71-98 avant corrections.

**Corrigé** (mesuré sur un serveur local avec gzip, comme GitHub Pages ; avant → après) :
- page d'accueil : score **78 → 95**, LCP 5,3 → 2,7 s, transfert 802 → 286 Ko ;
- page de connexion : **84 → 97**, LCP 3,8 → 2,4 s, **décalage de mise en page (CLS) 0,12 → 0**, 753 → 238 Ko.
Causes et remèdes : (1) logo PNG de **377 Ko** affiché à 28 px → WebP de 4 Ko, dimensions explicites (original conservé dans `concepts/`) ; (2) fond d'écran 4k de 168 Ko envoyé aux téléphones → variable CSS `--bg-home` (21 Ko à ≤ 900 px) ; (3) polices découvertes tard, donc élément LCP (le `<h1>`) peint après leur chargement → `<link rel="preload">` d'Inter et de Cinzel + police de secours « Inter Fallback » aux métriques d'Inter (supprime le décalage au remplacement) ; (4) `preconnect` vers Supabase injecté au build (≈ 300 ms).

**Reste, non corrigeable sur GitHub Pages** : une URL profonde (`/login`, `/cemetery`…) répond d'abord **404** puis redirige (hack SPA) — environ 760 ms de redirection et l'erreur console qui coûte 4 points « bonnes pratiques ». Seul un hébergeur avec réécriture SPA (Cloudflare Pages, Netlify, Vercel) l'élimine. JavaScript inutilisé ≈ 67 Ko gzip (client Supabase) : à envisager si besoin.

### Tombes publiques uniquement et Founding Ghosts (20/10/2026)

**Plus de tombes privées.** Une tombe privée devenue publique rendait ambigu « premier » (à la création ou à la publication ?), et elle ajoutait un 2e type d'invisibilité à côté du masquage de modération. Décision : toutes les tombes sont publiques ; le formulaire n'a plus de case de visibilité. Migration en **expand / contract** pour ne pas casser le site déployé : `20261020210000_public_graves_and_founding_ghosts.sql` (appliquée) interdit les tombes privées par `check (is_public)` et fait dépendre la policy de `hidden` seulement, mais **garde la colonne `is_public`** (toujours vraie) tant que l'ancien front la lit ; `20261020220000_drop_is_public.sql` la supprime ; elle n'a été appliquée **qu'après** déploiement du front sans `is_public` (bundle en ligne vérifié : aucune occurrence), le 20/10/2026 — la colonne n'existe plus. La migration refuse de s'exécuter s'il existe encore des tombes privées. (L'« unlisted » — lien secret hors cimetière — reste une option future.)

**Founding Ghosts.** Les 10 premières personnes à enterrer une tombe reçoivent chacune une **première tombe dorée** numérotée 1 à 10 (`graves.founding_rank`).
- Règles : par ordre de création ; **un emplacement par personne** (seule sa première tombe peut être dorée) ; **permanent** : supprimer la tombe ou le compte ne libère jamais l'emplacement (« tant pis »). Le registre `founding_ghosts` (rang, `user_id`/`grave_id` annulés à la suppression) n'est accessible à aucun rôle API.
- Attribution par un trigger `AFTER INSERT` (`claim_founding_ghost`, `security definer`, verrou consultatif pour sérialiser) ; `founding_rank` est forcé à `null` à l'insertion par un client et figé à la mise à jour (`protect_grave_columns`). **Seules les personnes réelles connectées via l'API réclament un rang** : pas les insertions d'administration (seed, restaurations) ni les comptes de test à domaine réservé (`example.com/org/net`, `.invalid`, `.test`, `.example`) — sinon chaque exécution de la CI aurait consommé des emplacements.
- Vérifié par simulation de rôles (transaction annulée) : attribution 1…10 dans l'ordre, une seule par personne, emplacement conservé après suppression de la tombe **et** du compte, 11e personne sans rang, comptes de test et admin sans rang, client incapable de forger ou modifier un rang, registre illisible/inscriptible par `anon`/`authenticated`.
- Affichage (`TombstoneCard`, `foundingRank`) : badge texte « 👻 Founding Ghost #n » (jamais la couleur seule), cadre et halo dorés, artwork teinté, reflet lent **sous** la couche de texte (jamais sur les dates/nom/badge), coupé en mouvement réduit ; note explicative sur la page de la tombe. Le nom est une constante (`src/lib/founding.ts`).
- **Compteur sur la landing** : pastille dorée sous le bouton principal — « Be the first of 10 Founding Ghosts », « N of 10 Founding Ghost spots left », « Last Founding Ghost spot! », puis « All 10 Founding Ghosts have been claimed » (sans appel à l'action). Fonction `founding_spots_claimed()` (`security definer`, migration `20261020230000_founding_spots_counter.sql`) qui ne renvoie qu'un nombre : elle lit le **registre** (pas les tombes : un emplacement reste pris quand la tombe ou le compte est supprimé) alors que le registre lui-même reste fermé à `anon`/`authenticated`. Si le chargement échoue, rien n'est affiché. L'emplacement est **réservé** pour éviter tout décalage de mise en page (testé avec une réponse retardée ; mutation-vérifié). Contraste mesuré sur les pixels réels : 10,1:1 minimum (4 messages × 4 largeurs).

**Correction d'une affirmation précédente (contraste).** L'audit de contraste du 20/10 mesurait la couleur de chaque texte mais **pas l'opacité de l'élément** : il avait manqué les textes volontairement estompés des cartes (dates à `opacity: .55` → 2,7:1 ; épitaphe à `.6` → 3,4:1 sur certains artworks). Corrigé : opacités relevées (≥ .9), pastille de cause opaque, **voile sombre** (dégradé haut + halo central) derrière le texte de la carte. Re-mesuré avec l'opacité prise en compte, sur les pixels réels, **10 fonds × 13 avant-plans, cartes ordinaires et dorées, à 1280/768/375/320 px** (pages courtes de 3 cartes : sur une page très haute la sonde donnait des faux négatifs) : 0 échec. Test e2e de garde (`founding.spec.ts`) : opacités ≥ .9, voile présent, pastille ≥ .85.

### Avant l'ouverture au public (20/10/2026)

- **Conditions d'utilisation** : page `/terms` (règles de contenu, licence d'affichage, liens externes, signalement et modération, pas de garantie), liée depuis le footer, la page de connexion (« By continuing you agree… ») et la politique de confidentialité. Rédigée en anglais clair, **sans relecture juridique** : à faire relire si le site prend de l'ampleur.
- **Liens utilisateur** : `rel="nofollow ugc noopener noreferrer"` sur le lien du projet.
- **Signalement** : lien « Report this grave » (mailto prérempli : sujet avec nom + slug, corps avec l'URL) pour tout visiteur sauf l'auteur ; adresse centralisée dans `src/lib/contact.ts`.
- **Modération** : colonne `graves.hidden` (migration `20261020190000_moderation_hidden.sql`). Contrairement à `is_public`, l'auteur ne peut ni la modifier ni l'insérer à `true` (trigger `protect_grave_columns`) ; la policy publique l'honore, `home_stats()` l'exclut, ainsi que les listes (`hidden=eq.false`) et le sitemap ; l'auteur voit sa tombe avec un avis « hidden by a moderator ». Outil : `npm run moderate -- hide|unhide|show <slug ou URL>` (API Management ; entrée validée ; testé de bout en bout). Procédure : recevoir le mail → `npm run moderate -- show <slug>` → `hide` → répondre. Pour suspendre un compte : le supprimer dans le dashboard (cascade sur ses tombes) après export.
- **Polices auto-hébergées** : Cinzel (variable, latin + latin-ext, 40 Ko, licence OFL) dans `src/assets/fonts/`. Les liens Google Fonts sont supprimés (Inter et Roboto étaient demandées mais jamais rendues) : plus d'IP de visiteur envoyée à Google, CSP `style-src 'self'` / `font-src 'self'`. Captures avant/après identiques au pixel sur 4 pages.
- **Typographie corrigée** : la plupart du texte était rendu en **Times** (police par défaut du navigateur). Deux causes : (1) `--font-body`, `--font-mono` et `--font-display` étaient utilisées par ~55 règles CSS mais **jamais définies** ; (2) `reset.css` (`font: inherit` sur `html, body`) était importé **après** `index.css` et écrasait la police du corps. Désormais : reset d'abord (`main.tsx`), variables définies dans `index.css` — `--font-display` = Cinzel, `--font-body` = Inter (variable 300-700, auto-hébergée : latin, latin-ext, italique latin ; ~48 Ko pour le latin, le reste seulement si le texte l'exige), `--font-mono` = pile monospace système (0 Ko). Corps à `font-weight: 400` (il était à 500, invisible en Times). Contraste re-mesuré sur les pixels réels après le changement (235 éléments à 1280/768 px, 211 à 375/320 px) : 0 échec.

### Sauvegarde (le plan Free n'en fait pas)

- `npm run export` (`scripts/export-data.mjs`) : toutes les tombes (privées et masquées incluses) + utilisateurs et identités, **toujours chiffré** (AES-256-GCM, clé dérivée par scrypt, refuse une phrase de passe < 12 caractères). Le dépôt étant public, ses artefacts le sont aussi : un export en clair divulguerait emails et tombes privées. Env : `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BACKUP_PASSPHRASE`.
- `.github/workflows/backup.yml` : chaque dimanche (et à la demande), artefact chiffré conservé 30 jours. **Dormant tant que le secret de dépôt `BACKUP_PASSPHRASE` n'existe pas** (message d'info, pas d'échec). À conserver ailleurs en lieu sûr : sans elle, les sauvegardes sont illisibles.
- Lecture : `BACKUP_PASSPHRASE=… npm run export:decrypt -- fichier.bmpx --out sauvegarde.json`.
- Vérifié de bout en bout sur la vraie base (adaptateur SQL à la place du client service) : comptes identiques, tombes privées/masquées incluses, Unicode préservé, aucun clair dans le fichier, mauvaise phrase refusée. Le chemin `supabase-js` (clé service) ne tourne qu'en CI : premier vrai test = premier déclenchement manuel du workflow.
- **Restauration** (manuelle) : les utilisateurs se reconnectent par OAuth et reçoivent un **nouvel UUID** ; rattacher les tombes en faisant correspondre `email` / identité (`identities[].identity_data`) de l'export avec le nouvel utilisateur, puis réinsérer les tombes avec le nouvel `author_id` (insertion en rôle admin : le trigger ne touche pas aux dates ni au `hidden`).

### Durcissement du 20/10/2026 (revue RLS / Vague F)

Migration versionnée `supabase/migrations/20261020150000_harden_graves.sql`, appliquée en prod et vérifiée par simulation de rôles (`anon`, `authenticated` auteur, `authenticated` autre utilisateur, admin) dans une transaction annulée :

- **Grants au moindre privilège** : `anon` = `SELECT` seul ; `authenticated` = `SELECT/INSERT/UPDATE/DELETE`. Plus de `TRUNCATE`/`TRIGGER`/`REFERENCES` (que la RLS ne couvre pas).
- **Policies** recréées par rôle (`anon, authenticated` pour la lecture, `authenticated` pour l'écriture), `(select auth.uid())` (évalué une fois par requête : l'advisor performance passe de plusieurs WARN à 0), `WITH CHECK` explicite sur UPDATE.
- **Trigger `protect_grave_columns`** (rôles API uniquement ; migrations, seeds et `service_role` gardent le contrôle) : `created_at`/`updated_at` forcés à `now()` à l'insertion (empêche de se postdater en 2099 pour rester en tête de « Recently Buried »), `created_at`/`public_slug`/`tombstone_*` figés à l'update, **plafond de 200 tombes par utilisateur** (anti-abus).
- **Contraintes CHECK** reflétant le schéma zod (description ≤ 1000, epitaph ≤ 280, cause ≤ 200, tech_stack ≤ 20 éléments / 1000 car., tombstone ≤ 100, format de `public_slug`), car la validation zod est contournable en appelant l'API directement.
- `set_updated_at` : `search_path` figé ; `rls_auto_enable()` (fonction du trigger d'événement `ensure_rls`, qui active la RLS sur toute nouvelle table `public`) n'est plus exécutable via `/rest/v1/rpc`.
- **Auth** : longueur minimale de mot de passe passée de 6 à 8 côté serveur (alignée sur le client, qui était contournable).
- **Open redirect corrigé** : `?redirectTo=` du login était passé tel quel à `navigate()` (`?redirectTo=https://evil.com` redirigeait après connexion). Désormais filtré par `safeRedirectPath` (chemins internes uniquement ; 21 cas unitaires + e2e réels, test de mutation vérifié).
- **Dépendances** : `npm audit fix` → 0 vulnérabilité (react-router-dom 7.18.4, vite 8.3.4, ws 8.22.0).
- Cas ajoutés à `scripts/rls-integration-test.mjs` (exécuté en CI avec la clé service) : date forcée, champs figés, limites de taille, URL `javascript:` refusée, insertion anonyme refusée.
- **Risques acceptés / non traités** : protection contre les mots de passe compromis (HIBP, plan Pro) ; captcha (nécessite un compte) ; `author_id` (UUID) exposé en lecture publique car utilisé pour les stats de la landing ; `localhost` conservé dans `uri_allow_list` pour le dev ; pas de pentest externe.

### Plan « 100 000 tombes » (mesures du 20/10/2026)

**Mesures réelles** (20 000 tombes seedées, 19 000 publiques, rôle `anon`, RLS incluse ; table + index = 8 Mo, soit ~400 octets/tombe → ~40 Mo pour 100 000, base entière 20 Mo) :

| Requête | Temps BDD | Remarque |
| --- | --- | --- |
| Page 1 | 0,1 ms | index `created_at` |
| Page 100 (offset 2376) | 1,3 ms | |
| Dernière page (offset 18 960) | 9 ms | croît avec l'offset |
| `count(*)` exact | 6 ms | par clic « Load more » avant correction |
| Recherche `ilike '%x%'` | 27-29 ms | seq scan, linéaire |
| `home_stats()` | 17 ms | par visite de la landing |

Via l'API, chaque appel coûte ~0,3 s, presque uniquement de la latence réseau (région `eu-west-1`) : à 20k, la base n'est pas ce qui ralentit. **Projection linéaire à 100k** : recherche ~150 ms, count ~30 ms, `home_stats()` ~85 ms par visite, offset profond ~45 ms.

**Fait** (indépendant de la taille) : images de cartes `loading="lazy"` + `decoding="async"` ; `content-visibility: auto` sur les cartes des grilles ; `count` demandé seulement sur la 1re page d'une recherche (une page courte marque la fin de liste) ; recherche et nombre de pages chargées dans l'URL (`?q=`, `?pages=` plafonné à 10, restauré en **une seule requête**) ; position de scroll sauvegardée par terme et restaurée après « Retour » (nécessaire sur Firefox/WebKit) ; `ScrollToTop` global sur les navigations hors « Retour ». « Load more » est conservé (choix UX) : pas de scroll infini.

**À faire vers ~10 000 tombes**
- Pagination par curseur (`created_at`, `id`) + index partiel `(created_at desc, id desc) where not hidden` : coût constant quelle que soit la profondeur, pages stables quand des tombes arrivent.
- Index `pg_trgm` (GIN) sur le nom ; recherche par tech stack = colonne `search_text` (migration, fonction immuable).
- `home_stats()` : précalculer dans une petite table rafraîchie par `pg_cron` toutes les quelques minutes (lecture O(1)) au lieu d'un scan complet à chaque visite.
- Sitemap : au-delà de 50 000 URLs le script tronque silencieusement → sitemap index + plusieurs fichiers.

**À faire vers ~50 000-100 000 tombes**
- Pagination numérotée ou virtualisation de la liste (le DOM grossit à chaque « Load more »).
- Découverte : filtres par cause / tech stack, bouton « tombe au hasard » (personne ne parcourt 100k tombes dans l'ordre).
- Modération du contenu public (signalement, masquage), captcha à l'inscription ; le plafond de 200 tombes/utilisateur limite déjà l'abus.
- Couche de cache devant le site (Cloudflare), vérifier les quotas du plan Free (taille BDD, egress, MAU) au moment venu.

### Revue d'architecture et de scalabilité du 20/10/2026

Méthode : vérifications sur la vraie base (config PostgREST, index, `EXPLAIN ANALYZE`, seed de 2500-4000 tombes), mesures réseau en navigateur sur le build de prod, lecture du code.

**Corrigé**
- **Bug de correction + scalabilité des stats de la landing** : elles étaient calculées dans le navigateur à partir de `select author_id, cause` sur *toutes* les tombes publiques. PostgREST plafonne les réponses à `max_rows = 1000` : au-delà, « total graves » restait bloqué à 1000, et chaque visite téléchargeait ~83 ko. Remplacé par la fonction SQL `public.home_stats()` (`security invoker`, agrégats seuls, départage déterministe de la cause la plus fréquente) : 2377 tombes publiques → réponse exacte en 64 octets (migration `20261020170000_home_stats_and_index_cleanup.sql`, test d'intégration ajouté dans `scripts/rls-integration-test.mjs`).
- **Index doublon** `graves_public_slug_idx` supprimé (même colonne que l'index de la contrainte UNIQUE : coût d'écriture sans bénéfice).
- **Taille du bundle** : un seul chunk JS de 583 ko (165 ko gzip) → pages de formulaires/auth/privacy/my-graves chargées à la demande (`React.lazy`) ; landing/cemetery/tombe : **165 → 125 ko gzip** (−24 %), zod (36 ko gzip) ne se charge plus que sur les pages de formulaire. Pour que ça tienne, zod est configuré dans `src/lib/zod.ts` (import obligatoire, règle ESLint `no-restricted-imports`).
- **Erreurs réseau trompeuses** : un échec de chargement affichait « This grave doesn't exist » (page d'une tombe, édition), « No projects buried here » (My Graveyard) et la suppression naviguait ailleurs même en cas d'échec. Désormais : état d'erreur + « Try again », et message si la suppression échoue.
- Fichier doublon de 5 Mo supprimé (`src/assets/bg-home-4k - Copie.jpg`, non référencé ; il reste dans l'historique git), README mis à jour.

**Constaté, volontairement non traité (à reconsidérer à l'échelle)**
- Pagination du cemetery par `offset` : 9 ms à la dernière page de 20 000 tombes ; `count` désormais limité à la 1re page. Vers ~100k lignes : pagination par curseur + index partiel (cf. « Plan 100 000 tombes »).
- Recherche `ilike '%x%'` : seq scan linéaire (~7 ms à 4000). Vers ~100k : `pg_trgm`. Recherche par tech stack = migration `search_text`.
- Pas de cache client (react-query) : chaque navigation re-télécharge. Acceptable tant qu'aucun problème n'est mesuré (YAGNI).
- `GravePage` et `EditGravePage` répètent la même logique « charger par slug » (statuts loading/found/not-found/error) : factoriser en hook si un 3e consommateur apparaît.
- `src/types/database.types.ts` est écrit à la main : risque de dérive avec le schéma. L'API Management expose la génération de types (`GET /v1/projects/{ref}/types/typescript`) : un contrôle de dérive en CI est possible.
- **Sitemap figé au build** : une nouvelle tombe n'y apparaît qu'au prochain déploiement. Un `schedule` (cron quotidien) dans `deploy.yml` le rafraîchirait et ferait aussi une requête quotidienne vers Supabase.
- **À vérifier dans le dashboard** : le plan Supabase (non visible par l'API). Sur le plan Free, un projet sans activité est mis en pause après ~7 jours, ce qui casserait le site.
- `author_id` reste lisible publiquement (déjà noté), images sources non utilisées par l'app (`undertaker.png` 2,7 Mo, `bg-home-4k.jpg` 1,2 Mo ; la version `.webp` est celle utilisée).
- Nom du chunk vendor (`usePageTitle-*.js`) trompeur (nommage automatique de Rolldown), sans incidence.

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
│   │   ├── GraveFormShell.tsx         # coque de page partagée (création/édition)
│   │   ├── graveRow.ts                # mapping valeurs du formulaire → colonnes (insert/update)
│   │   ├── NewGravePage.tsx           # /graves/new (protégé)
│   │   ├── EditGravePage.tsx          # /graves/:slug/edit (protégé, auteur uniquement)
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
| `/login` | Public | Connexion Google/GitHub (redirige vers `redirectTo` ou `/my-graves` ; renvoie aussi un utilisateur déjà connecté) |
| `/signup` | Public | Redirige vers `/login` (OAuth uniquement) ; formulaire d'inscription email derrière `VITE_AUTH_EMAIL_ENABLED` |
| `/cemetery` | Public | Cimetière global, toutes les tombes publiques |
| `/graves/:slug` | Public | Tombe individuelle, 404 thématique si non trouvée/non publique |
| `/my-graves` | Authentifié (`ProtectedRoute`) | Mes tombes (publiques + privées), suppression, empty state |
| `/graves/new` | Authentifié (`ProtectedRoute`) | Création d'une tombe |
| `/graves/:slug/edit` | Authentifié (`ProtectedRoute`) | Édition d'une tombe (la requête filtre sur `author_id` → « not found » si ce n'est pas la sienne) ; l'image de tombe reste fixe |
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
- [x] Boutons OAuth (`OAuthButtons.tsx` : Google + GitHub) sur Login/SignUp
- [x] **Test manuel** : signup, login, création de tombe publique/privée, RLS (lecture/update/delete croisés entre utilisateurs) — tout validé via script contre le vrai projet Supabase le 17/10/2026. Seul point non testable automatiquement : le vrai flow d'email de confirmation (bloqué par le rate limit du mailer par défaut, cf. Milestone 1) — contourné via `mailer_autoconfirm` temporaire pour le test, remis à `false` immédiatement après.

#### Décision du 20/10/2026 : connexion OAuth uniquement (Google + GitHub)

Faute d'envoi d'email fiable (limite de 2 emails/heure du mailer par défaut), l'inscription/connexion email+mot de passe est **désactivée** :

- **Serveur** : `external_email_enabled: false` (API Management). Vérifié : `POST /auth/v1/signup` → `email_provider_disabled`, `grant_type=password` → `email_provider_disabled` ; Google et GitHub redirigent toujours. Désactiver seulement le formulaire ne suffisait pas : l'API restait appelable (comptes non vérifiés, saturation du mailer, risque de liaison de compte avec une identité OAuth portant le même email). `auto-confirm` volontairement non utilisé pour la même raison.
- **Front** : drapeau de build `VITE_AUTH_EMAIL_ENABLED` (défaut : désactivé). Désactivé : `/login` n'affiche que les boutons OAuth, `/signup` redirige vers `/login` (en gardant `?redirectTo=`), la navbar affiche un seul « Sign in » ; le code du formulaire email est en `React.lazy` et n'est jamais téléchargé. Les tests e2e du serveur de dev tournent drapeau activé, le projet `production-build` drapeau désactivé.
- **Destination après connexion** : `OAuthButtons` fait revenir le fournisseur sur `/login?redirectTo=…` (chemin validé par `safeRedirectPath`) ; `LoginPage` redirige dès qu'une session existe (un utilisateur déjà connecté qui visite `/login` est renvoyé aussi).
- **Utilisateurs** : les 6 comptes existants (dont les comptes de test et le seed) ont été supprimés (cascade sur leurs tombes) ; sauvegarde locale hors dépôt faite avant.
- **Tests RLS en CI** : `scripts/rls-integration-test.mjs` ne peut plus se connecter par mot de passe ; il crée les utilisateurs de test (API admin), génère un jeton à usage unique (`generateLink` magiclink) et l'échange par `verifyOtp` avec la clé anon (le code source de GoTrue montre que ni `generate_link` ni `/verify` ne vérifient l'activation du fournisseur email ; vérifié avec un faux jeton : `otp_expired`, pas `email_provider_disabled`). Il vérifie aussi que signup et login par mot de passe restent refusés.
- **Pour réactiver l'email** : (1) un SMTP fiable (domaine ou Gmail + mot de passe d'application) ; (2) `external_email_enabled: true` ; (3) `VITE_AUTH_EMAIL_ENABLED=true` au build ; (4) adapter la politique de confidentialité (« we never store a password ») ; (5) ajouter « mot de passe oublié » (inexistant).

#### ⚠️ Problème connu : emails de confirmation peu fiables

Le projet Supabase n'a **pas de SMTP personnalisé configuré** (`smtp_host` vide). Il utilise le service email par défaut de Supabase, limité à **2 emails/heure** et prévu uniquement pour du test — pas pour de la prod. Conséquence observée : signup sans réception d'email, lien de confirmation expiré/invalide.

Décision prise : **mettre Resend de côté pour l'instant** (nécessite un nom de domaine vérifié pour envoyer vers de vrais utilisateurs — `coleim.github.io` ne peut pas être vérifié, la zone DNS appartient à GitHub). On contourne via Google OAuth en attendant.

**Reste à faire plus tard** : trouver une vraie solution d'envoi d'email (acheter un petit domaine dédié type `burymyproject.dev` chez un registrar, le vérifier sur Resend/un autre fournisseur SMTP transactionnel, puis reconfigurer `smtp_host`/`smtp_user`/`smtp_pass` via l'API Management Supabase) pour que l'auth email/password redevienne pleinement fiable en plus de Google OAuth.

#### GitHub OAuth — configuré (20/10/2026)

- [x] OAuth App GitHub (callback `https://bibzxeryywqvjwoejgwz.supabase.co/auth/v1/callback`), provider activé via l'API Management (`external_github_enabled: true`)
- [x] Bouton « Continue with GitHub » sur `/login` et `/signup` via `OAuthButtons` (remplace `GoogleSignInButton`) ; e2e (redirection vers `/auth/v1/authorize?provider=github`) + test réel navigateur jusqu'à la page de login GitHub
- [ ] Test manuel du login complet GitHub → retour sur l'app → `/my-graves`
- ~~LinkedIn (provider OIDC)~~ : abandonné (nécessite une Company Page LinkedIn)

#### Google OAuth — configuré, test manuel restant

Code front en place (`OAuthButtons.tsx` (Google + GitHub, liste de providers), toujours visible sur `LoginPage` et `SignUpPage`, appelle `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: origin + BASE_URL } })`). Config faite le 20/10/2026 :

- [x] **Google Cloud Console** : projet + OAuth consent screen (External) + OAuth client ID (Web application)
- [x] **Authorized redirect URI** : `https://bibzxeryywqvjwoejgwz.supabase.co/auth/v1/callback`
- [x] Provider activé côté Supabase via l'API Management (`external_google_enabled: true`) ; `/auth/v1/authorize?provider=google` redirige bien vers Google
- [x] Consent screen passé en « In production » (confirmé le 20/10/2026)
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
- [x] `/cemetery` (grille publique, pagination « Load more » par 24 via `range()` + count exact, recherche par nom `ilike` avec debounce 300 ms ; recherche tech stack non faite, cf. Features à venir)
- [x] Landing : "Recently Buried" branché sur les vraies données
- [x] **Test manuel** : confirmé qu'une tombe privée n'est accessible ni par un visiteur anonyme ni par un autre utilisateur authentifié (cf. Milestone 1)

### Milestone 4 — Polish UX & a11y ⚠️ partiel

- [x] `lang="en"`, labels, erreurs inline, messages humains, tailles tactiles
- [x] Localisation : tout le texte UI repassé en anglais (cf. section Localisation)
- [x] Tests unitaires (Vitest + RTL) et E2E (Playwright) — cf. section Tests locaux
- [x] Déploiement GitHub Pages (CI + hack SPA) — cf. section GitHub Pages
- [x] Vérification a11y approfondie (contraste réel mesuré, navigation clavier : skip link, ordre de tab, indicateurs de focus, menu mobile)
- [ ] Responsive fin sur petits écrans (fait : bouton de création après la preview sur mobile, menu hamburger dans la Navbar ; reste à re-tester composant par composant)
- [ ] Métadonnées Open Graph dynamiques par tombe (voir Scaling, Phase 2)
- [x] Headers de sécurité : CSP livrée en meta (cf. section Sécurité) ; `X-Frame-Options` & co impossibles sans hébergeur supportant les headers
- [x] Vérification d'architecture et scalabilités (cf. « Revue d'architecture et de scalabilité du 20/10/2026 »)
- [x] Review du project : Good practices a verifier, tels que KISS, YAGNI, DRY, etc ... — fait un premier passage DRY : le pattern fond+overlay (`.page::before`/`.page::after`) était dupliqué à l'identique dans 7 fichiers CSS, factorisé via `composes` (`src/shared/styles/pageBackground.module.css`). Note technique : les `@keyframes` ne peuvent **pas** être partagées de la même façon (CSS Modules localise le nom utilisé dans `animation:` même sans `@keyframes` local correspondant dans le fichier — testé, ça casse l'animation en silence) ; elles restent dupliquées intentionnellement (3 occurrences identiques, `TombstoneCard`/`LandingPage`/`GravePage`).
- [x] Skeletons de chargement (`TombstoneCardSkeleton`) sur `/cemetery`, `/my-graves` et `/graves/:slug`, remplace le texte "Loading..."
- [x] Suppression d'une tombe déplacée de la grille `/my-graves` vers la page de détail `/graves/:slug` (visible seulement si `user.id === grave.author_id`), prépare l'emplacement du futur bouton "Edit"

## Mise en production et scaling (1 → 1 000 → 10 000 users)

### Phase 0 — Mise en production initiale

- [x] Déploiement statique sur **GitHub Pages** (CI via GitHub Actions, cf. section GitHub Pages ci-dessus)
- [x] Variables d'env en prod (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`) injectées via secrets GitHub Actions au build
- [ ] Domaine custom + HTTPS (optionnel, GitHub Pages fournit déjà HTTPS sur `coleim.github.io`)
- [~] Headers de sécurité : CSP en meta faite ; le reste nécessite un hébergeur avec contrôle des headers (cf. Phase 2)
- [ ] Monitoring erreurs front (Sentry free tier ou équivalent)
- [ ] Vérifier le plan Supabase Free (backups, quotas) et activer un export manuel périodique si besoin
- [ ] Analytics simple (Plausible/Umami) pour mesurer l'usage réel
- [~] Test de sécurité : revue RLS/advisors/audit/OWASP faits (Vague F) ; pentest externe non fait

### Phase 1 — Jusqu'à ~1 000 users

- [ ] Surveiller les quotas Supabase Free (500 MB DB, 50k MAU auth) ; passer en Pro si besoin
- [x] Pagination réelle sur `/cemetery` (« Load more », `range()`, count exact ; testée sur un mock de 4000 tombes et sur 4000 tombes réelles seedées, cf. section Tests de charge)
- [ ] Cache client (`@tanstack/react-query` ou équivalent) pour éviter les refetchs inutiles
- [x] Sitemap + meta tags statiques basiques pour le SEO
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
- Couverture actuelle (109 tests, 13 fichiers) :
  - `scripts/lib/export-crypto.test.mjs`, `scripts/lib/export-snapshot.test.mjs` — chiffrement de l'export (aller-retour, mauvaise phrase, fichier altéré, aucun clair dans le fichier) et pagination > 1000 lignes
  - `src/lib/schemas/grave.test.ts` — règles zod (`died >= born`, champs optionnels, limite `tech_stack`)
  - `src/shared/components/TagInput.test.tsx` — ajout/suppression de tags, anti-doublon, limite `max`
  - `src/shared/components/TombstoneCard.test.tsx` — rendu des props, lien conditionnel vers `/graves/:slug`
  - `src/features/auth/ProtectedRoute.test.tsx` — loading/redirection/rendu selon la session (mock de `useAuth`)
  - `src/features/grave/GraveForm.test.tsx` — boutons "✨ Generate" (epitaph/cause)

### E2E — Playwright (interception réseau native, pas de MSW)

Note : le plan initial prévoyait MSW, mais l'interception native de Playwright (`page.route()`) s'est avérée suffisante et plus simple (pas de service worker à gérer sous un `basename`) — même objectif atteint (aucune dépendance à un vrai backend Supabase pendant les tests).

- Config : `playwright.config.ts` (serveur `vite dev` sur le port 4300, `baseURL` incluant le `base` GitHub Pages)
- Mocks réseau : `e2e/mocks/supabase.ts` (signup, login, liste de tombes, insertion)
- Scripts : `npm run test:e2e`
- Couverture actuelle (119 tests, 21 fichiers) :
  - `e2e/landing.spec.ts` — landing + navigation + stats réelles calculées depuis Supabase
  - `e2e/auth.spec.ts` — validation signup, confirmation email, email déjà utilisé, erreur login, redirection après login
  - `e2e/protected-routes.spec.ts` — redirection `/login?redirectTo=...` sur `/my-graves` et `/graves/new`, retour à la page d'origine après connexion, `redirectTo` externe ignoré (open redirect)
  - `e2e/create-grave.spec.ts` — connexion → création d'une tombe → redirection vers `/graves/:slug`
  - `e2e/404.spec.ts` — route inconnue et slug de tombe inexistant
  - `e2e/cemetery.spec.ts` — pagination « Load more » (mock de 4000 tombes), recherche, états vide/erreur
  - `e2e/cemetery-navigation.spec.ts` — `count` demandé uniquement sur la 1re page, images lazy, `content-visibility`, état dans l'URL (`?q=`, `?pages=` plafonné), retour arrière (recherche + pages + position de scroll, avec réseau lent), visite neuve = haut de page
  - `e2e/legal-and-moderation.spec.ts` — page `/terms` et ses liens, `rel="nofollow ugc"`, lien « Report this grave » prérempli (absent pour l'auteur), avis « hidden by a moderator », listes publiques filtrées sur `hidden=eq.false`
  - `e2e/performance.spec.ts` — build de production : préchargement des 2 polices (avec `crossorigin`) et `preconnect` Supabase, fond 4k jamais envoyé aux téléphones (1280 px à la place), logo de quelques Ko avec dimensions explicites, aucune image > 200 Ko sur les pages d'entrée (mutation-vérifié)
  - `e2e/founding.spec.ts` — badge « Founding Ghost #n » sur les tombes fondatrices et elles seules, note sur la page de la tombe, rendu doré réellement appliqué (cadre, teinte), reflet **sous** le texte (mutation-vérifié), texte de carte non estompé (mutation-vérifié), mouvement réduit, badge contenu dans la carte à 320/375/768 px
  - `e2e/typography.spec.ts` — corps en Inter, titres en Cinzel, boutons/labels en monospace, aucun texte dans la police par défaut du navigateur (mutation-vérifié : remettre le reset après `index.css` fait réapparaître « Times »), Inter chargée depuis le site (italique et latin-ext seulement si besoin)
  - `e2e/self-hosted.spec.ts` — aucune requête vers googleapis/gstatic, Cinzel chargée depuis l'origine du site
  - `e2e/oauth-only.spec.ts` — build de production, connexion OAuth uniquement : pas de champs email/mot de passe, `/signup` → `/login`, un seul « Sign in », code du formulaire email jamais téléchargé, destination transmise au fournisseur, retour connecté → destination, `redirectTo` hostile ignoré (mutation-vérifié)
  - `e2e/undertaker.spec.ts` — illustration du croque-mort : décorative, chargée, sans chevauchement (nav/titre/formulaire/aperçu) à 320/375/768/1280 px, fichiers WebP optimisés, absente de la page d'édition
  - `e2e/edit-grave.spec.ts` — édition par l'auteur, not-found si pas propriétaire, redirection si déconnecté
  - `e2e/seo.spec.ts` — meta Open Graph/description/canonical, image de partage servie, titres de page
  - `e2e/a11y.spec.ts` (axe WCAG + best-practice, 10 pages × desktop/mobile), `e2e/keyboard.spec.ts` (skip link, focus, menu, reduced motion), `e2e/responsive.spec.ts` (pas de scroll horizontal 320→1440 px)
  - `e2e/error-states.spec.ts` — échec de chargement d'une tombe / de « My Graveyard » (message d'erreur ≠ « n'existe pas » / état vide) avec retry, échec de suppression
  - `e2e/csp.spec.ts` — build de production (projet Playwright `production-build`, `vite preview`) : politique CSP stricte, aucune violation sur toutes les pages, script de restauration SPA autorisé

### Intégration — RLS contre le vrai Supabase

- `scripts/rls-integration-test.mjs` (`npm run test:rls`) : contrairement aux tests unitaires/E2E (mockés), ce script tourne contre le **vrai projet Supabase**
- Utilise la clé `service_role` **uniquement** pour créer/supprimer 2 utilisateurs de test déjà confirmés (`auth.admin.createUser({ email_confirm: true })`, bypass du mailer — pas de dépendance au rate limit d'envoi d'email)
- Toutes les assertions utilisent ensuite des clients **anon** connectés normalement (comme un vrai navigateur), pour valider réellement les policies RLS : lecture publique/privée, cross-user read/update/delete
- Nettoyage systématique en `finally` (users + graves supprimés), même si une assertion échoue
- Nécessite le secret `SUPABASE_SERVICE_ROLE_KEY` en plus des deux secrets existants

### Tests de charge — seed de fausses tombes

- `npm run seed -- [count]` (`scripts/seed-graves.mjs`, défaut 4000) crée un utilisateur dédié `seed-bot@burymyproject.invalid` et N tombes `[SEED] ...` (dates `created_at` antidatées pour rester sous les vraies tombes, ~5 % privées). Idempotent.
- `npm run seed:remove` (`scripts/unseed-graves.mjs`) supprime ce seul utilisateur ; `graves.author_id ... on delete cascade` supprime toutes les tombes seedées.
- Passe par l'API Management (HTTPS) : env `SUPABASE_ACCESS_TOKEN` + `VITE_SUPABASE_URL`. Nécessite Node ≥ 22.18 (le script importe les constantes TypeScript).
- Résultats du 20/10/2026 (4000 tombes, rôle `anon`, RLS incluse, `EXPLAIN ANALYZE`) : page 1 ≈ 4 ms, page 150 (offset 3576) ≈ 2 ms, `count(*)` ≈ 1,3 ms, recherche `ilike '%x%'` ≈ 6-7 ms (seq scan, linéaire). Parcours UI réel (Load more ×3, recherche, no-results) sans erreur. Si la table atteint ~100k lignes : index `pg_trgm` sur `name` (ou `search_text`) et pagination par curseur (`created_at`) à la place de `offset`.

### Cross-navigateurs (opt-in)

`npm run test:e2e:cross-browser` (`playwright.cross-browser.config.ts`, nécessite `npx playwright install firefox webkit`) rejoue `cemetery-navigation.spec.ts` sur Chromium, Firefox et WebKit (moteur de Safari). Pourquoi : Chromium restaure seul la position de scroll après « Retour », **pas Firefox ni WebKit** pour du contenu chargé après coup. Vérifié par test de mutation : avec la restauration maison désactivée, Firefox et WebKit retombent à `scrollY = 0`. Non branché en CI (non testé sur Linux, il bloquerait le déploiement).

Le projet Playwright `production-build` (CSP) construit avec `tsc -b && vite build` **sans** l'étape sitemap (elle paginerait la vraie base à chaque exécution : ~10 s avec 19 000 tombes).

### CI

Intégré dans `.github/workflows/deploy.yml` (job `test`), bloque le déploiement si lint/tsc/unit/rls/e2e échouent.

## Features à venir (non prioritaires)

- **Choisir sa tombe** : actuellement, l'image de tombe (fond + premier plan) est assignée aléatoirement à la création et fixée définitivement (colonnes `tombstone_bg`/`tombstone_fg` sur `graves`). Un bouton désactivé "🔒 Choose your tombstone" est déjà présent dans `/graves/new` pour montrer que cette fonctionnalité arrivera. Prévu comme **feature payante** : permettre à l'utilisateur de choisir manuellement son image de tombe parmi la collection (ou en débloquer plus).
- **Génération IA d'epitaph/cause** : le bouton "✨ Generate" pioche actuellement dans des listes statiques (`src/lib/constants/graveContent.ts`, ~20 phrases chacune). Prévu à terme : remplacer par un vrai appel à un modèle IA pour générer une phrase contextuelle (basée sur le nom du projet, la stack technique, etc.), sans changer l'UX du bouton.
- **Recherche par tech stack** : la recherche actuelle ne porte que sur le nom (`tech_stack` est un `text[]`, pas de `ilike` direct). Option envisagée : colonne `search_text` + index `pg_trgm` via migration.
- ~~**Éditer une tombe existante**~~ ✅ fait : route `/graves/:slug/edit` réutilisant `GraveForm` (props `defaultValues`/`tombstone`), bouton « Edit this grave » visible uniquement pour l'auteur sur `/graves/:slug`. Policy RLS UPDATE vérifiée : l'auteur peut modifier, mais pas réattribuer `author_id` (la clause `USING` sert aussi de `WITH CHECK`) ; un autre utilisateur modifie 0 ligne. Cas ajoutés dans `scripts/rls-integration-test.mjs`.

- ✅ **Lien vers le projet** : colonne `project_url` (migration versionnée dans `supabase/migrations/`), contrainte BDD http(s) uniquement (rejette `javascript:`, sans schéma, espaces, > 500 car.), validation zod côté formulaire, affichage sur `/graves/:slug` en lien sortant (`target="_blank" rel="noopener noreferrer"`, et seulement si l'URL stockée est http(s)).

## Roadmap vers la prod (hors auth, mise de côté sur demande)

Découpage convenu pour la suite, auth/Google OAuth/fiabilité email explicitement **mis de côté pour l'instant** (cf. Milestone 1) :

- [x] **Vague A — Qualité & revue de code** : DRY du CSS fond/overlay (7 fichiers → `composes`), bug d'asset Vite détecté et corrigé au passage. Skeletons de chargement + suppression déplacée vers la page de détail (demandes complémentaires traitées dans la foulée).
- [x] **Vague B — SEO & partage social** : meta description/canonical/Open Graph/Twitter dans `index.html` (landing) + image de partage 1200×630 (`public/og-image.jpg`), `document.title` par page (`usePageTitle`, ex. « DevFlow — RIP · burymyproject.dev »), `public/robots.txt`, `dist/sitemap.xml` généré au build (`scripts/generate-sitemap.mjs`, pages statiques + toutes les tombes publiques, pagination > 1000 testée sur 2500 tombes seedées). **Limites documentées** : (1) les aperçus OG par tombe nécessitent du SSR/edge (les bots n'exécutent pas le JS) ; (2) `robots.txt` n'est lu qu'à la racine d'un domaine — sans domaine custom, il est ignoré sur `coleim.github.io/burymyproject.dev/` (soumettre le sitemap dans Google Search Console) ; (3) GitHub Pages répond 404 sur les deep links avant le hack SPA, ce qui peut gêner l'indexation des pages `/graves/:slug`.
- [x] **Vague C — a11y & responsive** : audit axe automatisé (WCAG 2.0/2.1 A+AA + best-practice) sur 10 pages × desktop/mobile, devenu test de non-régression (`e2e/a11y.spec.ts`). Corrigé : liens de cartes dont le nom accessible ne contenait pas le texte visible (WCAG 2.5.3), liens dans du texte distingués par la seule couleur (soulignés), classe CSS `undefined` sur les cartes « featured », absence de landmark `<main>` (composant `Main`) + lien « Skip to main content », ordre des titres (`headingLevel` sur `TombstoneCard`, `<h1>` sur la page d'une tombe), `prefers-reduced-motion`, alt du logo redondant, retour du focus sur le bouton du menu après Échap. **Contraste** : axe ne peut PAS le vérifier ici (fonds en pseudo-éléments/images → « incomplete »), donc mesuré à la main en échantillonnant les pixels réels derrière chaque texte (5 largeurs 320→1280, 12 pages) : `--color-text-muted` #6b7280 → #9aa1ae (ratios 2,9–4,05 → ≥ 4,5) et `--color-text-secondary` #a8a8b3 → #b8b8c3. Responsive : aucun scroll horizontal de 320 à 1440 px (`e2e/responsive.spec.ts`) ; bug corrigé : titre du hero fixe à 80 px débordait à 320 px (désormais `clamp`). Politique de confidentialité mise à jour (GitHub, lien projet, Google Fonts).
- [ ] **Vague D — Monitoring & analytics** : Sentry (erreurs front) + Plausible/Umami (analytics) — nécessite la création de comptes externes par l'utilisateur
- [x] **Vague E — Scaling léger** : pagination sur `/cemetery` faite (perf validée sur 4000 lignes réelles, cf. Tests de charge ; index `pg_trgm` à ajouter seulement si la recherche devient lente à plus grande échelle)
- [x] **Vague F — Sécurité** : revue RLS + advisors Supabase (cf. « Durcissement du 20/10/2026 »), `npm audit` (0 vulnérabilité), checklist OWASP basique (injection : requêtes paramétrées via PostgREST + `ilike` échappé ; XSS : pas de `dangerouslySetInnerHTML`/`eval`, liens sortants en `noopener noreferrer`, URL stockées filtrées http(s) en BDD et à l'affichage ; broken access control : RLS testée ; open redirect corrigé ; secrets : aucun dans le dépôt, clé service uniquement en CI), CSP en meta (headers HTTP impossibles sur GitHub Pages). Reste hors périmètre : pentest externe, HIBP (Pro), captcha.

## Rappel de méthode

- Les Milestones sont à valider dans l'ordre ; les cases non cochées ci-dessus sont les prochaines actions à mener.
- Toute évolution de la BDD en production doit passer par une migration SQL explicite et versionnée (envisager `supabase/migrations/` si la CLI est liée un jour), pas uniquement par le Dashboard.




