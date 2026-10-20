# 🪦 burymyproject.dev

**A digital graveyard for your abandoned side projects.**

Every developer has a folder full of half-finished ideas. `burymyproject.dev` gives them a dignified end: create a tombstone for your dead project, write its epitaph, list its cause of death and tech stack, and share a public link so the world can pay its respects.

🔗 **Live**: [coleim.github.io/burymyproject.dev](https://coleim.github.io/burymyproject.dev/)

## Screenshots

> Add real screenshots to `docs/screenshots/` and they'll show up here.

| Landing page | Create a grave |
| --- | --- |
| ![Landing page](./docs/screenshots/landing.png) | ![Create a grave](./docs/screenshots/create-grave.png) |

| My Graveyard | Grave detail |
| --- | --- |
| ![My Graveyard](./docs/screenshots/my-graveyard.png) | ![Grave detail](./docs/screenshots/grave-detail.png) |

## Features

- 🪦 Create a tombstone for an abandoned project: name, epitaph, cause of death, tech stack, lifespan
- ✨ "Generate" buttons to pick a random epitaph/cause of death, plus a live tombstone preview while filling the form
- 🔗 Public, shareable link for each grave, with an optional link to the project's repo or site
- ✏️ Edit your graves after burying them
- 📜 "My Graveyard" — a private dashboard of everything you've buried
- 🌍 "Global Cemetery" — browse every public grave buried by the community, with "Load more" pagination and name search
- 🔐 Email/password, Google and GitHub sign-in (Supabase Auth)
- 📱 Responsive down to 320px, with a mobile menu
- ♿ Accessibility: automated axe checks, skip link, keyboard navigation, measured colour contrast, reduced-motion support
- 📊 Real-time home page stats (total graves, developers, most common cause of death) computed from Supabase

## Tech stack

- [Vite](https://vite.dev) + [React 19](https://react.dev) (client-side rendered, no SSR)
- [React Router](https://reactrouter.com)
- [Supabase](https://supabase.com) (Auth + Postgres + Row Level Security)
- CSS Modules (no UI framework)
- [react-hook-form](https://react-hook-form.com) + [zod](https://zod.dev)
- [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react) for unit tests
- [Playwright](https://playwright.dev) for end-to-end tests
- A standalone integration test script that validates Row Level Security policies against the real Supabase project
- Strict Content-Security-Policy on production builds, hardened database (least-privilege grants, constraints, triggers), `sitemap.xml` generated at build time
- Deployed on [GitHub Pages](https://pages.github.com) via GitHub Actions

See [`PLAN.MD`](./PLAN.MD) for the full technical plan, database schema, architecture, and roadmap.

## Getting started

```bash
npm install
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY in .env.local
npm run dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check, build for production and generate `dist/sitemap.xml` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run test:unit` | Run unit tests (Vitest) |
| `npm run test:unit:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests (Playwright). Includes accessibility (axe), keyboard, responsive and CSP checks; the CSP project builds and serves the production bundle |
| `npm run test:rls` | Run RLS integration tests against the real Supabase project (requires `SUPABASE_SERVICE_ROLE_KEY`) |
| `npm run seed -- [count]` | Insert fake graves (default 4000) under a dedicated `seed-bot` user, to test pagination, search and performance. Requires `SUPABASE_ACCESS_TOKEN` and Node ≥ 22.18 |
| `npm run seed:remove` | Remove everything created by `seed` (deleting the seed user cascades to its graves) |

## Database migrations

SQL changes live in [`supabase/migrations/`](./supabase/migrations) and are versioned by timestamp. They are applied manually (Supabase Dashboard SQL editor or Management API) — there is no CLI link yet. Never change the production schema only from the dashboard.

## Security notes

- Row Level Security and database constraints are the only server-side barrier (there is no custom backend), so every client-side rule is mirrored in the database.
- GitHub Pages can't send custom HTTP headers, so the Content-Security-Policy is a `<meta>` tag injected into production builds by `vite.config.ts`. zod runs in `jitless` mode (no `eval`); always import it from `@/lib/zod` (enforced by ESLint).
- Never put `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ACCESS_TOKEN` in the client or in a committed file.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`: lint + type-check + unit tests + RLS integration tests + e2e tests, then build and deploy to GitHub Pages. The deployment only runs if all tests pass.
