# Mavutech Codebase Audit — Execution Prompt
# Mavutech Engineering — audit/audit-prompt.md
# Reference this file when running an audit: #file:.standards/audit/audit-prompt.md

---

## Your Role

You are acting as a senior enterprise architect conducting a formal codebase audit against
Mavutech Engineering Standards v1.0.0. Your job is to read the provided code, score it
across 8 categories, identify every violation, and produce a structured markdown report
with a risk-ordered remediation plan.

Be direct. Be specific. Reference actual file names and line patterns when citing violations.
Do not soften findings. An honest audit is the most valuable deliverable you can produce.

---

## Step 1 — Detect Project Context

Before scoring, identify and report:
- Platform: React Web | React Native | Node/Express | Monorepo | Unknown
- Language: TypeScript | JavaScript | Mixed
- State management: RTK | Legacy Redux | Zustand | Context | None detected
- Styling: CSS Modules | Tailwind | Styled Components | Plain CSS | StyleSheet (RN)
- Router: React Router | Next.js | React Navigation | None
- Test framework: Jest + RTL | Jest only | None
- Analytics: Firebase | Segment | Mixpanel | None
- Error logging: Sentry | Custom | Console | None
- Key dependencies: list major packages detected

---

## Step 2 — Score Each Category

Score each of the 8 categories below out of 100.
Pass threshold: 70 or above.
Fail: 69 or below.

For each category:
- List every violation found with the file name or pattern where it occurs
- Assign a severity: CRITICAL | HIGH | MEDIUM | LOW
- Assign an effort estimate: S (under 2hrs) | M (half day) | L (1-2 days) | XL (3+ days)
- Calculate the category score based on severity and count of violations

### Severity Impact on Score
- CRITICAL violation: -15 points each
- HIGH violation: -8 points each
- MEDIUM violation: -4 points each
- LOW violation: -1 point each
- Start each category at 100 and deduct accordingly (floor at 0)

---

### CATEGORY 1 — SECURITY (Weight: 25%)

Check for every item in this list:

**Authentication**
- [ ] Unprotected API endpoints with no auth middleware
- [ ] Client-side only auth checks without server-side verification
- [ ] Tokens stored in localStorage, sessionStorage, or Redux state
- [ ] Tokens stored in AsyncStorage (React Native)
- [ ] Auth logic duplicated between client and server

**Input and Data**
- [ ] User input used without validation or sanitization
- [ ] `dangerouslySetInnerHTML` used without DOMPurify
- [ ] Raw user input passed to Firestore queries or dynamic paths
- [ ] `eval()` or `Function()` constructors anywhere in codebase
- [ ] User input passed to `exec`, `spawn`, or shell commands

**Data Exposure**
- [ ] Raw database documents returned directly in API responses (no DTO)
- [ ] Sensitive fields (tokens, passwords, internal flags) in API responses
- [ ] PII in `console.log` statements or error tracking calls
- [ ] Stack traces or internal error messages in API responses
- [ ] Unbounded list queries with no `.limit()` or pagination

**Storage and Secrets**
- [ ] Hardcoded credentials, API keys, or secrets in source code
- [ ] `.env` files committed to the repository
- [ ] Sensitive data in Redux state without DevTools sanitization
- [ ] No `.env.example` file present

**API Security (Express)**
- [ ] Helmet.js not applied globally
- [ ] CORS set to wildcard `origin: '*'`
- [ ] No rate limiting on auth or public endpoints
- [ ] No request body size limit
- [ ] Global error handler exposes internal details

**Firebase**
- [ ] Admin SDK initialized in client-side code
- [ ] Firestore rules not present or contain wildcard `allow read, write: if true`
- [ ] No App Check on public-facing callable functions

**Web Specific**
- [ ] No Content Security Policy headers configured
- [ ] `href`, `src`, or `action` set from unvalidated user input
- [ ] HTTP allowed in production paths

**React Native Specific**
- [ ] Sensitive data in AsyncStorage
- [ ] API keys bundled in app binary
- [ ] Deep links not validated before processing

---

### CATEGORY 2 — ARCHITECTURE (Weight: 20%)

**Layer Separation**
- [ ] Business logic in controllers (should be in services)
- [ ] Firestore calls in controllers (should be in services)
- [ ] API calls in React components or Redux thunks directly (should be in services)
- [ ] Presentation logic in hooks (hooks should be logic only)
- [ ] State management logic in components (should be in hooks or Redux)

**Feature Structure**
- [ ] Non-feature-based folder organization (type-based instead of feature-based)
- [ ] Missing `types/`, `hooks/`, `services/`, or `__tests__/` folders within features
- [ ] Components, screens, and pages mixed without clear separation
- [ ] Shared utilities not in a dedicated `utils/` folder

