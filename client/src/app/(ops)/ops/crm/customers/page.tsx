"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CrmSectionShell from "@/components/crm/CrmSectionShell";
import OpsBadge from "@/components/ops/OpsBadge";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import {
  createCrmCampaignWithFallback,
  createCrmCustomerNoteWithFallback,
  createCrmCustomerWithFallback,
  loadCrmCustomers,
} from "@/lib/crm/crmDataSource";
import { formatCurrency, formatDate } from "@/lib/crm/minimalCrmMock";
import type {
  CrmCustomer,
  CrmCustomerCreatePayload,
  CrmCustomerNote,
  CrmSegmentKey,
  CrmNoteType,
  CustomerStatus,
} from "@/types/crm";

type StatusFilter = "all" | CustomerStatus;
type FollowUpFilter = "all" | "needs_follow_up" | "no_follow_up";
type SortOption = "newest" | "highest_spend" | "most_orders" | "last_order_date" | "loyalty_points";
const allowedNoteTypes: CrmNoteType[] = ["general", "preference", "complaint", "follow_up"];
const allowedOfferChannels = ["whatsapp", "sms", "email"] as const;
type OfferChannel = (typeof allowedOfferChannels)[number];

const getDateMsOrFallback = (dateValue: string | null | undefined, fallbackMs = 0) => {
  if (!dateValue) return fallbackMs;
  const parsed = new Date(dateValue).getTime();
  return Number.isNaN(parsed) ? fallbackMs : parsed;
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

const getNoteTypeLabel = (type: CrmNoteType) => {
  if (type === "follow_up") return "Follow-up";
  if (type === "preference") return "Preference";
  if (type === "complaint") return "Complaint";
  return "General";
};

const getNoteTypeBadgeClass = (type: CrmNoteType) => {
  if (type === "follow_up") return "bg-amber-100 text-amber-800";
  if (type === "preference") return "bg-emerald-100 text-emerald-800";
  if (type === "complaint") return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
};

const formatNoteDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const filterCustomers = (
  customers: CrmCustomer[],
  query: string,
  statusFilter: StatusFilter,
  followUpFilter: FollowUpFilter
) => {
  const normalizedQuery = query.trim().toLowerCase();

  return customers.filter((customer) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      customer.name.toLowerCase().includes(normalizedQuery) ||
      customer.phone.toLowerCase().includes(normalizedQuery) ||
      customer.email.toLowerCase().includes(normalizedQuery) ||
      customer.favoriteProduct.toLowerCase().includes(normalizedQuery);

    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;

    const matchesFollowUp =
      followUpFilter === "all" ||
      (followUpFilter === "needs_follow_up" && customer.needsFollowUp) ||
      (followUpFilter === "no_follow_up" && !customer.needsFollowUp);

    return matchesSearch && matchesStatus && matchesFollowUp;
  });
};

const sortCustomers = (customers: CrmCustomer[], sortOption: SortOption) => {
  const sorted = [...customers];

  sorted.sort((a, b) => {
    if (sortOption === "highest_spend") return b.totalSpend - a.totalSpend;
    if (sortOption === "most_orders") return b.totalOrders - a.totalOrders;
    if (sortOption === "last_order_date") {
      return getDateMsOrFallback(b.lastOrderDate, -1) - getDateMsOrFallback(a.lastOrderDate, -1);
    }
    if (sortOption === "loyalty_points") return b.loyaltyPoints - a.loyaltyPoints;
    return getDateMsOrFallback(b.createdAt, -1) - getDateMsOrFallback(a.createdAt, -1);
  });

  return sorted;
};

