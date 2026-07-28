# Node.js / Express API Standards
# Mavutech Engineering — docs/standards/node-api.md

---

## Architecture: Routes → Controllers → Services

```
src/
  routes/         # Express router only — no logic
  controllers/    # Request/response handling only — no business logic
  services/       # All business logic lives here
  middleware/     # Auth, validation, error handling
  types/          # Shared TypeScript interfaces
  config/         # Environment and app configuration
  utils/          # Shared utilities (requestId, logger, etc.)
```

---

## Standard Response Envelope

Every endpoint returns this shape — no exceptions:

```ts
// src/types/api.ts

/**
 * Standard API response envelope used across all endpoints.
 *
 * @template T - Type of the data payload
 */
export interface ApiResponse<T = null> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;       // ISO 8601
    requestId: string;       // UUID from X-Request-ID header
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
  error: {
    code: string;            // Machine-readable e.g. USER_NOT_FOUND
    message: string;         // Human-readable
    details?: Record<string, unknown>;
  } | null;
}
```

### Response Helpers

```ts
// src/utils/response.ts
import { Response } from 'express';
import { ApiResponse } from '@/types/api';

/**
 * Sends a successful API response with the standard envelope.
 *
 * @param {Response} res - Express response object
 * @param {T} data - Response payload
 * @param {string} requestId - Request trace ID
 * @param {number} [status=200] - HTTP status code
 * @param {ApiResponse['meta']['pagination']} [pagination] - Optional pagination meta
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  requestId: string,
  status = 200,
  pagination?: ApiResponse<T>['meta']['pagination']
): void => {
  res.status(status).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      ...(pagination && { pagination }),
    },
    error: null,
  } as ApiResponse<T>);
};

/**
 * Sends a standardized error response.
 *
 * @param {Response} res - Express response object
 * @param {string} code - Machine-readable error code
 * @param {string} message - Human-readable error message
 * @param {string} requestId - Request trace ID
 * @param {number} [status=500] - HTTP status code
 * @param {Record<string, unknown>} [details] - Optional error details
 */
export const sendError = (
  res: Response,
  code: string,
  message: string,
  requestId: string,
  status = 500,
  details?: Record<string, unknown>
): void => {
  res.status(status).json({
    success: false,
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
    error: { code, message, ...(details && { details }) },
  } as ApiResponse);
};
```

---

## Route Layer (no logic — only wiring)

```ts
// src/routes/userRoutes.ts
import { Router } from 'express';
import { UserController } from '@/controllers/userController';
import { authenticate } from '@/middleware/authenticate';
import { validateBody } from '@/middleware/validateBody';
import { updateUserSchema } from '@/validators/userValidators';

const router = Router();

router.get('/:id', authenticate, UserController.getById);
router.put('/:id', authenticate, validateBody(updateUserSchema), UserController.update);

export default router;
```

---

## Controller Layer (request/response only — delegate all logic to service)

```ts
// src/controllers/userController.ts
import { Request, Response } from 'express';
import { userService } from '@/services/userService';
import { sendSuccess, sendError } from '@/utils/response';

export const UserController = {
  /**
   * Retrieves a user by their ID.
   *
   * @param {Request} req - Express request. Expects `req.params.id`.
   * @param {Response} res - Express response
   * @returns {Promise<void>}
   */
  getById: async (req: Request, res: Response): Promise<void> => {
    const requestId = req.headers['x-request-id'] as string;
    try {
      const user = await userService.getById(req.params.id);
      sendSuccess(res, user, requestId);
    } catch (error: any) {
      sendError(res, error.code ?? 'USER_FETCH_FAILED', error.message, requestId, error.status ?? 500);
    }
  },
};
```

---

## Service Layer (all business logic lives here)