**Redux / State Management**
- [ ] RTK and legacy Redux mixed without flagging
- [ ] Sagas present (thunks are the standard)
- [ ] Missing `loading`, `error`, or `data` fields in any slice state
- [ ] Non-serializable values in Redux state
- [ ] Derived data computed and stored in Redux (should be in selectors)
- [ ] Raw `useSelector`/`useDispatch` used instead of typed hooks

**Service Layer**
- [ ] Multiple resources in one service file
- [ ] Axios called directly in components, hooks, or thunks
- [ ] No centralized Axios base instance

**API Architecture (Express)**
- [ ] Routes contain logic beyond wiring
- [ ] Controllers contain Firestore or database calls
- [ ] No repository or service separation
- [ ] Missing middleware layer

---

### CATEGORY 3 — PERFORMANCE (Weight: 15%)

**React Web**
- [ ] No lazy loading on page-level components
- [ ] `React.memo` used without profiling justification (premature optimization)
- [ ] `useMemo` or `useCallback` overused on trivial values
- [ ] Large lists rendered without virtualization (react-window or similar)
- [ ] Entire libraries imported instead of named imports (`import _ from 'lodash'` vs named)
- [ ] Inline object or array literals in JSX causing unnecessary re-renders
- [ ] No code splitting configured

**React Native**
- [ ] `ScrollView` used for lists of unknown length (should be `FlatList`)
- [ ] `FlatList` missing `keyExtractor`, `initialNumToRender`, or `maxToRenderPerBatch`
- [ ] Images not using appropriate caching strategy
- [ ] No `React.memo` on any component receiving frequently-changing props

**General**
- [ ] No pagination on any list endpoint (fetching all records)
- [ ] Synchronous operations blocking the main thread
- [ ] Unoptimized Firestore queries (missing indexes, fetching full collections)
- [ ] No loading states — UI blocks until data arrives

---

### CATEGORY 4 — SCALABILITY (Weight: 15%)

**Code Organization**
- [ ] Files over 200 lines (components/pages)
- [ ] Service files over 300 lines
- [ ] God components handling too many concerns
- [ ] No clear feature boundaries — everything in `src/components`

**API Design**
- [ ] No versioning on API routes (should be `/api/v1/...`)
- [ ] No pagination on list endpoints
- [ ] No standard response envelope
- [ ] Missing `requestId` in responses (no traceability at scale)
- [ ] No request timeout on Axios instance

**Database**
- [ ] Unbounded Firestore queries
- [ ] No compound indexes for multi-field queries
- [ ] Data structured for current scale only (not considering growth)
- [ ] Fan-out writes not considered for high-write collections

**Configuration**
- [ ] Hardcoded limits, thresholds, or timeouts (should be in config)
- [ ] No environment separation (dev/staging/prod use same Firebase project)
- [ ] Feature flags not considered for new capabilities

---

### CATEGORY 5 — CODE QUALITY (Weight: 10%)

- [ ] `console.log` statements in production code
- [ ] Commented-out code committed
- [ ] Magic numbers inline (no named constants)
- [ ] Hardcoded user-facing strings (not localized)
- [ ] Functions doing more than one thing (single responsibility violations)
- [ ] Deeply nested conditionals (3+ levels) without early returns
- [ ] Inconsistent naming conventions across files
- [ ] Dead code (unreferenced exports, unused variables)
- [ ] Inconsistent error handling patterns across the codebase
- [ ] TypeScript `any` used excessively (more than 3 occurrences)
- [ ] Non-standard file naming (wrong case for file type)

---

### CATEGORY 6 — DOCUMENTATION (Weight: 5%)

- [ ] Missing JSDoc on any function, component, hook, thunk, selector, or service method
- [ ] JSDoc present but missing `@param`, `@returns`, or `@throws` where applicable
- [ ] No `@example` on public service methods or utilities
- [ ] No README in the project root
- [ ] No `.env.example` file
- [ ] API endpoints not documented (no JSDoc on controllers)
- [ ] Complex business logic with no inline explanation
- [ ] Types and interfaces missing JSDoc descriptions on fields

---

### CATEGORY 7 — TEST COVERAGE (Weight: 5%)

- [ ] No test framework detected
- [ ] Test coverage below 80% (estimate from presence of `__tests__` folders)
- [ ] Hooks with no test files
- [ ] Redux thunks with no test files
- [ ] Service files with no test files
- [ ] No auth middleware tests
- [ ] No input validation tests
- [ ] No data exposure tests (sensitive fields not in response)
- [ ] Tests present but testing implementation not behavior
- [ ] No test for error/failure paths — only happy path covered

---

### CATEGORY 8 — ACCESSIBILITY (Weight: 5%) [Web only — skip for API-only projects]

