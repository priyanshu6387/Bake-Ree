import AccessRole from "../models/AccessRole.js";
import OpsSettings from "../models/OpsSettings.js";
import { CORE_TABS, DEFAULT_ROLE_PRESETS } from "../config/permissionCatalog.js";
import { logAdminAudit, listAdminAuditLogs } from "../services/adminAuditService.js";
import { ensureAccessControlBootstrap } from "../services/accessControlService.js";

const SETTINGS_KEY = "default";

const normalizePolicyEntry = (entry) => ({
  visible: entry?.locked ? false : entry?.visible !== false,
  locked: entry?.locked === true,
});

const mapToObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (typeof value.toObject === "function") return value.toObject();
  return value;
};

const getOrCreateSettings = async () => {
  await ensureAccessControlBootstrap();
  let settings = await OpsSettings.findOne({ key: SETTINGS_KEY });
  if (!settings) {
    settings = await OpsSettings.create({ key: SETTINGS_KEY, settingsVersion: 1 });
  }
  return settings;
};

const bumpSettingsVersion = async (updatedBy = null) => {
  const settings = await getOrCreateSettings();
  settings.settingsVersion += 1;
  settings.updatedBy = updatedBy ?? null;
  await settings.save();
  return settings;
};

const formatRole = (role) => ({
  key: role.key,
  name: role.name,
  description: role.description,
  status: role.status,
  isSystem: role.isSystem,
  permissions: role.permissions ?? [],
  navPolicy: {
    modules: mapToObject(role.navPolicy?.modules),
    pages: mapToObject(role.navPolicy?.pages),
  },
  metadata: role.metadata ?? {},
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
});

const requireLockAuthority = (req) => {
  if (process.env.NODE_ENV !== "production") return true;
  return req.accessContext?.roleKey === "super_admin";
};

export const getSettingsBootstrap = async (_req, res) => {
  try {
    const [settings, roles] = await Promise.all([
      getOrCreateSettings(),
      AccessRole.find().sort({ isSystem: -1, name: 1 }),
    ]);

    res.status(200).json({
      settingsVersion: settings.settingsVersion ?? 1,
      coreTabs: [...CORE_TABS],
      systemRolePresets: DEFAULT_ROLE_PRESETS.map((preset) => ({
        key: preset.key,
        name: preset.name,
        description: preset.description,
      })),
      roles: roles.map(formatRole),
      settings: {
        workflow: settings.workflow ?? {},
        notifications: settings.notifications ?? {},
        integrations: settings.integrations ?? {},
        compliance: settings.compliance ?? {},
        kitchen: settings.kitchen ?? {},
      },
    });
  } catch (error) {
    console.error("Failed to load settings bootstrap:", error);
    res.status(500).json({ error: "Failed to load settings bootstrap" });
  }
};

export const listAccessRoles = async (_req, res) => {
  try {
    const roles = await AccessRole.find().sort({ isSystem: -1, name: 1 });
    res.status(200).json(roles.map(formatRole));
  } catch (error) {
    console.error("Failed to list access roles:", error);
    res.status(500).json({ error: "Failed to list access roles" });
  }
};

export const createAccessRole = async (req, res) => {
  try {
    const { key, name, description = "", permissions = [], metadata = {} } = req.body;
    if (!key || !name) {
      return res.status(400).json({ error: "Role key and name are required" });
    }

    const existing = await AccessRole.findOne({ key: String(key).trim() });
    if (existing) {
      return res.status(409).json({ error: "Role key already exists" });
    }

    const role = await AccessRole.create({
      key: String(key).trim(),
      name: String(name).trim(),
      description,
      permissions,
      metadata,
      status: "ACTIVE",
      isSystem: false,
      navPolicy: { modules: {}, pages: {} },
    });

    const settings = await bumpSettingsVersion(req.user?._id);
    await logAdminAudit({
      actorId: req.user?._id,
      action: "ROLE_CREATED",
      entityType: "access_role",
      entityId: role.key,
      before: null,
      after: formatRole(role),
      metadata: { settingsVersion: settings.settingsVersion },
    });

    res.status(201).json({ role: formatRole(role), settingsVersion: settings.settingsVersion });
  } catch (error) {
    console.error("Failed to create access role:", error);
    res.status(500).json({ error: "Failed to create access role" });
  }
};

