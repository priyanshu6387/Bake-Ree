"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CrmSectionShell from "@/components/crm/CrmSectionShell";
import OpsBadge from "@/components/ops/OpsBadge";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import { crmCustomers, formatCurrency, formatDate } from "@/lib/crm/minimalCrmMock";
import type { CrmCustomer, CustomerStatus } from "@/types/crm";

type SegmentKey =
  | "vip_customers"
  | "active_customers"
  | "inactive_customers"
  | "new_customers"
  | "high_spenders"
  | "frequent_buyers"
  | "needs_follow_up"
  | "loyalty_champions";

type SegmentSortKey = "highest_spend" | "most_orders" | "last_order_date" | "loyalty_points" | "name";

type CrmSegmentDefinition = {
  key: SegmentKey;
  name: string;
  description: string;
  ruleSummary: string;
  match: (customer: CrmCustomer) => boolean;
};

const INACTIVE_DAYS_THRESHOLD = 30;

const segmentDefinitions: CrmSegmentDefinition[] = [
  {
    key: "vip_customers",
    name: "VIP Customers",
    description: "Premium customers with high spend or explicit VIP status.",
    ruleSummary: 'status === "vip" OR totalSpend >= 5000',
    match: (customer) => customer.status === "vip" || customer.totalSpend >= 5000,
  },
  {
    key: "active_customers",
    name: "Active Customers",
    description: "Customers currently marked active in CRM.",
    ruleSummary: 'status === "active"',
    match: (customer) => customer.status === "active",
  },
  {
    key: "inactive_customers",
    name: "Inactive Customers",
    description: "Customers inactive or not ordering in the last 30 days.",
    ruleSummary: 'status === "inactive" OR lastOrderDate older than 30 days',
    match: (customer) =>
      customer.status === "inactive" || isOlderThanDays(customer.lastOrderDate, INACTIVE_DAYS_THRESHOLD),
  },
  {
    key: "new_customers",
    name: "New Customers",
    description: "Newly acquired customers with up to one order.",
    ruleSummary: "totalOrders <= 1",
    match: (customer) => customer.totalOrders <= 1,
  },
  {
    key: "high_spenders",
    name: "High Spenders",
    description: "Customers with meaningful contribution to revenue.",
    ruleSummary: "totalSpend >= 3000",
    match: (customer) => customer.totalSpend >= 3000,
  },
  {
    key: "frequent_buyers",
    name: "Frequent Buyers",
    description: "Customers with repeat purchase behavior.",
    ruleSummary: "totalOrders >= 5",
    match: (customer) => customer.totalOrders >= 5,
  },
  {
    key: "needs_follow_up",
    name: "Needs Follow-up",
    description: "Customers flagged for callback, complaint, or care follow-up.",
    ruleSummary: "needsFollowUp === true",
    match: (customer) => customer.needsFollowUp,
  },
  {
    key: "loyalty_champions",
    name: "Loyalty Champions",
    description: "Highly engaged members with strong points balance.",
    ruleSummary: "loyaltyPoints >= 500",
    match: (customer) => customer.loyaltyPoints >= 500,
  },
];

const getCustomerStatusLabel = (status: CustomerStatus) => {
  if (status === "vip") return "VIP";
  if (status === "inactive") return "Inactive";
  return "Active";
};

const getCustomerStatusBadgeVariant = (status: CustomerStatus) => {
  if (status === "vip") return "success" as const;
  if (status === "inactive") return "warning" as const;
  return "info" as const;
};

const isOlderThanDays = (isoDate: string, days: number) => {
  const eventMs = new Date(isoDate).getTime();
  const nowMs = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  return nowMs - eventMs > days * dayMs;
};

const getSegmentCustomers = (segment: CrmSegmentDefinition, customers: CrmCustomer[]) =>
  customers.filter((customer) => segment.match(customer));