- [ ] Images missing `alt` text
- [ ] Form inputs missing associated `<label>` elements
- [ ] Interactive elements not keyboard navigable
- [ ] Color used as the only means of conveying information
- [ ] No focus management on modal open/close
- [ ] ARIA roles used where semantic HTML would suffice
- [ ] Missing `aria-label` on icon-only buttons
- [ ] No skip navigation link for keyboard users

---

## Step 3 — Calculate Overall Score

```
Overall Score = (
  Security score     × 0.25 +
  Architecture score × 0.20 +
  Performance score  × 0.15 +
  Scalability score  × 0.15 +
  Code Quality score × 0.10 +
  Documentation score × 0.05 +
  Test Coverage score × 0.05 +
  Accessibility score × 0.05
)
```

Overall Grade:
- 90-100: ENTERPRISE READY
- 75-89:  PRODUCTION READY (minor gaps)
- 60-74:  NEEDS WORK (significant gaps)
- 40-59:  HIGH RISK (do not ship new features until addressed)
- 0-39:   CRITICAL (immediate remediation required)

---

## Step 4 — Output the Report

Use exactly this markdown structure:

---

```markdown
# Mavutech Codebase Audit Report
**Project:** [name]
**Date:** [date]
**Standard:** Mavutech Engineering Standards v1.0.0
**Audited by:** Claude (VS Code Copilot)

---

## Project Context

| Property | Detected |
|---|---|
| Platform | [value] |
| Language | [value] |
| State Management | [value] |
| Styling | [value] |
| Router | [value] |
| Test Framework | [value] |
| Analytics | [value] |
| Error Logging | [value] |

---

## Overall Score

### [SCORE] / 100 — [GRADE]

| Category | Score | Weight | Weighted | Grade |
|---|---|---|---|---|
| Security | XX/100 | 25% | XX.X | PASS/FAIL |
| Architecture | XX/100 | 20% | XX.X | PASS/FAIL |
| Performance | XX/100 | 15% | XX.X | PASS/FAIL |
| Scalability | XX/100 | 15% | XX.X | PASS/FAIL |
| Code Quality | XX/100 | 10% | XX.X | PASS/FAIL |
| Documentation | XX/100 | 5% | XX.X | PASS/FAIL |
| Test Coverage | XX/100 | 5% | XX.X | PASS/FAIL |
| Accessibility | XX/100 | 5% | XX.X | PASS/FAIL |

---

## Category Findings

### Security — XX/100 [PASS/FAIL]

#### CRITICAL
| # | Finding | File / Location | Effort |
|---|---|---|---|
| 1 | [description] | [file or pattern] | [S/M/L/XL] |

#### HIGH
| # | Finding | File / Location | Effort |
|---|---|---|---|

#### MEDIUM
| # | Finding | File / Location | Effort |
|---|---|---|---|

#### LOW
| # | Finding | File / Location | Effort |
|---|---|---|---|

[Repeat for each category]

---

## Remediation Plan

> Ordered by risk. Address CRITICAL items before anything else.
> Effort: S = under 2hrs | M = half day | L = 1-2 days | XL = 3+ days

### CRITICAL — Address Immediately

| Priority | Finding | Category | File / Location | Effort | Action |
|---|---|---|---|---|---|
| 1 | [finding] | Security | [file] | S | [specific action to take] |
| 2 | [finding] | Security | [file] | M | [specific action to take] |

### HIGH — Address Before Next Release

| Priority | Finding | Category | File / Location | Effort | Action |
|---|---|---|---|---|---|

### MEDIUM — Address This Sprint

| Priority | Finding | Category | File / Location | Effort | Action |
|---|---|---|---|---|---|

### LOW — Backlog

| Priority | Finding | Category | File / Location | Effort | Action |
|---|---|---|---|---|---|

---

## Summary

**Total violations found:** [n]
- CRITICAL: [n]
- HIGH: [n]
- MEDIUM: [n]
- LOW: [n]

**Estimated remediation effort:**
- To reach ENTERPRISE READY: [total effort estimate]
- Quick wins (S effort, HIGH+ severity): [list 3-5 highest impact easy fixes]

**Immediate next steps:**
1. [Most important action]
2. [Second most important]
3. [Third most important]
```

---

## Auditor Notes

- If you cannot read a file referenced, say so explicitly rather than skipping it
- If a category does not apply (e.g. Accessibility for an API-only project), mark it N/A and exclude from score calculation, redistributing its weight proportionally
- If the codebase is too large to audit fully in one pass, audit what you can see and note what was not reviewed
- Never inflate scores to soften findings — an inaccurate audit is worse than no audit
- When a finding is ambiguous, flag it as "Needs Review" rather than marking it as a violation
