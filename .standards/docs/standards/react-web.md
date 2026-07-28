# React Web Standards
# Mavutech Engineering — docs/standards/react-web.md

---

## Detection — Ask Before Generating

Detect from package.json and existing files before writing any code:

| Concern | What to Detect |
|---|---|
| Language | TypeScript vs JavaScript — ask if unclear |
| Styling | CSS Modules, Styled Components, Tailwind, plain CSS — ask if unclear |
| Router | React Router v6+, Next.js — ask if unclear |
| State | Redux (RTK/legacy), Zustand, Context API — ask if unclear |
| Test lib | Jest + React Testing Library — suggest if none found |

Never introduce a new library without asking first.

---

## Component Architecture

### Functional Components — Default for All New Code

```tsx
// features/userProfile/components/ProfileCard.tsx

// 1. External imports
import React, { useCallback, useMemo } from 'react';

// 2. Internal imports
import { useAppSelector } from '@/hooks/redux';
import { selectUser } from '../redux/selectors';
import { useProfileActions } from '../hooks/useProfileActions';

// 3. Types
import type { ProfileCardProps } from '../types';

// 4. Styles (detect styling lib — example uses CSS Modules)
import styles from './ProfileCard.module.css';

/**
 * Displays a user profile summary card with avatar, name, and action controls.
 *
 * @param {string} props.userId - ID of the user whose profile to display
 * @param {boolean} [props.editable=false] - Whether edit controls are shown
 * @returns {JSX.Element}
 */
export const ProfileCard = ({ userId, editable = false }: ProfileCardProps): JSX.Element => {
  // 1. Hooks (Redux, router, custom — always first)
  const user = useAppSelector(selectUser);
  const { handleEdit, handleDelete } = useProfileActions(userId);

  // 2. Derived / memoized values
  const displayName = useMemo(
    () => user?.displayName ?? user?.email ?? 'Unknown User',
    [user]
  );

  // 3. Handlers (useCallback when passed as props)
  const onEditClick = useCallback(() => {
    handleEdit();
  }, [handleEdit]);

  // 4. Render
  return (
    <article className={styles.card} aria-label={`Profile card for ${displayName}`}>
      <h2 className={styles.name}>{displayName}</h2>
      {editable && (
        <button
          type="button"
          className={styles.editButton}
          onClick={onEditClick}
          aria-label="Edit profile"
        >
          Edit
        </button>
      )}
    </article>
  );
};
```

### Internal Order (enforce always)
1. Hooks (Redux, router, context, custom)
2. Derived/memoized values
3. Event handlers
4. Conditional early returns
5. Render

---

## Class Component Policy

**Do NOT convert class components unless there is a measurable benefit:**

| Condition | Action |
|---|---|
| Lifecycle methods map cleanly to hooks AND component has performance issues | Convert to functional |
| Class mixes concerns that hooks would separate | Convert to functional |
| Class component works correctly with no issues | Augment in place — add JSDoc, fix standards violations, do not convert |

When augmenting a class component:
```tsx
/**
 * Displays user account settings.
 * NOTE: Class component — augmented to meet standards. Not converted (no measurable benefit identified).
 *
 * @augments {React.Component<AccountSettingsProps, AccountSettingsState>}
 */
class AccountSettings extends React.Component<AccountSettingsProps, AccountSettingsState> {
  // Add missing JSDoc, fix hardcoded strings, add error boundaries
  // Do not restructure unless asked
}
```

---

## Hooks

### Organization Within a Hook File
```ts
// features/auth/hooks/useAuthForm.ts
import { useState, useCallback } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { signInThunk } from '../redux/thunks/signInThunk';
import { validateEmail, validatePassword } from '../utils/validators';
import type { SignInPayload } from '../types';

/**
 * Manages sign-in form state, validation, and submission.
 *
 * @returns {{
 *   email: string,
 *   password: string,
 *   errors: FormErrors,
 *   loading: boolean,
 *   handleEmailChange: (value: string) => void,
 *   handlePasswordChange: (value: string) => void,
 *   handleSubmit: () => Promise<void>
 * }}
 */
export const useAuthForm = () => {
  const dispatch = useAppDispatch();

  // State declarations grouped together
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // Validation
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!validateEmail(email)) newErrors.email = 'Valid email required.';
    if (!validatePassword(password)) newErrors.password = 'Password must be at least 8 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  // Handlers
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value.trim());
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await dispatch(signInThunk({ email, password }));
    } finally {
      setLoading(false);
    }
  }, [dispatch, email, password, validate]);

  return { email, password, errors, loading, handleEmailChange, handlePasswordChange, handleSubmit };
};
```

### Hook Rules
- Prefix: always `use`
- Location: `features/[feature]/hooks/`
- One concern per hook — split if a hook handles more than one domain
- JSDoc required on every hook and every returned value
- Hooks own logic — components own rendering only

---

## Styling Patterns

### CSS Modules (default if no library detected)
```css
/* ProfileCard.module.css */
.card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.name {
  font: var(--typography-heading-2);
  color: var(--color-text-primary);
}
```

- All colors, spacing, and typography from CSS custom properties (design tokens)
- No hardcoded hex values or pixel values in component CSS files
- No global styles except in the design token file and reset

### Tailwind (if detected)
- Use design token class names via `theme.extend` — no arbitrary values in components
- Extract repeated class combinations into component-level variables or `@apply` in a CSS file
- Never use inline `style` attributes

