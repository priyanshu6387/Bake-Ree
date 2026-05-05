"use client";

import { useEffect, useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import { createPurchaseOrderId, formatCurrency, formatDate, inventoryPurchaseOrders, inventorySuppliers } from "@/lib/inventory/minimalInventoryMock";
import {
  createPurchaseOrderWithFallback,
  loadPurchaseOrders,
  loadInventorySuppliers,
  updatePurchaseOrderStatusWithFallback,
} from "@/lib/inventory/inventoryDataSource";
import type { InventoryPurchaseOrder } from "@/types/inventory";

type StatusFilter = "all" | InventoryPurchaseOrder["status"];
type SortBy = "newest" | "oldest" | "highest_value" | "supplier";
type FormState = { supplierId: string; totalAmount: string; status: InventoryPurchaseOrder["status"] };
const defaultForm: FormState = { supplierId: "", totalAmount: "", status: "draft" };

export default function Page() {
  const [rows, setRows] = useState<InventoryPurchaseOrder[]>(inventoryPurchaseOrders.map((entry) => ({ ...entry })));
  const [suppliers, setSuppliers] = useState(inventorySuppliers.map((entry) => ({ ...entry })));
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

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      const [orderResult, supplierResult] = await Promise.all([loadPurchaseOrders(), loadInventorySuppliers()]);
      if (!mounted) return;
      setRows(orderResult.data);
      setSuppliers(supplierResult.data);
      setShowFallbackBanner(orderResult.usedMockFallback || supplierResult.usedMockFallback);
      setIsLoading(false);
    };
    void loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    const base = rows.filter((entry) => {
      const matchesSearch = normalized.length === 0 || entry.poNumber.toLowerCase().includes(normalized) || entry.supplierName.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
      const matchesSupplier = supplierFilter === "all" || entry.supplierId === supplierFilter;
      return matchesSearch && matchesStatus && matchesSupplier;
    });
    return [...base].sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "highest_value") return b.totalAmount - a.totalAmount;
      if (sortBy === "supplier") return a.supplierName.localeCompare(b.supplierName);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [rows, searchText, statusFilter, supplierFilter, sortBy]);

  const kpis = useMemo(() => {
    const count = (status: InventoryPurchaseOrder["status"]) => rows.filter((entry) => entry.status === status).length;
    const openValue = rows.filter((entry) => entry.status !== "received" && entry.status !== "closed").reduce((sum, entry) => sum + entry.totalAmount, 0);
    return [
      { label: "Total POs", value: rows.length },
      { label: "Sent", value: count("sent") },
      { label: "Partially Received", value: count("partially_received") },
      { label: "Received", value: count("received") },
      { label: "Open PO Value", value: formatCurrency(openValue) },
    ];
  }, [rows]);

  const markStatus = async (id: string, status: InventoryPurchaseOrder["status"]) => {
    const existing = rows.find((entry) => entry.id === id);
    if (!existing) return;
    const result = await updatePurchaseOrderStatusWithFallback(id, { status }, existing);
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setRows((prev) => prev.map((entry) => (entry.id === id ? result.data : entry)));
    setSuccessMessage(`PO marked ${status.replace("_", " ")}.`);
    setErrorMessage(null);
  };

  const addPo = async () => {
    setErrorMessage(null);
    const supplier = suppliers.find((entry) => entry.id === form.supplierId);
    if (!supplier) return setErrorMessage("Supplier is required.");
    const totalAmount = Number(form.totalAmount);
    if (Number.isNaN(totalAmount) || totalAmount < 0) return setErrorMessage("Total amount must be 0 or greater.");

    const result = await createPurchaseOrderWithFallback({
      id: createPurchaseOrderId(),
      poNumber: `PO-2026-${String(rows.length + 305).padStart(3, "0")}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      status: form.status,
      totalAmount,
      createdAt: new Date().toISOString(),
    });
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setRows((prev) => [result.data, ...prev]);
    setForm({ ...defaultForm });
    setIsModalOpen(false);
    setSuccessMessage("Purchase order added.");
  };

  return (
    <div className="space-y-6">
      <OpsSection title="Purchase Orders" description="Manage supplier orders for bakery ingredients and packaging." action={<div className="flex flex-wrap gap-2"><OpsActionButton label="Purchase Requests" href="/admin/inventory/purchase-requests" tone="ghost" /><OpsActionButton label="Goods Received" href="/admin/inventory/goods-received" tone="ghost" /><OpsActionButton label="Vendor Bills" href="/admin/inventory/vendor-bills" /></div>}>
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Orders" description="Track local PO status and value.">
        {isLoading && <p className="mb-3 text-sm text-[#6b6b6b]">Loading inventory data...</p>}
        {showFallbackBanner && <p className="mb-3 text-sm text-amber-700">Showing mock inventory data because backend is unavailable.</p>}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-4 xl:max-w-5xl">
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search by PO number or supplier" className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="all">All Status</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="partially_received">Partially Received</option><option value="received">Received</option><option value="closed">Closed</option></select>
            <select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="all">All Suppliers</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="highest_value">Highest Value</option><option value="supplier">Supplier</option></select>
          </div>
          <button type="button" onClick={() => setIsModalOpen(true)} className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white">Add PO</button>
        </div>

        {errorMessage && <p className="mb-3 text-sm text-rose-700">{errorMessage}</p>}
        {successMessage && <p className="mb-3 text-sm text-emerald-700">{successMessage}</p>}

        <OpsTable columns={[{ key: "no", label: "PO Number" }, { key: "supplier", label: "Supplier" }, { key: "status", label: "Status" }, { key: "amount", label: "Total Amount" }, { key: "created", label: "Created At" }, { key: "actions", label: "Actions" }]} rows={filtered.map((entry) => ({ id: entry.id, cells: { no: entry.poNumber, supplier: entry.supplierName, status: entry.status.replace("_", " "), amount: formatCurrency(entry.totalAmount), created: formatDate(entry.createdAt), actions: <div className="flex flex-wrap gap-2"><button type="button" onClick={() => markStatus(entry.id, "sent")} className="text-xs font-semibold text-[#1f7a6b] hover:underline">Mark Sent</button><button type="button" onClick={() => markStatus(entry.id, "received")} className="text-xs font-semibold text-[#1f7a6b] hover:underline">Mark Received</button><OpsActionButton label="Receive Goods" href="/admin/inventory/goods-received" tone="ghost" /></div> } }))} emptyLabel="No purchase orders found." />
      </OpsSection>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl"><h3 className="text-lg font-semibold text-[#2a2927]">Add Purchase Order</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-sm md:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Supplier *</span><select value={form.supplierId} onChange={(event) => setForm((prev) => ({ ...prev, supplierId: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="">Select Supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Total Amount *</span><input type="number" min={0} step="0.01" value={form.totalAmount} onChange={(event) => setForm((prev) => ({ ...prev, totalAmount: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Status</span><select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as InventoryPurchaseOrder["status"] }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="draft">Draft</option><option value="sent">Sent</option><option value="partially_received">Partially Received</option><option value="received">Received</option><option value="closed">Closed</option></select></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-[#d8d2c7] px-4 py-2 text-sm">Cancel</button><button type="button" onClick={addPo} className="rounded-full bg-[#2a2927] px-4 py-2 text-sm font-semibold text-white">Save</button></div></div></div>
      )}
    </div>
  );
}

