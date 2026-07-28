# Unit Test Standards
# Mavutech Engineering — docs/standards/unit-tests.md

---

## Detection Rule

Detect test framework from package.json:
- `jest` + `@testing-library/react-native` → use patterns below
- `jest` only (backend) → service layer tests only
- None found → suggest installing based on project type before proceeding

---

## Coverage Target

- Minimum 80% per feature
- Tests are written after features are complete unless instructed otherwise
- Always flag missing tests during refactor audits
- Ask about test priority at the start of every feature task

---

## Frontend: Jest + React Native Testing Library

### What to Test
| Target | Test? |
|---|---|
| Custom hooks | Yes — always |
| Redux thunks | Yes — always |
| Service files (Axios calls) | Yes — always |
| Selectors with logic | Yes |
| Utility functions | Yes |
| Simple presentational components | No — not worth the maintenance cost |
| Screen components with logic | Yes |

### Hook Test Pattern
```ts
// features/auth/hooks/__tests__/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../useAuth';
import { Provider } from 'react-redux';
import { store } from '@/store';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

describe('useAuth', () => {
  it('returns null user when not authenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
  });

  it('sets loading to true during sign in', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      result.current.signIn({ email: 'a@b.com', password: 'pass' });
    });
    expect(result.current.loading).toBe(true);
  });
});
```

### Thunk Test Pattern
```ts
// features/auth/redux/thunks/__tests__/signInThunk.test.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../authSlice';
import { signInThunk } from '../signInThunk';
import { authService } from '../../../services/authService';

jest.mock('../../../services/authService');

describe('signInThunk', () => {
  const store = configureStore({ reducer: { auth: authReducer } });

  it('sets user on fulfilled', async () => {
    const mockUser = { id: '1', email: 'a@b.com' };
    (authService.signIn as jest.Mock).mockResolvedValue(mockUser);

    await store.dispatch(signInThunk({ email: 'a@b.com', password: 'pass' }));
    expect(store.getState().auth.user).toEqual(mockUser);
    expect(store.getState().auth.loading).toBe(false);
  });

  it('sets error on rejected', async () => {
    (authService.signIn as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

    await store.dispatch(signInThunk({ email: 'a@b.com', password: 'wrong' }));
    expect(store.getState().auth.error).toBe('Invalid credentials');
    expect(store.getState().auth.user).toBeNull();
  });
});
```

### Service Test Pattern
```ts
// features/auth/services/__tests__/authService.test.ts
import client from '@/api/client';
import { authService } from '../authService';

jest.mock('@/api/client');

describe('authService', () => {
  describe('signIn', () => {
    it('returns user data on success', async () => {
      const mockUser = { id: '1', email: 'a@b.com' };
      (client.post as jest.Mock).mockResolvedValue({ data: { data: mockUser } });

      const result = await authService.signIn({ email: 'a@b.com', password: 'pass' });
      expect(result).toEqual(mockUser);
    });

    it('throws normalized error on failure', async () => {
      (client.post as jest.Mock).mockRejectedValue({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials.',
      });

      await expect(authService.signIn({ email: 'a@b.com', password: 'wrong' }))
        .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    });
  });
});
```

---

## Backend: Jest — Service Layer Only

Controllers are thin by design. Business logic lives in services.
Testing services gives maximum coverage where it counts.

```ts
// src/services/__tests__/userService.test.ts
import { userService } from '../userService';
import { getFirestore } from 'firebase-admin/firestore';

jest.mock('firebase-admin/firestore');

describe('userService', () => {
  describe('getById', () => {
    it('returns user when document exists', async () => {
      const mockData = { email: 'a@b.com', displayName: 'Test User' };
      const mockDoc = { exists: true, id: 'user1', data: () => mockData };
      (getFirestore as jest.Mock).mockReturnValue({
        collection: () => ({ doc: () => ({ get: () => Promise.resolve(mockDoc) }) }),
      });

      const result = await userService.getById('user1');
      expect(result).toEqual({ id: 'user1', ...mockData });
    });

    it('throws USER_NOT_FOUND when document does not exist', async () => {
      const mockDoc = { exists: false };
      (getFirestore as jest.Mock).mockReturnValue({
        collection: () => ({ doc: () => ({ get: () => Promise.resolve(mockDoc) }) }),
      });

      await expect(userService.getById('missing'))
        .rejects.toMatchObject({ code: 'USER_NOT_FOUND', status: 404 });
    });
  });
});
```

---

## File Location

All test files live in `__tests__/` within their feature folder:
```
features/auth/
  hooks/__tests__/useAuth.test.ts
  redux/thunks/__tests__/signInThunk.test.ts
  services/__tests__/authService.test.ts
```

---

## Refactor Audit Checklist

When auditing for test coverage, flag:
- Any hook without a test file
- Any thunk without a test file
- Any service method without a test case
- Any utility function with branching logic and no test
- Overall feature coverage below 80%

---

## Security Test Coverage

When generating tests for security-sensitive code, include these cases:

### Auth / Middleware Tests
```ts
describe('authenticate middleware', () => {
  it('rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects requests with an invalid token', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });
});
```

### Input Validation Tests
```ts
describe('createUser validation', () => {
  it('rejects missing required fields', async () => {
    const res = await request(app).post('/api/users').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects oversized payloads', async () => {
    const payload = { name: 'x'.repeat(100000) };
    const res = await request(app).post('/api/users').send(payload);
    expect(res.status).toBe(413); // or 400 depending on validation order
  });
});
```

### Data Exposure Tests
```ts
describe('user response shape', () => {
  it('does not return sensitive internal fields', async () => {
    const res = await authenticatedRequest(app).get('/api/users/me');
    expect(res.body.data).not.toHaveProperty('passwordHash');
    expect(res.body.data).not.toHaveProperty('internalFlags');
    expect(res.body.data).not.toHaveProperty('adminNotes');
  });
});
```
