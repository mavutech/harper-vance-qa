# Localization Standards
# Mavutech Engineering — docs/standards/localization.md

---

## Detection Rule

Detect the localization library from package.json:
- `react-i18next` / `i18next` → use i18next pattern below
- `react-intl` → use react-intl pattern
- None found → suggest `react-i18next` as the industry standard before proceeding

---

## Core Rule

No hardcoded user-facing strings anywhere in the codebase. Every label, message,
error, placeholder, and button text goes through the localization system.

---

## i18next Pattern (default)

### Setup
```ts
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

/**
 * Initializes i18next with supported languages and default namespace.
 */
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
```

### Translation File Structure
```json
// src/i18n/locales/en.json
{
  "auth": {
    "signIn": {
      "title": "Sign In",
      "emailPlaceholder": "Email address",
      "passwordPlaceholder": "Password",
      "submitButton": "Sign In",
      "forgotPassword": "Forgot password?",
      "errors": {
        "invalidCredentials": "Invalid email or password.",
        "networkError": "Unable to connect. Please try again."
      }
    }
  },
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong.",
    "retry": "Try again",
    "cancel": "Cancel",
    "save": "Save"
  }
}
```

### Key Naming Convention
- Feature-scoped: `feature.screen.element`
- Common strings shared across features: `common.label`
- Error messages: `feature.screen.errors.errorName`
- All keys: camelCase at every level

### Usage in Components
```tsx
import { useTranslation } from 'react-i18next';

export const SignInScreen = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('auth.signIn.title')}</Text>
      <TextInput placeholder={t('auth.signIn.emailPlaceholder')} />
    </View>
  );
};
```

---

## Rules Summary

| Rule | Requirement |
|---|---|
| Hardcoded strings | Never — zero tolerance |
| Key naming | feature.screen.element in camelCase |
| Common strings | Centralized under `common.*` namespace |
| Error messages | Always localized — never raw error.message to UI |
| Dynamic values | Use i18next interpolation: `t('key', { name: userName })` |
| Missing keys | Always provide fallback via `fallbackLng` |

---

## Refactor Audit Checklist

When auditing a file for localization compliance, flag:
- Any string literal inside a JSX element
- Any string literal in a `placeholder` or `accessibilityLabel` prop
- Any error message displayed directly from a catch block
- Any button label or navigation title not going through `t()`

---

## Security

- **Never interpolate raw user input into translation strings** without sanitization — this can introduce XSS in web contexts
- **Translation keys must never contain logic** — they are static identifiers only
- **User-supplied content** displayed alongside localized strings must be sanitized before rendering

```ts
// Bad — interpolates unsanitized user input
t('greeting', { name: rawUserInput });

// Good — sanitize before interpolation
import DOMPurify from 'dompurify';
t('greeting', { name: DOMPurify.sanitize(rawUserInput) });
```