const getSegmentCount = (segment: CrmSegmentDefinition, customers: CrmCustomer[]) =>
  getSegmentCustomers(segment, customers).length;

const getLargestSegment = (segments: CrmSegmentDefinition[], customers: CrmCustomer[]) => {
  let largest = segments[0];
  let largestCount = getSegmentCount(segments[0], customers);

  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index];
    const count = getSegmentCount(segment, customers);
    if (count > largestCount) {
      largest = segment;
      largestCount = count;
    }
  }

  return { segment: largest, count: largestCount };
};

const getSegmentKpis = (segments: CrmSegmentDefinition[], customers: CrmCustomer[]) => {
  const largest = getLargestSegment(segments, customers);
  const followUpCount = customers.filter((customer) => customer.needsFollowUp).length;
  const vipCount = customers.filter((customer) => customer.status === "vip" || customer.totalSpend >= 5000).length;
  const inactiveCount = customers.filter(
    (customer) => customer.status === "inactive" || isOlderThanDays(customer.lastOrderDate, INACTIVE_DAYS_THRESHOLD)
  ).length;

  return [
    { label: "Total Segments", value: segments.length },
    { label: "Largest Segment", value: `${largest.segment.name} (${largest.count})` },
    { label: "Customers Needing Follow-up", value: followUpCount, tone: "warning" as const },
    { label: "VIP Customers", value: vipCount, tone: "success" as const },
    { label: "Inactive Customers", value: inactiveCount, tone: "warning" as const },
  ];
};

const filterSegmentCustomers = (customers: CrmCustomer[], query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return customers;

  return customers.filter((customer) => {
    return (
      customer.name.toLowerCase().includes(normalized) ||
      customer.phone.toLowerCase().includes(normalized) ||
      customer.email.toLowerCase().includes(normalized) ||
      customer.favoriteProduct.toLowerCase().includes(normalized)
    );
  });
};

const sortSegmentCustomers = (customers: CrmCustomer[], sortKey: SegmentSortKey) => {
  const sorted = [...customers];
  sorted.sort((a, b) => {
    if (sortKey === "highest_spend") return b.totalSpend - a.totalSpend;
    if (sortKey === "most_orders") return b.totalOrders - a.totalOrders;
    if (sortKey === "last_order_date") return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
    if (sortKey === "loyalty_points") return b.loyaltyPoints - a.loyaltyPoints;
    return a.name.localeCompare(b.name);
  });
  return sorted;
};