export const updateAccessRole = async (req, res) => {
  try {
    const roleKey = req.params.roleKey;
    const role = await AccessRole.findOne({ key: roleKey });
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    const before = formatRole(role);
    const { name, description, permissions, status, metadata } = req.body;

    if (name !== undefined) role.name = name;
    if (description !== undefined) role.description = description;
    if (Array.isArray(permissions)) role.permissions = permissions;
    if (status && ["ACTIVE", "INACTIVE"].includes(status)) role.status = status;
    if (metadata && typeof metadata === "object") role.metadata = metadata;

    await role.save();
    const settings = await bumpSettingsVersion(req.user?._id);

    await logAdminAudit({
      actorId: req.user?._id,
      action: "ROLE_UPDATED",
      entityType: "access_role",
      entityId: role.key,
      before,
      after: formatRole(role),
      metadata: { settingsVersion: settings.settingsVersion },
    });

    res.status(200).json({ role: formatRole(role), settingsVersion: settings.settingsVersion });
  } catch (error) {
    console.error("Failed to update access role:", error);
    res.status(500).json({ error: "Failed to update access role" });
  }
};

export const getNavigationPolicy = async (req, res) => {
  try {
    const roleKey = req.query.roleKey;
    if (!roleKey) {
      return res.status(400).json({ error: "roleKey is required" });
    }

    const role = await AccessRole.findOne({ key: roleKey });
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    const settings = await getOrCreateSettings();
    res.status(200).json({
      roleKey: role.key,
      navPolicy: {
        modules: mapToObject(role.navPolicy?.modules),
        pages: mapToObject(role.navPolicy?.pages),
      },
      settingsVersion: settings.settingsVersion ?? 1,
      coreTabs: [...CORE_TABS],
    });
  } catch (error) {
    console.error("Failed to fetch navigation policy:", error);
    res.status(500).json({ error: "Failed to fetch navigation policy" });
  }
};

export const updateNavigationPolicy = async (req, res) => {
  try {
    const { roleKey, modules = {}, pages = {} } = req.body;
    if (!roleKey) {
      return res.status(400).json({ error: "roleKey is required" });
    }

    const role = await AccessRole.findOne({ key: roleKey });
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    const before = formatRole(role);

    const normalizedModules = {};
    for (const [moduleKey, entry] of Object.entries(modules)) {
      if (CORE_TABS.has(moduleKey)) {
        return res.status(400).json({
          error: `Core tab '${moduleKey}' cannot be configured from navigation settings`,
        });
      }
      if (entry?.locked && !requireLockAuthority(req)) {
        return res.status(403).json({ error: "Only super admin can lock navigation entries" });
      }
      normalizedModules[moduleKey] = normalizePolicyEntry(entry);
    }

    const normalizedPages = {};
    for (const [path, entry] of Object.entries(pages)) {
      if (entry?.locked && !requireLockAuthority(req)) {
        return res.status(403).json({ error: "Only super admin can lock route entries" });
      }
      normalizedPages[path] = normalizePolicyEntry(entry);
    }

    role.navPolicy = {
      modules: normalizedModules,
      pages: normalizedPages,
    };
    await role.save();

    const settings = await bumpSettingsVersion(req.user?._id);
    await logAdminAudit({
      actorId: req.user?._id,
      action: "NAV_POLICY_UPDATED",
      entityType: "access_role",
      entityId: role.key,
      before,
      after: formatRole(role),
      metadata: { settingsVersion: settings.settingsVersion },
    });

    res.status(200).json({
      roleKey: role.key,
      navPolicy: formatRole(role).navPolicy,
      settingsVersion: settings.settingsVersion,
    });
  } catch (error) {
    console.error("Failed to update navigation policy:", error);
    res.status(500).json({ error: "Failed to update navigation policy" });
  }
};

