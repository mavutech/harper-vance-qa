# Redux Standards
# Mavutech Engineering — docs/standards/redux.md

---

## Detection Rule

Before writing any Redux code, detect which pattern the project uses:
- Check for `@reduxjs/toolkit` in package.json → use RTK
- Check for legacy `redux` only → use legacy pattern
- If both exist → FLAG and ask before proceeding

---

## RTK Pattern (preferred for all new projects)

### Slice (replaces separate actions + reducers)
```ts
// features/auth/redux/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { signInThunk } from './thunks/signInThunk';
import { AuthState, User } from '../types';

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

/**
 * Auth slice managing user authentication state.
 * Handles sign in, sign out, and session persistence.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Clears the current user session from state.
     */
    signOut: (state) => {
      state.user = null;
      state.error = null;
    },
    /**
     * Clears any existing auth error from state.
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signInThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInThunk.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signInThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { signOut, clearError } = authSlice.actions;
export default authSlice.reducer;
```

### Thunk (RTK)
```ts
// features/auth/redux/thunks/signInThunk.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { SignInPayload, User } from '../../types';

/**
 * Authenticates a user with email and password via Firebase Auth.
 *
 * @param {SignInPayload} payload - User credentials
 * @returns {Promise<User>} Authenticated user object
 * @throws {string} Error message on authentication failure
 */
export const signInThunk = createAsyncThunk<User, SignInPayload, { rejectValue: string }>(
  'auth/signIn',
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.signIn(payload);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
```

### Selectors (RTK)
```ts
// features/auth/redux/selectors.ts
import { RootState } from '@/store';

/**
 * Returns the currently authenticated user or null.
 *
 * @param {RootState} state
 * @returns {User | null}
 */
export const selectUser = (state: RootState) => state.auth.user;

/**
 * Returns the auth loading state.
 *
 * @param {RootState} state
 * @returns {boolean}
 */
export const selectAuthLoading = (state: RootState) => state.auth.loading;

/**
 * Returns the current auth error message or null.
 *
 * @param {RootState} state
 * @returns {string | null}
 */
export const selectAuthError = (state: RootState) => state.auth.error;
```

---

## Legacy Redux Pattern (existing projects only — do not introduce in new projects)

### Action Types
```ts
// features/auth/redux/actions/authActions.ts
export const AUTH_SIGN_IN_REQUEST = 'AUTH_SIGN_IN_REQUEST';
export const AUTH_SIGN_IN_SUCCESS = 'AUTH_SIGN_IN_SUCCESS';
export const AUTH_SIGN_IN_FAILURE = 'AUTH_SIGN_IN_FAILURE';
```

### Action Creators
```ts
/**
 * Initiates the sign in request flow.
 *
 * @returns {{ type: string }}
 */
export const signInRequest = () => ({ type: AUTH_SIGN_IN_REQUEST });

/**
 * Dispatched on successful sign in.
 *
 * @param {User} user - Authenticated user data
 * @returns {{ type: string, payload: User }}
 */
export const signInSuccess = (user: User) => ({
  type: AUTH_SIGN_IN_SUCCESS,
  payload: user,
});
```

### Thunk (legacy)
```ts
// features/auth/redux/thunks/signInThunk.ts
import { Dispatch } from 'redux';
import { authService } from '../../services/authService';
import { signInRequest, signInSuccess, signInFailure } from '../actions/authActions';

/**
 * Authenticates a user with the provided credentials.
 *
 * @param {SignInPayload} payload - User credentials
 * @returns {Function} Redux thunk
 */
export const signInThunk = (payload: SignInPayload) => async (dispatch: Dispatch) => {
  dispatch(signInRequest());
  try {
    const user = await authService.signIn(payload);
    dispatch(signInSuccess(user));
  } catch (error: any) {
    dispatch(signInFailure(error.message));
  }
};
```

---

## Typed Hooks (always use these — never raw useSelector/useDispatch)

```ts
// src/hooks/redux.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## State Shape Rules

- Every slice must have `loading`, `error`, and the data field
- Loading is always boolean
- Error is always `string | null`
- Never store derived data in state — compute in selectors
- Never store non-serializable values in Redux (no class instances, no functions)

---

## Folder Structure
```
features/[feature]/redux/
  authSlice.ts          # RTK: slice with reducers and extraReducers
  selectors.ts          # All selectors for this feature
  thunks/
    signInThunk.ts      # One file per thunk
  actions/              # Legacy only
  reducers/             # Legacy only
```

---

## Security

- **Never store sensitive data in Redux state:** No tokens, passwords, full PII, payment card data, or session secrets
- **Sensitive display data:** If you must display sensitive info (last 4 of card, partial email), store only the masked version
- **State serialization:** Redux DevTools exposes full state in development — ensure sensitive fields are excluded via `actionSanitizer` and `stateSanitizer`
- **Selector exposure:** Selectors that return sensitive fields should only be used in components that genuinely need them — never expose globally
- **Persist carefully:** If using redux-persist, encrypt the persisted store and never persist auth tokens

```ts
// DevTools sanitization — always configure in development
const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production' && {
    actionSanitizer: (action) =>
      action.type === 'auth/signIn/fulfilled'
        ? { ...action, payload: '[REDACTED]' }
        : action,
    stateSanitizer: (state: any) => ({
      ...state,
      auth: { ...state.auth, sensitiveField: '[REDACTED]' },
    }),
  },
});
```
