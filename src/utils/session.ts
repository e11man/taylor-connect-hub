/**
 * Generate a simple access token for session management
 * @param userId - The user ID to include in the token
 * @returns string - Base64 encoded token
 */
export const generateAccessToken = (userId: string): string => {
  return btoa(JSON.stringify({
    userId,
    timestamp: Date.now(),
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  }));
};

/**
 * Validate an access token
 * @param token - The token to validate
 * @returns boolean - True if token is valid and not expired
 */
export const validateAccessToken = (token: string): boolean => {
  try {
    const decoded = JSON.parse(atob(token));
    return decoded.expires > Date.now();
  } catch {
    return false;
  }
};

/**
 * Decode an access token to get user information
 * @param token - The token to decode
 * @returns object | null - Decoded token data or null if invalid
 */
export const decodeAccessToken = (token: string): { userId: string; timestamp: number; expires: number } | null => {
  try {
    const decoded = JSON.parse(atob(token));
    if (decoded.expires > Date.now()) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
};