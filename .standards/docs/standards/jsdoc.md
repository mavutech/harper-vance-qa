# JSDoc Standards
# Mavutech Engineering — docs/standards/jsdoc.md

---

## Non-Negotiable Rule

Every function, component, hook, thunk, service method, and utility must have a JSDoc block.
No exceptions. This is what makes the codebase self-documenting and AI-navigable.

---

## Required Tags by Type

### Functions and Service Methods
```ts
/**
 * One-line description of what this does.
 *
 * @param {Type} paramName - What this parameter is
 * @returns {ReturnType} What is returned
 * @throws {ErrorShape} When and why this throws
 * @example
 * const result = myFunction('input');
 */
```

### React Components
```tsx
/**
 * One-line description of what this component renders.
 *
 * @param {string} props.title - Localized title string
 * @param {Function} props.onPress - Callback fired on user interaction
 * @returns {JSX.Element}
 */
```

### Custom Hooks
```ts
/**
 * One-line description of what this hook manages.
 *
 * @returns {{ user: User | null, loading: boolean, signOut: () => void }}
 */
```

### Redux Thunks
```ts
/**
 * One-line description of what this thunk does.
 *
 * @param {PayloadType} payload - What is passed in
 * @returns {Promise<ReturnType>} What resolves on success
 * @throws {string} Error message on failure passed to rejectWithValue
 */
```

### Redux Selectors
```ts
/**
 * Returns [what this selects] from state.
 *
 * @param {RootState} state
 * @returns {Type}
 */
```

### Interfaces and Types
```ts
/**
 * Represents a user in the system.
 */
export interface User {
  /** Firestore document ID */
  id: string;
  /** User's email address */
  email: string;
  /** Display name, null if not set */
  displayName: string | null;
  /** ISO 8601 creation timestamp */
  createdAt: string;
}
```

---

## Optional but Encouraged

- `@deprecated` -- mark legacy code that should not be used in new work
- `@see` -- link to related functions or docs
- `@todo` -- flag known improvements (but never commit broken code)

---

## What NOT to Do

```ts
// Bad — states the obvious, adds no value
/**
 * Gets the user.
 * @param id The id.
 * @returns The user.
 */

// Good — describes behavior, types, and failure modes
/**
 * Retrieves a user profile by Firestore document ID.
 *
 * @param {string} userId - Firestore document ID of the target user
 * @returns {Promise<User>} Fully hydrated user profile
 * @throws {{ code: 'USER_NOT_FOUND', status: 404 }} When no document exists for the given ID
 */
```

---

## Enforcement Rule for Claude

When generating or refactoring any code, Claude must:
1. Add JSDoc to every function, component, hook, thunk, selector, and service method
2. Flag any existing functions missing JSDoc in the refactor audit report
3. Never generate a function without a JSDoc block above it
