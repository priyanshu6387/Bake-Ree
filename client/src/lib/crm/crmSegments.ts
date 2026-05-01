import type { CrmCampaignRecipient, CrmCustomer, CrmSegmentKey } from "@/types/crm";

type SegmentDefinition = {
  key: CrmSegmentKey;
  label: string;
  match: (customer: CrmCustomer) => boolean;
};

const INACTIVE_DAYS_THRESHOLD = 30;

const isOlderThanDays = (isoDate: string, days: number) => {
  const eventMs = new Date(isoDate).getTime();
  const nowMs = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  return nowMs - eventMs > days * dayMs;
};

export const crmSegmentDefinitions: SegmentDefinition[] = [
  { key: "vip_customers", label: "VIP Customers", match: (customer) => customer.status === "vip" || customer.totalSpend >= 5000 },
  { key: "active_customers", label: "Active Customers", match: (customer) => customer.status === "active" },
  {
    key: "inactive_customers",
    label: "Inactive Customers",
    match: (customer) =>
      customer.status === "inactive" || isOlderThanDays(customer.lastOrderDate, INACTIVE_DAYS_THRESHOLD),
  },
  { key: "new_customers", label: "New Customers", match: (customer) => customer.totalOrders <= 1 },
  { key: "high_spenders", label: "High Spenders", match: (customer) => customer.totalSpend >= 3000 },
  { key: "frequent_buyers", label: "Frequent Buyers", match: (customer) => customer.totalOrders >= 5 },
  { key: "needs_follow_up", label: "Needs Follow-up", match: (customer) => customer.needsFollowUp },
  { key: "loyalty_champions", label: "Loyalty Champions", match: (customer) => customer.loyaltyPoints >= 500 },
  { key: "manual_customer", label: "Manual Customer", match: () => false },
];

export const getCrmSegmentLabel = (key: CrmSegmentKey) =>
  crmSegmentDefinitions.find((segment) => segment.key === key)?.label ?? "Unknown Segment";

export const getSegmentCustomers = (segmentKey: CrmSegmentKey, customers: CrmCustomer[]) => {
  const segment = crmSegmentDefinitions.find((item) => item.key === segmentKey);
  if (!segment) return [];
  return customers.filter((customer) => segment.match(customer));
};

export const getSegmentRecipients = (
  segmentKey: CrmSegmentKey,
  customers: CrmCustomer[]
): CrmCampaignRecipient[] =>
  getSegmentCustomers(segmentKey, customers).map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    totalSpend: customer.totalSpend,
    loyaltyPoints: customer.loyaltyPoints,
  }));