export default function Page() {
  const initialFormState: CrmCustomerCreatePayload = {
    name: "",
    phone: "",
    email: "",
    favoriteProduct: "",
    loyaltyPoints: 0,
    status: "active",
    needsFollowUp: false,
    preferenceNotes: "",
  };
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [rowActionMessage, setRowActionMessage] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [selectedCustomerForNote, setSelectedCustomerForNote] = useState<CrmCustomer | null>(null);
  // TODO: Fetch latest note summary from backend list endpoint when available.
  const [latestNotesByCustomerId, setLatestNotesByCustomerId] = useState<Record<string, CrmCustomerNote>>({});
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedOfferCustomer, setSelectedOfferCustomer] = useState<CrmCustomer | null>(null);
  const [offerName, setOfferName] = useState("");
  const [offerChannel, setOfferChannel] = useState<OfferChannel>("whatsapp");
  const [offerCouponCode, setOfferCouponCode] = useState("");
  const [offerDiscountLabel, setOfferDiscountLabel] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerError, setOfferError] = useState<string | null>(null);
  const [isSendingOffer, setIsSendingOffer] = useState(false);
  const [addNoteForm, setAddNoteForm] = useState<{ type: CrmNoteType; text: string }>({
    type: "general",
    text: "",
  });
  const [addNoteErrors, setAddNoteErrors] = useState<{ type?: string; text?: string }>({});
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  const [addCustomerForm, setAddCustomerForm] = useState<CrmCustomerCreatePayload>(initialFormState);
  const [addCustomerErrors, setAddCustomerErrors] = useState<Record<string, string>>({});
  const [addCustomerMessage, setAddCustomerMessage] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCustomers = async () => {
      setIsLoading(true);
      const result = await loadCrmCustomers();
      if (!isMounted) return;
      setCustomers(result.data);
      setShowFallbackMessage(result.apiAttempted && result.usedMockFallback);
      setIsLoading(false);
    };

    void loadCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  const kpiItems = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((customer) => customer.status === "active").length;
    const vipCustomers = customers.filter((customer) => customer.status === "vip").length;
    const needsFollowUp = customers.filter((customer) => customer.needsFollowUp).length;

    return [
      { label: "Total Customers", value: totalCustomers },
      { label: "Active Customers", value: activeCustomers },
      { label: "VIP Customers", value: vipCustomers },
      { label: "Customers Needing Follow-up", value: needsFollowUp, tone: "warning" },
    ];
  }, [customers]);

  const visibleCustomers = useMemo(() => {
    const filtered = filterCustomers(customers, searchQuery, statusFilter, followUpFilter);
    return sortCustomers(filtered, sortOption);
  }, [customers, followUpFilter, searchQuery, sortOption, statusFilter]);

  const validateAddCustomerForm = (values: CrmCustomerCreatePayload) => {
    const errors: Record<string, string> = {};
    if (!values.name?.trim()) errors.name = "Name is required.";
    if (!values.phone?.trim()) errors.phone = "Phone is required.";
    if (values.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    const points = Number(values.loyaltyPoints ?? 0);
    if (!Number.isFinite(points) || points < 0) {
      errors.loyaltyPoints = "Loyalty points must be 0 or greater.";
    }
    return errors;
  };

  const resetAddCustomerForm = () => {
    setAddCustomerForm(initialFormState);
    setAddCustomerErrors({});
  };

  const resetAddNoteForm = () => {
    setAddNoteForm({ type: "general", text: "" });
    setAddNoteErrors({});
  };

  const validateAddNoteForm = (values: { type: CrmNoteType; text: string }) => {
    const errors: { type?: string; text?: string } = {};
    if (!allowedNoteTypes.includes(values.type)) {
      errors.type = "Select a valid note type.";
    }
    if (!values.text.trim()) {
      errors.text = "Note text is required.";
    }
    return errors;
  };

  const handleOpenAddNoteModal = (customer: CrmCustomer) => {
    setSelectedCustomerForNote(customer);
    setRowActionMessage(null);
    resetAddNoteForm();
    setIsAddNoteModalOpen(true);
  };

  const handleOpenOfferModal = (customer: CrmCustomer) => {
    setSelectedOfferCustomer(customer);
    setOfferChannel("whatsapp");
    setOfferName(`Personal Offer for ${customer.name}`);
    setOfferCouponCode("CRM10");
    setOfferDiscountLabel("10% Off");
    setOfferMessage(`Hi ${customer.name}, enjoy a special bakery offer on your next order.`);
    setOfferError(null);
    setRowActionMessage(null);
    setIsOfferModalOpen(true);
  };

  const handleSaveOffer = async () => {
    if (!selectedOfferCustomer) return;
    const name = offerName.trim();
    const message = offerMessage.trim();
    if (!name) {
      setOfferError("Offer name is required.");
      return;
    }
    if (!message) {
      setOfferError("Message is required.");
      return;
    }
    if (!allowedOfferChannels.includes(offerChannel)) {
      setOfferError("Select a valid channel.");
      return;
    }

    setOfferError(null);
    setIsSendingOffer(true);
    const result = await createCrmCampaignWithFallback({
      name,
      targetSegment: "manual_customer" as CrmSegmentKey,
      channel: offerChannel,
      message,
      couponCode: offerCouponCode.trim() || undefined,
      discountLabel: offerDiscountLabel.trim() || undefined,
      status: "sent",
      recipientCustomerId: selectedOfferCustomer.id,
      recipientCustomerName: selectedOfferCustomer.name,
    });
    setIsSendingOffer(false);
    setIsOfferModalOpen(false);

    if (result.apiAttempted && result.usedMockFallback) {
      setRowActionMessage("Offer saved locally because backend is unavailable.");
      return;
    }
    if (result.apiAttempted) {
      setRowActionMessage(`Offer saved for ${selectedOfferCustomer.name}.`);
      return;
    }
    setRowActionMessage(`Offer saved locally for ${selectedOfferCustomer.name}.`);
  };

  const handleSaveNote = async () => {
    if (!selectedCustomerForNote) return;
    const errors = validateAddNoteForm(addNoteForm);
    setAddNoteErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmittingNote(true);
    const payload = {
      type: addNoteForm.type,
      text: addNoteForm.text.trim(),
    };
    const result = await createCrmCustomerNoteWithFallback(selectedCustomerForNote.id, payload);
    setIsSubmittingNote(false);
    setIsAddNoteModalOpen(false);
    resetAddNoteForm();
    setLatestNotesByCustomerId((prev) => ({
      ...prev,
      [selectedCustomerForNote.id]: result.data,
    }));

    if (result.apiAttempted && result.usedMockFallback) {
      setRowActionMessage("Note saved locally because backend is unavailable.");
      return;
    }
    if (result.apiAttempted) {
      setRowActionMessage(`Note added for ${selectedCustomerForNote.name}.`);
      return;
    }
    setRowActionMessage(`Note added locally for ${selectedCustomerForNote.name}.`);
  };

  const handleSaveCustomer = async () => {
    const errors = validateAddCustomerForm(addCustomerForm);
    setAddCustomerErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmittingCustomer(true);
    setAddCustomerMessage(null);
    const payload: CrmCustomerCreatePayload = {
      name: addCustomerForm.name?.trim() || "",
      phone: addCustomerForm.phone?.trim() || "",
      email: addCustomerForm.email?.trim() || undefined,
      favoriteProduct: addCustomerForm.favoriteProduct?.trim() || undefined,
      loyaltyPoints: Number(addCustomerForm.loyaltyPoints ?? 0),
      status: addCustomerForm.status ?? "active",
      needsFollowUp: addCustomerForm.needsFollowUp ?? false,
      preferenceNotes: addCustomerForm.preferenceNotes?.trim() || undefined,
    };

    const result = await createCrmCustomerWithFallback(payload);
    setCustomers((prev) => [result.data, ...prev]);
    setIsSubmittingCustomer(false);
    setIsAddModalOpen(false);
    resetAddCustomerForm();

    if (result.apiAttempted && result.usedMockFallback) {
      setAddCustomerMessage({
        tone: "warning",
        text: "Customer added locally because CRM API create failed.",
      });
      return;
    }
    if (result.apiAttempted) {
      setAddCustomerMessage({ tone: "success", text: "Customer created successfully." });
      return;
    }
    setAddCustomerMessage({ tone: "warning", text: "Customer added locally (mock mode)." });
  };

  return (
    <CrmSectionShell
      title="Customers"
      subtitle="CRM"
      description="Manage bakery customers, loyalty activity, spend, and follow-up status."
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/admin/crm"
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[#2a2927] transition hover:bg-[#f7f5f0]"
          >
            CRM Overview
          </Link>
        </div>
      }
    >
      <OpsKpiGrid items={kpiItems} />

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Filters</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2 xl:col-span-1">
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
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="vip">VIP</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Follow-up</label>
            <select
              value={followUpFilter}
              onChange={(event) => setFollowUpFilter(event.target.value as FollowUpFilter)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            >
              <option value="all">All</option>
              <option value="needs_follow_up">Needs Follow-up</option>
              <option value="no_follow_up">No Follow-up Needed</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Sort</label>
            <select
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as SortOption)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            >
              <option value="newest">Newest</option>
              <option value="highest_spend">Highest Spend</option>
              <option value="most_orders">Most Orders</option>
              <option value="last_order_date">Last Order Date</option>
              <option value="loyalty_points">Loyalty Points</option>
            </select>
          </div>
        </div>

        {rowActionMessage && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {rowActionMessage}
          </p>
        )}
        {showFallbackMessage && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Showing mock CRM data because the backend is unavailable.
          </p>
        )}
        {addCustomerMessage && (
          <p
            className={`mt-3 rounded-xl px-3 py-2 text-sm ${
              addCustomerMessage.tone === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : addCustomerMessage.tone === "error"
                  ? "border border-rose-200 bg-rose-50 text-rose-700"
                  : "border border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {addCustomerMessage.text}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Customer List</h3>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-full bg-[#1f7a6b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#176154]"
          >
            Add Customer
          </button>
        </div>
        {isLoading ? (
          <div className="rounded-xl border border-dashed border-[#e8dccd] bg-[#fcf8f2] px-4 py-8 text-center text-sm text-[#6b6b6b]">
            Loading customers...
          </div>
        ) : visibleCustomers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#e8dccd] bg-[#fcf8f2] px-4 py-8 text-center text-sm text-[#6b6b6b]">
            No customers found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1420px] w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-[#8b867f]">
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Customer</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Status</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Orders</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Total Spend</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Last Order</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Loyalty Points</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Favorite Product</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Follow-up</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Latest Note</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCustomers.map((customer) => {
                  const latestNote = latestNotesByCustomerId[customer.id];

                  return (
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
                      {customer.needsFollowUp ? (
                        <OpsBadge label="Needs Follow-up" tone="warning" />
                      ) : (
                        <OpsBadge label="No Follow-up Needed" tone="neutral" />
                      )}
                    </td>
                    <td className="py-3 pr-4 align-top text-xs min-w-[240px] max-w-[280px]">
                      {latestNote ? (
                        <div className="space-y-1">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${getNoteTypeBadgeClass(latestNote.type)}`}
                          >
                            {getNoteTypeLabel(latestNote.type)}
                          </span>
                          <p className="line-clamp-2 text-[#2a2927]">{latestNote.text}</p>
                          {latestNote.createdAt ? (
                            <p className="text-[11px] text-[#8b867f]">{formatNoteDate(latestNote.createdAt)}</p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-[#8b867f]">No notes yet</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 align-top text-xs whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/crm/customers/${customer.id}`}
                          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenAddNoteModal(customer)}
                          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
                        >
                          Add Note
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenOfferModal(customer)}
                          className="rounded-full border border-dashed border-black/20 px-3 py-1.5 text-xs font-semibold text-[#8b867f]"
                        >
                          Send Offer
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-[#2a2927]">Add Customer</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Name *</label>
                <input
                  type="text"
                  autoComplete="name"
                  value={addCustomerForm.name ?? ""}
                  onChange={(event) => setAddCustomerForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] placeholder:text-[#8b867f] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                />
                {addCustomerErrors.name && <p className="mt-1 text-xs text-rose-600">{addCustomerErrors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Phone *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={addCustomerForm.phone ?? ""}
                  onChange={(event) => setAddCustomerForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] placeholder:text-[#8b867f] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                />
                {addCustomerErrors.phone && <p className="mt-1 text-xs text-rose-600">{addCustomerErrors.phone}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={addCustomerForm.email ?? ""}
                  onChange={(event) => setAddCustomerForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] placeholder:text-[#8b867f] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                />
                {addCustomerErrors.email && <p className="mt-1 text-xs text-rose-600">{addCustomerErrors.email}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Favorite Product</label>
                <input
                  type="text"
                  value={addCustomerForm.favoriteProduct ?? ""}
                  onChange={(event) =>
                    setAddCustomerForm((prev) => ({ ...prev, favoriteProduct: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] placeholder:text-[#8b867f] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Loyalty Points</label>
                <input
                  type="number"
                  min={0}
                  value={addCustomerForm.loyaltyPoints ?? 0}
                  onChange={(event) =>
                    setAddCustomerForm((prev) => ({ ...prev, loyaltyPoints: Number(event.target.value) }))
                  }
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] placeholder:text-[#8b867f] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                />
                {addCustomerErrors.loyaltyPoints && (
                  <p className="mt-1 text-xs text-rose-600">{addCustomerErrors.loyaltyPoints}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Status</label>
                <select
                  value={addCustomerForm.status ?? "active"}
                  onChange={(event) =>
                    setAddCustomerForm((prev) => ({ ...prev, status: event.target.value as CustomerStatus }))
                  }
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">
                  Preference Notes
                </label>
                <textarea
                  value={addCustomerForm.preferenceNotes ?? ""}
                  onChange={(event) =>
                    setAddCustomerForm((prev) => ({ ...prev, preferenceNotes: event.target.value }))
                  }
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] placeholder:text-[#8b867f] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-[#2a2927] md:col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean(addCustomerForm.needsFollowUp)}
                  onChange={(event) =>
                    setAddCustomerForm((prev) => ({ ...prev, needsFollowUp: event.target.checked }))
                  }
                />
                Needs Follow-up
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetAddCustomerForm();
                }}
                className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingCustomer}
                onClick={() => void handleSaveCustomer()}
                className="rounded-full bg-[#1f7a6b] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70 hover:bg-[#176154]"
              >
                {isSubmittingCustomer ? "Saving..." : "Save Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
      {isAddNoteModalOpen && selectedCustomerForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-black/10 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-[#2a2927]">Add Note for {selectedCustomerForNote.name}</h3>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Note Type</label>
                <select
                  value={addNoteForm.type}
                  onChange={(event) =>
                    setAddNoteForm((prev) => ({
                      ...prev,
                      type: event.target.value as CrmNoteType,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                >
                  <option value="general">general</option>
                  <option value="preference">preference</option>
                  <option value="complaint">complaint</option>
                  <option value="follow_up">follow_up</option>
                </select>
                {addNoteErrors.type && <p className="mt-1 text-xs text-rose-600">{addNoteErrors.type}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Note Text *</label>
                <textarea
                  value={addNoteForm.text}
                  onChange={(event) => setAddNoteForm((prev) => ({ ...prev, text: event.target.value }))}
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] placeholder:text-[#8b867f] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                />
                {addNoteErrors.text && <p className="mt-1 text-xs text-rose-600">{addNoteErrors.text}</p>}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddNoteModalOpen(false);
                  resetAddNoteForm();
                }}
                className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingNote}
                onClick={() => void handleSaveNote()}
                className="rounded-full bg-[#1f7a6b] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70 hover:bg-[#176154]"
              >
                {isSubmittingNote ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}
      {isOfferModalOpen && selectedOfferCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-black/10 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-[#2a2927]">Send Offer to {selectedOfferCustomer.name}</h3>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Offer Name *</label>
                <input
                  type="text"
                  value={offerName}
                  onChange={(event) => setOfferName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Channel *</label>
                <select
                  value={offerChannel}
                  onChange={(event) => setOfferChannel(event.target.value as OfferChannel)}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                >
                  <option value="whatsapp">whatsapp</option>
                  <option value="sms">sms</option>
                  <option value="email">email</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Coupon Code</label>
                <input
                  type="text"
                  value={offerCouponCode}
                  onChange={(event) => setOfferCouponCode(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Discount Label</label>
                <input
                  type="text"
                  value={offerDiscountLabel}
                  onChange={(event) => setOfferDiscountLabel(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Message *</label>
                <textarea
                  value={offerMessage}
                  onChange={(event) => setOfferMessage(event.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
                />
              </div>
              {offerError && <p className="text-xs text-rose-600">{offerError}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOfferModalOpen(false);
                  setOfferError(null);
                }}
                className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingOffer}
                onClick={() => void handleSaveOffer()}
                className="rounded-full bg-[#1f7a6b] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70 hover:bg-[#176154]"
              >
                {isSendingOffer ? "Sending..." : "Send Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CrmSectionShell>
  );
}
