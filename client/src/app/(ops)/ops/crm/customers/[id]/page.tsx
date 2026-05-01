"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CrmSectionShell from "@/components/crm/CrmSectionShell";
import OpsBadge from "@/components/ops/OpsBadge";
import OpsInputModal from "@/components/ops/OpsInputModal";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import {
  calculateAverageOrderValue,
  formatCurrency,
  formatDate,
} from "@/lib/crm/minimalCrmMock";
import {
  loadCrmCustomer,
  loadCrmCustomerComplaints,
  loadCrmCustomerLoyaltyActivity,
  loadCrmCustomerNotes,
  loadCrmCustomerOrders,
  saveCrmCustomerNote,
  shouldUseCrmApi,
} from "@/lib/crm/crmDataSource";
import type {
  ComplaintStatus,
  CrmComplaint,
  CrmCustomer,
  CrmCustomerNote,
  CrmLoyaltyActivity,
  CrmNoteType,
  CrmCustomerOrder,
  CrmOrderStatus,
} from "@/types/crm";

const getStatusBadgeVariant = (status: CrmCustomer["status"]) => {
  if (status === "vip") return "success" as const;
  if (status === "inactive") return "warning" as const;
  return "info" as const;
};

const formatCustomerStatus = (status: CrmCustomer["status"]) => {
  if (status === "vip") return "VIP";
  if (status === "inactive") return "Inactive";
  return "Active";
};

const getComplaintStatusBadgeVariant = (status: ComplaintStatus) => {
  if (status === "open") return "danger" as const;
  if (status === "in_progress") return "warning" as const;
  return "success" as const;
};

const getOrderStatusBadgeVariant = (status: CrmOrderStatus) => {
  if (status === "delivered") return "success" as const;
  if (status === "confirmed") return "info" as const;
  if (status === "placed") return "warning" as const;
  return "danger" as const;
};

const formatOrderStatus = (status: CrmOrderStatus) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const formatComplaintStatus = (status: ComplaintStatus) =>
  status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1);

const formatNoteType = (type: CrmNoteType) =>
  type === "follow_up" ? "Follow-up" : type.charAt(0).toUpperCase() + type.slice(1);

const getLoyaltyBadgeTone = (type: CrmLoyaltyActivity["type"]) => {
  if (type === "earned") return "success" as const;
  if (type === "redeemed") return "warning" as const;
  return "info" as const;
};

const formatLoyaltyType = (type: CrmLoyaltyActivity["type"]) =>
  type.charAt(0).toUpperCase() + type.slice(1);

