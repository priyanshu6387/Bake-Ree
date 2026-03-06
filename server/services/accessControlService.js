import AccessRole from "../models/AccessRole.js";
import OpsSettings from "../models/OpsSettings.js";
import {
  ADMIN_PINNED_ROLE_KEYS,
  CORE_TABS,
  DEFAULT_ROLE_PRESETS,
  buildModulePermission,
  normalizeRouteToPermission,
} from "../config/permissionCatalog.js";

let bootstrapPromise = null;

const toEntry = (entry) => {
  if (!entry) return { visible: true, locked: false };
  return {
    visible: entry.visible !== false,
    locked: entry.locked === true,
  };
};

const mapToObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (typeof value.toObject === "function") return value.toObject();
  return value;
};

const normalizePath = (path = "") => {
  if (!path) return "/";
  if (!path.startsWith("/")) return `/${path}`;
  return path;
};

const wildcardToRegex = (pattern = "") =>
  new RegExp(
    `^${pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\\\[.*?\\\]/g, "[^/]+")}$`
  );

export const hasPermission = (permissions = [], requiredPermission = "") => {
  if (!requiredPermission) return true;
  if (!Array.isArray(permissions) || permissions.length === 0) return false;
  if (permissions.includes("*")) return true;

  return permissions.some((perm) => {
    if (!perm) return false;
    if (perm === requiredPermission) return true;
    if (perm.includes("*")) {
      return wildcardToRegex(perm).test(requiredPermission);
    }
    return false;
  });
};

const mergeUnique = (...lists) => {
  const merged = new Set();
  lists
    .flat()
    .filter(Boolean)
    .forEach((item) => merged.add(item));
  return [...merged];
};

const resolveLegacyRoleKey = (user) => {
  if (user.accessRoleKey) return user.accessRoleKey;
  if (user.isAdmin === true || user.role === "admin") return "ops_admin";
  if (user.role === "kitchen_staff") return "kitchen_prep";
  return null;
};

const getBestPagePolicyMatch = (pagesPolicy = {}, pathname = "") => {
  const normalizedPath = normalizePath(pathname);
  if (pagesPolicy[normalizedPath]) return toEntry(pagesPolicy[normalizedPath]);

  const entries = Object.entries(pagesPolicy)
    .filter(([rulePath]) => rulePath.includes("*") || rulePath.includes("["))
    .map(([rulePath, value]) => ({
      rulePath,
      value: toEntry(value),
      regex: wildcardToRegex(normalizePath(rulePath)),
    }))
    .filter((entry) => entry.regex.test(normalizedPath))
    .sort((a, b) => b.rulePath.length - a.rulePath.length);

  return entries[0]?.value ?? null;
};

const resolveModuleVisibility = ({ moduleKey, roleKey, permissions, roleModules, userModules }) => {
  const requiredPermission = buildModulePermission(moduleKey);
  let result = {
    visible: hasPermission(permissions, requiredPermission),
    locked: false,
  };

  const isCore = CORE_TABS.has(moduleKey);
  const isPinnedAdmin = ADMIN_PINNED_ROLE_KEYS.has(roleKey);

  if (isCore && isPinnedAdmin) {
    result = { visible: true, locked: true };
  }

  if (!isCore && roleModules[moduleKey]) {
    result = toEntry(roleModules[moduleKey]);
  }
  if (!isCore && userModules[moduleKey]) {
    result = toEntry(userModules[moduleKey]);
  }

  if (result.locked) {
    return { visible: false, locked: true };
  }
  return result;
};

const resolvePageVisibility = ({ pathname, permissions, rolePages, userPages }) => {
  const requiredPermission = normalizeRouteToPermission(pathname);
  let result = {
    visible: hasPermission(permissions, requiredPermission) || hasPermission(permissions, "ops.page.*.view"),
    locked: false,
  };

  const roleMatch = getBestPagePolicyMatch(rolePages, pathname);
  if (roleMatch) result = roleMatch;
  const userMatch = getBestPagePolicyMatch(userPages, pathname);
  if (userMatch) result = userMatch;

  if (result.locked) {
    return { visible: false, locked: true };
  }
  return result;
};

