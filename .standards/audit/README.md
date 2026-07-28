# Codebase Audit System
# Mavutech Engineering — audit/README.md

---

## What This Does

Runs a scored audit of any codebase against Mavutech Engineering Standards v1.0.0.
Produces a markdown report with:

- Overall score out of 100 with a grade
- Category scores across 8 dimensions
- Every violation found with severity and effort estimate
- A risk-ordered remediation plan with specific actions

Use this when:
- Entering a new or legacy codebase for the first time
- Assessing a project before a client engagement
- Running a sprint-end quality check
- Validating that a feature meets enterprise standards before shipping

---

## How to Run an Audit in VS Code Copilot

### Step 1 — Trigger the audit
Type any of these phrases in Copilot chat:
```
audit this project
audit this codebase
run an audit
score this codebase
how enterprise grade is this
what's the state of this code
```

### Step 2 — Reference the audit prompt and your files
Copilot will ask you to confirm scope. Add these references to your chat:
```
#file:.standards/audit/audit-prompt.md
#file:src/features/auth
#file:src/api
#file:package.json
#file:src/app.ts
```

Reference as many files and folders as you want audited.
The more context you provide, the more accurate the audit.

### Step 3 — Confirm and receive the report
Confirm the scope and Claude will produce the full scored markdown report.

---

## Audit Categories and Weights

| Category | Weight | Pass Threshold |
|---|---|---|
| Security | 25% | 70/100 |
| Architecture | 20% | 70/100 |
| Performance | 15% | 70/100 |
| Scalability | 15% | 70/100 |
| Code Quality | 10% | 70/100 |
| Documentation | 5% | 70/100 |
| Test Coverage | 5% | 70/100 |
| Accessibility | 5% | 70/100 |

---

## Overall Grades

| Score | Grade |
|---|---|
| 90-100 | ENTERPRISE READY |
| 75-89 | PRODUCTION READY (minor gaps) |
| 60-74 | NEEDS WORK (significant gaps) |
| 40-59 | HIGH RISK (address before shipping features) |
| 0-39 | CRITICAL (immediate remediation required) |

---

## Saving the Report

After the audit, copy the markdown output and save it:
```
[project-root]/
  docs/
    audits/
      audit-[date].md     ← save here for tracking over time
```

Running audits periodically and saving them lets you track improvement sprint over sprint.

---

## Files in This Folder

```
audit/
  README.md              ← this file
  audit-prompt.md        ← the full audit execution logic (reference in Copilot)
  copilot-instructions-append.md  ← Rule 12 already added to copilot-instructions.md
```