export const getKitchenRbac = async (_req, res) => {
  try {
    const roles = await AccessRole.find({ key: { $regex: "^kitchen_" } }).sort({ key: 1 });
    res.status(200).json(roles.map(formatRole));
  } catch (error) {
    console.error("Failed to fetch kitchen RBAC:", error);
    res.status(500).json({ error: "Failed to fetch kitchen RBAC" });
  }
};

export const updateKitchenRbac = async (req, res) => {
  try {
    const { roleKey, permissions = [] } = req.body;
    if (!roleKey || !String(roleKey).startsWith("kitchen_")) {
      return res.status(400).json({ error: "A kitchen roleKey is required" });
    }

    const role = await AccessRole.findOne({ key: roleKey });
    if (!role) {
      return res.status(404).json({ error: "Kitchen role not found" });
    }

    const before = formatRole(role);
    role.permissions = Array.isArray(permissions) ? permissions : role.permissions;
    await role.save();

    const settings = await bumpSettingsVersion(req.user?._id);
    await logAdminAudit({
      actorId: req.user?._id,
      action: "KITCHEN_RBAC_UPDATED",
      entityType: "access_role",
      entityId: role.key,
      before,
      after: formatRole(role),
      metadata: { settingsVersion: settings.settingsVersion },
    });

    res.status(200).json({
      role: formatRole(role),
      settingsVersion: settings.settingsVersion,
    });
  } catch (error) {
    console.error("Failed to update kitchen RBAC:", error);
    res.status(500).json({ error: "Failed to update kitchen RBAC" });
  }
};

const createSettingsGetter = (section) => async (_req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.status(200).json({
      section,
      value: settings[section] ?? {},
      settingsVersion: settings.settingsVersion ?? 1,
    });
  } catch (error) {
    console.error(`Failed to fetch settings section ${section}:`, error);
    res.status(500).json({ error: `Failed to fetch ${section} settings` });
  }
};

const createSettingsUpdater = (section, actionName) => async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const before = settings[section] ?? {};
    settings[section] = req.body?.value && typeof req.body.value === "object" ? req.body.value : {};
    settings.settingsVersion += 1;
    settings.updatedBy = req.user?._id ?? null;
    await settings.save();

    await logAdminAudit({
      actorId: req.user?._id,
      action: actionName,
      entityType: "ops_settings",
      entityId: SETTINGS_KEY,
      before,
      after: settings[section],
      metadata: { section, settingsVersion: settings.settingsVersion },
    });

    res.status(200).json({
      section,
      value: settings[section],
      settingsVersion: settings.settingsVersion,
    });
  } catch (error) {
    console.error(`Failed to update settings section ${section}:`, error);
    res.status(500).json({ error: `Failed to update ${section} settings` });
  }
};

export const getWorkflowSettings = createSettingsGetter("workflow");
export const updateWorkflowSettings = createSettingsUpdater("workflow", "WORKFLOW_SETTINGS_UPDATED");

export const getNotificationSettings = createSettingsGetter("notifications");
export const updateNotificationSettings = createSettingsUpdater(
  "notifications",
  "NOTIFICATION_SETTINGS_UPDATED"
);

export const getIntegrationSettings = createSettingsGetter("integrations");
export const updateIntegrationSettings = createSettingsUpdater(
  "integrations",
  "INTEGRATION_SETTINGS_UPDATED"
);

export const getComplianceSettings = createSettingsGetter("compliance");
export const updateComplianceSettings = createSettingsUpdater(
  "compliance",
  "COMPLIANCE_SETTINGS_UPDATED"
);

export const listSettingsAuditLog = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 100);
    const logs = await listAdminAuditLogs({ limit: Number.isNaN(limit) ? 100 : limit });
    res.status(200).json(logs);
  } catch (error) {
    console.error("Failed to fetch settings audit log:", error);
    res.status(500).json({ error: "Failed to fetch settings audit log" });
  }
};
