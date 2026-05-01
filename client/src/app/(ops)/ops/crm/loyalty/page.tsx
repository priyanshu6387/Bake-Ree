"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CrmSectionShell from "@/components/crm/CrmSectionShell";
import OpsBadge from "@/components/ops/OpsBadge";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import {
  createCrmLoyaltyAdjustmentWithFallback,
  loadCrmLoyaltyOverview,
} from "@/lib/crm/crmDataSource";
import { crmCustomers, crmLoyaltyActivity, formatCurrency, formatDate } from "@/lib/crm/minimalCrmMock";
import type {
  CrmCustomer,
  CrmLoyaltyActivity,
  CrmLoyaltyActivityType,
  CrmLoyaltySummary,
  CustomerStatus,
} from "@/types/crm";

type LoyaltyTier = "low" | "medium" | "champion";
type LoyaltySortKey = "highest_points" | "lowest_points" | "highest_spend" | "most_orders" | "last_order_date";

type AdjustmentFormState = {
  customerId: string;
  type: CrmLoyaltyActivityType;
  points: string;
  description: string;
};

const defaultAdjustmentForm: AdjustmentFormState = {
  customerId: "",
  type: "earned",
  points: "",
  description: "",
};

const getLoyaltyTier = (points: number): LoyaltyTier => {
  if (points >= 500) return "champion";
  if (points >= 200) return "medium";
  return "low";
};

const getLoyaltyTierLabel = (tier: LoyaltyTier) => {
  if (tier === "champion") return "Champion";
  if (tier === "medium") return "Medium";
  return "Low";
};

const getLoyaltyTierBadgeVariant = (tier: LoyaltyTier) => {
  if (tier === "champion") return "success" as const;
  if (tier === "medium") return "info" as const;
  return "warning" as const;
};

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

const getLoyaltyActivityLabel = (type: CrmLoyaltyActivityType) => {
  if (type === "earned") return "Earned";
  if (type === "redeemed") return "Redeemed";
  return "Adjusted";
};

const getLoyaltyActivityBadgeVariant = (type: CrmLoyaltyActivityType) => {
  if (type === "earned") return "success" as const;
  if (type === "redeemed") return "warning" as const;
  return "info" as const;
};

const filterLoyaltyCustomers = (
  customers: CrmCustomer[],
  searchQuery: string,
  statusFilter: "all" | CustomerStatus,
  tierFilter: "all" | LoyaltyTier
) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return customers.filter((customer) => {
    const statusMatch = statusFilter === "all" || customer.status === statusFilter;
    const tierMatch = tierFilter === "all" || getLoyaltyTier(customer.loyaltyPoints) === tierFilter;
    const queryMatch =
      normalizedQuery.length === 0 ||
      customer.name.toLowerCase().includes(normalizedQuery) ||
      customer.phone.toLowerCase().includes(normalizedQuery) ||
      customer.email.toLowerCase().includes(normalizedQuery) ||
      customer.favoriteProduct.toLowerCase().includes(normalizedQuery);

    return statusMatch && tierMatch && queryMatch;
  });
};

const sortLoyaltyCustomers = (customers: CrmCustomer[], sortKey: LoyaltySortKey) => {
  const sorted = [...customers];
  sorted.sort((a, b) => {
    if (sortKey === "highest_points") return b.loyaltyPoints - a.loyaltyPoints;
    if (sortKey === "lowest_points") return a.loyaltyPoints - b.loyaltyPoints;
    if (sortKey === "highest_spend") return b.totalSpend - a.totalSpend;
    if (sortKey === "most_orders") return b.totalOrders - a.totalOrders;
    return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
  });
  return sorted;
};

const calculateLoyaltySummary = (customers: CrmCustomer[], activity: CrmLoyaltyActivity[]): CrmLoyaltySummary => {
  const totalLoyaltyCustomers = customers.filter((customer) => customer.loyaltyPoints > 0).length;
  const totalActivePoints = customers.reduce((sum, customer) => sum + customer.loyaltyPoints, 0);
  const pointsEarned = activity.filter((row) => row.type === "earned").reduce((sum, row) => sum + row.points, 0);
  const pointsRedeemed = activity
    .filter((row) => row.type === "redeemed")
    .reduce((sum, row) => sum + Math.abs(row.points), 0);
  const loyaltyChampions = customers.filter((customer) => customer.loyaltyPoints >= 500).length;
  const averagePointsPerCustomer = customers.length === 0 ? 0 : Math.round(totalActivePoints / customers.length);

  return {
    totalLoyaltyCustomers,
    totalActivePoints,
    pointsEarned,
    pointsRedeemed,
    loyaltyChampions,
    averagePointsPerCustomer,
  };
};

