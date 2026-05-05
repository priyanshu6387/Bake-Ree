"use client";

import { useEffect, useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import { createVendorBillId, formatCurrency, formatDate, inventorySuppliers, inventoryVendorBills } from "@/lib/inventory/minimalInventoryMock";
import { createVendorBillWithFallback, loadInventorySuppliers, loadVendorBills, updateVendorBillStatusWithFallback } from "@/lib/inventory/inventoryDataSource";
import type { InventoryVendorBill } from "@/types/inventory";

type StatusFilter = "all" | InventoryVendorBill["status"];
type SortBy = "due_date" | "newest" | "highest_amount" | "supplier";
type FormState = { supplierId: string; billNumber: string; amount: string; status: InventoryVendorBill["status"]; dueDate: string };
const today = () => new Date().toISOString().slice(0, 10);
const defaultForm: FormState = { supplierId: "", billNumber: "", amount: "", status: "unpaid", dueDate: today() };

export default function Page() {
  const [rows, setRows] = useState<InventoryVendorBill[]>(inventoryVendorBills.map((entry) => ({ ...entry })));
  const [suppliers, setSuppliers] = useState(inventorySuppliers.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("due_date");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    const base = rows.filter((entry) => {
      const matchesSearch = normalized.length === 0 || entry.billNumber.toLowerCase().includes(normalized) || entry.supplierName.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
      const matchesSupplier = supplierFilter === "all" || entry.supplierId === supplierFilter;
      return matchesSearch && matchesStatus && matchesSupplier;
    });
    return [...base].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "highest_amount") return b.amount - a.amount;
      if (sortBy === "supplier") return a.supplierName.localeCompare(b.supplierName);
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [rows, searchText, statusFilter, supplierFilter, sortBy]);

  const kpis = useMemo(() => {
    const count = (status: InventoryVendorBill["status"]) => rows.filter((entry) => entry.status === status).length;
    const due = rows.filter((entry) => entry.status !== "paid").reduce((sum, entry) => sum + entry.amount, 0);
    return [
      { label: "Total Bills", value: rows.length },
      { label: "Unpaid", value: count("unpaid") },
      { label: "Partially Paid", value: count("partially_paid") },
      { label: "Paid", value: count("paid") },
      { label: "Amount Due", value: formatCurrency(due) },
    ];
  }, [rows]);

  const markPaid = async (id: string) => {
    const existing = rows.find((entry) => entry.id === id);
    if (!existing) return;
    const result = await updateVendorBillStatusWithFallback(id, { status: "paid" }, existing);
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setRows((prev) => prev.map((entry) => (entry.id === id ? result.data : entry)));
    setSuccessMessage("Bill marked paid.");
    setErrorMessage(null);
  };

  const addBill = async () => {
    setErrorMessage(null);
    const supplier = suppliers.find((entry) => entry.id === form.supplierId);
    if (!supplier) return setErrorMessage("Supplier is required.");
    if (!form.billNumber.trim()) return setErrorMessage("Bill number is required.");
    const amount = Number(form.amount);
    if (Number.isNaN(amount) || amount < 0) return setErrorMessage("Amount must be 0 or greater.");
    if (!form.dueDate) return setErrorMessage("Due date is required.");

    const next: InventoryVendorBill = {
      id: createVendorBillId(),
      billNumber: form.billNumber.trim(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      amount,
      status: form.status,
      dueDate: form.dueDate,
      createdAt: new Date().toISOString(),
    };

    const result = await createVendorBillWithFallback(next);
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setRows((prev) => [result.data, ...prev]);
    setForm({ ...defaultForm, dueDate: today() });
    setIsModalOpen(false);
    setSuccessMessage("Vendor bill added.");
  };

  return (
    <div className="space-y-6">
      <OpsSection title="Vendor Bills" description="Track supplier invoices and payment status." action={<div className="flex flex-wrap gap-2"><OpsActionButton label="Goods Received" href="/admin/inventory/goods-received" tone="ghost" /><OpsActionButton label="Vendor Payments" href="/admin/inventory/vendor-payments" /></div>}>
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Bills" description="Maintain payable bills in local state.">
        {isLoading && <p className="mb-3 text-sm text-[#6b6b6b]">Loading inventory data...</p>}
        {showFallbackBanner && <p className="mb-3 text-sm text-amber-700">Showing mock inventory data because backend is unavailable.</p>}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-4 xl:max-w-5xl"><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search by bill number or supplier" className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="all">All Status</option><option value="unpaid">Unpaid</option><option value="partially_paid">Partially Paid</option><option value="paid">Paid</option></select><select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="all">All Suppliers</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select><select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="due_date">Due Date</option><option value="newest">Newest</option><option value="highest_amount">Highest Amount</option><option value="supplier">Supplier</option></select></div><button type="button" onClick={() => setIsModalOpen(true)} className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white">Add Bill</button></div>

        {errorMessage && <p className="mb-3 text-sm text-rose-700">{errorMessage}</p>}
        {successMessage && <p className="mb-3 text-sm text-emerald-700">{successMessage}</p>}

        <OpsTable columns={[{ key: "bill", label: "Bill Number" }, { key: "supplier", label: "Supplier" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }, { key: "due", label: "Due Date" }, { key: "created", label: "Created At" }, { key: "actions", label: "Actions" }]} rows={filtered.map((entry) => ({ id: entry.id, cells: { bill: entry.billNumber, supplier: entry.supplierName, amount: formatCurrency(entry.amount), status: entry.status.replace("_", " "), due: formatDate(entry.dueDate), created: formatDate(entry.createdAt), actions: <div className="flex flex-wrap gap-2"><button type="button" onClick={() => markPaid(entry.id)} className="text-xs font-semibold text-[#1f7a6b] hover:underline">Mark Paid</button><OpsActionButton label="Record Payment" href="/admin/inventory/vendor-payments" tone="ghost" /></div> } }))} emptyLabel="No vendor bills found." />
      </OpsSection>

      {isModalOpen && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl"><h3 className="text-lg font-semibold text-[#2a2927]">Add Vendor Bill</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-sm md:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Supplier *</span><select value={form.supplierId} onChange={(event) => setForm((prev) => ({ ...prev, supplierId: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="">Select Supplier</option>{inventorySuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Bill Number *</span><input value={form.billNumber} onChange={(event) => setForm((prev) => ({ ...prev, billNumber: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Amount *</span><input type="number" min={0} step="0.01" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Status</span><select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as InventoryVendorBill["status"] }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="unpaid">Unpaid</option><option value="partially_paid">Partially Paid</option><option value="paid">Paid</option></select></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Due Date *</span><input type="date" value={form.dueDate} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-[#d8d2c7] px-4 py-2 text-sm">Cancel</button><button type="button" onClick={addBill} className="rounded-full bg-[#2a2927] px-4 py-2 text-sm font-semibold text-white">Save</button></div></div></div>}
    </div>
  );
}

