"use client";

import { useEffect, useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import { createPurchaseRequestId, formatDate, inventoryItems, inventoryPurchaseRequests } from "@/lib/inventory/minimalInventoryMock";
import {
  createPurchaseRequestWithFallback,
  loadInventoryItems,
  loadPurchaseRequests,
  updatePurchaseRequestStatusWithFallback,
} from "@/lib/inventory/inventoryDataSource";
import type { InventoryPurchaseRequest } from "@/types/inventory";

type StatusFilter = "all" | InventoryPurchaseRequest["status"];
type SortBy = "newest" | "oldest" | "item" | "quantity";
type FormState = { itemId: string; quantity: string; status: "draft" | "submitted" | "approved" };
const defaultForm: FormState = { itemId: "", quantity: "", status: "draft" };

export default function Page() {
  const [rows, setRows] = useState<InventoryPurchaseRequest[]>(inventoryPurchaseRequests.map((entry) => ({ ...entry })));
  const [items, setItems] = useState(inventoryItems.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      const [requestResult, itemResult] = await Promise.all([loadPurchaseRequests(), loadInventoryItems()]);
      if (!mounted) return;
      setRows(requestResult.data);
      setItems(itemResult.data);
      setShowFallbackBanner(requestResult.usedMockFallback || itemResult.usedMockFallback);
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
      const matchesSearch = normalized.length === 0 || entry.requestNumber.toLowerCase().includes(normalized) || entry.itemName.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    return [...base].sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "item") return a.itemName.localeCompare(b.itemName);
      if (sortBy === "quantity") return b.quantity - a.quantity;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [rows, searchText, statusFilter, sortBy]);

  const kpis = useMemo(() => {
    const count = (status: InventoryPurchaseRequest["status"]) => rows.filter((entry) => entry.status === status).length;
    return [
      { label: "Total Requests", value: rows.length },
      { label: "Draft", value: count("draft") },
      { label: "Submitted", value: count("submitted") },
      { label: "Approved", value: count("approved") },
      { label: "Ordered", value: count("ordered") },
    ];
  }, [rows]);

  const setStatus = async (id: string, status: InventoryPurchaseRequest["status"]) => {
    const existing = rows.find((entry) => entry.id === id);
    if (!existing) return;
    const result = await updatePurchaseRequestStatusWithFallback(id, { status }, existing);
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setRows((prev) => prev.map((entry) => (entry.id === id ? result.data : entry)));
    setSuccessMessage(`Request marked ${status.replace("_", " ")}.`);
    setErrorMessage(null);
  };

  const addRequest = async () => {
    setErrorMessage(null);
    const item = items.find((entry) => entry.id === form.itemId);
    if (!item) return setErrorMessage("Item is required.");
    const quantity = Number(form.quantity);
    if (Number.isNaN(quantity) || quantity <= 0) return setErrorMessage("Quantity must be greater than 0.");

    const result = await createPurchaseRequestWithFallback({
      id: createPurchaseRequestId(),
      requestNumber: `PR-2026-${String(rows.length + 55).padStart(3, "0")}`,
      itemId: item.id,
      itemName: item.name,
      quantity,
      unit: item.unit,
      status: form.status,
      createdAt: new Date().toISOString(),
    });
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setRows((prev) => [result.data, ...prev]);
    setIsModalOpen(false);
    setForm({ ...defaultForm });
    setSuccessMessage("Purchase request added.");
  };

  return (
    <div className="space-y-6">
      <OpsSection
        title="Purchase Requests"
        description="Create simple purchase requests for inventory replenishment."
        action={<div className="flex flex-wrap gap-2"><OpsActionButton label="Reorder Alerts" href="/admin/inventory/reorder-alerts" tone="ghost" /><OpsActionButton label="Purchase Orders" href="/admin/inventory/purchase-orders" /></div>}
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Requests" description="Track local request status from draft to ordered.">
        {isLoading && <p className="mb-3 text-sm text-[#6b6b6b]">Loading inventory data...</p>}
        {showFallbackBanner && <p className="mb-3 text-sm text-amber-700">Showing mock inventory data because backend is unavailable.</p>}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-4 xl:max-w-5xl">
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search by request number or item" className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="all">All Status</option><option value="draft">Draft</option><option value="submitted">Submitted</option><option value="approved">Approved</option><option value="ordered">Ordered</option></select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="item">Item</option><option value="quantity">Quantity</option></select>
          </div>
          <button type="button" onClick={() => setIsModalOpen(true)} className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white">Add Purchase Request</button>
        </div>

        {errorMessage && <p className="mb-3 text-sm text-rose-700">{errorMessage}</p>}
        {successMessage && <p className="mb-3 text-sm text-emerald-700">{successMessage}</p>}

        <OpsTable columns={[{ key: "no", label: "Request No." }, { key: "item", label: "Item" }, { key: "qty", label: "Quantity" }, { key: "unit", label: "Unit" }, { key: "status", label: "Status" }, { key: "created", label: "Created At" }, { key: "actions", label: "Actions" }]} rows={filtered.map((entry) => ({ id: entry.id, cells: { no: entry.requestNumber, item: entry.itemName, qty: entry.quantity, unit: entry.unit, status: entry.status.replace("_", " "), created: formatDate(entry.createdAt), actions: <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setStatus(entry.id, "submitted")} className="text-xs font-semibold text-[#1f7a6b] hover:underline">Mark Submitted</button><button type="button" onClick={() => setStatus(entry.id, "approved")} className="text-xs font-semibold text-[#1f7a6b] hover:underline">Mark Approved</button><OpsActionButton label="Create PO" href="/admin/inventory/purchase-orders" tone="ghost" /></div> } }))} emptyLabel="No purchase requests found." />
      </OpsSection>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl"><h3 className="text-lg font-semibold text-[#2a2927]">Add Purchase Request</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-sm md:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Item *</span><select value={form.itemId} onChange={(event) => setForm((prev) => ({ ...prev, itemId: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="">Select Item</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Quantity *</span><input type="number" min={0} step="0.01" value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Status</span><select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as "draft" | "submitted" | "approved" }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="draft">Draft</option><option value="submitted">Submitted</option><option value="approved">Approved</option></select></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-[#d8d2c7] px-4 py-2 text-sm">Cancel</button><button type="button" onClick={addRequest} className="rounded-full bg-[#2a2927] px-4 py-2 text-sm font-semibold text-white">Save</button></div></div></div>
      )}
    </div>
  );
}

