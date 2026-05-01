"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CrmSectionShell from "@/components/crm/CrmSectionShell";
import OpsBadge from "@/components/ops/OpsBadge";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsTable, { type OpsTableColumn, type OpsTableRow } from "@/components/ops/OpsTable";
import {
  calculateAverageOrderValue,
  calculateRepeatOrderRate,
  crmComplaints,
  crmCustomers,
  formatCurrency,
  formatDate,
} from "@/lib/crm/minimalCrmMock";
import { loadCrmCustomers } from "@/lib/crm/crmDataSource";
import type { ComplaintStatus, CrmCustomer } from "@/types/crm";

const quickActions = [
  { label: "View Customers", href: "/admin/crm/customers" },
  { label: "View Segments", href: "/admin/crm/segments" },
  { label: "View Complaints", href: "/admin/crm/complaints" },
  { label: "Create Campaign", href: "/admin/crm/campaigns" },
];

const customerColumns: OpsTableColumn[] = [
  { key: "name", label: "Customer" },
  { key: "status", label: "Status" },
  { key: "orders", label: "Orders" },
  { key: "spend", label: "Total Spend" },
  { key: "lastOrder", label: "Last Order" },
];

const followUpColumns: OpsTableColumn[] = [
  { key: "name", label: "Customer" },
  { key: "contact", label: "Contact" },
  { key: "lastOrder", label: "Last Order" },
  { key: "favorite", label: "Favorite Product" },
];

const complaintColumns: OpsTableColumn[] = [
  { key: "customer", label: "Customer" },
  { key: "order", label: "Order" },
  { key: "issue", label: "Issue" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created" },
];

const getCustomerTone = (status: CrmCustomer["status"]) => {
  if (status === "vip") return "success" as const;
  if (status === "inactive") return "warning" as const;
  return "info" as const;
};

const formatCustomerStatus = (status: CrmCustomer["status"]) => {
  if (status === "vip") return "VIP";
  if (status === "inactive") return "Inactive";
  return "Active";
};

const formatComplaintStatus = (status: ComplaintStatus) => {
  if (status === "in_progress") return "In Progress";
  if (status === "resolved") return "Resolved";
  return "Open";
};

const getComplaintTone = (status: ComplaintStatus) => {
  if (status === "open") return "danger" as const;
  if (status === "in_progress") return "warning" as const;
  return "success" as const;
};

export default function Page() {
  const [customers, setCustomers] = useState<CrmCustomer[]>(crmCustomers);

  useEffect(() => {
    let isMounted = true;

    const loadCustomers = async () => {
      const result = await loadCrmCustomers();
      if (!isMounted) return;
      setCustomers(result.data);
    };

    void loadCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  const openComplaints = crmComplaints.filter((complaint) => complaint.status === "open").length;
  const topCustomers = useMemo(
    () => [...customers].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5),
    [customers]
  );
  const recentCustomers = useMemo(
    () => [...customers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [customers]
  );
  const followUpCustomers = useMemo(
    () =>
      customers
        .filter((customer) => customer.needsFollowUp)
        .sort((a, b) => new Date(a.lastOrderDate).getTime() - new Date(b.lastOrderDate).getTime())
        .slice(0, 5),
    [customers]
  );
  const recentComplaints = useMemo(
    () => [...crmComplaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    []
  );

  const kpiCards = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((customer) => customer.status === "active").length;
    const inactiveCustomers = customers.filter((customer) => customer.status === "inactive").length;
    const vipCustomers = customers.filter((customer) => customer.status === "vip").length;
    const repeatOrderRate = calculateRepeatOrderRate(customers);
    const averageOrderValue = calculateAverageOrderValue(customers);
    const crmRevenue = customers.reduce((sum, customer) => sum + customer.totalSpend, 0);

    return [
      { label: "Total Customers", value: totalCustomers, tone: "neutral" },
      { label: "Active Customers", value: activeCustomers, tone: "neutral" },
      { label: "Inactive Customers", value: inactiveCustomers, tone: "neutral" },
      { label: "VIP Customers", value: vipCustomers, tone: "neutral" },
      { label: "Repeat Order Rate", value: `${repeatOrderRate}%`, tone: "positive" },
      { label: "Average Order Value", value: formatCurrency(averageOrderValue), tone: "neutral" },
      { label: "CRM Revenue", value: formatCurrency(crmRevenue), tone: "neutral" },
      { label: "Open Complaints", value: openComplaints, tone: openComplaints > 0 ? "warning" : "positive" },
    ];
  }, [customers, openComplaints]);

  const topCustomerRows: OpsTableRow[] = topCustomers.map((customer) => ({
    id: customer.id,
    cells: {
      name: customer.name,
      status: <OpsBadge label={formatCustomerStatus(customer.status)} tone={getCustomerTone(customer.status)} />,
      orders: customer.totalOrders,
      spend: formatCurrency(customer.totalSpend),
      lastOrder: formatDate(customer.lastOrderDate),
    },
  }));

  const recentCustomerRows: OpsTableRow[] = recentCustomers.map((customer) => ({
    id: customer.id,
    cells: {
      name: customer.name,
      status: <OpsBadge label={formatCustomerStatus(customer.status)} tone={getCustomerTone(customer.status)} />,
      orders: customer.totalOrders,
      spend: formatCurrency(customer.totalSpend),
      lastOrder: formatDate(customer.lastOrderDate),
    },
  }));

  const followUpRows: OpsTableRow[] = followUpCustomers.map((customer) => ({
    id: customer.id,
    cells: {
      name: customer.name,
      contact: customer.phone,
      lastOrder: formatDate(customer.lastOrderDate),
      favorite: customer.favoriteProduct,
    },
  }));

  const complaintRows: OpsTableRow[] = recentComplaints.map((complaint) => ({
    id: complaint.id,
    cells: {
      customer: complaint.customerName,
      order: complaint.orderId,
      issue: complaint.issueType,
      status: (
        <OpsBadge
          label={formatComplaintStatus(complaint.status)}
          tone={getComplaintTone(complaint.status)}
        />
      ),
      createdAt: formatDate(complaint.createdAt),
    },
  }));

  return (
    <CrmSectionShell
      title="CRM Overview"
      subtitle="CRM"
      description="Minimal customer relationship dashboard for bakery operations. Metrics and sections below are powered by shared local mock data."
    >
      <OpsKpiGrid items={kpiCards} />

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Quick Actions</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-xl border border-black/10 bg-[#fdfaf5] px-4 py-3 text-sm font-semibold text-[#2a2927] transition hover:bg-[#f7f2ea]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Top Customers</h3>
          <div className="mt-4">
            <OpsTable columns={customerColumns} rows={topCustomerRows} />
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Recent Customers</h3>
          <div className="mt-4">
            <OpsTable columns={customerColumns} rows={recentCustomerRows} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">
            Customers Needing Follow-up
          </h3>
          <div className="mt-4">
            <OpsTable columns={followUpColumns} rows={followUpRows} />
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b867f]">Recent Complaints</h3>
          <div className="mt-4">
            <OpsTable columns={complaintColumns} rows={complaintRows} />
          </div>
        </div>
      </section>
    </CrmSectionShell>
  );
}
