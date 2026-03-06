type JwtPayload = {
  exp?: number;
  id?: string;
  userId?: string;
  role?: string;
  isAdmin?: boolean;
  accessRoleKey?: string | null;
};

export const decodeTokenPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    return JSON.parse(atob(payload));
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
};

export const clearStoredToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
};

export const setSessionExpiredFlag = (): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("sessionExpired", "1");
};

export const consumeSessionExpiredFlag = (): boolean => {
  if (typeof window === "undefined") return false;
  const flag = localStorage.getItem("sessionExpired");
  if (flag) {
    localStorage.removeItem("sessionExpired");
    return true;
  }
  return false;
};

/**
 * Extract user ID from JWT token stored in localStorage
 * @returns {string | null} User ID or null if token is invalid/missing
 */
export const getUserIdFromToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) return null;

  if (isTokenExpired(token)) {
    clearStoredToken();
    return null;
  }

  const decoded = decodeTokenPayload(token);
  return decoded?.id || decoded?.userId || null;
};

/**
 * Check if user is logged in
 * @returns {boolean} True if token exists and is valid
 */
export const isLoggedIn = (): boolean => {
  return getUserIdFromToken() !== null;
};
