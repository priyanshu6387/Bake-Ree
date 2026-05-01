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
        label: "Stock",
        items: [
          {
            label: "Stock Overview",
            href: "/ops/inventory/overview",
            description: "Live availability, valuation, and coverage overview.",
          },
          {
            label: "Stock Ledger (Movements)",
            href: "/ops/inventory/ledger",
            description: "Append-only movement ledger with audit trail.",
          },
          {
            label: "Batch / Expiry Tracking",
            href: "/ops/inventory/batches",
            description: "Lot tracking, expiries, and traceability controls.",
          },
          {
            label: "FEFO Allocation & Reservations",
            href: "/ops/inventory/fefo",
            description: "FEFO allocation, holds, and consumption flow.",
          },
          {
            label: "Cycle Counts & Audits",
            href: "/ops/inventory/audits",
            description: "Cycle counts, variances, and audit approvals.",
          },
          {
            label: "Adjustments",
            href: "/ops/inventory/adjustments",
            description: "Damage, expiry write-offs, and shrink adjustments.",
          },
          {
            label: "Transfers",
            href: "/ops/inventory/transfers",
            description: "Inter-branch transfers and warehouse dispatches.",
          },
          {
            label: "Reorder Alerts",
            href: "/ops/inventory/alerts/low-stock",
            description: "Low stock alerts and reorder triggers.",
          },
          {
            label: "Expiry Alerts",
            href: "/ops/inventory/alerts/expiry",
            description: "Expiring batches and action queue.",
          },
          {
            label: "Replenishment Planner",
            href: "/ops/inventory/replenishment",
            description: "Suggested PRs and safety stock planning.",
          },
        ],
      },
      {
        key: "inventory-master",
        label: "Items & Master Data",
        items: [
          {
            label: "Item Master",
            href: "/ops/inventory/items",
            description: "Ingredients, packaging, finished goods catalog.",
          },
          {
            label: "Categories & Units",
            href: "/ops/inventory/categories",
            description: "UoM definitions and conversion rules.",
          },
          {
            label: "Recipes / BOM Links",
            href: "/ops/inventory/recipes",
            description: "Recipe-to-item consumption mapping.",
          },
          {
            label: "Storage Rules",
            href: "/ops/inventory/storage-rules",
            description: "Temp zones, shelf life, and handling rules.",
          },
          {
            label: "Suppliers Mapping",
            href: "/ops/inventory/suppliers",
            description: "Preferred vendors per item and lead times.",
          },
          {
            label: "Pricing & Cost History",
            href: "/ops/inventory/pricing",
            description: "Cost history and price variance analysis.",
          },
        ],
      },
      {
        key: "inventory-ops",
        label: "Operations",
        items: [
          {
            label: "Receiving (GRN Intake)",
            href: "/ops/inventory/receiving",
            description: "Inbound receiving, QC, and stock posting.",
          },
          {
            label: "Issues to Production",
            href: "/ops/inventory/production/issue",
            description: "Raw material issues to work orders.",
          },
          {
            label: "Production Output",
            href: "/ops/inventory/production/output",
            description: "Finished goods receipt and batch creation.",
          },
          {
            label: "Waste & Spoilage Logs",
            href: "/ops/inventory/waste",
            description: "Wastage by batch with reason codes.",
          },
          {
            label: "Returns to Vendor (RTV)",
            href: "/ops/inventory/returns",
            description: "Return items to vendor with credits.",
          },
          {
            label: "Customer Returns",
            href: "/ops/inventory/returns/customers",
            description: "Customer returns and restock decisions.",
          },
          {
            label: "Replacement / Substitutions",
            href: "/ops/inventory/replacements",
            description: "Substitution records for cost variance.",
          },
        ],
      },
      {
        key: "inventory-reports",
        label: "Reports & Finance Links",
        items: [
          {
            label: "Inventory Valuation",
            href: "/ops/inventory/reports/valuation",
            description: "FIFO/WAVG valuation by item and warehouse.",
          },
          {
            label: "COGS Summary",
            href: "/ops/inventory/reports/cogs",
            description: "Period-based cost of goods sold summary.",
          },
          {
            label: "Variance Report",
            href: "/ops/inventory/reports/variance",
            description: "Expected vs actual usage variance.",
          },
          {
            label: "Slow Moving / Dead Stock",
            href: "/ops/inventory/reports/slow-moving",
            description: "Slow moving inventory and dead stock list.",
          },
          {
            label: "Stock Turns & Days on Hand",
            href: "/ops/inventory/reports/turns",
            description: "Turns, days on hand, and velocity.",
          },
          {
            label: "Waste % and Cost Impact",
            href: "/ops/inventory/reports/waste",
            description: "Waste KPIs with cost impact.",
          },
          {
            label: "Inventory P&L Impact",
            href: "/ops/inventory/reports/pl",
            description: "Purchases, COGS, waste, closing stock.",
          },
          {
            label: "Audit Trail Export",
            href: "/ops/inventory/reports/audit-trail",
            description: "Audit-grade ledger export.",
          },
        ],
      },
      {
        key: "inventory-procurement",
        label: "Procurement",
        items: [
          {
            label: "Vendors",
            href: "/ops/procurement/vendors",
            description: "Vendor profiles, SLAs, and performance history.",
          },
          {
            label: "Vendor Items & Price Lists",
            href: "/ops/procurement/items",
            description: "Catalog, price lists, and vendor-specific SKUs.",
          },
          {
            label: "Purchase Requests (PR)",
            href: "/ops/procurement/requests",
            description: "Internal request intake and approvals.",
          },
          {
            label: "RFQ / Quotes",
            href: "/ops/procurement/rfq",
            description: "Quotes and bid comparisons (optional).",
          },
          {
            label: "Purchase Orders (PO)",
            href: "/ops/procurement/pos",
            description: "PO creation, approvals, and tracking.",
          },
          {
            label: "Approvals Workflow",
            href: "/ops/procurement/approvals",
            description: "Approval routing and audit approvals.",
          },
          {
            label: "GRN (Goods Received)",
            href: "/ops/procurement/grn",
            description: "Receiving entries, inspections, and variances.",
          },
          {
            label: "3-Way Match",
            href: "/ops/procurement/three-way-match",
            description: "POÃ¢â‚¬â€œGRNÃ¢â‚¬â€œInvoice matching.",
          },
          {
            label: "Vendor Bills / AP",
            href: "/ops/procurement/bills",
            description: "Vendor invoices, match status, and disputes.",
          },
          {
            label: "Vendor Payments",
            href: "/ops/procurement/payments",
            description: "Payment batches, due dates, and remittance status.",
          },
          {
            label: "Purchase Returns (RTV)",
            href: "/ops/procurement/returns",
            description: "Return to vendor and credit notes.",
          },
          {
            label: "Procurement Analytics",
            href: "/ops/procurement/analytics",
            description: "Lead times, fill rate, and price variance.",
          },
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
