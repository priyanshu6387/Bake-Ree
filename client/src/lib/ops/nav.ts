import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  Factory,
  Home,
  LineChart,
  Settings,
  ShoppingCart,
  Tag,
  Truck,
  Users,
} from "lucide-react";

export type ModuleId =
  | "orders"
  | "production"
  | "inventory"
  | "logistics"
  | "finance"
  | "crm"
  | "coupons"
  | "hr"
  | "analytics"
  | "settings"
  | "staff";

export type OpsTopNavItem = {
  key: ModuleId | "home";
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export type OpsSubNavItem = {
  label: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
};

export type OpsSubNavGroup = {
  key: string;
  label: string;
  items: OpsSubNavItem[];
};

export type OpsSubNavModule = {
  title: string;
  items?: OpsSubNavItem[];
  groups?: OpsSubNavGroup[];
};

export type OpsRouteMeta = {
  href: string;
  label: string;
  description: string;
};

export const TOP_NAV: OpsTopNavItem[] = [
  {
    key: "home",
    label: "Home",
    href: "/ops",
    icon: Home,
    description: "Unified operations overview across orders, production, and service health.",
  },
  {
    key: "orders",
    label: "Orders",
    href: "/ops/orders",
    icon: ClipboardList,
    description: "Track live demand, exceptions, and service commitments.",
  },
  {
    key: "production",
    label: "Production",
    href: "/ops/production",
    icon: Factory,
    description: "Plan batches, manage work orders, and maintain yield quality.",
  },
  {
    key: "inventory",
    label: "Inventory",
    href: "/ops/inventory",
    icon: Boxes,
    description: "Monitor stock positions, movements, and expiry risk.",
  },
  {
    key: "logistics",
    label: "Logistics",
    href: "/ops/logistics",
    icon: Truck,
    description: "Coordinate deliveries, routes, and fleet performance.",
  },
  {
    key: "crm",
    label: "Customers (CRM)",
    href: "/ops/crm",
    icon: Users,
    description: "Customer 360 views, lifecycle insights, and engagement workflows.",
  },
  {
    key: "coupons",
    label: "Coupons",
    href: "/ops/crm/engagement/offers",
    icon: Tag,
    description: "Coupon studio for global, targeted, and automated promo campaigns.",
  },
  {
    key: "finance",
    label: "Finance",
    href: "/ops/finance",
    icon: CreditCard,
    description: "Invoicing, payments, taxes, and margin control.",
  },
  {
    key: "hr",
    label: "HR & Payroll",
    href: "/ops/hr",
    icon: Users,
    description: "Employee lifecycle, attendance, payroll, and compliance controls.",
  },
  {
    key: "analytics",
    label: "Analytics",
    href: "/ops/analytics",
    icon: LineChart,
    description: "Operational, CRM, and revenue performance analytics.",
  },
  {
    key: "settings",
    label: "Settings",
    href: "/ops/settings",
    icon: Settings,
    description: "Configuration, roles, and compliance settings for the console.",
  },
];

export const SUB_NAV_BY_MODULE: Record<ModuleId, OpsSubNavModule> = {
  orders: {
    title: "Orders",
    items: [
      {
        label: "Orders Dashboard",
        href: "/ops/orders",
        description: "Live order performance, SLA adherence, and escalations.",
      },
      {
        label: "All Orders",
        href: "/ops/orders/all",
        description: "End-to-end order ledger across channels and stores.",
      },
      {
        label: "POS / Counter Orders",
        href: "/ops/orders/pos",
        description: "In-store counter tickets and cashier throughput.",
      },
      {
        label: "Subscriptions / Scheduled",
        href: "/ops/orders/subscriptions",
        description: "Scheduled deliveries and subscription commitments.",
      },
      {
        label: "Returns / Refunds",
        href: "/ops/orders/refunds",
        description: "Return approvals, refund timelines, and root-cause notes.",
      },
      {
        label: "SLA & Exceptions",
        href: "/ops/orders/sla",
        description: "Late order reviews, SLA breaches, and exception tracking.",
      },
    ],
  },
  production: {
    title: "Production",
    items: [
      {
        label: "Recipes & BOM",
        href: "/ops/production/recipes",
        description: "Recipe standards, BOM versions, and yield benchmarks.",
      },
      {
        label: "Batch Planning",
        href: "/ops/production/batches",
        description: "Forecast-driven batch sizing and material readiness.",
      },
      {
        label: "Work Orders",
        href: "/ops/production/work-orders",
        description: "Production tasks, staffing, and station assignments.",
      },
      {
        label: "Yield & Wastage",
        href: "/ops/production/yield-waste",
        description: "Yield variance, shrinkage, and wastage reasons.",
      },
      {
        label: "Quality Checks (QC)",
        href: "/ops/production/qc",
        description: "Quality assurance checkpoints and compliance logs.",
      },
      {
        label: "Production Calendar",
        href: "/ops/production/calendar",
        description: "Bake calendar, shift planning, and capacity overview.",
      },
    ],
  },
  inventory: {
    title: "Inventory",
    groups: [
      {
        key: "inventory-stock",
        label: "STOCK",
        items: [
          { label: "Stock Overview", href: "/ops/inventory", description: "Current stock position across key bakery items." },
          { label: "Stock Movements", href: "/ops/inventory/movements", description: "Track stock in, stock out, and transfer movements." },
          { label: "Batch & Expiry", href: "/ops/inventory/batches", description: "Monitor tracked batches and expiry timelines." },
          { label: "Stock Counts", href: "/ops/inventory/counts", description: "Physical count snapshots and variance checks." },
          { label: "Adjustments", href: "/ops/inventory/adjustments", description: "Manual inventory corrections with reason context." },
          { label: "Transfers", href: "/ops/inventory/transfers", description: "Move stock between bakery storage locations." },
          { label: "Reorder Alerts", href: "/ops/inventory/reorder-alerts", description: "Items below minimum stock thresholds." },
          { label: "Expiry Alerts", href: "/ops/inventory/expiry-alerts", description: "Expiring and expired stock requiring action." },
        ],
      },
      {
        key: "inventory-items",
        label: "ITEMS",
        items: [
          { label: "Item Master", href: "/ops/inventory/items", description: "Core ingredient and packaging item list." },
          { label: "Categories & Units", href: "/ops/inventory/categories", description: "Item categories and measurement units." },
          { label: "Supplier Mapping", href: "/ops/inventory/supplier-mapping", description: "Map items to preferred suppliers." },
          { label: "Pricing & Cost", href: "/ops/inventory/pricing", description: "Cost and pricing references by item." },
        ],
      },
      {
        key: "inventory-operations",
        label: "OPERATIONS",
        items: [
          { label: "Receiving / Stock In", href: "/ops/inventory/stock-in", description: "Record inbound stock receipts." },
          { label: "Issues to Production", href: "/ops/inventory/issues", description: "Issue ingredients to production usage." },
          { label: "Waste & Spoilage", href: "/ops/inventory/waste", description: "Track wastage and spoilage quantities." },
          { label: "Returns to Vendor", href: "/ops/inventory/returns", description: "Send damaged or excess stock back to vendors." },
        ],
      },
      {
        key: "inventory-reports",
        label: "REPORTS",
        items: [
          { label: "Inventory Valuation", href: "/ops/inventory/valuation", description: "Inventory value snapshot by item." },
          { label: "COGS Summary", href: "/ops/inventory/cogs", description: "Cost of goods sold rollup for operations." },
          { label: "Variance Report", href: "/ops/inventory/variance", description: "Expected vs actual usage differences." },
          { label: "Slow Moving Stock", href: "/ops/inventory/slow-moving", description: "Items with low movement over time." },
        ],
      },
      {
        key: "inventory-procurement",
        label: "PROCUREMENT",
        items: [
          { label: "Vendors", href: "/ops/inventory/vendors", description: "Supplier master with active status." },
          { label: "Vendor Price Lists", href: "/ops/inventory/vendor-prices", description: "Supplier-wise item pricing lists." },
          { label: "Purchase Requests", href: "/ops/inventory/purchase-requests", description: "Internal purchase requests queue." },
          { label: "Purchase Orders", href: "/ops/inventory/purchase-orders", description: "Track purchase orders and statuses." },
          { label: "Goods Received", href: "/ops/inventory/goods-received", description: "Posted goods received records." },
          { label: "Vendor Bills", href: "/ops/inventory/vendor-bills", description: "Vendor bill register and payment state." },
          { label: "Vendor Payments", href: "/ops/inventory/vendor-payments", description: "Outgoing vendor payments log." },
          { label: "Purchase Returns", href: "/ops/inventory/purchase-returns", description: "Returns and credit flow to vendors." },
        ],
      },
    ],
  },
  logistics: {
    title: "Logistics",
    items: [
      {
        label: "Delivery Queue",
        href: "/ops/logistics/queue",
        description: "Dispatch queue, pickup prioritization, and readiness.",
      },
      {
        label: "Driver / Fleet",
        href: "/ops/logistics/fleet",
        description: "Fleet roster, driver performance, and compliance.",
      },
      {
        label: "Route Planning",
        href: "/ops/logistics/routes",
        description: "Route optimization, clustering, and ETA planning.",
      },
      {
        label: "Zones & Charges",
        href: "/ops/logistics/zones",
        description: "Delivery zones, surcharges, and coverage rules.",
      },
      {
        label: "SLA (On-time/Late)",
        href: "/ops/logistics/sla",
        description: "On-time performance and late delivery analysis.",
      },
      {
        label: "Delivery Events / Tracking",
        href: "/ops/logistics/tracking",
        description: "Real-time tracking events and issue resolution.",
      },
    ],
  },
  finance: {
    title: "Finance",
    items: [
      {
        label: "Invoices",
        href: "/ops/finance/invoices",
        description: "Customer invoices, statuses, and reconciliation.",
      },
      {
        label: "Payments",
        href: "/ops/finance/payments",
        description: "Payment collection, settlement, and exceptions.",
      },
      {
        label: "Refunds",
        href: "/ops/finance/refunds",
        description: "Refund approvals, aging, and payout tracking.",
      },
      {
        label: "Taxes / GST",
        href: "/ops/finance/taxes",
        description: "Tax reporting, GST filings, and compliance.",
      },
      {
        label: "Costing & Margin",
        href: "/ops/finance/costing",
        description: "Recipe costing, margins, and variance analysis.",
      },
      {
        label: "P&L Summary",
        href: "/ops/finance/pl",
        description: "Profit and loss summary with drill-down insights.",
      },
    ],
  },
  hr: {
    title: "HR & Payroll",
    items: [
      {
        label: "Employees",
        href: "/ops/hr/employees",
        description: "Employee master records, roles, and compensation details.",
      },
      {
        label: "Roles & Permissions",
        href: "/ops/hr/roles",
        description: "Role-based access controls and permission scopes.",
      },
      {
        label: "Attendance",
        href: "/ops/hr/attendance",
        description: "Daily check-ins, exceptions, and overtime tracking.",
      },
      {
        label: "Shifts & Roster",
        href: "/ops/hr/shifts",
        description: "Shift assignments, roster coverage, and compliance.",
      },
      {
        label: "Leave Requests",
        href: "/ops/hr/leave",
        description: "Leave balances, accruals, and approvals.",
      },
      {
        label: "Payroll Runs",
        href: "/ops/hr/payroll",
        description: "Payroll drafts, approvals, and locked runs.",
      },
      {
        label: "Payslips",
        href: "/ops/hr/payslips",
        description: "Payslip distribution and audit trail.",
      },
      {
        label: "Performance",
        href: "/ops/hr/performance",
        description: "Review cycles, KPIs, and coaching plans.",
      },
      {
        label: "Documents",
        href: "/ops/hr/documents",
        description: "Contracts, IDs, and compliance files.",
      },
      {
        label: "Approvals",
        href: "/ops/hr/approvals",
        description: "Leave, payroll, and expense approvals.",
      },
      {
        label: "Reports",
        href: "/ops/hr/reports",
        description: "HR KPIs, payroll summaries, and compliance exports.",
      },
    ],
  },
  crm: {
    title: "CRM",
    items: [
      {
        label: "Overview",
        href: "/ops/crm",
        description: "CRM overview with key customer and complaint metrics.",
      },
      {
        label: "Customers",
        href: "/ops/crm/customers",
        description: "Search and manage customer profiles and follow-ups.",
      },
      {
        label: "Segments",
        href: "/ops/crm/segments",
        description: "Customer segments and targeting groups.",
      },
      {
        label: "Complaints",
        href: "/ops/crm/complaints",
        description: "Track customer complaints and resolution status.",
      },
      {
        label: "Campaigns",
        href: "/ops/crm/campaigns",
        description: "Manage outreach campaigns and offers.",
      },
      {
        label: "Loyalty",
        href: "/ops/crm/loyalty",
        description: "Loyalty program activity, points, and rewards.",
      },
    ],
  },
  coupons: {
    title: "Coupons",
    items: [
      {
        label: "Coupon Studio",
        href: "/ops/crm/engagement/offers",
        description: "Create, activate, assign, and analyze coupon performance.",
      },
      {
        label: "Campaign Coupling",
        href: "/ops/crm/engagement/campaigns",
        description: "Attach coupon offers to outreach campaigns.",
      },
    ],
  },
  analytics: {
    title: "Analytics",
    items: [],
  },
  settings: {
    title: "Settings",
    items: [
      {
        label: "Navigation",
        href: "/ops/settings/navigation",
        description: "Control sidebar visibility, locks, and route discoverability by role.",
      },
      {
        label: "Roles & Permissions",
        href: "/ops/settings/roles",
        description: "Manage role presets, permission matrices, and overrides.",
      },
      {
        label: "Kitchen RBAC",
        href: "/ops/settings/kitchen-rbac",
        description: "Configure kitchen role segregation and action-level controls.",
      },
      {
        label: "Workflow Policies",
        href: "/ops/settings/workflow",
        description: "Set approval flows, status rules, and operational guardrails.",
      },
      {
        label: "Notifications",
        href: "/ops/settings/notifications",
        description: "Route alerts by role, channel, severity, and escalation policy.",
      },
      {
        label: "Integrations",
        href: "/ops/settings/integrations",
        description: "Manage external providers, webhook rules, and credentials metadata.",
      },
      {
        label: "Compliance",
        href: "/ops/settings/compliance",
        description: "Define retention, controls, and compliance policy switches.",
      },
      {
        label: "Audit Log",
        href: "/ops/settings/audit",
        description: "Review immutable admin settings and access policy changes.",
      },
    ],
  },
  staff: {
    title: "Staff & Payroll",
    items: [
      {
        label: "Employees",
        href: "/ops/erp/staff/employees",
        description: "Employee master records and onboarding status.",
      },
      {
        label: "Roles & Permissions",
        href: "/ops/erp/staff/roles",
        description: "Role-based access and shift permissions.",
      },
      {
        label: "Attendance",
        href: "/ops/erp/staff/attendance",
        description: "Attendance tracking, punch data, and exceptions.",
      },
      {
        label: "Shifts & Roster",
        href: "/ops/erp/staff/shifts",
        description: "Shift planning, roster coverage, and compliance.",
      },
      {
        label: "Payroll Runs",
        href: "/ops/erp/staff/payroll",
        description: "Payroll processing cycles and approvals.",
      },
      {
        label: "Payslips",
        href: "/ops/erp/staff/payslips",
        description: "Payslip distribution and audit history.",
      },
    ],
  },
};

const flattenRoutes = (routes: OpsRouteMeta[]) => {
  const seen = new Set<string>();
  return routes.filter((route) => {
    if (seen.has(route.href)) return false;
    seen.add(route.href);
    return true;
  });
};

const subnavRoutes = Object.values(SUB_NAV_BY_MODULE).flatMap((module) => {
  const grouped = module.groups?.flatMap((group) => group.items) ?? [];
  const flatItems = module.items ?? [];
  return [...flatItems, ...grouped];
});

export const opsRouteMeta: OpsRouteMeta[] = flattenRoutes([
  ...TOP_NAV.map((item) => ({
    href: item.href,
    label: item.label,
    description: item.description,
  })),
  {
    href: "/ops/procurement",
    label: "Procurement",
    description: "Purchasing, vendor management, and 3-way match workflows.",
  },
  ...subnavRoutes.map((item) => ({
    href: item.href,
    label: item.label,
    description: item.description ?? "",
  })),
]);

const toRouteRegex = (href: string) => {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped.replace(/\\\[[^/]+?\\\]/g, "[^/]+");
  return new RegExp(`^${pattern}$`);
};

export const findOpsRouteMeta = (pathname: string) => {
  const matches = opsRouteMeta
    .map((route) => ({
      route,
      match: toRouteRegex(route.href).test(pathname),
    }))
    .filter((entry) => entry.match)
    .map((entry) => entry.route);

  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.href.length - a.href.length)[0];
};

