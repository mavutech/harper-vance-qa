# Refactor Guide
# Mavutech Engineering — docs/standards/refactor-guide.md

---

## Rule 1 — Audit Before You Touch Anything

When entering a legacy codebase or refactoring any file, always audit first.
Never modify code before presenting the violations report and receiving confirmation.

---

## Audit Report Format

```
REFACTOR AUDIT: [filename or feature name]

DETECTED PROJECT STATE:
  Language:        [TypeScript | JavaScript]
  Redux pattern:   [RTK | Legacy | Both | None]
  Test framework:  [Detected | None]
  Analytics:       [Detected | None]
  Localization:    [Detected | None]

VIOLATIONS FOUND:

  CODE QUALITY
    [ ] console.log statements: [list locations]
    [ ] Commented-out code: [list locations]
    [ ] Magic numbers or hardcoded values: [list]
    [ ] Components over 200 lines: [list]
    [ ] Service files over 300 lines: [list]
    [ ] Unhandled promise rejections: [list]

  DOCUMENTATION
    [ ] Missing JSDoc: [list every function/component/hook missing it]

  ARCHITECTURE
    [ ] Non-standard folder structure: [describe]
    [ ] Logic in wrong layer (e.g. business logic in controller): [describe]
    [ ] Direct Axios calls outside service files: [list]
    [ ] Redux pattern inconsistency: [describe]
    [ ] Missing loading/error/success states: [list]

  STRINGS & LOCALIZATION
    [ ] Hardcoded user-facing strings: [list occurrences]
    [ ] Raw error messages displayed to user: [list]

  ANALYTICS
    [ ] Missing screen_viewed event: [list screens]
    [ ] Untracked user interactions: [list]

  TESTING
    [ ] Missing test files: [list hooks, thunks, services with no tests]
    [ ] Estimated current coverage: [low | medium | unknown]

SEVERITY SUMMARY:
  Critical (blocks enterprise standard): [count]
  Major (degrades consistency): [count]
  Minor (improvement opportunities): [count]

PROPOSED APPROACH:
  [High-level summary of what will be changed and in what order]

  Items deferred (requires separate task):
  - [anything that should be a separate PR or tracked separately]

Confirm to proceed, or adjust scope.
```

---

## Refactor Order of Operations

Once confirmed, refactor in this sequence:

1. **Architecture first** -- folder structure, layer separation, file splits
2. **JSDoc** -- document everything before logic changes
3. **Logic corrections** -- fix pattern violations (Redux, Axios, service layer)
4. **Localization** -- replace hardcoded strings
5. **Analytics** -- instrument missing events
6. **Code quality** -- remove console.logs, dead code, magic numbers
7. **Tests** -- flag missing tests for follow-up (or generate now if priority allows)

---

## What Not to Do During Refactor

- Do not change behavior -- refactoring is structural, not functional
- Do not introduce new dependencies without flagging it
- Do not refactor files outside the agreed scope
- Do not skip the audit step even for small files
- Do not generate tests as part of the refactor unless explicitly asked -- flag them instead

---

## Post-Refactor Summary Format

```
REFACTOR COMPLETE: [filename or feature]

CHANGES MADE:
  - [What was changed and why]

DEFERRED ITEMS (separate task required):
  - [ ] Tests: [list what needs coverage]
  - [ ] [Any other deferred items]

FILES MODIFIED:
  - [list]

FILES CREATED:
  - [list]
```

---

## Entering a New Legacy Codebase

When starting work in a project for the first time, before writing any code:

1. Scan `package.json` to detect stack, test framework, analytics, localization library
2. Scan folder structure to assess architectural patterns
3. Report findings in the standard confirmation format
4. Flag any conflicts with current Mavutech standards
5. Agree on an approach before touching anything

---

## Security Audit (Always Included)

Every refactor audit must include a security section:

```
SECURITY AUDIT:

  AUTHENTICATION
    [ ] Unprotected API endpoints (no auth middleware)
    [ ] Client-side only auth checks with no server validation

  DATA EXPOSURE
    [ ] Raw database documents returned in API responses
    [ ] Sensitive fields (tokens, passwords, internal flags) in API responses
    [ ] PII in console.log or error tracking calls
    [ ] Unbounded list queries with no pagination

  INPUT HANDLING
    [ ] User input used without validation
    [ ] User input rendered without sanitization
    [ ] dangerouslySetInnerHTML without DOMPurify

  STORAGE
    [ ] Tokens or PII in localStorage or sessionStorage
    [ ] Sensitive data in Redux state without DevTools sanitization
    [ ] Credentials or secrets in source code

  DEPENDENCIES
    [ ] npm audit vulnerabilities unaddressed
    [ ] Unknown or unmaintained packages
    [ ] Loose version ranges in package.json

  API SECURITY
    [ ] Missing Helmet.js
    [ ] CORS set to wildcard
    [ ] No rate limiting on auth endpoints
    [ ] No request body size limit
    [ ] Stack traces or internal errors in API responses

  FIREBASE
    [ ] Security rules not reviewed
    [ ] Admin SDK initialized client-side
    [ ] Wildcard rules in production Firestore rules
```