export default function Page() {
  const params = useParams<{ id: string }>();
  const customerId = Array.isArray(params?.id) ? params.id[0] : (params?.id ?? "");

  const [customer, setCustomer] = useState<CrmCustomer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CrmCustomerOrder[]>([]);
  const [baseNotes, setBaseNotes] = useState<CrmCustomerNote[]>([]);
  const [customerComplaints, setCustomerComplaints] = useState<CrmComplaint[]>([]);
  const [loyaltyActivity, setLoyaltyActivity] = useState<CrmLoyaltyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [localNotes, setLocalNotes] = useState<CrmCustomerNote[]>([]);
  const [comingSoonMessage, setComingSoonMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!customerId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const [customerResult, ordersResult, notesResult, loyaltyResult, complaintsResult] = await Promise.all([
        loadCrmCustomer(customerId),
        loadCrmCustomerOrders(customerId),
        loadCrmCustomerNotes(customerId),
        loadCrmCustomerLoyaltyActivity(customerId),
        loadCrmCustomerComplaints(customerId),
      ]);

      if (!isMounted) return;

      setCustomer(customerResult.data);
      setCustomerOrders(ordersResult.data);
      setBaseNotes(notesResult.data);
      setLoyaltyActivity(loyaltyResult.data);
      setCustomerComplaints(complaintsResult.data);

      const usedFallback =
        customerResult.usedMockFallback ||
        ordersResult.usedMockFallback ||
        notesResult.usedMockFallback ||
        loyaltyResult.usedMockFallback ||
        complaintsResult.usedMockFallback;
      const apiAttempted =
        customerResult.apiAttempted ||
        ordersResult.apiAttempted ||
        notesResult.apiAttempted ||
        loyaltyResult.apiAttempted ||
        complaintsResult.apiAttempted;

      setShowFallbackMessage(apiAttempted && usedFallback);
      setIsLoading(false);
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [customerId]);

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-[#6b6b6b]">Loading customer profile...</p>
      </section>
    );
  }

  if (!customer) {
    return (
      <section className="rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-[#2a2927]">Customer not found</h2>
        <p className="mt-2 text-sm text-[#6b6b6b]">
          The requested customer profile is not available in CRM mock data.
        </p>
        <Link
          href="/admin/crm/customers"
          className="mt-4 inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
        >
          Back to Customers
        </Link>
      </section>
    );
  }

  const mergedNotes = [...localNotes, ...baseNotes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const aovFromOrders = customerOrders.length
    ? Math.round(customerOrders.reduce((sum, order) => sum + order.amount, 0) / customerOrders.length)
    : calculateAverageOrderValue([customer]);

  const loyaltyEarned = loyaltyActivity
    .filter((item) => item.type === "earned")
    .reduce((sum, item) => sum + Math.max(item.points, 0), 0);

  const loyaltyRedeemed = Math.abs(
    loyaltyActivity
      .filter((item) => item.type === "redeemed")
      .reduce((sum, item) => sum + Math.min(item.points, 0), 0)
  );

  const kpis = [
    { label: "Total Orders", value: customer.totalOrders },
    { label: "Total Spend", value: formatCurrency(customer.totalSpend) },
    { label: "Average Order Value", value: formatCurrency(aovFromOrders) },
    { label: "Loyalty Points", value: customer.loyaltyPoints.toLocaleString("en-IN") },
    { label: "Last Order Date", value: formatDate(customer.lastOrderDate) },
    { label: "Favorite Product", value: customer.favoriteProduct },
  ];

  return (
    <CrmSectionShell
      title={customer.name}
      subtitle="Customer 360"
      description="Single customer profile with order behavior, loyalty, notes, and support context."
      secondaryAction={{ label: "Back to Customers", href: "/admin/crm/customers" }}
    >
      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold text-[#2a2927]">{customer.name}</h3>
              <OpsBadge
                label={formatCustomerStatus(customer.status)}
                tone={getStatusBadgeVariant(customer.status)}
              />
            </div>
            <p className="mt-2 text-sm text-[#5c5a56]">{customer.phone}</p>
            <p className="text-sm text-[#5c5a56]">{customer.email}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#8b867f]">
              Last order: {formatDate(customer.lastOrderDate)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/crm/customers"
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
            >
              Back to Customers
            </Link>
            <button
              type="button"
              onClick={() => setIsNoteModalOpen(true)}
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
            >
              Add Note
            </button>
            <button
              type="button"
              onClick={() => setComingSoonMessage("Send Offer is coming soon.")}
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
            >
              Send Offer
            </button>
            <Link
              href="/admin/orders"
              className="rounded-full bg-[#2a2927] px-4 py-2 text-xs font-semibold text-white"
            >
              View Orders
            </Link>
          </div>
        </div>
        {comingSoonMessage && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {comingSoonMessage}
          </p>
        )}
        {showFallbackMessage && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Showing mock CRM data because the backend is unavailable.
          </p>
        )}
      </section>

      <OpsKpiGrid items={kpis} />

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Customer Information</h4>
          <dl className="mt-4 grid gap-3 text-sm text-[#2a2927] sm:grid-cols-2">
            <div><dt className="text-[#8b867f]">Name</dt><dd className="font-medium">{customer.name}</dd></div>
            <div><dt className="text-[#8b867f]">Phone</dt><dd className="font-medium">{customer.phone}</dd></div>
            <div><dt className="text-[#8b867f]">Email</dt><dd className="font-medium">{customer.email}</dd></div>
            <div><dt className="text-[#8b867f]">Status</dt><dd className="font-medium">{formatCustomerStatus(customer.status)}</dd></div>
            <div><dt className="text-[#8b867f]">Joined Date</dt><dd className="font-medium">{formatDate(customer.createdAt)}</dd></div>
            <div><dt className="text-[#8b867f]">Last Order</dt><dd className="font-medium">{formatDate(customer.lastOrderDate)}</dd></div>
            <div><dt className="text-[#8b867f]">Needs Follow-up</dt><dd className="font-medium">{customer.needsFollowUp ? "Yes" : "No"}</dd></div>
          </dl>
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Preferences</h4>
          <div className="mt-4 space-y-3 text-sm text-[#2a2927]">
            <p><span className="text-[#8b867f]">Favorite product:</span> {customer.favoriteProduct}</p>
            <p>
              <span className="text-[#8b867f]">Preferred channel:</span>{" "}
              {(customer.preferredOrderChannel ?? "delivery").charAt(0).toUpperCase() +
                (customer.preferredOrderChannel ?? "delivery").slice(1)}
            </p>
            <p><span className="text-[#8b867f]">Notes:</span> {customer.preferenceNotes ?? "No preference notes recorded."}</p>
            <div>
              <p className="text-[#8b867f]">Top purchased products:</p>
              <ul className="mt-1 list-disc pl-5">
                {(customer.topPurchasedProducts ?? []).slice(0, 3).map((product) => (
                  <li key={product}>{product}</li>
                ))}
                {(customer.topPurchasedProducts ?? []).length === 0 && <li>No product trends yet.</li>}
              </ul>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Order History</h4>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-[#8b867f]">
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Order ID</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Date</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Items</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Status</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Amount</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Channel</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {customerOrders.map((order) => (
                <tr key={order.id} className="border-b border-[#f1ebe1] text-[#2a2927]">
                  <td className="py-3 pr-4 text-xs">{order.orderNumber}</td>
                  <td className="py-3 pr-4 text-xs">{formatDate(order.date)}</td>
                  <td className="py-3 pr-4 text-xs">{order.itemsSummary}</td>
                  <td className="py-3 pr-4 text-xs">
                    <OpsBadge label={formatOrderStatus(order.status)} tone={getOrderStatusBadgeVariant(order.status)} />
                  </td>
                  <td className="py-3 pr-4 text-xs">{formatCurrency(order.amount)}</td>
                  <td className="py-3 pr-4 text-xs">{order.channel === "delivery" ? "Delivery" : "Pickup"}</td>
                  <td className="py-3 pr-4 text-xs">
                    <Link href={`/admin/orders/${order.orderNumber}`} className="font-semibold text-[#1f7a6b] hover:underline">
                      View Order
                    </Link>
                  </td>
                </tr>
              ))}
              {customerOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-[#6b6b6b]">No orders recorded for this customer.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Loyalty</h4>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-xl border border-[#efe5d8] bg-[#fbf7f1] p-3">
              <p className="text-[#8b867f]">Current points</p>
              <p className="mt-1 font-semibold text-[#2a2927]">{customer.loyaltyPoints.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl border border-[#efe5d8] bg-[#fbf7f1] p-3">
              <p className="text-[#8b867f]">Total earned</p>
              <p className="mt-1 font-semibold text-[#2a2927]">{loyaltyEarned.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl border border-[#efe5d8] bg-[#fbf7f1] p-3">
              <p className="text-[#8b867f]">Total redeemed</p>
              <p className="mt-1 font-semibold text-[#2a2927]">{loyaltyRedeemed.toLocaleString("en-IN")}</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[640px] w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-[#8b867f]">
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Date</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Type</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Points</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {loyaltyActivity.map((activity) => (
                  <tr key={activity.id} className="border-b border-[#f1ebe1]">
                    <td className="py-3 pr-4 text-xs">{formatDate(activity.createdAt)}</td>
                    <td className="py-3 pr-4 text-xs"><OpsBadge label={formatLoyaltyType(activity.type)} tone={getLoyaltyBadgeTone(activity.type)} /></td>
                    <td className="py-3 pr-4 text-xs font-semibold">{activity.points > 0 ? `+${activity.points}` : activity.points}</td>
                    <td className="py-3 pr-4 text-xs">{activity.description}</td>
                  </tr>
                ))}
                {loyaltyActivity.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-[#6b6b6b]">No loyalty activity recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">CRM Notes</h4>
          <div className="mt-4 space-y-3">
            {mergedNotes.map((note) => (
              <div key={note.id} className="rounded-xl border border-[#efe5d8] bg-[#fbf7f1] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <OpsBadge label={formatNoteType(note.type)} tone="neutral" />
                  <p className="text-xs text-[#8b867f]">{formatDate(note.createdAt)} by {note.createdBy}</p>
                </div>
                <p className="mt-2 text-sm text-[#2a2927]">{note.text}</p>
              </div>
            ))}
            {mergedNotes.length === 0 && (
              <p className="text-sm text-[#6b6b6b]">No notes recorded yet.</p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Complaints</h4>
        {customerComplaints.length === 0 ? (
          <p className="mt-4 text-sm text-[#6b6b6b]">No complaints recorded for this customer.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-[#8b867f]">
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Complaint ID</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Order ID</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Issue Type</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Status</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Created At</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {customerComplaints.map((complaint) => (
                  <tr key={complaint.id} className="border-b border-[#f1ebe1]">
                    <td className="py-3 pr-4 text-xs">{complaint.id}</td>
                    <td className="py-3 pr-4 text-xs">{complaint.orderId}</td>
                    <td className="py-3 pr-4 text-xs">{complaint.issueType}</td>
                    <td className="py-3 pr-4 text-xs">
                      <OpsBadge
                        label={formatComplaintStatus(complaint.status)}
                        tone={getComplaintStatusBadgeVariant(complaint.status)}
                      />
                    </td>
                    <td className="py-3 pr-4 text-xs">{formatDate(complaint.createdAt)}</td>
                    <td className="py-3 pr-4 text-xs">{complaint.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <OpsInputModal
        open={isNoteModalOpen}
        title="Add CRM Note"
        description="Add an internal note for this customer profile."
        label="Note"
        placeholder="Write a follow-up, preference, or support note..."
        required
        confirmLabel="Save Note"
        onClose={() => setIsNoteModalOpen(false)}
        onConfirm={(value) => {
          const createLocalNote = (text: string): CrmCustomerNote => ({
            id: `LOCAL-${Date.now()}`,
            customerId,
            text,
            type: "general",
            createdBy: "Ops Admin",
            createdAt: new Date().toISOString(),
          });

          const saveNote = async () => {
            const trimmed = value.trim();
            if (!trimmed) return;

            if (!shouldUseCrmApi) {
              setLocalNotes((prev) => [createLocalNote(trimmed), ...prev]);
              setIsNoteModalOpen(false);
              return;
            }

            try {
              const createdNote = await saveCrmCustomerNote(customerId, {
                text: trimmed,
                type: "general",
              });
              setLocalNotes((prev) => [createdNote, ...prev]);
            } catch {
              setLocalNotes((prev) => [createLocalNote(trimmed), ...prev]);
              setShowFallbackMessage(true);
            } finally {
              setIsNoteModalOpen(false);
            }
          };

          void saveNote();
        }}
      />
    </CrmSectionShell>
  );
}
