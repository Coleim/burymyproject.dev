# 🪦 burymyproject.dev

**A digital graveyard for your abandoned side projects.**

Every developer has a folder full of half-finished ideas. `burymyproject.dev` gives them a dignified end: create a tombstone for your dead project, write its epitaph, list its cause of death and tech stack, and share a public link so the world can pay its respects.

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
- 🔗 Public, shareable link for each grave
- 📜 "My Graveyard" — a private dashboard of everything you've buried
- 🌍 "Global Cemetery" — browse every public grave buried by the community
- 🔐 Email/password authentication (Supabase Auth)

## Tech stack

- [Vite](https://vite.dev) + [React 19](https://react.dev) (client-side rendered, no SSR)
- [React Router](https://reactrouter.com)
- [Supabase](https://supabase.com) (Auth + Postgres + Row Level Security)
- CSS Modules (no UI framework)
- [react-hook-form](https://react-hook-form.com) + [zod](https://zod.dev)
- [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react) for unit tests
- [Playwright](https://playwright.dev) for end-to-end tests
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
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run test:unit` | Run unit tests (Vitest) |
| `npm run test:unit:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`: lint + type-check + unit tests + e2e tests, then build and deploy to GitHub Pages. The deployment only runs if all tests pass.
