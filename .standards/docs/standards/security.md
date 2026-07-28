# Security Standards
# Mavutech Engineering — docs/standards/security.md

---

## Posture

Security is evaluated on every task regardless of type. AI-assisted attacks, dependency
poisoning, prompt injection into AI-integrated features, and data exfiltration are active
and growing threats. Enterprise grade means secure by default — not secured after the fact.

---

## Authentication and Authorization

### Rules
- Every API endpoint is protected by auth middleware unless explicitly marked public
- Firebase Auth ID tokens verified server-side on every protected request — never trust client-side auth state for sensitive operations
- Role-based access control (RBAC) enforced at the service layer — not just the route
- Token expiry handled gracefully — expired tokens trigger re-auth, not silent failures
- Never store auth tokens in localStorage, sessionStorage, Redux state, or cookies without `HttpOnly` and `Secure` flags

### Pattern — Server-Side Token Verification
```ts
// Every protected route runs through this middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return sendError(res, 'UNAUTHORIZED', 'Missing token.', requestId, 401);
  }
  try {
    req.user = await getAuth().verifyIdToken(token);
    next();
  } catch {
    return sendError(res, 'UNAUTHORIZED', 'Invalid or expired token.', requestId, 401);
  }
};
```

---

## Input Validation and Sanitization

### Rules
- Validate all inputs server-side regardless of client-side validation
- Sanitize all string inputs before storing or rendering
- Whitelist expected values — never blacklist
- Reject requests that fail validation before they reach the service layer
- Never trust query params, headers, route params, or request body without validation

### Pattern — Validation Middleware (Express)
```ts
import Joi from 'joi';

/**
 * Validates request body against a Joi schema.
 * Rejects the request before it reaches the controller if validation fails.
 *
 * @param {Joi.Schema} schema - Validation schema
 */
export const validateBody = (schema: Joi.Schema) => (
  req: Request, res: Response, next: NextFunction
) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return sendError(
      res,
      'VALIDATION_ERROR',
      'Request validation failed.',
      req.headers['x-request-id'] as string,
      400,
      { fields: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) }
    );
  }
  next();
};
```

---

## Data Exposure

### Rules
- Never return internal database IDs, stack traces, or system error messages to the client
- Strip sensitive fields before sending any response (passwords, tokens, internal flags)
- Use response DTOs (Data Transfer Objects) — never return raw database documents
- Never log PII (emails, phone numbers, names, addresses) in console or error tracking
- Paginate all list endpoints — never return unbounded datasets

### Pattern — Response DTO
```ts
/**
 * Strips sensitive fields and returns a safe public user representation.
 *
 * @param {UserDocument} user - Raw Firestore user document
 * @returns {PublicUser} Safe user shape for API responses
 */
const toPublicUser = (user: UserDocument): PublicUser => ({
  id: user.id,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
  // passwordHash, internalFlags, adminNotes — never included
});
```

---

## XSS Prevention (Web)

- Never use `dangerouslySetInnerHTML` — if unavoidable, sanitize with DOMPurify first
- Never construct HTML strings from user input
- Never set `href`, `src`, or `action` attributes from unvalidated user data
- CSP headers configured at server or CDN level for all web responses

```ts
// If dangerouslySetInnerHTML is truly unavoidable:
import DOMPurify from 'dompurify';

const safeHtml = DOMPurify.sanitize(userSuppliedContent);
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />
```

---

## Injection Prevention

### SQL / NoSQL Injection
- Never construct Firestore queries with raw string concatenation from user input
- Always use parameterized SDK calls — never string-built query paths

```ts
// Good
db.collection('users').doc(userId).get();

// Bad — never do this
db.collection(`users/${req.params.userId}`).get(); // if userId is unsanitized
```

### Command Injection
- Never pass user input to `exec`, `spawn`, `eval`, or `Function()` constructors
- Never use `eval` anywhere in the codebase

---

## Dependency Security

- Run `npm audit` before adding any new package
- Flag any package with zero community traction, no recent updates, or unknown maintainer
- Lock dependency versions in `package-lock.json` — never use `*` or loose ranges in production
- Never install packages suggested by AI without independently verifying the package exists on npmjs.com
  (AI package hallucination is an active attack vector — attackers register fake packages matching hallucinated names)
- Review `package.json` scripts before running in a new codebase — malicious `postinstall` scripts exist

---

## Environment and Secrets

- All secrets, API keys, and credentials in `.env` files only
- `.env` files always in `.gitignore` — never committed under any circumstance
- Maintain `.env.example` with placeholder values and comments
- Never hardcode any credential, key, or environment-specific URL in source code
- Rotate any secret that is accidentally committed immediately — assume it is compromised
- Use separate Firebase projects (and separate credential sets) for dev, staging, and production

---

## API Security (Express)

- Rate limiting on all public and auth endpoints (use `express-rate-limit`)
- Helmet.js applied globally for security headers
- CORS configured explicitly — never use `origin: '*'` in production
- Request size limits set — never accept unbounded request bodies
- All endpoints return only the standard response envelope — no raw Express error responses

```ts
// src/app.ts — apply globally
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

app.use(helmet());
app.use(cors({ origin: CONFIG.ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: '10kb' })); // reject oversized bodies
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));
```

---

## Firebase Security Rules

- Every collection has explicit, restrictive rules — no wildcards in production
- User data always scoped: `request.auth.uid == userId`
- Never deploy with `allow read, write: if true`
- Rules reviewed and tested before every production deployment

```
// Firestore rules — minimum pattern
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Every collection explicitly defined — no catch-all rules
  }
}
```

---

## AI-Specific Threat Vectors

As AI is increasingly integrated into features and development workflows, additional
attack surfaces must be considered:

- **Prompt Injection:** If any feature processes user input through an AI model, sanitize
  and bound the input before sending. Never pass raw user text directly as a system prompt
  or alongside privileged instructions.

- **Data Exfiltration via AI:** Never include sensitive data (tokens, PII, internal configs)
  in prompts sent to external AI APIs.

- **Model Output Trust:** Never trust AI-generated content as authoritative without validation.
  Treat AI output like user input — sanitize before rendering or storing.

- **Supply Chain via AI Suggestions:** Always verify package names on npmjs.com before
  installing anything an AI recommends. AI models hallucinate package names, and attackers
  pre-register those names with malicious code.

---

## Security Refactor Checklist

When auditing any codebase for security, flag:

- [ ] Unprotected API endpoints (no auth middleware)
- [ ] User input used without validation or sanitization
- [ ] Sensitive data in Redux state, localStorage, or sessionStorage
- [ ] `dangerouslySetInnerHTML` without DOMPurify
- [ ] `eval` or dynamic `Function()` usage anywhere
- [ ] Secrets or credentials in source code
- [ ] `.env` files not in `.gitignore`
- [ ] CORS configured as `origin: '*'`
- [ ] No rate limiting on auth endpoints
- [ ] Helmet.js not applied
- [ ] PII in console logs or error tracking
- [ ] Raw database documents returned directly in API responses
- [ ] Unbounded list queries without pagination or limits
- [ ] Packages with `npm audit` vulnerabilities unaddressed
- [ ] Firebase rules not reviewed before deployment
