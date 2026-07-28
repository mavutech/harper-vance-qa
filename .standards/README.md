# mavutech-coding-standards

Single source of truth for all Mavutech / Technically Focused engineering standards.
Every project references this repo. Nothing lives in individual codebases.

**Version 1.0.0** — Audit system added. Security hardened across all standards.

---

## What's In Here

```
mavutech-coding-standards/
  copilot-instructions.md       # Master decision engine — applied globally in VS Code
  setup.sh                      # New machine setup script

  audit/
    README.md                   # How to run an audit
    audit-prompt.md             # Full audit execution logic (reference in Copilot)

  docs/standards/
    react-web.md                # React web — components, hooks, styling, routing, security
    react-native.md             # Expo/React Native — components, navigation, security
    redux.md                    # RTK and legacy Redux patterns
    axios.md                    # API client, interceptors, token refresh, security
    firebase.md                 # Firestore, Auth, Functions, Security Rules
    node-api.md                 # Express architecture, response envelope, security
    jsdoc.md                    # Documentation requirements for all code
    localization.md             # i18n standards and key naming conventions
    unit-tests.md               # Jest patterns for frontend, backend, security tests
    analytics.md                # Firebase Analytics, event naming, PII rules
    security.md                 # Cross-cutting security — auth, input, AI threat vectors
    refactor-guide.md           # Audit and refactor workflow with security checklist
```

---

## New Machine Setup

```bash
git clone git@github.com:mavutech/mavutech-coding-standards.git
cd mavutech-coding-standards
bash setup.sh
```

Restart VS Code after running setup.

---

## Adding This to a Project

```bash
git submodule add git@github.com:mavutech/mavutech-coding-standards.git .standards
git commit -m "chore: add mavutech-coding-standards submodule"
```

---

## Running a Codebase Audit

Type any of these in VS Code Copilot chat:
```
audit this project
audit this codebase
run an audit
score this codebase
how enterprise grade is this
```

Then reference your files and the audit prompt:
```
#file:.standards/audit/audit-prompt.md
#file:src/
#file:package.json
```

You get back a scored markdown report across 8 categories with a risk-ordered remediation plan.
See `audit/README.md` for full instructions.

---

## Daily Development Workflow

Copilot reads `copilot-instructions.md` automatically on every prompt.
Before generating any code it will pause, confirm the task, declare which standards apply,
propose analytics events, flag security implications, and confirm test priority.

For focused work, reference specific standards:
```
#file:.standards/docs/standards/redux.md
#file:.standards/docs/standards/security.md
```

For refactoring:
```
Refactor this file. #file:.standards/docs/standards/refactor-guide.md
```

---

## Updating Standards

```bash
# Edit files in this repo, then:
git add .
git commit -m "standards: [what changed and why]"
git push

# In each project repo:
git submodule update --remote .standards
git commit -m "chore: update mavutech-coding-standards to latest"
```
