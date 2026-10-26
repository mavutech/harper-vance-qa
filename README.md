# harper-vance-qa

React (CRA) dashboard for the Harper Vance Intelligence environment. Auth and data live in Firebase; the app also talks to the `sonaDashboard` Cloud Function for enterprise auth.

## Requirements

- Node.js **>= 18** (see `engines` in `package.json`; `engineStrict` is on)
- Yarn 1.x (project ships a `yarn.lock`)
- Firebase CLI (only needed for `yarn deploy`)

## Setup

```bash
yarn install
```

Environment files:

- `.env.development` — used by `yarn start`
- `.env.production` — used by `yarn build`
- `.env.example` — template, copy values from here if you need a local `.env`

All variables are `REACT_APP_*` (baked in at build time). See `.env.example` for the full list (Firebase config + `REACT_APP_API_BASE_URL` for the `sonaDashboard` function).

## Scripts

| Command | What it does |
| --- | --- |
| `yarn start` | Dev server at http://localhost:3000 |
| `yarn test` | Jest + React Testing Library in watch mode |
| `yarn test:e2e:install` | Installs the supported Chromium browser for Playwright |
| `yarn test:e2e` | Runs real-browser customer journey checks locally or against `PLAYWRIGHT_BASE_URL` |
| `yarn build` | Production build into `build/` |
| `yarn deploy` | Builds and deploys Hosting site `harpervanceqa-dev` via Firebase |

## Deployment

`main` is the source of truth. Every push to `main`, including an approved pull-request merge, runs the test, build, and Firebase Hosting deployment workflow automatically.

Hosting is configured in `firebase.json` (site: `harpervanceqa-dev`, public dir:
`build`). `/health`, `/api/**`, and the explicit public intake and onboarding
pages route to `sonaDashboard`; dashboard paths such as `/pages/profile` and all
other browser routes use the React application fallback. Manual deployment
requires Firebase CLI access to the project referenced in `.firebaserc` and
should be reserved for authorized release or recovery work.

```bash
yarn deploy
```

See [Repository Workflow](docs/repository-workflow.md) for the feature-branch, preview, merge, deployment, and rollback process.
See [Enterprise Readiness](docs/enterprise-readiness/README.md) for the owner
administration, customer lifecycle, acceptance, and release requirements.
See [Automated End-to-End Testing](docs/enterprise-readiness/automated-e2e-testing.md)
for browser-test coverage, evidence, and credential boundaries.

## Project layout

```
src/
  api/           axios client
  apps/          feature apps (calendar, chat, contacts, email, ...)
  components/    shared components (Avatar, ProtectedRoute, PublicRoute)
  dashboard/     dashboard pages (finance, sales, analytics, ...)
  features/      auth, notifications, sonaStats
  firebase/      firebase init
  layouts/       Header, Sidebar, Footer, Main
  pages/         top-level pages (Login, Profile, Settings, ...)
  redux/         store, reducers, actions
  routes/        route config
  scss/          styles
  utils/         helpers
docs/            product docs (roadmap, contracts)
.standards/      code standards
```

## Styling

Uses **dart-sass** (`sass`) via `sass-loader`. Do not add `node-sass` — it's deprecated and its `node-gyp` build breaks on Python 3.12+ (no `distutils`).

## Known warnings

`yarn start` compiles with a handful of ESLint warnings (unused imports, a duplicate case in `src/utils/firebaseErrorMessages.js`). These do not block the build.

## Notes

- Both `package-lock.json` and `yarn.lock` exist in the repo. Yarn is the source of truth — prefer `yarn` commands and don't run `npm install`.

## Shared branding

The editable definition is in the backend repository at `functions/brand/brand.json`.
Files named `*.generated.*` and public wordmarks are export artifacts. Never edit
them by hand. See `docs/shared-branding.md` for the coordinated rebrand procedure.