```ts
// src/services/userService.ts
import { getFirestore } from 'firebase-admin/firestore';
import { User } from '@/types';

/**
 * Handles all user-related business logic and data access.
 */
export const userService = {
  /**
   * Retrieves a user document by ID from Firestore.
   *
   * @param {string} userId - The Firestore document ID of the user
   * @returns {Promise<User>} The user data
   * @throws {{ code: string, message: string, status: number }} When user is not found
   * @example
   * const user = await userService.getById('abc123');
   */
  getById: async (userId: string): Promise<User> => {
    const db = getFirestore();
    const doc = await db.collection('users').doc(userId).get();

    if (!doc.exists) {
      throw { code: 'USER_NOT_FOUND', message: 'User not found.', status: 404 };
    }

    return { id: doc.id, ...doc.data() } as User;
  },
};
```

---

## Middleware Standards

### Auth Middleware
```ts
// src/middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { sendError } from '@/utils/response';

/**
 * Verifies Firebase Auth ID token on protected routes.
 * Attaches decoded user to req.user on success.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const requestId = req.headers['x-request-id'] as string;
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'UNAUTHORIZED', 'Missing or invalid authorization header.', requestId, 401);
    return;
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    req.user = await getAuth().verifyIdToken(token);
    next();
  } catch {
    sendError(res, 'UNAUTHORIZED', 'Invalid or expired token.', requestId, 401);
  }
};
```

### Request ID Middleware (apply globally)
```ts
// src/middleware/requestId.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Attaches a unique request ID to every inbound request for traceability.
 */
export const attachRequestId = (req: Request, _res: Response, next: NextFunction): void => {
  req.headers['x-request-id'] = req.headers['x-request-id'] ?? uuidv4();
  next();
};
```

---

## Rules Summary

| Layer | Responsibility |
|---|---|
| Routes | Wire paths to controllers. Zero logic. |
| Controllers | Handle req/res. Delegate to service. Try/catch only. |
| Services | All business logic. All Firestore access. |
| Middleware | Auth, validation, request ID, error handling |

- No logic in routes
- No Firestore calls in controllers
- No req/res objects in services
- Every endpoint uses `sendSuccess` and `sendError` helpers
- Every endpoint has input validation middleware
- Every response includes `requestId` and `timestamp`

---

## Security (Hardened)

### Global Middleware — Apply in This Order
```ts
// src/app.ts
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { attachRequestId } from './middleware/requestId';

app.use(helmet());                                    // 1. Security headers
app.use(cors({ origin: CONFIG.ALLOWED_ORIGINS, credentials: true })); // 2. CORS
app.use(express.json({ limit: '10kb' }));            // 3. Body size limit
app.use(attachRequestId);                             // 4. Request tracing
app.use(rateLimit({                                   // 5. Rate limiting
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));
```

### Error Handling — Never Leak Internals
```ts
// src/middleware/globalErrorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { sendError } from '@/utils/response';

/**
 * Global error handler. Catches any unhandled errors and returns
 * a safe, sanitized response. Never exposes stack traces or internal details.
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string;

  // Log full error internally — never send to client
  console.error('Unhandled error:', {
    requestId,
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  sendError(
    res,
    err.code ?? 'INTERNAL_ERROR',
    'An unexpected error occurred.', // Generic message — never err.message directly
    requestId,
    err.status ?? 500
  );
};
```

### Controller Security Rules
- Never pass `req.body` directly to a service — always destructure only the fields you expect
- Never return raw Firestore documents — always map to a DTO before responding
- Never trust `req.params` or `req.query` without validation

```ts
// Bad — passes entire body, trusts all fields
userService.update(req.params.id, req.body);

// Good — explicitly destructure expected fields only
const { displayName, avatarUrl } = req.body;
userService.update(req.params.id, { displayName, avatarUrl });
```

### Additional Rules
- No stack traces in any API response body — ever
- No internal error messages in API responses — use machine codes and generic messages
- Helmet sets: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `X-XSS-Protection`
- CORS: `ALLOWED_ORIGINS` comes from environment config — never `*` in production
- Run `npm audit --production` before every deployment