const calculateLoyaltyKpis = (summary: CrmLoyaltySummary) => {
  const {
    totalLoyaltyCustomers,
    totalActivePoints,
    pointsEarned,
    pointsRedeemed,
    loyaltyChampions,
    averagePointsPerCustomer,
  } = summary;

  return [
    { label: "Total Loyalty Customers", value: totalLoyaltyCustomers },
    { label: "Total Active Points", value: totalActivePoints.toLocaleString("en-IN") },
    { label: "Points Earned", value: pointsEarned.toLocaleString("en-IN"), tone: "success" as const },
    { label: "Points Redeemed", value: pointsRedeemed.toLocaleString("en-IN"), tone: "warning" as const },
    { label: "Loyalty Champions", value: loyaltyChampions },
    { label: "Average Points Per Customer", value: averagePointsPerCustomer.toLocaleString("en-IN") },
  ];
};

const getTopLoyaltyCustomers = (customers: CrmCustomer[]) =>
  [...customers].sort((a, b) => b.loyaltyPoints - a.loyaltyPoints).slice(0, 5);

const getCustomerNameById = (customers: CrmCustomer[], customerId: string) =>
  customers.find((customer) => customer.id === customerId)?.name ?? "Unknown Customer";

const validateAdjustmentForm = (form: AdjustmentFormState, customers: CrmCustomer[]) => {
  const customerExists = customers.some((customer) => customer.id === form.customerId);
  if (!customerExists) return "Customer is required.";

  const points = Number(form.points);
  if (!Number.isFinite(points) || points <= 0) return "Points must be a positive number.";

  if (!form.description.trim()) return "Description is required.";

  return null;
};

