// Firebase Error Message Utility
// Converts Firebase error codes to user-friendly messages

export const getFirebaseErrorMessage = (error) => {
  if (!error || !error.code) {
    return error?.message || 'An unexpected error occurred';
  }

  switch (error.code) {
    // Authentication Errors
    case 'auth/invalid-email':
      return 'Please enter a valid email address';
    
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support';
    
    case 'auth/user-not-found':
      return 'No account found with this email address';
    
    case 'auth/wrong-password':
      return 'Invalid password. Please check your password and try again';
    
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again';
    
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later';
    
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again';
    
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Please contact support';
    
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password';
    
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists';
    
    case 'auth/requires-recent-login':
      return 'Please sign in again to complete this action';
    
    case 'auth/credential-already-in-use':
      return 'This credential is already associated with another account';
    
    case 'auth/invalid-verification-code':
      return 'Invalid verification code. Please try again';
    
    case 'auth/invalid-verification-id':
      return 'Invalid verification ID. Please try again';
    
    case 'auth/missing-verification-code':
      return 'Please enter the verification code';
    
    case 'auth/missing-verification-id':
      return 'Verification ID is missing. Please try again';
    
    case 'auth/code-expired':
      return 'Verification code has expired. Please request a new one';
    
    case 'auth/invalid-phone-number':
      return 'Please enter a valid phone number';
    
    case 'auth/missing-phone-number':
      return 'Please enter your phone number';
    
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded. Please try again later';
    
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed. Please try again';
    
    case 'auth/app-deleted':
      return 'Application has been deleted. Please contact support';
    
    case 'auth/app-not-authorized':
      return 'Application is not authorized. Please contact support';
    
    case 'auth/argument-error':
      return 'Invalid request. Please try again';
    
    case 'auth/invalid-api-key':
      return 'Invalid API key. Please contact support';
    
    case 'auth/invalid-user-token':
      return 'Your session has expired. Please sign in again';
    
    case 'auth/invalid-tenant-id':
      return 'Invalid tenant ID. Please contact support';
    
    case 'auth/multi-factor-auth-required':
      return 'Multi-factor authentication is required';
    
    case 'auth/multi-factor-info-not-found':
      return 'Multi-factor authentication information not found';
    
    case 'auth/multi-factor-session-expired':
      return 'Multi-factor authentication session expired. Please try again';
    
    case 'auth/second-factor-already-in-use':
      return 'This second factor is already in use';
    
    case 'auth/maximum-second-factor-count-exceeded':
      return 'Maximum number of second factors exceeded';
    
    case 'auth/tenant-id-mismatch':
      return 'Tenant ID mismatch. Please contact support';
    
    case 'auth/unsupported-tenant-operation':
      return 'Operation not supported for this tenant';
    
    case 'auth/unverified-email':
      return 'Please verify your email address before signing in';
    
    case 'auth/user-mismatch':
      return 'User credentials do not match';
    
    case 'auth/user-signed-out':
      return 'You have been signed out. Please sign in again';
    
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password';
    
    case 'auth/web-storage-unsupported':
      return 'Web storage is not supported. Please enable cookies and try again';
    
    case 'auth/already-initialized':
      return 'Authentication already initialized';
    
    case 'auth/recaptcha-not-enabled':
      return 'reCAPTCHA is not enabled. Please contact support';
    
    case 'auth/missing-recaptcha-token':
      return 'reCAPTCHA token is missing. Please try again';
    
    case 'auth/invalid-recaptcha-token':
      return 'Invalid reCAPTCHA token. Please try again';
    
    case 'auth/invalid-recaptcha-action':
      return 'Invalid reCAPTCHA action. Please try again';
    
    case 'auth/missing-client-type':
      return 'Missing client type. Please contact support';
    
    case 'auth/missing-recaptcha-version':
      return 'Missing reCAPTCHA version. Please contact support';
    
    case 'auth/invalid-recaptcha-version':
      return 'Invalid reCAPTCHA version. Please contact support';
    
    case 'auth/invalid-req-type':
      return 'Invalid request type. Please contact support';
    
    // Generic fallback
    default:
      // If it's a Firebase error but not in our list, return the original message
      if (error.code.startsWith('auth/')) {
        return error.message || 'Authentication error occurred';
      }
      
      // For non-Firebase errors, return the original message
      return error.message || 'An unexpected error occurred';
  }
};

// Helper function specifically for sign-in errors
export const getSignInErrorMessage = (error) => {
  const message = getFirebaseErrorMessage(error);
  
  // Add context for common sign-in scenarios
  if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  return message;
};

// Helper function specifically for sign-up errors
export const getSignUpErrorMessage = (error) => {
  const message = getFirebaseErrorMessage(error);
  
  // Add context for common sign-up scenarios
  if (error?.code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Please sign in instead or use a different email address.';
  }
  
  return message;
};

// Helper function specifically for password reset errors
export const getPasswordResetErrorMessage = (error) => {
  const message = getFirebaseErrorMessage(error);
  
  // Add context for password reset scenarios
  if (error?.code === 'auth/user-not-found') {
    return 'No account found with this email address. Please check the email or create a new account.';
  }
  
  return message;
};
