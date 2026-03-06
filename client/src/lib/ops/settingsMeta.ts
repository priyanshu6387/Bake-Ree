export type OpsSettingsSectionKey =
  | "navigation"
  | "roles"
  | "kitchen-rbac"
  | "workflow"
  | "notifications"
  | "integrations"
  | "compliance"
  | "audit";

export type OpsSettingsRelatedLink = {
  label: string;
  href: string;
  detail: string;
};

export type OpsSettingsSectionMeta = {
  key: OpsSettingsSectionKey;
  label: string;
  href: string;
  description: string;
  phase: string;
  readiness: {
    ui: boolean;
    api: boolean;
    links: boolean;
  };
  relatedLinks: OpsSettingsRelatedLink[];
};

export const OPS_SETTINGS_SECTIONS: OpsSettingsSectionMeta[] = [
  {
    key: "navigation",
    label: "Navigation",
    href: "/ops/settings/navigation",
    description: "Control sidebar discoverability and route visibility by role.",
    phase: "Phase 2",
    readiness: { ui: true, api: false, links: true },
    relatedLinks: [
      {
        label: "Ops Overview",
        href: "/ops",
        detail: "Primary module entrypoint for visibility checks.",
      },
      {
        label: "Orders Dashboard",
        href: "/ops/orders",
        detail: "Critical operations route for policy impact preview.",
      },
      {
        label: "Inventory Overview",
        href: "/ops/inventory/overview",
        detail: "Module-level visibility validation target.",
      },
    ],
  },
  {
    key: "roles",
    label: "Roles & Permissions",
    href: "/ops/settings/roles",
    description: "Manage access role definitions, status, and permission bundles.",
    phase: "Phase 2",
    readiness: { ui: true, api: false, links: true },
    relatedLinks: [
      {
        label: "HR Roles",
        href: "/ops/hr/roles",
        detail: "Operational role catalog cross-reference.",
      },
      {
        label: "HR Employees",
        href: "/ops/hr/employees",
        detail: "Role assignment and staffing verification.",
      },
      {
        label: "Kitchen RBAC",
        href: "/ops/settings/kitchen-rbac",
        detail: "Kitchen-specific role access handoff.",
      },
    ],
  },
  {
    key: "kitchen-rbac",
    label: "Kitchen RBAC",
    href: "/ops/settings/kitchen-rbac",
    description: "Configure kitchen action permissions and staff role boundaries.",
    phase: "Phase 3",
    readiness: { ui: true, api: false, links: true },
    relatedLinks: [
      {
        label: "Kitchen Queue",
        href: "/kitchen",
        detail: "Primary kitchen surface impacted by RBAC.",
      },
      {
        label: "Kitchen Workstation",
        href: "/kitchen/workstation",
        detail: "Action-level controls validation target.",
      },
      {
        label: "Kitchen Settings",
        href: "/kitchen/settings",
        detail: "Runtime settings and permission crossover.",
      },
    ],
  },
  {
    key: "workflow",
    label: "Workflow Policies",
    href: "/ops/settings/workflow",
    description: "Define process rules for approvals, statuses, and escalation flows.",
    phase: "Phase 4",
    readiness: { ui: true, api: false, links: true },
    relatedLinks: [
      {
        label: "Orders SLA",
        href: "/ops/orders/sla",
        detail: "SLA and exception rule consumers.",
      },
      {
        label: "Production Work Orders",
        href: "/ops/production/work-orders",
        detail: "Production workflow policy target.",
      },
      {
        label: "Logistics Queue",
        href: "/ops/logistics/queue",
        detail: "Dispatch and handoff policy impact area.",
      },
    ],
  },
  {
    key: "notifications",
    label: "Notifications",
    href: "/ops/settings/notifications",
    description: "Route alerts by role, channel, priority, and escalation policy.",
    phase: "Phase 4",
    readiness: { ui: true, api: false, links: true },
    relatedLinks: [
      {
        label: "Customer Notification Settings",
        href: "/dashboard/settings",
        detail: "Customer-facing notification preference surface.",
      },
      {
        label: "CRM Campaigns",
        href: "/ops/crm/engagement/campaigns",
        detail: "Outbound engagement channel orchestration.",
      },
      {
        label: "Logistics Tracking",
        href: "/ops/logistics/tracking",
        detail: "Delivery event notification dependencies.",
      },
    ],
  },
  {
    key: "integrations",
    label: "Integrations",
    href: "/ops/settings/integrations",
    description: "Manage provider connectivity, webhooks, and sync configuration.",
    phase: "Phase 4",
    readiness: { ui: true, api: false, links: true },
    relatedLinks: [
      {
        label: "Finance Payments",
        href: "/ops/finance/payments",
        detail: "Payment provider integration consumers.",
      },
      {
        label: "Delivery Tracking",
        href: "/ops/logistics/tracking",
        detail: "Carrier or maps integration consumers.",
      },
      {
        label: "CRM Engagement Offers",
        href: "/ops/crm/engagement/offers",
        detail: "Promotion and campaign integration touchpoint.",
      },
    ],
  },
  {
    key: "compliance",
    label: "Compliance",
    href: "/ops/settings/compliance",
    description: "Set policy controls for auditability, retention, and governance.",
    phase: "Phase 4",
    readiness: { ui: true, api: false, links: true },
    relatedLinks: [
      {
        label: "HR Documents",
        href: "/ops/hr/documents",
        detail: "Staff compliance and document control alignment.",
      },
      {
        label: "Finance Taxes",
        href: "/ops/finance/taxes",
        detail: "Regulatory tax and filing compliance alignment.",
      },
      {
        label: "Settings Audit Log",
        href: "/ops/settings/audit",
        detail: "Traceability and governance verification surface.",
      },
    ],
  },
  {
    key: "audit",
    label: "Audit Log",
    href: "/ops/settings/audit",
    description: "Review immutable records of settings and access control changes.",
    phase: "Phase 5",
    readiness: { ui: true, api: false, links: true },
    relatedLinks: [
      {
        label: "Navigation Settings",
        href: "/ops/settings/navigation",
        detail: "Route and module policy change source.",
      },
      {
        label: "Roles & Permissions",
        href: "/ops/settings/roles",
        detail: "Role mutation and permission grant source.",
      },
      {
        label: "Compliance Settings",
        href: "/ops/settings/compliance",
        detail: "Governance rule update source.",
      },
    ],
  },
];

export const OPS_SETTINGS_SECTION_MAP = OPS_SETTINGS_SECTIONS.reduce<
  Record<OpsSettingsSectionKey, OpsSettingsSectionMeta>
>((acc, section) => {
  acc[section.key] = section;
  return acc;
}, {} as Record<OpsSettingsSectionKey, OpsSettingsSectionMeta>);
