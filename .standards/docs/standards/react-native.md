# React Native / Expo Standards
# Mavutech Engineering — docs/standards/react-native.md

---

## Stack
- React Native with Expo (managed or bare workflow — detect per project)
- TypeScript preferred — detect per project and confirm if unclear
- Functional components only — no class components

---

## Component Rules

### Structure of every component file
```tsx
// 1. Imports (external first, internal second, styles last)
import React, { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { styles } from './ComponentName.styles';

// 2. Types
interface Props {
  title: string;
  onPress: () => void;
}

// 3. Component (JSDoc required)
/**
 * Displays a labeled action button for primary user interactions.
 *
 * @param {string} props.title - Button label text (localized)
 * @param {Function} props.onPress - Callback fired on press
 * @returns {JSX.Element}
 */
export const ComponentName = ({ title, onPress }: Props): JSX.Element => {
  // hooks first
  // derived state second
  // handlers third
  // render last
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};
```

### Component rules
- One component per file
- Max 200 lines per component — split if approaching this
- No inline styles — all styles in a companion `.styles.ts` file
- Use `Pressable` over `TouchableOpacity`
- All text must go through the localization library — no hardcoded strings
- Use `KeyboardAvoidingView` on all forms
- All images must have `accessibilityLabel`

---

## Styling

```ts
// ComponentName.styles.ts
import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  title: {
    ...typography.heading1,
    color: colors.text.primary,
  },
});
```

- All colors, spacing, and typography come from the theme file
- No hardcoded hex values or pixel values in component style files
- StyleSheet.create() always — never plain objects

---

## Hooks

- Custom hooks live in `features/[feature]/hooks/`
- Prefix all custom hooks with `use`
- JSDoc required on every hook
- Hooks handle logic — components handle rendering only

```ts
/**
 * Manages user authentication state and sign-out action.
 *
 * @returns {{ user: User | null, signOut: () => void, loading: boolean }}
 */
export const useAuth = () => {
  // implementation
};
```

---

## Navigation

- React Navigation — detect version per project
- All route names defined as constants in `src/navigation/routes.ts`
- Never use string literals for route names inline
- Type all navigation props

```ts
// routes.ts
export const ROUTES = {
  HOME: 'Home',
  SETTINGS: 'Settings',
  PROFILE: 'Profile',
} as const;
```

---

## Performance

- Wrap expensive components in `React.memo` only when profiling shows a need
- Use `useCallback` for handlers passed as props
- Use `useMemo` for expensive derived values only
- Always use `FlatList` over `ScrollView` for lists of unknown length
- Set `keyExtractor` on every FlatList
- Set `initialNumToRender` and `maxToRenderPerBatch` on large lists

---

## Error Boundaries

- Every screen-level component must be wrapped in an Error Boundary
- Provide a user-facing fallback UI — never let a blank screen show

---

## Expo Specific

- Use `expo-constants` for environment config — never hardcode
- Use `expo-secure-store` for sensitive data — never AsyncStorage for tokens
- Target both iOS and Android on every feature — no platform-only assumptions
- Test on both simulators before marking complete

---

## Security (React Native / Expo Specific)

- **Token storage:** Use `expo-secure-store` for all sensitive data — never AsyncStorage for tokens, keys, or PII
- **Deep links:** Validate all incoming deep link URLs before processing — never trust scheme params blindly
- **API keys:** Never bundle API keys in the app binary — use environment variables and server-side proxies
- **Certificate pinning:** Implement for any endpoint handling financial or health data
- **Jailbreak/root detection:** Use `expo-device` to detect and warn on compromised devices for sensitive features
- **Screenshot prevention:** Disable screenshots on screens displaying sensitive data (payment info, PII)
- **Obfuscation:** Enable Hermes and ProGuard/R8 for production builds — never ship unobfuscated JS
- **Dependency audit:** Run `npm audit` before every production release
- **No eval:** Never use `eval` or dynamic `Function()` — especially dangerous in RN's JS context
- **User input:** Sanitize all user input before sending to backend or rendering in any component
- **Error messages:** Never display raw server error messages or stack traces to the user
