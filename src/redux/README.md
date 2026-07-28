# Redux Implementation Guide

This project uses Redux for state management with the following packages:
- `redux` - Core Redux library
- `react-redux` - React bindings for Redux
- `redux-thunk` - Middleware for async actions
- `redux-devtools-extension` - Browser DevTools integration
- `redux-form` - Form state management
- `redux-persist` - State persistence to localStorage

## Store Structure

The Redux store is configured in `src/redux/store.js` with Redux Persist integration. The persisted state structure:

```javascript
{
  auth: {
    loading: false,
    isLoggedIn: false,
    user: null,
    error: '',
    isProfileComplete: false
  },
  form: {} // redux-form state (not persisted)
}
```

### Redux Persist Configuration
- **Storage**: localStorage (web)
- **Persisted State**: Only `auth` state is persisted
- **Excluded State**: `form` state is excluded from persistence
- **Key**: 'root'

## Authentication Module

### Action Types (`src/redux/authentication/authTypes.js`)
- `SIGN_UP_REQUEST`, `SIGN_UP_SUCCESS`, `SIGN_UP_FAILURE`
- `SIGN_IN_REQUEST`, `SIGN_IN_SUCCESS`, `SIGN_IN_FAILURE`
- `LOGOUT`
- `CLEAR_ERRORS`
- `UPDATE_PROFILE_REQUEST`, `UPDATE_PROFILE_SUCCESS`, `UPDATE_PROFILE_FAILURE`

### Actions (`src/redux/authentication/authActions.js`)

**Architecture**: Single thunk pattern that dispatches REQUEST, SUCCESS, and FAILURE actions internally.

Available action creators:
- `signUp(userData, config)` - Async action for user registration with Firebase
- `signIn(credentials, config)` - Async action for user login with Firebase
- `logoutUser(config)` - Action for user logout with Firebase and persist cleanup
- `updateUserProfile(profileData, config)` - Async action for profile updates with Firebase
- `clearErrors()` - Action to clear error messages
- `checkAuthStatus(config)` - Action to check Firebase authentication status

**Action Pattern**: Each thunk follows the REQUEST → SUCCESS/FAILURE pattern:
```javascript
export const signIn = (credentials, config = {}) => (dispatch) => {
  dispatch({ type: authTypes.SIGN_IN_REQUEST });
  
  return new Promise((resolve, reject) => {
    // API call logic here
    if (success) {
      const transformedData = config.transformData ? config.transformData(user) : user;
      dispatch({ type: authTypes.SIGN_IN_SUCCESS, payload: transformedData });
      resolve(transformedData);
    } else {
      dispatch({ type: authTypes.SIGN_IN_FAILURE, payload: error });
      reject(new Error(error));
    }
  });
};
```

### Reducer (`src/redux/authentication/authReducers.js`)
Handles all authentication-related state changes.

## Usage Examples

### 1. Using Redux Actions with New Architecture

```javascript
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { signIn, signUp, logoutUser, clearErrors } from '../redux/authentication/authActions';

function MyComponent() {
  const dispatch = useDispatch();
  const { loading, error, isLoggedIn, user } = useSelector(state => state.auth);

  const handleLogin = async (credentials) => {
    try {
      const user = await dispatch(signIn(credentials, {
        transformData: (userData) => ({
          ...userData,
          displayName: userData.name.toUpperCase()
        })
      }));
      console.log('Signed in successfully:', user);
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignUp = async (userData) => {
    try {
      const user = await dispatch(signUp(userData, {
        transformData: (userData) => ({
          ...userData,
          isNewUser: true
        })
      }));
      console.log('Signed up successfully:', user);
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser({
        onComplete: () => {
          console.log('Logout completed');
          // Additional cleanup if needed
        }
      }));
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {isLoggedIn && <p>Welcome, {user.name}!</p>}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

### 2. Using Redux Form

```javascript
import React from 'react';
import { Field, reduxForm } from 'redux-form';

let ContactForm = props => {
  const { handleSubmit } = props;
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="firstName">First Name</label>
        <Field name="firstName" component="input" type="text" />
      </div>
      <div>
        <label htmlFor="lastName">Last Name</label>
        <Field name="lastName" component="input" type="text" />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <Field name="email" component="input" type="email" />
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};

