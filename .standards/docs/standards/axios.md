# Axios Standards
# Mavutech Engineering — docs/standards/axios.md

---

## Core Rules

- One shared Axios base instance per project — never instantiate Axios ad hoc
- Never call Axios directly from a component or thunk
- All API calls go through a service file
- One service file per resource (`userService.ts`, `paymentService.ts`)
- 10 second timeout on every request — no exceptions
- Firebase Auth token injected automatically via interceptor

---

## Base Instance Setup

```ts
// src/api/client.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getAuth } from 'firebase/auth';
import { generateRequestId } from '@/utils/requestId';
import { CONFIG } from '@/config';

/**
 * Shared Axios instance for all API communication.
 * Handles auth token injection, request IDs, timeouts, and error normalization.
 */
const client: AxiosInstance = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor — injects Firebase Auth token and request ID on every outbound request.
 */
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['X-Request-ID'] = generateRequestId();
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor — normalizes errors and handles 401 sign-out.
 */
client.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const auth = getAuth();
      await auth.signOut();
      // Navigation to auth screen handled by auth state listener in app root
    }
    return Promise.reject(normalizeError(error));
  }
);

/**
 * Normalizes Axios errors into a consistent shape.
 *
 * @param {unknown} error - Raw Axios error
 * @returns {{ code: string, message: string, status: number | null }}
 */
const normalizeError = (error: any) => ({
  code: error.response?.data?.error?.code ?? 'UNKNOWN_ERROR',
  message: error.response?.data?.error?.message ?? 'An unexpected error occurred.',
  status: error.response?.status ?? null,
});

export default client;
```

---

## Service File Pattern

```ts
// features/auth/services/authService.ts
import client from '@/api/client';
import { SignInPayload, User, ApiResponse } from '../types';

/**
 * Handles all authentication-related API communication.
 */
export const authService = {
  /**
   * Signs in a user with email and password.
   *
   * @param {SignInPayload} payload - User credentials
   * @returns {Promise<User>} Authenticated user data
   * @throws {{ code: string, message: string }} Normalized API error
   * @example
   * const user = await authService.signIn({ email: 'a@b.com', password: 'secret' });
   */
  signIn: async (payload: SignInPayload): Promise<User> => {
    const { data } = await client.post<ApiResponse<User>>('/auth/sign-in', payload);
    return data.data;
  },

  /**
   * Signs out the current user session on the server.
   *
   * @returns {Promise<void>}
   */
  signOut: async (): Promise<void> => {
    await client.post('/auth/sign-out');
  },
};
```

---

## Request ID Utility

```ts
// src/utils/requestId.ts
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique UUID for request tracing.
 *
 * @returns {string} UUID v4 string
 */
export const generateRequestId = (): string => uuidv4();
```

---

## Rules Summary

| Rule | Requirement |
|---|---|
| Timeout | 10 seconds on every request |
| Auth | Firebase token via interceptor — never manually |
| Request ID | X-Request-ID header on every request |
| Error shape | Always normalized via interceptor |
| Direct Axios | Never — always through a service |
| Service naming | One file per resource, camelCase |
| Response unwrapping | Unwrap `data.data` in service, not in thunk or component |

---

## Security

- **Never log request payloads** that may contain PII or credentials — sanitize before any logging
- **Strip sensitive headers** from error logs — Authorization headers must never appear in logs
- **Response validation:** Validate that responses match the expected shape before using data — never blindly trust API responses
- **HTTPS only:** The base URL must always be HTTPS in production — reject HTTP base URLs at config level
- **Timeout is mandatory:** A missing timeout allows hanging connections that can be exploited for resource exhaustion
- **Error messages:** Never surface raw Axios error details to the user — always use the normalized error shape
- **Token handling:** Firebase tokens are short-lived — the interceptor must always call `getIdToken(true)` to force refresh when within the expiry window

```ts
// Force token refresh when within 5 minutes of expiry
const token = await user.getIdToken(
  user.stsTokenManager?.expirationTime - Date.now() < 5 * 60 * 1000
);
```

- **Dependency:** Pin `axios` to an exact version in package.json — axios has had historical supply chain incidents
