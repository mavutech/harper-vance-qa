# Mavutech Standards — Setup Guide

Everything you need to get this system running on your machine and across your projects.
Follow this guide top to bottom the first time. After that, new projects take about 5 minutes.

---

## What You Have

This repo (`mavutech-coding-standards`) is your single source of truth for all engineering standards.
It contains:

- A master instruction file that VS Code Copilot reads automatically on every prompt
- Individual standards files for every layer of your stack
- A codebase audit system that scores any project against your standards
- A setup script that wires everything into VS Code

Nothing lives in your individual project repos — they just reference this one.

---

## Prerequisites

Make sure you have these before starting:

- [ ] VS Code installed
- [ ] GitHub Copilot extension installed in VS Code
- [ ] Copilot is powered by Claude (check in VS Code settings under Copilot model)
- [ ] Git installed
- [ ] Node.js installed (for the setup script)
- [ ] `jq` installed — used by the setup script to write to VS Code settings
  - Mac: `brew install jq`
  - Ubuntu: `sudo apt-get install jq`

---

## Step 1 — Push This Repo to GitHub

This repo needs to live on GitHub so it survives if your laptop dies
and so all your projects can pull from it.

1. Log into GitHub
2. Create a new **private** repository named `mavutech-coding-standards`
3. Do not initialize it with a README (you already have one)
4. Then run these commands from inside this folder:

```bash
git init
git add .
git commit -m "chore: initial commit — mavutech standards v1.0.0"
git remote add origin git@github.com:mavutech/mavutech-coding-standards.git
git push -u origin main
```

Replace `mavutech` with your actual GitHub organization name.

---

## Step 2 — Run the Setup Script on Your Machine

This script reads `copilot-instructions.md` and injects it into VS Code's global
Copilot settings so Claude follows your standards on every single prompt automatically.

From inside the `mavutech-coding-standards` folder, run:

```bash
bash setup.sh
```

What it does:
- Detects your OS (Mac or Linux)
- Finds your VS Code `settings.json`
- Backs up your existing settings
- Injects the master instructions into `github.copilot.chat.codeGeneration.instructions`

After it runs:
- **Restart VS Code completely**
- Open any project and test it by typing: `build me a settings screen`
- Copilot should pause and show you the confirmation block before writing any code

### If You Are on Windows

The script does not auto-inject on Windows. Do this manually:

1. Open VS Code
2. Press `Ctrl + Shift + P` and type `Open User Settings (JSON)`
3. Open `copilot-instructions.md` from this repo in any text editor
4. Copy the entire contents
5. Add this to your `settings.json`:

```json
"github.copilot.chat.codeGeneration.instructions": [
  {
    "text": "PASTE THE CONTENTS OF copilot-instructions.md HERE"
  }
]
```

6. Save and restart VS Code

---

## Step 3 — Add This Repo to a Project

For every project you want these standards applied to, add this repo as a Git submodule.
This means the standards files live inside your project but are sourced from one place.

```bash
# Navigate to your project root
cd /path/to/your-project

# Add the submodule
git submodule add git@github.com:mavutech/mavutech-coding-standards.git .standards

# Commit it
git add .gitmodules .standards
git commit -m "chore: add mavutech-coding-standards submodule"
git push
```

Your project will now have a `.standards/` folder containing everything.

### Cloning a Project That Already Has the Submodule

When you or someone else clones a project that has `.standards` as a submodule:

```bash
git clone --recurse-submodules git@github.com:mavutech/your-project.git
```

Or if you already cloned without the flag:

```bash
git submodule update --init --recursive
```

---

## Step 4 — Test That Everything Works

Open a project in VS Code that has the `.standards` submodule. Open Copilot chat and type:

```
build me a settings screen
```

You should see Claude respond with the confirmation block:

```
TASK: Settings screen
TYPE: New Screen

DETECTED:
  Platform: ...
  Language: ...
  ...

STANDARDS APPLYING:
  [x] react-web.md
  [x] redux.md
  ...

Confirm to proceed, or adjust anything above.
```

If you see that — everything is working.

If Copilot just generates code without the confirmation, the instructions did not inject
correctly. Go back to Step 2 and verify the settings.json was updated.