export const ensureAccessControlBootstrap = async () => {
  if (bootstrapPromise) {
    await bootstrapPromise;
    return;
  }

  bootstrapPromise = (async () => {
    await Promise.all(
      DEFAULT_ROLE_PRESETS.map((preset) =>
        AccessRole.findOneAndUpdate(
          { key: preset.key },
          {
            $setOnInsert: {
              key: preset.key,
              name: preset.name,
              description: preset.description,
              isSystem: preset.isSystem,
            },
            $set: {
              status: "ACTIVE",
              permissions: preset.permissions,
            },
          },
          { upsert: true, new: true }
        )
      )
    );

    await OpsSettings.findOneAndUpdate(
      { key: "default" },
      { $setOnInsert: { key: "default", settingsVersion: 1 } },
      { upsert: true, new: true }
    );
  })();

  await bootstrapPromise;
};

export const resolveAccessContextForUser = async (user, { persistRoleKey = true } = {}) => {
  await ensureAccessControlBootstrap();

  const roleKey = resolveLegacyRoleKey(user);
  const role = roleKey ? await AccessRole.findOne({ key: roleKey, status: "ACTIVE" }) : null;
  const opsSettings = await OpsSettings.findOne({ key: "default" }).lean();

  if (persistRoleKey && !user.accessRoleKey && roleKey) {
    try {
      await user.constructor.findByIdAndUpdate(user._id, { $set: { accessRoleKey: roleKey } });
    } catch {
      // Intentionally ignore persistence errors while resolving context.
    }
  }

  const mergedPermissions = mergeUnique(role?.permissions ?? [], user.permissions ?? []);
  const roleModules = mapToObject(role?.navPolicy?.modules);
  const rolePages = mapToObject(role?.navPolicy?.pages);
  const userModules = mapToObject(user.accessOverrides?.modules);
  const userPages = mapToObject(user.accessOverrides?.pages);

  return {
    roleKey: role?.key ?? roleKey ?? null,
    roleName: role?.name ?? null,
    roleStatus: role?.status ?? "INACTIVE",
    permissions: mergedPermissions,
    isSuperAdmin: role?.key === "super_admin",
    isOpsAdmin: role?.key === "ops_admin" || user.isAdmin === true || user.role === "admin",
    settingsVersion: opsSettings?.settingsVersion ?? 1,
    navPolicy: {
      modules: {
        ...roleModules,
        ...userModules,
      },
      pages: {
        ...rolePages,
        ...userPages,
      },
    },
    _internals: {
      roleModules,
      rolePages,
      userModules,
      userPages,
    },
  };
};

export const canViewModule = (accessContext, moduleKey) => {
  if (!accessContext) return false;
  const { roleKey, permissions, _internals } = accessContext;
  const roleModules = _internals?.roleModules ?? {};
  const userModules = _internals?.userModules ?? {};

  return resolveModuleVisibility({
    moduleKey,
    roleKey,
    permissions,
    roleModules,
    userModules,
  }).visible;
};

export const canViewPath = (accessContext, pathname) => {
  if (!accessContext) return false;
  const normalizedPath = normalizePath(pathname);
  if (!normalizedPath.startsWith("/ops") && !normalizedPath.startsWith("/kitchen")) {
    return true;
  }

  if (normalizedPath.startsWith("/kitchen")) {
    const permission = normalizeRouteToPermission(normalizedPath);
    return hasPermission(accessContext.permissions, permission);
  }

  const firstSegment = normalizedPath.split("/").filter(Boolean)[1];
  const moduleKey = firstSegment || "home";

  if (!canViewModule(accessContext, moduleKey)) {
    return false;
  }

  const { rolePages = {}, userPages = {}, permissions = [] } = accessContext._internals ?? {};
  const pageVisibility = resolvePageVisibility({
    pathname: normalizedPath,
    permissions,
    rolePages,
    userPages,
  });

  return pageVisibility.visible;
};

export const getModuleVisibilityMap = (accessContext, moduleKeys = []) => {
  const entries = moduleKeys.map((moduleKey) => [moduleKey, canViewModule(accessContext, moduleKey)]);
  return Object.fromEntries(entries);
};
