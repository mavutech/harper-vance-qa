/**
 * @fileoverview Auth feature — public surface re-exports.
 * Components, hooks, and thunks elsewhere in the app should import from
 * `features/auth` rather than reaching into subfolders directly.
 */

export {default as apiClient} from '../../api/client';
export * as usersApi from './api/usersApi';
export * as authApi from './api/authApi';
export * as firebaseAuthService from './services/firebaseAuthService';
export {useCurrentUser} from './hooks/useCurrentUser';
export {useRole, ROLES} from './hooks/useRole';
