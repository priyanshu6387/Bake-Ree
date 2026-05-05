"use client";

import { useEffect, useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import { createVendorPaymentId, formatCurrency, formatDate, inventoryVendorBills, inventoryVendorPayments } from "@/lib/inventory/minimalInventoryMock";
import { createVendorPaymentWithFallback, loadInventorySuppliers, loadVendorBills, loadVendorPayments } from "@/lib/inventory/inventoryDataSource";
import type { InventoryVendorPayment } from "@/types/inventory";

type MethodFilter = "all" | InventoryVendorPayment["method"];
type SortBy = "newest" | "oldest" | "highest_amount" | "supplier";
type FormState = { billId: string; amount: string; method: InventoryVendorPayment["method"]; paidAt: string; status: InventoryVendorPayment["status"] };
const today = () => new Date().toISOString().slice(0, 10);
const defaultForm: FormState = { billId: "", amount: "", method: "bank", paidAt: today(), status: "recorded" };

export default function Page() {
  const [rows, setRows] = useState<InventoryVendorPayment[]>(inventoryVendorPayments.map((entry) => ({ ...entry })));
  const [bills, setBills] = useState(inventoryVendorBills.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supplierOptions = useMemo(() => Array.from(new Set(rows.map((entry) => JSON.stringify({ id: entry.supplierId, name: entry.supplierName })))).map((raw) => JSON.parse(raw) as { id: string; name: string }), [rows]);

  const selectedBill = useMemo(() => bills.find((entry) => entry.id === form.billId), [form.billId, bills]);

  const filtered = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    const base = rows.filter((entry) => {
      const matchesSearch = normalized.length === 0 || entry.paymentNumber.toLowerCase().includes(normalized) || entry.billNumber.toLowerCase().includes(normalized) || entry.supplierName.toLowerCase().includes(normalized);
      const matchesMethod = methodFilter === "all" || entry.method === methodFilter;
      const matchesSupplier = supplierFilter === "all" || entry.supplierId === supplierFilter;
      return matchesSearch && matchesMethod && matchesSupplier;
    });
    return [...base].sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime();
      if (sortBy === "highest_amount") return b.amount - a.amount;
      if (sortBy === "supplier") return a.supplierName.localeCompare(b.supplierName);
      return new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime();
    });
  }, [rows, searchText, methodFilter, supplierFilter, sortBy]);

  const kpis = useMemo(() => {
    const total = rows.reduce((sum, entry) => sum + entry.amount, 0);
    const cash = rows.filter((entry) => entry.method === "cash").reduce((sum, entry) => sum + entry.amount, 0);
    const bankUpi = rows.filter((entry) => entry.method === "bank" || entry.method === "upi").reduce((sum, entry) => sum + entry.amount, 0);
    return [
      { label: "Total Payments", value: rows.length },
      { label: "Paid Amount", value: formatCurrency(total) },
      { label: "Cash Payments", value: formatCurrency(cash) },
      { label: "Bank/UPI Payments", value: formatCurrency(bankUpi) },
    ];
  }, [rows]);

  const addPayment = async () => {
    setErrorMessage(null);
    const bill = bills.find((entry) => entry.id === form.billId);
    if (!bill) return setErrorMessage("Bill is required.");
    const amount = Number(form.amount);
    if (Number.isNaN(amount) || amount <= 0) return setErrorMessage("Amount must be greater than 0.");

    const next: InventoryVendorPayment = {
      id: createVendorPaymentId(),
      paymentNumber: `PAY-2026-${String(rows.length + 203).padStart(3, "0")}`,
      billId: bill.id,
      billNumber: bill.billNumber,
      supplierId: bill.supplierId,
      supplierName: bill.supplierName,
      amount,
      method: form.method,
      paidAt: new Date(`${form.paidAt}T09:00:00.000Z`).toISOString(),
      status: form.status,
    };

    const result = await createVendorPaymentWithFallback(next);
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setRows((prev) => [result.data, ...prev]);
    setForm({ ...defaultForm, paidAt: today() });
    setIsModalOpen(false);
    setSuccessMessage("Vendor payment recorded.");
  };

  return (
    <div className="space-y-6">
      <OpsSection title="Vendor Payments" description="Record vendor payment entries for inventory purchases." action={<div className="flex flex-wrap gap-2"><OpsActionButton label="Vendor Bills" href="/admin/inventory/vendor-bills" tone="ghost" /><OpsActionButton label="Vendors" href="/admin/inventory/vendors" /></div>}>
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Payments" description="Maintain vendor payment records without accounting integration.">
        {isLoading && <p className="mb-3 text-sm text-[#6b6b6b]">Loading inventory data...</p>}
        {showFallbackBanner && <p className="mb-3 text-sm text-amber-700">Showing mock inventory data because backend is unavailable.</p>}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-4 xl:max-w-5xl"><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search by payment number, bill, supplier" className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm" /><select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value as MethodFilter)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="all">All Methods</option><option value="cash">Cash</option><option value="bank">Bank</option><option value="upi">UPI</option></select><select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="all">All Suppliers</option>{supplierOptions.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select><select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="highest_amount">Highest Amount</option><option value="supplier">Supplier</option></select></div><button type="button" onClick={() => setIsModalOpen(true)} className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white">Add Payment</button></div>

        {errorMessage && <p className="mb-3 text-sm text-rose-700">{errorMessage}</p>}
        {successMessage && <p className="mb-3 text-sm text-emerald-700">{successMessage}</p>}

        <OpsTable columns={[{ key: "payment", label: "Payment Number" }, { key: "bill", label: "Bill" }, { key: "supplier", label: "Supplier" }, { key: "amount", label: "Amount" }, { key: "method", label: "Method" }, { key: "paid", label: "Paid At" }, { key: "status", label: "Status" }]} rows={filtered.map((entry) => ({ id: entry.id, cells: { payment: entry.paymentNumber, bill: entry.billNumber, supplier: entry.supplierName, amount: formatCurrency(entry.amount), method: entry.method.toUpperCase(), paid: formatDate(entry.paidAt), status: entry.status } }))} emptyLabel="No vendor payments found." />
      </OpsSection>

      {isModalOpen && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl"><h3 className="text-lg font-semibold text-[#2a2927]">Add Vendor Payment</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-sm md:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Bill *</span><select value={form.billId} onChange={(event) => setForm((prev) => ({ ...prev, billId: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="">Select Bill</option>{bills.map((bill) => <option key={bill.id} value={bill.id}>{bill.billNumber} - {bill.supplierName}</option>)}</select></label><label className="text-sm md:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Supplier</span><input value={selectedBill?.supplierName ?? ""} readOnly className="w-full rounded-lg border border-[#e7dfd2] bg-[#faf8f4] px-3 py-2 text-[#6b6b6b]" /></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Amount *</span><input type="number" min={0} step="0.01" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Method</span><select value={form.method} onChange={(event) => setForm((prev) => ({ ...prev, method: event.target.value as InventoryVendorPayment["method"] }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="cash">Cash</option><option value="bank">Bank</option><option value="upi">UPI</option></select></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Paid At</span><input type="date" value={form.paidAt} onChange={(event) => setForm((prev) => ({ ...prev, paidAt: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Status</span><select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as InventoryVendorPayment["status"] }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="recorded">Recorded</option><option value="reconciled">Reconciled</option></select></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-[#d8d2c7] px-4 py-2 text-sm">Cancel</button><button type="button" onClick={addPayment} className="rounded-full bg-[#2a2927] px-4 py-2 text-sm font-semibold text-white">Save</button></div></div></div>}
    </div>
  );
}

