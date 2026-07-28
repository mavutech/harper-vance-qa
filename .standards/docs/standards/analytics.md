# Analytics Standards
# Mavutech Engineering — docs/standards/analytics.md

---

## Detection Rule

Detect from package.json:
- `firebase/analytics` present → use Firebase Analytics
- `@segment/analytics-react-native` present → use Segment
- `mixpanel-react-native` present → use Mixpanel
- None found → default to Firebase Analytics, confirm before adding

---

## Core Rules

- Never call `logEvent` or any analytics SDK directly from a component
- All events go through the centralized `trackEvent` utility
- All event names: snake_case, descriptive, consistent
- All events proposed and confirmed before feature code is written
- Analytics placement is part of feature delivery — not an afterthought

---

## Centralized Analytics Utility

```ts
// src/utils/analytics.ts
import { getAnalytics, logEvent } from 'firebase/analytics';

/**
 * Logs a Firebase Analytics event with optional parameters.
 * All analytics calls in the app must go through this utility.
 *
 * @param {string} eventName - Snake case event identifier
 * @param {Record<string, unknown>} [params] - Optional event parameters
 * @example
 * trackEvent('settings_notifications_toggled', { enabled: true });
 */
export const trackEvent = (eventName: string, params?: Record<string, unknown>): void => {
  try {
    const analytics = getAnalytics();
    logEvent(analytics, eventName, params);
  } catch (error) {
    // Never let analytics failures affect user experience
    console.warn('Analytics event failed:', eventName, error);
  }
};
```

---

## Event Naming Convention

Pattern: `[feature]_[element]_[action]`

| Good | Bad |
|---|---|
| `settings_notifications_toggled` | `btn_click` |
| `auth_sign_in_submitted` | `signIn` |
| `payment_checkout_completed` | `event1` |
| `profile_avatar_updated` | `update` |
| `onboarding_step_2_viewed` | `screen` |

---

## Required Events by Task Type

### New Screen
Every new screen must fire at minimum:
```ts
// In the screen component on mount
useEffect(() => {
  trackEvent('[feature]_screen_viewed');
}, []);
```

### User Interactions
Fire on meaningful user actions:
```ts
// Button press
trackEvent('settings_save_tapped');

// Toggle
trackEvent('settings_notifications_toggled', { enabled: value });

// Form submit
trackEvent('auth_sign_in_submitted');

// Form error
trackEvent('auth_sign_in_failed', { error_code: error.code });
```

### Errors
```ts
trackEvent('error_occurred', {
  screen: 'SettingsScreen',
  error_code: error.code,
  error_message: error.message,
});
```

---

## Pre-Generation Proposal Format

During the confirmation step, Claude proposes analytics events like this:

```
ANALYTICS EVENTS PROPOSED:
  - settings_screen_viewed       → fires on screen mount
  - settings_notifications_toggled → fires on toggle change, params: { enabled: boolean }
  - settings_save_tapped         → fires on save button press
  - settings_save_succeeded      → fires on successful API response
  - settings_save_failed         → fires on error, params: { error_code: string }
```

Confirm or adjust before code is written.

---

## Placement Rules

- Screen view events: in `useEffect` with empty dependency array on the screen component
- User interaction events: directly in the handler function, before or after the action
- Error events: in the catch block of thunks or service calls
- Never place analytics calls inside render logic

---

## Security and Privacy

- **Never include PII in analytics events** — no emails, names, phone numbers, or addresses as event parameters
- **Never include tokens, IDs, or internal codes** that could expose system internals
- **User IDs:** Firebase Analytics user properties can include a hashed or anonymized user identifier — never a raw UID or email
- **Financial data:** Never log payment amounts, card details, or account numbers in analytics events
- **Consent:** Ensure analytics is only initialized after user consent where required (GDPR, CCPA)
- **Parameter scrubbing:** Review all event parameter values before adding — if in doubt, exclude it

```ts
// Bad — includes PII
trackEvent('user_signed_in', { email: user.email, userId: user.uid });

// Good — no PII
trackEvent('auth_sign_in_succeeded', { method: 'email_password' });
```