export default function Page() {
  const [selectedSegmentKey, setSelectedSegmentKey] = useState<SegmentKey>(segmentDefinitions[0].key);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SegmentSortKey>("highest_spend");
  const [comingSoonMessage, setComingSoonMessage] = useState<string | null>(null);

  const kpis = useMemo(() => getSegmentKpis(segmentDefinitions, crmCustomers), []);

  const selectedSegment = useMemo(
    () => segmentDefinitions.find((segment) => segment.key === selectedSegmentKey) ?? segmentDefinitions[0],
    [selectedSegmentKey]
  );

  const selectedSegmentCustomers = useMemo(
    () => getSegmentCustomers(selectedSegment, crmCustomers),
    [selectedSegment]
  );

  const visibleCustomers = useMemo(() => {
    const filtered = filterSegmentCustomers(selectedSegmentCustomers, searchQuery);
    return sortSegmentCustomers(filtered, sortKey);
  }, [searchQuery, selectedSegmentCustomers, sortKey]);

  return (
    <CrmSectionShell
      title="Segments"
      subtitle="CRM"
      description="Group bakery customers by spend, loyalty, activity, and follow-up needs."
      primaryAction={{ label: "View Customers", href: "/admin/crm/customers" }}
      secondaryAction={{ label: "Back to CRM Overview", href: "/admin/crm" }}
    >
      <OpsKpiGrid items={kpis} />

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Segments</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {segmentDefinitions.map((segment) => {
            const customers = getSegmentCustomers(segment, crmCustomers);
            const isSelected = segment.key === selectedSegment.key;
            const examples = customers.slice(0, 3).map((customer) => customer.name);
            return (
              <article
                key={segment.key}
                className={`rounded-xl border p-4 ${
                  isSelected ? "border-[#1f7a6b]/40 bg-[#f1f8f6]" : "border-black/10 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-base font-semibold text-[#2a2927]">{segment.name}</h4>
                  <OpsBadge label={`${customers.length} customers`} tone={isSelected ? "success" : "neutral"} />
                </div>
                <p className="mt-2 text-sm text-[#5c5a56]">{segment.description}</p>
                <p className="mt-2 text-xs text-[#8b867f]">Rule: {segment.ruleSummary}</p>
                <p className="mt-2 text-xs text-[#6b6b6b]">
                  Examples: {examples.length > 0 ? examples.join(", ") : "No customers yet"}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedSegmentKey(segment.key)}
                  className="mt-3 rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
                >
                  View Customers in Segment
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#2a2927]">{selectedSegment.name}</h3>
            <p className="mt-1 text-sm text-[#5c5a56]">{selectedSegment.description}</p>
          </div>
          <OpsBadge label={`${selectedSegmentCustomers.length} customers`} tone="info" />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Search</label>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Name, phone, email, favorite product"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Sort</label>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SegmentSortKey)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            >
              <option value="highest_spend">Highest Spend</option>
              <option value="most_orders">Most Orders</option>
              <option value="last_order_date">Last Order Date</option>
              <option value="loyalty_points">Loyalty Points</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {comingSoonMessage && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {comingSoonMessage}
          </p>
        )}

        {selectedSegmentCustomers.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#e8dccd] bg-[#fcf8f2] px-4 py-8 text-center text-sm text-[#6b6b6b]">
            No customers currently match this segment.
          </div>
        ) : visibleCustomers.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#e8dccd] bg-[#fcf8f2] px-4 py-8 text-center text-sm text-[#6b6b6b]">
            No customers found in this segment for the search.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1200px] w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-[#8b867f]">
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Customer</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Status</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Total Orders</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Total Spend</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Last Order</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Loyalty Points</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Favorite Product</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-[#f1ebe1] text-[#2a2927]">
                    <td className="py-3 pr-4 align-top text-xs">
                      <p className="font-semibold text-sm text-[#2a2927]">{customer.name}</p>
                      <p className="mt-0.5 text-[#6b6b6b]">{customer.phone}</p>
                      <p className="mt-0.5 text-[#6b6b6b]">{customer.email}</p>
                    </td>
                    <td className="py-3 pr-4 align-top text-xs">
                      <OpsBadge
                        label={getCustomerStatusLabel(customer.status)}
                        tone={getCustomerStatusBadgeVariant(customer.status)}
                      />
                    </td>
                    <td className="py-3 pr-4 align-top text-xs">{customer.totalOrders}</td>
                    <td className="py-3 pr-4 align-top text-xs">{formatCurrency(customer.totalSpend)}</td>
                    <td className="py-3 pr-4 align-top text-xs">{formatDate(customer.lastOrderDate)}</td>
                    <td className="py-3 pr-4 align-top text-xs">{customer.loyaltyPoints.toLocaleString("en-IN")}</td>
                    <td className="py-3 pr-4 align-top text-xs">{customer.favoriteProduct}</td>
                    <td className="py-3 pr-4 align-top text-xs">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/crm/customers/${customer.id}`}
                          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
                        >
                          View Customer
                        </Link>
                        <button
                          type="button"
                          onClick={() => setComingSoonMessage(`Send Offer for ${customer.name} is coming soon.`)}
                          className="rounded-full border border-dashed border-black/20 px-3 py-1.5 text-xs font-semibold text-[#8b867f]"
                        >
                          Send Offer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </CrmSectionShell>
  );
}
