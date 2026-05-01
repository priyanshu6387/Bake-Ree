"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CrmSectionShell from "@/components/crm/CrmSectionShell";
import OpsBadge from "@/components/ops/OpsBadge";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import {
  crmCustomerNotes,
  crmCustomers,
  formatDate,
} from "@/lib/crm/minimalCrmMock";
import { loadCrmComplaints, updateCrmComplaintStatusWithFallback } from "@/lib/crm/crmDataSource";
import type { ComplaintStatus, CrmComplaint, CrmCustomerNote } from "@/types/crm";

type StatusFilter = "all" | ComplaintStatus;
type SortOption = "newest" | "oldest" | "customer_name" | "status";

const getComplaintStatusLabel = (status: ComplaintStatus) => {
  if (status === "in_progress") return "In Progress";
  if (status === "resolved") return "Resolved";
  return "Open";
};

const getComplaintStatusBadgeVariant = (status: ComplaintStatus) => {
  if (status === "resolved") return "success" as const;
  if (status === "in_progress") return "warning" as const;
  return "danger" as const;
};

const getIssueTypes = (complaints: CrmComplaint[]) =>
  Array.from(new Set(complaints.map((complaint) => complaint.issueType))).sort((a, b) =>
    a.localeCompare(b)
  );

const filterComplaints = (
  complaints: CrmComplaint[],
  query: string,
  statusFilter: StatusFilter,
  issueTypeFilter: string
) => {
  const normalizedQuery = query.trim().toLowerCase();

  return complaints.filter((complaint) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      complaint.id.toLowerCase().includes(normalizedQuery) ||
      complaint.customerName.toLowerCase().includes(normalizedQuery) ||
      (complaint.orderId ?? "").toLowerCase().includes(normalizedQuery) ||
      complaint.issueType.toLowerCase().includes(normalizedQuery) ||
      complaint.description.toLowerCase().includes(normalizedQuery);

    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    const matchesIssueType = issueTypeFilter === "all" || complaint.issueType === issueTypeFilter;

    return matchesQuery && matchesStatus && matchesIssueType;
  });
};