### Styled Components (if detected)
- Styled components defined in a companion `.styles.ts` file — not inline in the component
- All theme values come from the ThemeProvider — no hardcoded values

---

## Routing

### React Router v6
```ts
// src/navigation/routes.ts
export const ROUTES = {
  HOME: '/',
  PROFILE: '/profile/:userId',
  SETTINGS: '/settings',
  AUTH: {
    SIGN_IN: '/auth/sign-in',
    SIGN_UP: '/auth/sign-up',
  },
} as const;
```

- All route paths defined as constants — never string literals in components
- Protected routes wrapped in an `AuthGuard` component
- Lazy load all page-level components with `React.lazy` and `Suspense`

```tsx
// Lazy loading pattern
const SettingsPage = React.lazy(() => import('@/features/settings/pages/SettingsPage'));

// AuthGuard pattern
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useAppSelector(selectUser);
  const location = useLocation();
  if (!user) return <Navigate to={ROUTES.AUTH.SIGN_IN} state={{ from: location }} replace />;
  return <>{children}</>;
};
```

### Next.js (if detected)
- Use App Router conventions if Next 13+
- All API routes validate auth via middleware before reaching route handlers
- Never expose sensitive data in `getServerSideProps` or `getStaticProps` response shapes

---

## Performance

- `React.memo` only when profiling confirms unnecessary re-renders
- `useCallback` for handlers passed as props to child components
- `useMemo` for expensive computed values only — not as a default
- Lazy load all page-level components
- Virtualize long lists (react-window or react-virtual)
- Never import entire libraries — use named imports

---

## Security (Web-Specific)

- **XSS:** Never use `dangerouslySetInnerHTML` — if unavoidable, sanitize with DOMPurify first
- **Sensitive data:** Never store tokens, PII, or session data in localStorage or sessionStorage
- **Forms:** Validate all inputs client-side before submission — server validation is still required
- **Links:** Never set `href` from user-supplied data without validation
- **Dependencies:** Audit with `npm audit` before adding any new package
- **CSP:** Ensure Content Security Policy headers are configured at the server/CDN level
- **Open redirects:** Never redirect to a URL constructed from user input

---

## Accessibility (A11y)

Enterprise-grade means accessible by default:
- All interactive elements are keyboard navigable
- All images have `alt` text
- All form inputs have associated `<label>` elements
- Color is never the only means of conveying information
- Focus management on modal open/close
- ARIA roles used only when semantic HTML is insufficient

---

## Error Boundaries

Every page-level component must be wrapped in an Error Boundary:

```tsx
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo } from 'react';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; }

/**
 * Catches rendering errors in the component tree and displays a fallback UI.
 * Prevents full app crashes from isolated component failures.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Send to error logging service (Sentry, etc.)
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <p>Something went wrong. Please refresh the page.</p>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

## Environment Configuration

```ts
// src/config/index.ts

/**
 * Centralized application configuration derived from environment variables.
 * All env vars accessed here — never directly via process.env in components or services.
 */
export const CONFIG = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL ?? '',
  FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID ?? '',
  ENV: process.env.NODE_ENV,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;
```

- Never access `process.env` directly in components or services
- All config goes through the centralized config file
- Never commit `.env` files — maintain `.env.example` with placeholder values

---

## React File Review Checklist

Run this checklist before making any changes to an existing React file.
Report all findings before generating any new code.

### DRY
- [ ] Any logic that duplicates something in `hooks/`, `utils/`, or another component?
- [ ] Any inline logic that has no dependency on rendering and belongs in a custom hook?
- [ ] Any JSX pattern repeated two or more times that should be extracted to a shared component?
- [ ] Any constant value (number, string, URL, timeout) that appears more than once?

### Localization
- [ ] Any hardcoded string literals in JSX? (text, labels, placeholders, `aria-label`, button text)
- [ ] Any error messages rendered directly from a `catch` block without going through `t()`?
- [ ] Any navigation titles, modal headings, or tooltip content not using `t()`?

### Magic Numbers and Hardcoded Values
- [ ] Any numeric literals that should be named constants?
- [ ] Any hardcoded URLs, timeouts, limits, or thresholds not coming from `config/`?

### Component Health
- [ ] File over 200 lines? If so, identify the split point.
- [ ] Component handling more than one concern? If so, propose the extraction.
- [ ] Business logic inside the component that belongs in a hook?
- [ ] Direct API calls (Axios, fetch) inside the component instead of a service?

### Code Quality
- [ ] Any `console.log` statements?
- [ ] Any commented-out code?
- [ ] Any TypeScript `any` types?
- [ ] Missing JSDoc on the component or any exported function?
- [ ] Any async operation missing loading, success, or error state handling?

### Report Format

Present all findings in this block before writing any code:

```
REACT FILE REVIEW: [filename]

DRY VIOLATIONS:
  - [description] — [line or pattern]
    Proposed fix: extract to [hook name | util name | component name] in [path]

LOCALIZATION VIOLATIONS:
  - "[hardcoded string]" — [line or prop]
    Suggested key: [feature.screen.element]

MAGIC NUMBERS / HARDCODED VALUES:
  - [value] — [line]
    Suggested constant: [CONSTANT_NAME] in [constants file]

COMPONENT HEALTH:
  - [finding] — [proposed action]

CODE QUALITY:
  - [finding] — [proposed action]

Confirm to proceed, or adjust scope.
```

If no violations are found in a category, omit that category from the report entirely.