ContactForm = reduxForm({
  form: 'contact' // a unique identifier for this form
})(ContactForm);

export default ContactForm;
```

### 3. Accessing Form Data

```javascript
import { useSelector } from 'react-redux';

function MyComponent() {
  const formData = useSelector(state => state.form.contact?.values);
  
  return (
    <div>
      {formData && <pre>{JSON.stringify(formData, null, 2)}</pre>}
    </div>
  );
}
```

## Adding New Modules

To add a new Redux module (e.g., for products, notifications, etc.):

1. Create a new folder in `src/redux/` (e.g., `src/redux/products/`)
2. Create the following files:
   - `productTypes.js` - Action type constants
   - `productActions.js` - Action creators
   - `productReducers.js` - Reducer function
3. Import and add the reducer to `src/redux/store.js`:

```javascript
import productReducer from './products/productReducers';

const rootReducer = combineReducers({
  auth: authReducer,
  products: productReducer, // Add new reducer here
  form: formReducer,
});
```

## Best Practices

1. **Keep actions pure** - Use thunks for async operations
2. **Normalize state shape** - Avoid deeply nested objects
3. **Use selectors** - Create reusable state selectors
4. **Handle loading states** - Always show loading indicators
5. **Error handling** - Provide meaningful error messages
6. **Persist important data** - Use localStorage for auth tokens

## Development Tools

The Redux DevTools Extension is configured and will work in development mode. You can:
- Inspect the current state
- Time-travel through actions
- Replay actions
- Export/import state

## Redux Persist Integration

### How It Works
Redux Persist automatically saves and restores Redux state to/from localStorage:

1. **On App Load**: State is automatically rehydrated from localStorage
2. **On State Changes**: Auth state is automatically persisted to localStorage
3. **On Logout**: Persisted state is cleared when logout action is dispatched

### PersistGate Component
The app is wrapped with `PersistGate` which:
- Shows a loading screen while state is being rehydrated
- Ensures the app doesn't render until persistence is ready
- Handles the rehydration process automatically

### Benefits
- **Automatic Persistence**: No manual localStorage management needed
- **Seamless UX**: Users stay logged in across browser sessions
- **Selective Persistence**: Only important state (auth) is persisted
- **Error Handling**: Built-in error handling for storage issues

## Firebase Integration

### Setup
The authentication system is integrated with Firebase Authentication. Firebase configuration is located in `src/firebase/config.js`.

### Environment Variables
Create a `.env` file in the project root with your Firebase configuration:

```bash
REACT_APP_FIREBASE_API_KEY=your-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Firebase Features Used
- **Authentication**: Email/password sign up and sign in
- **User Profile Management**: Display name and profile updates
- **Auth State Persistence**: Automatic session management
- **Real-time Auth State**: `onAuthStateChanged` listener

### Firebase Actions
All Redux actions now use Firebase Authentication:

- **`signUp()`**: Uses `createUserWithEmailAndPassword()`
- **`signIn()`**: Uses `signInWithEmailAndPassword()`
- **`logoutUser()`**: Uses `signOut()`
- **`updateUserProfile()`**: Uses `updateProfile()`
- **`checkAuthStatus()`**: Uses `onAuthStateChanged()`

## Current Implementation Status

✅ **Completed:**
- Redux store configuration with Redux Persist
- Authentication module (complete with actions, reducer, types)
- React-Redux Provider setup
- Redux DevTools integration
- Redux Thunk middleware
- Redux Form integration
- Redux Persist integration with PersistGate
- Firebase Authentication integration
- Firebase configuration setup
- Example implementation in Login component
- Header component integration with user state
- Automatic state persistence and rehydration
- Environment variables configuration

✅ **Working Features:**
- Firebase email/password authentication
- User sign up with Firebase
- User sign in with Firebase
- Firebase user profile management
- Real-time auth state synchronization
- Error handling with Firebase error messages
- User logout with Firebase
- Automatic state persistence across browser sessions
- State rehydration on app initialization
- User information display in header
- Form validation and submission
- Selective state persistence (auth only)

The Redux implementation with Firebase Authentication and Redux Persist is now fully functional and provides seamless authentication and state persistence across browser sessions.
