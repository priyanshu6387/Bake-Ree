import {
  clearStoredToken,
  decodeTokenPayload,
  isTokenExpired,
} from "./jwt";

/**
 * Get user role from JWT token
 * @returns {string | null} User role or null if token is invalid/missing
 */
const getValidTokenPayload = () => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) return null;

  if (isTokenExpired(token)) {
    clearStoredToken();
    return null;
  }

  return decodeTokenPayload(token);
};

export const getUserRole = (): string | null => {
  try {
    const decoded = getValidTokenPayload();
    if (!decoded) return null;

    // Return the role if available
    return decoded.role || null;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Get user info from token
 * @returns {Object | null} User info or null
 */
export const getUserInfo = (): {
  id: string;
  role?: string;
  isAdmin?: boolean;
  accessRoleKey?: string | null;
} | null => {
  try {
    const decoded = getValidTokenPayload();
    if (!decoded) return null;
    const userId = decoded.id ?? decoded.userId;
    if (!userId) return null;

    return {
      id: userId,
      role: decoded.role,
      isAdmin: decoded.isAdmin,
      accessRoleKey: decoded.accessRoleKey,
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Check if user is admin
 */
export const isAdmin = (): boolean => {
  const userInfo = getUserInfo();
  return userInfo?.isAdmin === true || userInfo?.role === "admin";
};

/**
 * Check if user is kitchen staff
 */
export const isKitchenStaff = (): boolean => {
  const role = getUserRole();
  return role === "kitchen_staff" || role === "admin";
};

/**
 * Check if user is delivery staff
 */
export const isDeliveryStaff = (): boolean => {
  const role = getUserRole();
  return role === "delivery_staff" || role === "admin";
};

/**
 * Check if user has access to a specific role
 */
export const hasRole = (requiredRole: string): boolean => {
  const role = getUserRole();
  if (role === "admin") return true; // Admin has access to everything
  return role === requiredRole;
};
