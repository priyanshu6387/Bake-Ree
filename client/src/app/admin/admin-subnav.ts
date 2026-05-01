export type AdminSubnavItem = {
  label: string;
  href: string;
};

export type AdminSubnavGroup = {
  label: string;
  items: AdminSubnavItem[];
};

const products: AdminSubnavItem[] = [
  { label: "Catalog", href: "/admin/products/catalog" },
  { label: "Pricing", href: "/admin/products/pricing" },
  { label: "Categories", href: "/admin/products/categories" },
  { label: "Availability", href: "/admin/products/availability" },
];

const inventory: AdminSubnavItem[] = [];

const crm: AdminSubnavItem[] = [
  { label: "Overview", href: "/admin/crm" },
  { label: "Customers", href: "/admin/crm/customers" },
  { label: "Segments", href: "/admin/crm/segments" },
  { label: "Complaints", href: "/admin/crm/complaints" },
  { label: "Campaigns", href: "/admin/crm/campaigns" },
  { label: "Loyalty", href: "/admin/crm/loyalty" },
];

const erp: AdminSubnavItem[] = [];

const analytics: AdminSubnavItem[] = [];

const settings: AdminSubnavItem[] = [
  { label: "Roles & Permissions", href: "/admin/settings/roles" },
  { label: "Locations", href: "/admin/settings/locations" },
  { label: "Integrations", href: "/admin/settings/integrations" },
  { label: "Audit Log", href: "/admin/settings/audit" },
];

export const adminSubnavMap: Record<string, AdminSubnavGroup> = {
  "/admin/products": { label: "Products", items: products },
  "/admin/inventory": { label: "Inventory", items: inventory },
  "/admin/crm": { label: "CRM", items: crm },
  "/admin/erp": { label: "ERP", items: erp },
  "/admin/analytics": { label: "Analytics", items: analytics },
  "/admin/settings": { label: "Settings", items: settings },
};

export const getAdminSubnav = (pathname: string): AdminSubnavGroup | null => {
  const match = Object.keys(adminSubnavMap).find(
    (key) => pathname === key || pathname.startsWith(key + "/")
  );
  return match ? adminSubnavMap[match] : null;
};

export const hasAdminSubnav = (href: string) => Boolean(adminSubnavMap[href]);