export default function Page() {
  const [customers, setCustomers] = useState<CrmCustomer[]>(crmCustomers.map((customer) => ({ ...customer })));
  const [loyaltyActivity, setLoyaltyActivity] = useState<CrmLoyaltyActivity[]>(
    [...crmLoyaltyActivity].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [loyaltySummary, setLoyaltySummary] = useState<CrmLoyaltySummary>(
    calculateLoyaltySummary(crmCustomers, crmLoyaltyActivity)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [usedApiFallback, setUsedApiFallback] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CustomerStatus>("all");
  const [tierFilter, setTierFilter] = useState<"all" | LoyaltyTier>("all");
  const [sortKey, setSortKey] = useState<LoyaltySortKey>("highest_points");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentFormState>(defaultAdjustmentForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSavingAdjustment, setIsSavingAdjustment] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const result = await loadCrmLoyaltyOverview();
      if (!isMounted) return;
      setCustomers(result.data.customers.map((customer) => ({ ...customer })));
      setLoyaltyActivity(
        [...result.data.activity].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
      setLoyaltySummary(result.data.summary);
      setUsedApiFallback(result.apiAttempted && result.usedMockFallback);
      setIsLoading(false);
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const kpis = useMemo(() => calculateLoyaltyKpis(loyaltySummary), [loyaltySummary]);

  const visibleCustomers = useMemo(() => {
    const filtered = filterLoyaltyCustomers(customers, searchQuery, statusFilter, tierFilter);
    return sortLoyaltyCustomers(filtered, sortKey);
  }, [customers, searchQuery, statusFilter, tierFilter, sortKey]);

  const topCustomers = useMemo(() => getTopLoyaltyCustomers(customers), [customers]);

  const openAdjustmentModal = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setAdjustmentForm({ ...defaultAdjustmentForm, customerId });
    setFormError(null);
  };

  const closeAdjustmentModal = () => {
    setSelectedCustomerId(null);
    setAdjustmentForm(defaultAdjustmentForm);
    setFormError(null);
  };

  const handleSaveAdjustment = async () => {
    const error = validateAdjustmentForm(adjustmentForm, customers);
    if (error) {
      setFormError(error);
      return;
    }

    const pointsValue = Number(adjustmentForm.points);

    const targetCustomer = customers.find((customer) => customer.id === adjustmentForm.customerId);
    if (!targetCustomer) {
      setFormError("Customer is required.");
      return;
    }

    setIsSavingAdjustment(true);
    setFormError(null);

    try {
      const result = await createCrmLoyaltyAdjustmentWithFallback(
        {
          customerId: adjustmentForm.customerId,
          type: adjustmentForm.type,
          points: pointsValue,
          description: adjustmentForm.description,
        },
        customers
      );

      setUsedApiFallback((prev) => prev || (result.apiAttempted && result.usedMockFallback));

      const updatedCustomers = customers.map((customer) =>
        customer.id === result.data.customer.id
          ? { ...customer, loyaltyPoints: result.data.customer.loyaltyPoints }
          : customer
      );
      const updatedActivity = [result.data.activity, ...loyaltyActivity];

      setCustomers(updatedCustomers);
      setLoyaltyActivity(updatedActivity);
      setLoyaltySummary(calculateLoyaltySummary(updatedCustomers, updatedActivity));
      setSuccessMessage(
        `Loyalty points updated for ${targetCustomer.name}. New balance: ${result.data.customer.loyaltyPoints.toLocaleString("en-IN")}.`
      );
      closeAdjustmentModal();
    } catch (saveError) {
      setFormError("Unable to save loyalty adjustment. Please try again.");
      if (process.env.NODE_ENV === "development") {
        console.warn("[CRM] Failed to save loyalty adjustment.", saveError);
      }
    } finally {
      setIsSavingAdjustment(false);
    }
  };

  return (
    <CrmSectionShell
      title="Loyalty"
      subtitle="CRM"
      description="Track customer points, rewards, and bakery loyalty activity."
      primaryAction={{ label: "View Customers", href: "/admin/crm/customers" }}
      secondaryAction={{ label: "Back to CRM Overview", href: "/admin/crm" }}
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/crm"
          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
        >
          Back to CRM Overview
        </Link>
        <Link
          href="/admin/crm/customers"
          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
        >
          View Customers
        </Link>
        <Link
          href="/admin/crm/segments"
          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
        >
          View Segments
        </Link>
      </div>

      {isLoading && (
        <p className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#5c5a56]">
          Loading loyalty data...
        </p>
      )}

      {usedApiFallback && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Showing mock CRM data because the backend is unavailable.
        </p>
      )}

      <OpsKpiGrid items={kpis} />

      {successMessage && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p>
      )}

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Loyalty Customers</h3>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | CustomerStatus)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Loyalty Tier</label>
            <select
              value={tierFilter}
              onChange={(event) => setTierFilter(event.target.value as "all" | LoyaltyTier)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="champion">Champion</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Sort</label>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as LoyaltySortKey)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            >
              <option value="highest_points">Highest Points</option>
              <option value="lowest_points">Lowest Points</option>
              <option value="highest_spend">Highest Spend</option>
              <option value="most_orders">Most Orders</option>
              <option value="last_order_date">Last Order Date</option>
            </select>
          </div>
        </div>

        {visibleCustomers.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#e8dccd] bg-[#fcf8f2] px-4 py-8 text-center text-sm text-[#6b6b6b]">
            No loyalty customers found for the selected filters.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1300px] w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-[#8b867f]">
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Customer</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Status</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Loyalty Points</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Total Orders</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Total Spend</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Last Order</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Favorite Product</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCustomers.map((customer) => {
                  const tier = getLoyaltyTier(customer.loyaltyPoints);
                  return (
                    <tr key={customer.id} className="border-b border-[#f1ebe1] text-[#2a2927]">
                      <td className="py-3 pr-4 align-top text-xs">
                        <p className="text-sm font-semibold text-[#2a2927]">{customer.name}</p>
                        <p className="mt-0.5 text-[#6b6b6b]">{customer.phone}</p>
                        <p className="mt-0.5 text-[#6b6b6b]">{customer.email}</p>
                      </td>
                      <td className="py-3 pr-4 align-top text-xs">
                        <OpsBadge label={getCustomerStatusLabel(customer.status)} tone={getCustomerStatusBadgeVariant(customer.status)} />
                      </td>
                      <td className="py-3 pr-4 align-top text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{customer.loyaltyPoints.toLocaleString("en-IN")}</span>
                          <OpsBadge label={getLoyaltyTierLabel(tier)} tone={getLoyaltyTierBadgeVariant(tier)} />
                        </div>
                      </td>
                      <td className="py-3 pr-4 align-top text-xs">{customer.totalOrders}</td>
                      <td className="py-3 pr-4 align-top text-xs">{formatCurrency(customer.totalSpend)}</td>
                      <td className="py-3 pr-4 align-top text-xs">{formatDate(customer.lastOrderDate)}</td>
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
                            onClick={() => openAdjustmentModal(customer.id)}
                            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
                          >
                            Adjust Points
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Recent Loyalty Activity</h3>

        {loyaltyActivity.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#e8dccd] bg-[#fcf8f2] px-4 py-8 text-center text-sm text-[#6b6b6b]">
            No loyalty activity recorded yet.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-[#8b867f]">
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Date</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Customer</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Type</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Points</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Description</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loyaltyActivity.map((item) => (
                  <tr key={item.id} className="border-b border-[#f1ebe1] text-[#2a2927]">
                    <td className="py-3 pr-4 text-xs">{formatDate(item.createdAt)}</td>
                    <td className="py-3 pr-4 text-xs">{getCustomerNameById(customers, item.customerId)}</td>
                    <td className="py-3 pr-4 text-xs">
                      <OpsBadge label={getLoyaltyActivityLabel(item.type)} tone={getLoyaltyActivityBadgeVariant(item.type)} />
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {item.points > 0 ? `+${item.points.toLocaleString("en-IN")}` : item.points.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 pr-4 text-xs">{item.description}</td>
                    <td className="py-3 pr-4 text-xs">
                      <Link
                        href={`/admin/crm/customers/${item.customerId}`}
                        className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
                      >
                        View Customer
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Top Loyalty Customers</h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {topCustomers.map((customer) => {
            const tier = getLoyaltyTier(customer.loyaltyPoints);
            return (
              <article key={customer.id} className="rounded-xl border border-black/10 bg-white p-4">
                <h4 className="text-sm font-semibold text-[#2a2927]">{customer.name}</h4>
                <p className="mt-1 text-sm text-[#5c5a56]">{customer.loyaltyPoints.toLocaleString("en-IN")} points</p>
                <div className="mt-2">
                  <OpsBadge label={getLoyaltyTierLabel(tier)} tone={getLoyaltyTierBadgeVariant(tier)} />
                </div>
                <p className="mt-2 text-xs text-[#6b6b6b]">Spend: {formatCurrency(customer.totalSpend)}</p>
                <Link href={`/admin/crm/customers/${customer.id}`} className="mt-3 inline-block text-xs font-semibold text-[#1f7a6b] hover:underline">
                  View profile
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {selectedCustomerId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-[#2a2927]">Adjust Loyalty Points</h3>
            <p className="mt-1 text-sm text-[#6b6b6b]">
              Customer: {getCustomerNameById(customers, adjustmentForm.customerId)}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Adjustment Type</label>
                <select
                  value={adjustmentForm.type}
                  onChange={(event) =>
                    setAdjustmentForm((prev) => ({ ...prev, type: event.target.value as CrmLoyaltyActivityType }))
                  }
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                >
                  <option value="earned">Earned</option>
                  <option value="redeemed">Redeemed</option>
                  <option value="adjusted">Adjusted</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Points</label>
                <input
                  type="number"
                  min="1"
                  value={adjustmentForm.points}
                  onChange={(event) => setAdjustmentForm((prev) => ({ ...prev, points: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Description</label>
                <textarea
                  rows={3}
                  value={adjustmentForm.description}
                  onChange={(event) => setAdjustmentForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Reason for adjustment"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                />
              </div>
            </div>

            {formError && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveAdjustment}
                disabled={isSavingAdjustment}
                className="rounded-full bg-[#2a2927] px-4 py-2 text-xs font-semibold text-white"
              >
                {isSavingAdjustment ? "Saving..." : "Save Adjustment"}
              </button>
              <button
                type="button"
                onClick={closeAdjustmentModal}
                className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </CrmSectionShell>
  );
}
