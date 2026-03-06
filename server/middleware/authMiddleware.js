import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  canViewPath,
  hasPermission,
  resolveAccessContextForUser,
} from "../services/accessControlService.js";

const resolveDevUser = async () => {
  const user = await User.findOne().select("-password");
  return user || null;
};

const extractBearerToken = (authHeader) => {
  if (!authHeader || typeof authHeader !== "string") return null;
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
};

const hydrateAccessContext = async (req) => {
  if (!req.user) return null;
  const accessContext = await resolveAccessContextForUser(req.user, { persistRoleKey: true });
  req.accessContext = accessContext;
  req.user.permissions = accessContext.permissions;
  req.user.accessRoleKey = accessContext.roleKey;
  req.user.settingsVersion = accessContext.settingsVersion;
  return accessContext;
};

// 🛡️ Middleware: Protect routes (requires valid token)
const protect = async (req, res, next) => {
  const isDev = process.env.NODE_ENV !== "production";
  const token = extractBearerToken(req.headers.authorization);

  if (isDev) {
    // In dev, accept valid token if present; otherwise cleanly fallback to a local dev user.
    // This avoids noisy "invalid signature" spam caused by stale tokens in localStorage.
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (user) {
          req.user = user;
          await hydrateAccessContext(req);
          return next();
        }
      } catch {
        // Ignore invalid/expired signatures in dev and continue to fallback below.
      }
    }

    const devUser = await resolveDevUser();
    if (devUser) {
      req.user = devUser;
      await hydrateAccessContext(req);
      return next();
    }
    return res.status(401).json({ error: "Unauthorized: No dev user found" });
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    req.user = user; // Attach user object to request
    await hydrateAccessContext(req);
    return next();
  } catch (err) {
    console.error("🔐 JWT Error:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// 🧑‍⚖️ Middleware: Admin-only access
const adminOnly = (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  const hasAdminAccess =
    req.user?.isAdmin === true ||
    req.user?.role === "admin" ||
    req.accessContext?.roleKey === "super_admin" ||
    req.accessContext?.roleKey === "ops_admin";

  if (!req.user || !hasAdminAccess) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
};

// 👨‍🍳 Middleware: Kitchen staff or admin access
const kitchenStaffOrAdmin = (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const isKitchenStaff =
    req.user.role === "kitchen_staff" ||
    req.accessContext?.roleKey?.startsWith("kitchen_");
  const isAdmin =
    req.user.isAdmin === true ||
    req.user.role === "admin" ||
    req.accessContext?.roleKey === "super_admin" ||
    req.accessContext?.roleKey === "ops_admin";

  if (!isKitchenStaff && !isAdmin) {
    return res.status(403).json({ error: "Forbidden: Kitchen staff or admin access required" });
  }
  next();
};

// 👨‍🍳 Middleware: Kitchen staff only (no admin override)
const kitchenStaffOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const isKitchenStaff =
    req.user.role === "kitchen_staff" ||
    req.accessContext?.roleKey?.startsWith("kitchen_");

  if (!isKitchenStaff) {
    return res.status(403).json({ error: "Forbidden: Kitchen staff access required" });
  }
  next();
};

// 🚚 Middleware: Delivery staff or admin access
const deliveryStaffOrAdmin = (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const isDeliveryStaff = req.user.role === "delivery_staff" || req.user.role === "admin";
  const isAdmin =
    req.user.isAdmin === true ||
    req.user.role === "admin" ||
    req.accessContext?.roleKey === "super_admin" ||
    req.accessContext?.roleKey === "ops_admin";
  
  if (!isDeliveryStaff && !isAdmin) {
    return res.status(403).json({ error: "Forbidden: Delivery staff or admin access required" });
  }
  next();
};

// ✅ Permission middleware: require explicit permission or admin
const requirePermission = (permission) => (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const permissions = req.accessContext?.permissions || req.user.permissions || [];
  const isAdmin =
    req.user.isAdmin === true ||
    req.user.role === "admin" ||
    req.accessContext?.roleKey === "super_admin" ||
    req.accessContext?.roleKey === "ops_admin";
  if (isAdmin || hasPermission(permissions, permission)) {
    return next();
  }
  return res.status(403).json({ error: `Forbidden: Permission required (${permission})` });
};

const requireAnyPermission = (permissions = []) => (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const granted = req.accessContext?.permissions || req.user.permissions || [];
  const isAdmin =
    req.user.isAdmin === true ||
    req.user.role === "admin" ||
    req.accessContext?.roleKey === "super_admin" ||
    req.accessContext?.roleKey === "ops_admin";
  if (isAdmin || permissions.some((permission) => hasPermission(granted, permission))) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: One of the required permissions is missing" });
};

const requireRoleKey = (roleKeys = []) => (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (roleKeys.includes(req.accessContext?.roleKey)) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: Role access denied" });
};

const requirePathAccess = (pathResolver) => (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }
  if (!req.user || !req.accessContext) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const path = typeof pathResolver === "function" ? pathResolver(req) : req.path;
  if (canViewPath(req.accessContext, path)) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: Route is hidden or locked for this role" });
};

export {
  protect,
  adminOnly,
  kitchenStaffOrAdmin,
  kitchenStaffOnly,
  deliveryStaffOrAdmin,
  requirePermission,
  requireAnyPermission,
  requireRoleKey,
  requirePathAccess,
};
