"use client";

import { useEffect, useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import { createPurchaseReturnId, formatCurrency, formatDate, inventoryItems, inventoryPurchaseReturns, inventorySuppliers } from "@/lib/inventory/minimalInventoryMock";
import { createPurchaseReturnWithFallback, loadInventoryItems, loadInventorySuppliers, loadPurchaseReturns, updatePurchaseReturnStatusWithFallback } from "@/lib/inventory/inventoryDataSource";
import type { InventoryPurchaseReturn } from "@/types/inventory";

type StatusFilter = "all" | InventoryPurchaseReturn["status"];
type SortBy = "newest" | "oldest" | "highest_value" | "supplier";
type FormState = { supplierId: string; itemId: string; quantity: string; reason: string; value: string; status: InventoryPurchaseReturn["status"] };
const defaultForm: FormState = { supplierId: "", itemId: "", quantity: "", reason: "", value: "", status: "draft" };

export default function Page() {
  const [rows, setRows] = useState<InventoryPurchaseReturn[]>(inventoryPurchaseReturns.map((entry) => ({ ...entry })));
  const [suppliers, setSuppliers] = useState(inventorySuppliers.map((entry) => ({ ...entry })));
  const [items, setItems] = useState(inventoryItems.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    const base = rows.filter((entry) => {
      const matchesSearch = normalized.length === 0 || entry.returnNumber.toLowerCase().includes(normalized) || entry.supplierName.toLowerCase().includes(normalized) || entry.itemName.toLowerCase().includes(normalized) || entry.reason.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
      const matchesSupplier = supplierFilter === "all" || entry.supplierId === supplierFilter;
      return matchesSearch && matchesStatus && matchesSupplier;
    });
    return [...base].sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "highest_value") return b.value - a.value;
      if (sortBy === "supplier") return a.supplierName.localeCompare(b.supplierName);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [rows, searchText, statusFilter, supplierFilter, sortBy]);

  const kpis = useMemo(() => {
    const sent = rows.filter((entry) => entry.status === "sent").length;
    const settled = rows.filter((entry) => entry.status === "settled").length;
    const value = rows.reduce((sum, entry) => sum + entry.value, 0);
    return [
      { label: "Purchase Returns", value: rows.length },
      { label: "Sent Returns", value: sent },
      { label: "Settled Returns", value: settled },
      { label: "Return Value", value: formatCurrency(value) },
    ];
  }, [rows]);

  const addReturn = async () => {
    setErrorMessage(null);
    const supplier = suppliers.find((entry) => entry.id === form.supplierId);
    const item = items.find((entry) => entry.id === form.itemId);
    if (!supplier) return setErrorMessage("Supplier is required.");
    if (!item) return setErrorMessage("Item is required.");

    const quantity = Number(form.quantity);
    if (Number.isNaN(quantity) || quantity <= 0) return setErrorMessage("Quantity must be greater than 0.");
    if (!form.reason.trim()) return setErrorMessage("Reason is required.");
    const value = Number(form.value);
    if (Number.isNaN(value) || value < 0) return setErrorMessage("Value must be 0 or greater.");

    const next: InventoryPurchaseReturn = {
      id: createPurchaseReturnId(),
      returnNumber: `PRTN-2026-${String(rows.length + 42).padStart(2, "0")}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemId: item.id,
      itemName: item.name,
      quantity,
      unit: item.unit,
      reason: form.reason.trim(),
      value,
      status: form.status,
      createdAt: new Date().toISOString(),
    };

    const result = await createPurchaseReturnWithFallback(next);
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setRows((prev) => [result.data, ...prev]);
    setForm({ ...defaultForm });
    setIsModalOpen(false);
    setSuccessMessage("Purchase return added. Stock is not updated here.");
  };

  return (
    <div className="space-y-6">
      <OpsSection title="Purchase Returns" description="Track returned goods, supplier credits, and rejected purchases." action={<div className="flex flex-wrap gap-2"><OpsActionButton label="Returns to Vendor" href="/admin/inventory/returns" tone="ghost" /><OpsActionButton label="Vendors" href="/admin/inventory/vendors" /></div>}>
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Returns Register" description="Record supplier returns in local state.">
        {isLoading && <p className="mb-3 text-sm text-[#6b6b6b]">Loading inventory data...</p>}
        {showFallbackBanner && <p className="mb-3 text-sm text-amber-700">Showing mock inventory data because backend is unavailable.</p>}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-4 xl:max-w-5xl"><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search by return number, supplier, item, reason" className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="all">All Status</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="settled">Settled</option></select><select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="all">All Suppliers</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select><select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="highest_value">Highest Value</option><option value="supplier">Supplier</option></select></div><button type="button" onClick={() => setIsModalOpen(true)} className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white">Add Purchase Return</button></div>

        {errorMessage && <p className="mb-3 text-sm text-rose-700">{errorMessage}</p>}
        {successMessage && <p className="mb-3 text-sm text-emerald-700">{successMessage}</p>}

        <OpsTable columns={[{ key: "number", label: "Return Number" }, { key: "supplier", label: "Supplier" }, { key: "item", label: "Item" }, { key: "quantity", label: "Quantity" }, { key: "value", label: "Value" }, { key: "status", label: "Status" }, { key: "created", label: "Created At" }, { key: "reason", label: "Reason" }]} rows={filtered.map((entry) => ({ id: entry.id, cells: { number: entry.returnNumber, supplier: entry.supplierName, item: entry.itemName, quantity: `${entry.quantity} ${entry.unit}`, value: formatCurrency(entry.value), status: entry.status, created: formatDate(entry.createdAt), reason: entry.reason } }))} emptyLabel="No purchase returns found." />
      </OpsSection>

      {isModalOpen && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"><div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl"><h3 className="text-lg font-semibold text-[#2a2927]">Add Purchase Return</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Supplier *</span><select value={form.supplierId} onChange={(event) => setForm((prev) => ({ ...prev, supplierId: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="">Select Supplier</option>{inventorySuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Item *</span><select value={form.itemId} onChange={(event) => setForm((prev) => ({ ...prev, itemId: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="">Select Item</option>{inventoryItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Quantity *</span><input type="number" min={0} step="0.01" value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Value *</span><input type="number" min={0} step="0.01" value={form.value} onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label><label className="text-sm md:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Reason *</span><input value={form.reason} onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label><label className="text-sm md:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Status</span><select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as InventoryPurchaseReturn["status"] }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="draft">Draft</option><option value="sent">Sent</option><option value="settled">Settled</option></select></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-[#d8d2c7] px-4 py-2 text-sm">Cancel</button><button type="button" onClick={addReturn} className="rounded-full bg-[#2a2927] px-4 py-2 text-sm font-semibold text-white">Save</button></div></div></div>}
    </div>
  );
}

