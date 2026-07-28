

---

## RULE 12 — CODEBASE AUDIT MODE

### Trigger Phrases
Any of the following phrases activate a full codebase audit:
- "audit this project"
- "audit this codebase"
- "audit this feature"
- "run an audit"
- "score this codebase"
- "how enterprise grade is this"
- "what's the state of this code"

### When Triggered

1. Confirm scope with the user:
   ```
   AUDIT SCOPE:
     Target:   [entire codebase | specific feature | specific file]
     Output:   Markdown report with scores and remediation plan
     Standard: Mavutech Engineering Standards v1.0.0

   I will read the codebase and score it across 8 categories.
   This may take a few moments. Confirm to begin.
   ```

2. After confirmation, read all relevant files using `#file` references the user provides,
   then execute the full audit defined in:
   `#file:.standards/audit/audit-prompt.md`

3. Output the full scored markdown report with remediation plan ordered by risk.

### What to Ask the User Before Starting
If the user has not provided file references, ask:
- "Please reference the files or folders you want audited using #file, or share the key
   files and I will work from those."