const sortComplaints = (complaints: CrmComplaint[], sortOption: SortOption) => {
  const next = [...complaints];

  next.sort((a, b) => {
    if (sortOption === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortOption === "customer_name") {
      return a.customerName.localeCompare(b.customerName);
    }
    if (sortOption === "status") {
      return getComplaintStatusLabel(a.status).localeCompare(getComplaintStatusLabel(b.status));
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return next;
};

const calculateComplaintKpis = (complaints: CrmComplaint[]) => {
  const total = complaints.length;
  const open = complaints.filter((complaint) => complaint.status === "open").length;
  const inProgress = complaints.filter((complaint) => complaint.status === "in_progress").length;
  const resolved = complaints.filter((complaint) => complaint.status === "resolved").length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonth = complaints.filter((complaint) => {
    const createdDate = new Date(complaint.createdAt);
    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
  }).length;

  return { total, open, inProgress, resolved, thisMonth };
};

const getCustomerNameById = (customerId: string) =>
  crmCustomers.find((customer) => customer.id === customerId)?.name ?? "Unknown Customer";

const getRecentNotes = (notes: CrmCustomerNote[]) =>
  [...notes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

const formatNoteType = (type: CrmCustomerNote["type"]) =>
  type === "follow_up" ? "Follow-up" : type.charAt(0).toUpperCase() + type.slice(1);

export default function Page() {
  const [complaints, setComplaints] = useState<CrmComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  useEffect(() => {
    let isMounted = true;

    const fetchComplaints = async () => {
      setIsLoading(true);
      const result = await loadCrmComplaints();
      if (!isMounted) return;
      setComplaints(result.data);
      setShowFallbackMessage(result.apiAttempted && result.usedMockFallback);
      setIsLoading(false);
    };

    void fetchComplaints();

    return () => {
      isMounted = false;
    };
  }, []);

  const issueTypes = useMemo(() => getIssueTypes(complaints), [complaints]);

  const visibleComplaints = useMemo(() => {
    const filtered = filterComplaints(complaints, searchQuery, statusFilter, issueTypeFilter);
    return sortComplaints(filtered, sortOption);
  }, [complaints, searchQuery, statusFilter, issueTypeFilter, sortOption]);

  const kpis = useMemo(() => calculateComplaintKpis(complaints), [complaints]);
  const recentNotes = useMemo(() => getRecentNotes(crmCustomerNotes), []);

  const updateComplaintStatus = async (complaintId: string, status: ComplaintStatus) => {
    const currentComplaint = complaints.find((complaint) => complaint.id === complaintId);
    if (!currentComplaint) return;

    const result = await updateCrmComplaintStatusWithFallback(
      complaintId,
      {
        status,
        resolutionNote: status === "resolved" ? "Resolved from CRM complaints page" : undefined,
      },
      currentComplaint
    );

    setComplaints((prev) =>
      prev.map((complaint) => (complaint.id === complaintId ? result.data : complaint))
    );

    if (result.apiAttempted && result.usedMockFallback) {
      setShowFallbackMessage(true);
    }
  };

  return (
    <CrmSectionShell
      title="Complaints"
      subtitle="CRM"
      description="Track customer issues, service recovery, and resolution status."
      primaryAction={{ label: "View Customers", href: "/admin/crm/customers" }}
      secondaryAction={{ label: "Back to CRM Overview", href: "/admin/crm" }}
    >
      <OpsKpiGrid
        items={[
          { label: "Total Complaints", value: kpis.total },
          { label: "Open Complaints", value: kpis.open, tone: "critical" },
          { label: "In Progress Complaints", value: kpis.inProgress, tone: "warning" },
          { label: "Resolved Complaints", value: kpis.resolved, tone: "positive" },
          { label: "Complaints This Month", value: kpis.thisMonth },
          { label: "Average Resolution Time", value: "3 days", hint: "Derived mock value" },
        ]}
      />

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2 xl:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Search</label>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Customer, complaint/order id, issue type, description"
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
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Issue Type</label>
            <select
              value={issueTypeFilter}
              onChange={(event) => setIssueTypeFilter(event.target.value)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#2a2927] outline-none ring-[#1f7a6b]/20 focus:ring-2"
            >
              <option value="all">All</option>
              {issueTypes.map((issueType) => (
                <option key={issueType} value={issueType}>
                  {issueType}
                </option>
              ))}
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
              <option value="oldest">Oldest</option>
              <option value="customer_name">Customer Name</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
        {showFallbackMessage && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Showing mock CRM data because the backend is unavailable.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Complaints</h3>

        {isLoading ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#e8dccd] bg-[#fcf8f2] px-4 py-8 text-center text-sm text-[#6b6b6b]">
            Loading complaints...
          </div>
        ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[1280px] w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-[#8b867f]">
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Complaint ID</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Customer</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Order ID</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Issue Type</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Description</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Status</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Created At</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleComplaints.map((complaint) => (
                <tr key={complaint.id} className="border-b border-[#f1ebe1] text-[#2a2927]">
                  <td className="py-3 pr-4 text-xs">{complaint.id}</td>
                  <td className="py-3 pr-4 text-xs">{complaint.customerName}</td>
                  <td className="py-3 pr-4 text-xs">{complaint.orderId ?? "-"}</td>
                  <td className="py-3 pr-4 text-xs">{complaint.issueType}</td>
                  <td className="py-3 pr-4 text-xs">{complaint.description}</td>
                  <td className="py-3 pr-4 text-xs">
                    <OpsBadge
                      label={getComplaintStatusLabel(complaint.status)}
                      tone={getComplaintStatusBadgeVariant(complaint.status)}
                    />
                  </td>
                  <td className="py-3 pr-4 text-xs">{formatDate(complaint.createdAt)}</td>
                  <td className="py-3 pr-4 text-xs">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/crm/customers/${complaint.customerId}`}
                        className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
                      >
                        View Customer
                      </Link>
                      {complaint.orderId ? (
                        <Link
                          href={`/admin/orders/${complaint.orderId}`}
                          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
                        >
                          View Order
                        </Link>
                      ) : (
                        <span className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#8b867f]">
                          No Order
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => void updateComplaintStatus(complaint.id, "in_progress")}
                        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"
                        disabled={complaint.status === "in_progress"}
                      >
                        Mark In Progress
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateComplaintStatus(complaint.id, "resolved")}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                        disabled={complaint.status === "resolved"}
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleComplaints.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-sm text-[#6b6b6b]">
                    No complaints found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">
          Recent CRM Notes
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-[#8b867f]">
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Customer</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Note</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Type</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Created By</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Created At</th>
                <th className="border-b border-[#efe5d8] pb-2 pr-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentNotes.map((note) => (
                <tr key={note.id} className="border-b border-[#f1ebe1] text-[#2a2927]">
                  <td className="py-3 pr-4 text-xs">{getCustomerNameById(note.customerId)}</td>
                  <td className="py-3 pr-4 text-xs">{note.text}</td>
                  <td className="py-3 pr-4 text-xs">
                    <OpsBadge label={formatNoteType(note.type)} tone="neutral" />
                  </td>
                  <td className="py-3 pr-4 text-xs">{note.createdBy}</td>
                  <td className="py-3 pr-4 text-xs">{formatDate(note.createdAt)}</td>
                  <td className="py-3 pr-4 text-xs">
                    <Link
                      href={`/admin/crm/customers/${note.customerId}`}
                      className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#2a2927] hover:bg-[#f7f5f0]"
                    >
                      View Customer
                    </Link>
                  </td>
                </tr>
              ))}
              {recentNotes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-[#6b6b6b]">
                    No notes available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </CrmSectionShell>
  );
}