---

## Step 5 — Running a Codebase Audit

To audit any project against your standards, open Copilot chat and type any of these:

```
audit this project
run an audit
score this codebase
how enterprise grade is this
```

Then add file references so Claude can read your code:

```
#file:.standards/audit/audit-prompt.md
#file:src/
#file:package.json
```

Claude will confirm scope, read the files, and return a full scored report across
8 categories with a risk-ordered remediation plan.

**Save your audit reports here for tracking over time:**
```
your-project/
  docs/
    audits/
      audit-2026-05-24.md
      audit-2026-06-15.md
```

---

## Day-to-Day Usage

### Building something new
Just describe what you want. The confirmation block appears automatically.
```
Build a payment history screen
```

### Referencing a specific standard manually
When doing focused work on one domain:
```
Build the auth service. #file:.standards/docs/standards/axios.md
```

### Refactoring a legacy file
```
Refactor this file. #file:.standards/docs/standards/refactor-guide.md
```

### Auditing a specific feature only
```
audit this feature

#file:.standards/audit/audit-prompt.md
#file:src/features/auth
```

---

## Updating Standards

When you want to change or improve a standard:

1. Edit the relevant file in `mavutech-coding-standards/docs/standards/`
2. Commit and push to GitHub:

```bash
cd mavutech-coding-standards
git add .
git commit -m "standards: [describe what you changed and why]"
git push
```

3. Update each active project to pull the latest:

```bash
cd your-project
git submodule update --remote .standards
git commit -m "chore: update mavutech-coding-standards to latest"
git push
```

4. Re-run `bash setup.sh` to update the VS Code global instructions if you changed
   `copilot-instructions.md`

---

## New Machine Setup (If Your Laptop Dies or You Get a New One)

```bash
# 1. Clone the standards repo
git clone git@github.com:mavutech/mavutech-coding-standards.git

# 2. Run setup
cd mavutech-coding-standards
bash setup.sh

# 3. Restart VS Code

# 4. Clone your projects with submodules
git clone --recurse-submodules git@github.com:mavutech/your-project.git
```

That is all. You are fully restored in under 15 minutes.

---

## File Reference

| File | What It Does |
|---|---|
| `copilot-instructions.md` | Master rules — auto-loaded by VS Code Copilot on every prompt |
| `setup.sh` | Injects master instructions into VS Code settings |
| `audit/audit-prompt.md` | Full audit scoring logic — reference in Copilot to run an audit |
| `audit/README.md` | How to run audits and interpret results |
| `docs/standards/react-web.md` | React web component, hook, and styling standards |
| `docs/standards/react-native.md` | React Native / Expo standards |
| `docs/standards/redux.md` | Redux RTK and legacy patterns |
| `docs/standards/axios.md` | API client and service file standards |
| `docs/standards/firebase.md` | Firestore, Auth, Functions, Security Rules |
| `docs/standards/node-api.md` | Express architecture and response standards |
| `docs/standards/jsdoc.md` | Documentation requirements |
| `docs/standards/localization.md` | i18n standards |
| `docs/standards/unit-tests.md` | Jest testing patterns |
| `docs/standards/analytics.md` | Firebase Analytics event standards |
| `docs/standards/security.md` | Full security standards including AI threat vectors |
| `docs/standards/refactor-guide.md` | How to audit and refactor legacy code |

---

## Troubleshooting

**Copilot is not showing the confirmation block**
- Verify `settings.json` has the `github.copilot.chat.codeGeneration.instructions` key
- Restart VS Code completely (not just reload window)
- Check that the Copilot model is set to Claude

**Submodule folder is empty after cloning**
```bash
git submodule update --init --recursive
```

**Setup script says jq is not found**
```bash
# Mac
brew install jq

# Then re-run
bash setup.sh
```

**Standards are out of date in a project**
```bash
cd your-project
git submodule update --remote .standards
git commit -m "chore: update mavutech-coding-standards"
```

**You accidentally committed a .env file**
Rotate every secret in that file immediately — assume it is compromised.
Then remove it from git history:
```bash
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "fix: remove .env from tracking"
```
