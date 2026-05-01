"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CrmSectionShell from "@/components/crm/CrmSectionShell";
import OpsBadge from "@/components/ops/OpsBadge";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import { crmCustomers, formatCurrency, formatDate } from "@/lib/crm/minimalCrmMock";
import { crmSegmentDefinitions, getCrmSegmentLabel, getSegmentCustomers } from "@/lib/crm/crmSegments";
import {
  createCrmCampaignWithFallback,
  loadCrmCampaignRecipients,
  loadCrmCampaigns,
  updateCrmCampaignStatusWithFallback,
} from "@/lib/crm/crmDataSource";
import type {
  CampaignChannel,
  CampaignStatus,
  CrmCampaign,
  CrmCampaignRecipient,
  CrmSegmentKey,
} from "@/types/crm";
type CampaignSortKey = "newest" | "oldest" | "most_recipients" | "status";

type CampaignFormState = {
  name: string;
  targetSegment: CrmSegmentKey | "";
  channel: CampaignChannel;
  message: string;
  couponCode: string;
  discountLabel: string;
  scheduledAt: string;
};

const defaultCampaignForm: CampaignFormState = {
  name: "",
  targetSegment: "",
  channel: "whatsapp",
  message: "",
  couponCode: "",
  discountLabel: "",
  scheduledAt: "",
};

const getRecipientCount = (segmentKey: CrmSegmentKey) => getSegmentCustomers(segmentKey, crmCustomers).length;

const getBestSegmentByReach = () => {
  let best = { name: crmSegmentDefinitions[0].label, count: getRecipientCount(crmSegmentDefinitions[0].key) };

  for (let index = 1; index < crmSegmentDefinitions.length; index += 1) {
    const segment = crmSegmentDefinitions[index];
    const count = getRecipientCount(segment.key);
    if (count > best.count) {
      best = { name: segment.label, count };
    }
  }

  return `${best.name} (${best.count})`;
};

const filterCampaigns = (
  campaigns: CrmCampaign[],
  searchQuery: string,
  statusFilter: "all" | CampaignStatus,
  channelFilter: "all" | CampaignChannel
) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return campaigns.filter((campaign) => {
    const statusMatch = statusFilter === "all" || campaign.status === statusFilter;
    const channelMatch = channelFilter === "all" || campaign.channel === channelFilter;

    const queryMatch =
      normalizedQuery.length === 0 ||
      campaign.name.toLowerCase().includes(normalizedQuery) ||
      getSegmentName(campaign.targetSegment).toLowerCase().includes(normalizedQuery) ||
      (campaign.couponCode ?? "").toLowerCase().includes(normalizedQuery) ||
      campaign.message.toLowerCase().includes(normalizedQuery);

    return statusMatch && channelMatch && queryMatch;
  });
};

const sortCampaigns = (campaigns: CrmCampaign[], sortKey: CampaignSortKey) => {
  const sorted = [...campaigns];
  sorted.sort((a, b) => {
    if (sortKey === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortKey === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortKey === "most_recipients") return b.recipientCount - a.recipientCount;
    return a.status.localeCompare(b.status);
  });
  return sorted;
};

const getCampaignStatusLabel = (status: CampaignStatus) => {
  if (status === "scheduled") return "Scheduled";
  if (status === "sent") return "Sent";
  return "Draft";
};

const getCampaignStatusBadgeVariant = (status: CampaignStatus) => {
  if (status === "scheduled") return "warning" as const;
  if (status === "sent") return "success" as const;
  return "neutral" as const;
};

const getChannelLabel = (channel: CampaignChannel) => {
  if (channel === "sms") return "SMS";
  if (channel === "email") return "Email";
  return "WhatsApp";
};

const getSegmentName = (segmentKey: CrmSegmentKey) => getCrmSegmentLabel(segmentKey);

const buildNewCampaign = (
  formState: CampaignFormState,
  status: CampaignStatus,
  nowIsoDate: string
): CrmCampaign => {
  const segmentKey = formState.targetSegment as CrmSegmentKey;

  return {
    id: `LOCAL-CAM-${Date.now()}`,
    name: formState.name.trim(),
    targetSegment: segmentKey,
    channel: formState.channel,
    message: formState.message.trim(),
    couponCode: formState.couponCode.trim() || undefined,
    discountLabel: formState.discountLabel.trim() || undefined,
    status,
    recipientCount: getRecipientCount(segmentKey),
    createdAt: nowIsoDate,
    scheduledAt: formState.scheduledAt ? new Date(formState.scheduledAt).toISOString() : undefined,
  };
};

