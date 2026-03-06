export const TOP_MODULE_KEYS = [
  "home",
  "orders",
  "production",
  "inventory",
  "logistics",
  "crm",
  "finance",
  "hr",
  "analytics",
  "settings",
];

export const CORE_TABS = new Set(["home", "orders", "analytics"]);
export const ADMIN_PINNED_ROLE_KEYS = new Set(["super_admin", "ops_admin"]);

export const KITCHEN_PAGE_PERMISSIONS = [
  "ops.page.kitchen.queue.view",
  "ops.page.kitchen.workstation.view",
  "ops.page.kitchen.prep.view",
  "ops.page.kitchen.alerts.view",
  "ops.page.kitchen.quality.view",
  "ops.page.kitchen.messages.view",
  "ops.page.kitchen.settings.view",
];

export const KITCHEN_ACTION_PERMISSIONS = [
  "ops.action.kitchen.order.start",
  "ops.action.kitchen.order.mark_ready",
  "ops.action.kitchen.order.hold",
  "ops.action.kitchen.order.handoff",
  "ops.action.kitchen.order.assign_dispatch",
  "ops.action.kitchen.order.complete",
  "ops.action.kitchen.alert.create",
  "ops.action.kitchen.alert.acknowledge",
  "ops.action.kitchen.alert.resolve",
  "ops.action.kitchen.qc.escalate",
  "ops.action.kitchen.message.send",
  "ops.action.kitchen.settings.edit",
];

export const SETTINGS_SECTION_PERMISSIONS = [
  "ops.settings.navigation.read",
  "ops.settings.navigation.write",
  "ops.settings.roles.read",
  "ops.settings.roles.write",
  "ops.settings.kitchen_rbac.read",
  "ops.settings.kitchen_rbac.write",
  "ops.settings.workflow.read",
  "ops.settings.workflow.write",
  "ops.settings.notifications.read",
  "ops.settings.notifications.write",
  "ops.settings.integrations.read",
  "ops.settings.integrations.write",
  "ops.settings.compliance.read",
  "ops.settings.compliance.write",
  "ops.settings.audit.read",
];

export const COUPON_PERMISSIONS = [
  "ops.page.ops.crm.engagement.offers.view",
  "ops.action.coupons.create",
  "ops.action.coupons.edit",
  "ops.action.coupons.publish",
  "ops.action.coupons.assign",
  "ops.action.coupons.analytics.view",
  "ops.action.coupons.recommendations.run",
];

export const SYSTEM_PERMISSION_SEEDS = [
  ...TOP_MODULE_KEYS.map((moduleKey) => `ops.module.${moduleKey}.view`),
  ...KITCHEN_PAGE_PERMISSIONS,
  ...KITCHEN_ACTION_PERMISSIONS,
  ...SETTINGS_SECTION_PERMISSIONS,
  ...COUPON_PERMISSIONS,
];

export const buildModulePermission = (moduleKey) => `ops.module.${moduleKey}.view`;

export const normalizeRouteToPermission = (href = "") => {
  if (href === "/kitchen" || href === "/kitchen/") {
    return "ops.page.kitchen.queue.view";
  }
  const clean = href
    .replace(/^\/+/, "")
    .replace(/\[(.+?)\]/g, "*")
    .replace(/\/+/g, ".")
    .replace(/-/g, "_");
  return `ops.page.${clean}.view`;
};

export const DEFAULT_ROLE_PRESETS = [
  {
    key: "super_admin",
    name: "Super Admin",
    description: "Full platform access with lock/unlock authority.",
    isSystem: true,
    permissions: ["*"],
  },
  {
    key: "ops_admin",
    name: "Ops Admin",
    description: "Operational control across modules with broad management permissions.",
    isSystem: true,
    permissions: ["ops.module.*.view", "ops.page.*.view", "ops.action.*", "ops.settings.*"],
  },
  {
    key: "kitchen_manager",
    name: "Kitchen Manager",
    description: "Supervises all kitchen operations and escalations.",
    isSystem: true,
    permissions: [
      "ops.module.orders.view",
      "ops.page.kitchen.*.view",
      "ops.action.kitchen.*",
      "ops.page.ops.orders*.view",
    ],
  },
  {
    key: "kitchen_prep",
    name: "Kitchen Prep",
    description: "Handles prep and order execution.",
    isSystem: true,
    permissions: [
      "ops.module.orders.view",
      "ops.page.kitchen.queue.view",
      "ops.page.kitchen.workstation.view",
      "ops.page.kitchen.prep.view",
      "ops.page.kitchen.messages.view",
      "ops.action.kitchen.order.start",
      "ops.action.kitchen.order.mark_ready",
      "ops.action.kitchen.order.handoff",
      "ops.action.kitchen.message.send",
    ],
  },
  {
    key: "kitchen_qc",
    name: "Kitchen QC",
    description: "Owns quality checks, waste, and escalations.",
    isSystem: true,
    permissions: [
      "ops.module.orders.view",
      "ops.page.kitchen.queue.view",
      "ops.page.kitchen.quality.view",
      "ops.page.kitchen.messages.view",
      "ops.action.kitchen.order.hold",
      "ops.action.kitchen.qc.escalate",
      "ops.action.kitchen.message.send",
    ],
  },
  {
    key: "kitchen_dispatch",
    name: "Kitchen Dispatch",
    description: "Coordinates handoff and dispatch closure.",
    isSystem: true,
    permissions: [
      "ops.module.orders.view",
      "ops.page.kitchen.queue.view",
      "ops.page.kitchen.messages.view",
      "ops.action.kitchen.order.assign_dispatch",
      "ops.action.kitchen.order.complete",
      "ops.action.kitchen.message.send",
    ],
  },
];
