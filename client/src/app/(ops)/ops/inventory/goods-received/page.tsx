"use client";

import { useEffect, useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import { createGoodsReceivedId, formatCurrency, formatDate, inventoryGoodsReceived, inventoryItems, inventorySuppliers } from "@/lib/inventory/minimalInventoryMock";
import { createGoodsReceivedWithFallback, loadGoodsReceived, loadInventoryItems, loadInventorySuppliers } from "@/lib/inventory/inventoryDataSource";
import type { InventoryGoodsReceived } from "@/types/inventory";

type StatusFilter = "all" | InventoryGoodsReceived["status"];
type SortBy = "newest" | "oldest" | "supplier" | "value";
type FormState = { supplierId: string; itemId: string; quantity: string; cost: string; status: "draft" | "received"; receivedDate: string };
const today = () => new Date().toISOString().slice(0, 10);
const defaultForm: FormState = { supplierId: "", itemId: "", quantity: "", cost: "", status: "draft", receivedDate: today() };

export default function Page() {
  const [rows, setRows] = useState<InventoryGoodsReceived[]>(inventoryGoodsReceived.map((entry) => ({ ...entry, receivedItems: entry.receivedItems.map((item) => ({ ...item })) })));
  const [suppliers, setSuppliers] = useState(inventorySuppliers.map((entry) => ({ ...entry })));
  const [items, setItems] = useState(inventoryItems.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getValue = (entry: InventoryGoodsReceived) => entry.receivedItems.reduce((sum, item) => sum + item.cost, 0);

  const filtered = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    const base = rows.filter((entry) => {
      const itemNames = entry.receivedItems.map((item) => item.itemName).join(" ").toLowerCase();
      const matchesSearch = normalized.length === 0 || entry.grnNumber.toLowerCase().includes(normalized) || entry.supplierName.toLowerCase().includes(normalized) || itemNames.includes(normalized);
      const matchesSupplier = supplierFilter === "all" || entry.supplierId === supplierFilter;
      const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
      return matchesSearch && matchesSupplier && matchesStatus;
    });
    return [...base].sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
      if (sortBy === "supplier") return a.supplierName.localeCompare(b.supplierName);
      if (sortBy === "value") return getValue(b) - getValue(a);
      return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
    });
  }, [rows, searchText, supplierFilter, statusFilter, sortBy]);

  const kpis = useMemo(() => {
    const todayKey = today();
    const receivedToday = rows.filter((entry) => entry.receivedAt.slice(0, 10) === todayKey).length;
    const receivedValue = rows.reduce((sum, entry) => sum + getValue(entry), 0);
    const suppliersReceived = new Set(rows.map((entry) => entry.supplierId)).size;
    return [
      { label: "GRNs", value: rows.length },
      { label: "Received Today", value: receivedToday },
      { label: "Received Value", value: formatCurrency(receivedValue) },
      { label: "Suppliers Received", value: suppliersReceived },
    ];
  }, [rows]);

  const addGrn = async () => {
    setErrorMessage(null);
    const supplier = suppliers.find((entry) => entry.id === form.supplierId);
    const item = items.find((entry) => entry.id === form.itemId);
    if (!supplier) return setErrorMessage("Supplier is required.");
    if (!item) return setErrorMessage("Item is required.");

    const quantity = Number(form.quantity);
    if (Number.isNaN(quantity) || quantity <= 0) return setErrorMessage("Quantity must be greater than 0.");
    const cost = Number(form.cost);
    if (Number.isNaN(cost) || cost < 0) return setErrorMessage("Cost must be 0 or greater.");

    const isoDate = new Date(`${form.receivedDate}T09:00:00.000Z`).toISOString();
    const next: InventoryGoodsReceived = {
      id: createGoodsReceivedId(),
      grnNumber: `GRN-2026-${String(rows.length + 103).padStart(3, "0")}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      receivedItems: [{ itemId: item.id, itemName: item.name, quantity, unit: item.unit, cost }],
      status: form.status,
      receivedAt: isoDate,
      createdAt: new Date().toISOString(),
    };

    const result = await createGoodsReceivedWithFallback(next);
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setRows((prev) => [result.data, ...prev]);
    setForm({ ...defaultForm, receivedDate: today() });
    setIsModalOpen(false);
    setSuccessMessage(form.status === "received" ? "GRN saved. Use Stock In page to update inventory stock." : "GRN draft saved.");
  };

  return (
    <div className="space-y-6">
      <OpsSection title="Goods Received" description="Record supplier deliveries and goods received notes." action={<div className="flex flex-wrap gap-2"><OpsActionButton label="Purchase Orders" href="/admin/inventory/purchase-orders" tone="ghost" /><OpsActionButton label="Stock In" href="/admin/inventory/stock-in" tone="ghost" /><OpsActionButton label="Vendor Bills" href="/admin/inventory/vendor-bills" /></div>}>
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="GRN Register" description="Capture local goods receipt entries.">
        {isLoading && <p className="mb-3 text-sm text-[#6b6b6b]">Loading inventory data...</p>}
        {showFallbackBanner && <p className="mb-3 text-sm text-amber-700">Showing mock inventory data because backend is unavailable.</p>}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-4 xl:max-w-5xl"><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search by GRN, supplier, item" className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm" /><select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="all">All Suppliers</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="all">All Status</option><option value="draft">Draft</option><option value="received">Received</option></select><select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="supplier">Supplier</option><option value="value">Value</option></select></div>
          <button type="button" onClick={() => setIsModalOpen(true)} className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white">Add GRN</button>
        </div>

        {errorMessage && <p className="mb-3 text-sm text-rose-700">{errorMessage}</p>}
        {successMessage && <p className="mb-3 text-sm text-emerald-700">{successMessage}</p>}

        <OpsTable columns={[{ key: "grn", label: "GRN Number" }, { key: "supplier", label: "Supplier" }, { key: "items", label: "Items" }, { key: "value", label: "Total Value" }, { key: "status", label: "Status" }, { key: "received", label: "Received At" }, { key: "actions", label: "Actions" }]} rows={filtered.map((entry) => ({ id: entry.id, cells: { grn: entry.grnNumber, supplier: entry.supplierName, items: entry.receivedItems.map((item) => `${item.itemName} (${item.quantity} ${item.unit})`).join(", "), value: formatCurrency(getValue(entry)), status: entry.status, received: formatDate(entry.receivedAt), actions: <OpsActionButton label="Open Stock In" href="/admin/inventory/stock-in" tone="ghost" /> } }))} emptyLabel="No goods received entries found." />
      </OpsSection>

      {isModalOpen && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"><div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl"><h3 className="text-lg font-semibold text-[#2a2927]">Add GRN</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Supplier *</span><select value={form.supplierId} onChange={(event) => setForm((prev) => ({ ...prev, supplierId: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="">Select Supplier</option>{inventorySuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Item *</span><select value={form.itemId} onChange={(event) => setForm((prev) => ({ ...prev, itemId: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="">Select Item</option>{inventoryItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Quantity *</span><input type="number" min={0} step="0.01" value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Cost *</span><input type="number" min={0} step="0.01" value={form.cost} onChange={(event) => setForm((prev) => ({ ...prev, cost: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Status</span><select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as "draft" | "received" }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="draft">Draft</option><option value="received">Received</option></select></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Received Date</span><input type="date" value={form.receivedDate} onChange={(event) => setForm((prev) => ({ ...prev, receivedDate: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-[#d8d2c7] px-4 py-2 text-sm">Cancel</button><button type="button" onClick={addGrn} className="rounded-full bg-[#2a2927] px-4 py-2 text-sm font-semibold text-white">Save</button></div></div></div>}
    </div>
  );
}

