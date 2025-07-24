/**
 * Get the appropriate base URL for the current environment
 * In production, use the environment variable
 * In development, fall back to window.location.origin
 */
export const getBaseUrl = (): string => {
  // First try to get from environment variable
  const envUrl = import.meta.env.VITE_APP_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Fallback to window.location.origin for development
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Default fallback (shouldn't happen in normal usage)
  return 'http://localhost:3000';
};

/**
 * Get the redirect URL for password reset emails
 */
export const getPasswordResetUrl = (): string => {
  return `${getBaseUrl()}/reset-password`;
};

/**
 * Get the redirect URL for email confirmations
 */
export const getEmailConfirmUrl = (path: string = '/'): string => {
  return `${getBaseUrl()}${path}`;
};