export const getOpsBreadcrumbs = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];

  segments.forEach((_, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    if (!href.startsWith("/ops")) return;
    const meta = findOpsRouteMeta(href);
    if (meta) {
      const exists = breadcrumbs.some((crumb) => crumb.label === meta.label);
      if (!exists) {
        breadcrumbs.push({ label: meta.label, href });
      }
    } else {
      const raw = segments[index];
      const label = raw
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
      const exists = breadcrumbs.some((crumb) => crumb.label === label);
      if (!exists) {
        breadcrumbs.push({ label, href });
      }
    }
  });

  return breadcrumbs.length > 0 ? breadcrumbs : [{ label: "Ops", href: "/ops" }];
};

export const getOpsTitle = (pathname: string) =>
  findOpsRouteMeta(pathname)?.label ?? "Operations Console";

export const getOpsDescription = (pathname: string) =>
  findOpsRouteMeta(pathname)?.description ??
  "Unified operations visibility across Bake-Ree ERP and CRM workflows.";

export const opsHighlights = [
  {
    label: "Current Facility",
    value: "Main Bakehouse",
    icon: ShoppingCart,
  },
  {
    label: "Team On Duty",
    value: "42 staff",
    icon: Users,
  },
  {
    label: "Open Tasks",
    value: "18 tasks",
    icon: BarChart3,
  },
];
