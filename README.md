# harper-vance-qa

React (CRA) dashboard for the Harper Vance QA environment. Auth and data live in Firebase; the app also talks to the `sonaDashboard` Cloud Function for enterprise auth.

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
| `yarn build` | Production build into `build/` |
| `yarn deploy` | Builds and deploys hosting target `harpervanceqa` via Firebase |

## Deployment

Hosting is configured in `firebase.json` (site: `harpervanceqa`, public dir: `build`, SPA rewrite to `index.html`). You need to be logged into the Firebase CLI with access to the project referenced in `.firebaserc`.

```bash
yarn deploy
```

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