const validateCampaignForm = (formState: CampaignFormState) => {
  if (!formState.name.trim()) return "Campaign name is required.";
  if (!formState.targetSegment) return "Target segment is required.";
  if (!formState.message.trim()) return "Message is required.";
  return null;
};

export default function Page() {
  const [campaigns, setCampaigns] = useState<CrmCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);
  const [formState, setFormState] = useState<CampaignFormState>(defaultCampaignForm);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [selectedPreviewSegment, setSelectedPreviewSegment] = useState<CrmSegmentKey | null>(null);
  const [previewOverride, setPreviewOverride] = useState<{
    segmentKey: CrmSegmentKey;
    segmentLabel: string;
    recipients: CrmCampaignRecipient[];
    recipientCount: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CampaignStatus>("all");
  const [channelFilter, setChannelFilter] = useState<"all" | CampaignChannel>("all");
  const [sortKey, setSortKey] = useState<CampaignSortKey>("newest");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCampaigns = async () => {
      setIsLoading(true);
      const result = await loadCrmCampaigns();
      if (!isMounted) return;
      setCampaigns(result.data);
      setShowFallbackMessage(result.apiAttempted && result.usedMockFallback);
      setIsLoading(false);
    };

    void fetchCampaigns();

    return () => {
      isMounted = false;
    };
  }, []);

  const activePreviewSegment = (formState.targetSegment || selectedPreviewSegment) as CrmSegmentKey | null;

  const previewCustomers = useMemo(() => {
    if (previewOverride) return previewOverride.recipients.slice(0, 5);
    if (!activePreviewSegment) return [];
    return getSegmentCustomers(activePreviewSegment as CrmSegmentKey, crmCustomers).slice(0, 5);
  }, [activePreviewSegment, previewOverride]);

  const previewRecipientCount = useMemo(() => {
    if (previewOverride) return previewOverride.recipientCount;
    if (!activePreviewSegment) return 0;
    return getRecipientCount(activePreviewSegment as CrmSegmentKey);
  }, [activePreviewSegment, previewOverride]);

  const visibleCampaigns = useMemo(() => {
    const filtered = filterCampaigns(campaigns, searchQuery, statusFilter, channelFilter);
    return sortCampaigns(filtered, sortKey);
  }, [campaigns, searchQuery, statusFilter, channelFilter, sortKey]);

  const kpis = useMemo(() => {
    const total = campaigns.length;
    const drafts = campaigns.filter((campaign) => campaign.status === "draft").length;
    const scheduled = campaigns.filter((campaign) => campaign.status === "scheduled").length;
    const sent = campaigns.filter((campaign) => campaign.status === "sent").length;
    const totalTargetedCustomers = campaigns.reduce((sum, campaign) => sum + campaign.recipientCount, 0);

    return [
      { label: "Total Campaigns", value: total },
      { label: "Draft Campaigns", value: drafts },
      { label: "Scheduled Campaigns", value: scheduled, tone: "warning" as const },
      { label: "Sent Campaigns", value: sent, tone: "success" as const },
      { label: "Total Targeted Customers", value: totalTargetedCustomers },
      { label: "Best Segment by Reach", value: getBestSegmentByReach() },
    ];
  }, [campaigns]);

  const handleCreateCampaign = async (status: CampaignStatus) => {
    const error = validateCampaignForm(formState);
    if (error) {
      setFormError(error);
      setSuccessMessage(null);
      return;
    }

    const nowIsoDate = new Date().toISOString();
    const localCampaignShape = buildNewCampaign(formState, status, nowIsoDate);
    const result = await createCrmCampaignWithFallback({
      name: localCampaignShape.name,
      targetSegment: localCampaignShape.targetSegment,
      channel: localCampaignShape.channel,
      message: localCampaignShape.message,
      couponCode: localCampaignShape.couponCode,
      discountLabel: localCampaignShape.discountLabel,
      status: localCampaignShape.status,
      scheduledAt: localCampaignShape.scheduledAt ?? null,
    });
    const newCampaign = result.data;

    setCampaigns((previous) => [newCampaign, ...previous]);
    setFormState(defaultCampaignForm);
    setEditingCampaignId(null);
    setFormError(null);
    setSuccessMessage(`${newCampaign.name} created as ${getCampaignStatusLabel(status)}.`);
    setPreviewOverride(null);
    if (result.apiAttempted && result.usedMockFallback) {
      setShowFallbackMessage(true);
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: CampaignStatus) => {
    const currentCampaign = campaigns.find((campaign) => campaign.id === campaignId);
    if (!currentCampaign) return;

    const result = await updateCrmCampaignStatusWithFallback(
      campaignId,
      { status, scheduledAt: status === "scheduled" ? currentCampaign.scheduledAt ?? new Date().toISOString() : null },
      currentCampaign
    );

    setCampaigns((previous) =>
      previous.map((campaign) => (campaign.id === campaignId ? result.data : campaign))
    );

    if (result.apiAttempted && result.usedMockFallback) {
      setShowFallbackMessage(true);
    }
  };

  const handleDuplicateCampaign = (campaign: CrmCampaign) => {
    // TODO: Preserve existing UX by copying to form only; direct API duplicate action can be added later.
    setFormState({
      name: `${campaign.name} Copy`,
      targetSegment: campaign.targetSegment,
      channel: campaign.channel,
      message: campaign.message,
      couponCode: campaign.couponCode ?? "",
      discountLabel: campaign.discountLabel ?? "",
      scheduledAt: campaign.scheduledAt ? campaign.scheduledAt.slice(0, 16) : "",
    });
    setEditingCampaignId(campaign.id);
    setSelectedPreviewSegment(campaign.targetSegment);
    setFormError(null);
    setSuccessMessage("Campaign copied into form. Review and save as a new campaign.");
  };

  const handleViewRecipients = async (campaign: CrmCampaign) => {
    const result = await loadCrmCampaignRecipients(campaign.id, campaign.targetSegment);
    const segmentKey = (result.data.segment.key || campaign.targetSegment) as CrmSegmentKey;
    setSelectedPreviewSegment(segmentKey);
    setFormState((prev) => ({ ...prev, targetSegment: segmentKey }));
    setPreviewOverride({
      segmentKey,
      segmentLabel: result.data.segment.label || getSegmentName(segmentKey),
      recipients: result.data.recipients,
      recipientCount: result.data.recipientCount,
    });
    if (result.apiAttempted && result.usedMockFallback) {
      setShowFallbackMessage(true);
    }
  };

  return (
    <CrmSectionShell
      title="Campaigns"
      subtitle="CRM"
      description="Create simple customer offers for bakery CRM segments."
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
          href="/admin/crm/segments"
          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
        >
          View Segments
        </Link>
        <Link
          href="/admin/crm/customers"
          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
        >
          View Customers
        </Link>
      </div>

      <OpsKpiGrid items={kpis} />

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Create Campaign</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Campaign Name</label>
            <input
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Weekend Loyalty Push"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Target Segment</label>
            <select
              value={formState.targetSegment}
              onChange={(event) => {
                const nextSegment = event.target.value as CrmSegmentKey | "";
                setFormState((prev) => ({ ...prev, targetSegment: nextSegment }));
                setSelectedPreviewSegment(nextSegment || null);
                setPreviewOverride(null);
              }}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            >
              <option value="">Select segment</option>
              {crmSegmentDefinitions.map((segment) => (
                <option key={segment.key} value={segment.key}>
                  {segment.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Channel</label>
            <select
              value={formState.channel}
              onChange={(event) => setFormState((prev) => ({ ...prev, channel: event.target.value as CampaignChannel }))}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Coupon Code</label>
            <input
              value={formState.couponCode}
              onChange={(event) => setFormState((prev) => ({ ...prev, couponCode: event.target.value }))}
              placeholder="Optional"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Discount Label</label>
            <input
              value={formState.discountLabel}
              onChange={(event) => setFormState((prev) => ({ ...prev, discountLabel: event.target.value }))}
              placeholder="15% off / Flat Rs 100"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Schedule Date/Time (Optional)</label>
            <input
              type="datetime-local"
              value={formState.scheduledAt}
              onChange={(event) => setFormState((prev) => ({ ...prev, scheduledAt: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Message</label>
            <textarea
              value={formState.message}
              onChange={(event) => setFormState((prev) => ({ ...prev, message: event.target.value }))}
              rows={4}
              placeholder="Offer message for selected segment"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            />
          </div>
        </div>

        {editingCampaignId && (
          <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            Editing duplicate source: {editingCampaignId}. Saving will create a new campaign.
          </p>
        )}

        {formError && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
        )}

        {successMessage && (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleCreateCampaign("draft")}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => void handleCreateCampaign("scheduled")}
            className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
          >
            Mark as Scheduled
          </button>
          <button
            type="button"
            onClick={() => void handleCreateCampaign("sent")}
            className="rounded-full bg-[#2a2927] px-4 py-2 text-xs font-semibold text-white"
          >
            Mark as Sent
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Recipient Preview</h3>
          <Link href="/admin/crm/segments" className="text-xs font-semibold text-[#1f7a6b] hover:underline">
            View segment
          </Link>
        </div>

        {!activePreviewSegment ? (
          <p className="mt-3 text-sm text-[#6b6b6b]">Select a target segment to preview recipients.</p>
        ) : (
          <>
            <div className="mt-3 flex items-center gap-2">
              <OpsBadge
                label={previewOverride?.segmentLabel ?? getSegmentName(activePreviewSegment as CrmSegmentKey)}
                tone="info"
              />
              <OpsBadge label={`${previewRecipientCount} recipients`} tone="neutral" />
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[760px] w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-[#8b867f]">
                    <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Name</th>
                    <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">
                      {formState.channel === "email" ? "Email" : "Phone"}
                    </th>
                    <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Total Spend</th>
                    <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Loyalty Points</th>
                  </tr>
                </thead>
                <tbody>
                  {previewCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-[#f1ebe1] text-[#2a2927]">
                      <td className="py-3 pr-4 text-xs">{customer.name}</td>
                      <td className="py-3 pr-4 text-xs">{formState.channel === "email" ? customer.email : customer.phone}</td>
                      <td className="py-3 pr-4 text-xs">{formatCurrency(customer.totalSpend)}</td>
                      <td className="py-3 pr-4 text-xs">{customer.loyaltyPoints.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Campaigns</h3>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Search</label>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Name, segment, coupon, message"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | CampaignStatus)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Channel</label>
            <select
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value as "all" | CampaignChannel)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            >
              <option value="all">All</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Sort</label>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as CampaignSortKey)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="most_recipients">Most Recipients</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
        {showFallbackMessage && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Showing mock CRM data because the backend is unavailable.
          </p>
        )}

        {isLoading ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#e8dccd] bg-[#fcf8f2] px-4 py-8 text-center text-sm text-[#6b6b6b]">
            Loading campaigns...
          </div>
        ) : visibleCampaigns.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#e8dccd] bg-[#fcf8f2] px-4 py-8 text-center text-sm text-[#6b6b6b]">
            No campaigns found for the selected filters.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1300px] w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-[#8b867f]">
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Campaign</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Target Segment</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Channel</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Coupon</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Discount</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Recipients</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Status</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Created At</th>
                  <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-[#f1ebe1] text-[#2a2927]">
                    <td className="py-3 pr-4 align-top text-xs">
                      <p className="text-sm font-semibold text-[#2a2927]">{campaign.name}</p>
                      <p className="mt-0.5 max-w-[320px] truncate text-[#6b6b6b]">{campaign.message}</p>
                    </td>
                    <td className="py-3 pr-4 align-top text-xs">{getSegmentName(campaign.targetSegment)}</td>
                    <td className="py-3 pr-4 align-top text-xs">{getChannelLabel(campaign.channel)}</td>
                    <td className="py-3 pr-4 align-top text-xs">{campaign.couponCode || "-"}</td>
                    <td className="py-3 pr-4 align-top text-xs">{campaign.discountLabel || "-"}</td>
                    <td className="py-3 pr-4 align-top text-xs">{campaign.recipientCount}</td>
                    <td className="py-3 pr-4 align-top text-xs">
                      <OpsBadge
                        label={getCampaignStatusLabel(campaign.status)}
                        tone={getCampaignStatusBadgeVariant(campaign.status)}
                      />
                    </td>
                    <td className="py-3 pr-4 align-top text-xs">{formatDate(campaign.createdAt)}</td>
                    <td className="py-3 pr-4 align-top text-xs">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void updateCampaignStatus(campaign.id, "scheduled")}
                          className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                        >
                          Mark Scheduled
                        </button>
                        <button
                          type="button"
                          onClick={() => void updateCampaignStatus(campaign.id, "sent")}
                          className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Mark Sent
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateCampaign(campaign)}
                          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleViewRecipients(campaign)}
                          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
                        >
                          View Recipients
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
