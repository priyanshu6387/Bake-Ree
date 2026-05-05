"use client";

import { useEffect, useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  formatDate,
  getBatchStatusClass,
  getBatchStatusLabel,
  inventoryBatches,
  inventoryItems,
} from "@/lib/inventory/minimalInventoryMock";
import {
  createBatchWithFallback,
  loadInventoryBatches,
  loadInventoryItems,
  markBatchReviewedWithFallback,
} from "@/lib/inventory/inventoryDataSource";
import type { InventoryBatch } from "@/types/inventory";

type BatchFilter = "all" | InventoryBatch["status"];
type BatchSort = "expiry_date" | "newest_received" | "item_name" | "quantity";

type BatchFormState = {
  itemId: string;
  batchNumber: string;
  quantity: string;
  expiryDate: string;
  receivedDate: string;
};

const getTodayDateValue = () => new Date().toISOString().slice(0, 10);

const defaultFormState: BatchFormState = {
  itemId: "",
  batchNumber: "",
  quantity: "",
  expiryDate: "",
  receivedDate: getTodayDateValue(),
};

export default function Page() {
  const [batches, setBatches] = useState<InventoryBatch[]>(inventoryBatches.map((batch) => ({ ...batch })));
  const [items, setItems] = useState(inventoryItems.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<BatchFilter>("all");
  const [sortBy, setSortBy] = useState<BatchSort>("expiry_date");
  const [reviewedBatchIds, setReviewedBatchIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<BatchFormState>({ ...defaultFormState });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredBatches = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    const base = batches.filter((batch) => {
      const matchesSearch =
        normalized.length === 0 ||
        batch.batchNumber.toLowerCase().includes(normalized) ||
        batch.itemName.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || batch.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const copied = base.map((entry) => ({ ...entry }));
    if (sortBy === "newest_received") {
      return copied.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
    }
    if (sortBy === "item_name") {
      return copied.sort((a, b) => a.itemName.localeCompare(b.itemName));
    }
    if (sortBy === "quantity") {
      return copied.sort((a, b) => b.quantity - a.quantity);
    }
    return copied.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [batches, searchText, sortBy, statusFilter]);

  const kpis = useMemo(() => {
    const valid = batches.filter((batch) => batch.status === "valid").length;
    const expiringSoon = batches.filter((batch) => batch.status === "expiring_soon").length;
    const expired = batches.filter((batch) => batch.status === "expired").length;
    const batchQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
    const riskItems = new Set(
      batches.filter((batch) => batch.status === "expiring_soon" || batch.status === "expired").map((batch) => batch.itemId)
    ).size;

    return [
      { label: "Total Batches", value: batches.length },
      { label: "Valid Batches", value: valid, tone: "positive" },
      { label: "Expiring Soon", value: expiringSoon, tone: "warning" },
      { label: "Expired Batches", value: expired, tone: "critical" },
      { label: "Batch Quantity", value: batchQuantity },
      { label: "Expiry Risk Items", value: riskItems, tone: "warning" },
    ];
  }, [batches]);

  const updateForm = <K extends keyof BatchFormState>(key: K, value: BatchFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const getBatchStatus = (expiryDate: string): InventoryBatch["status"] => {
    const today = new Date(getTodayDateValue());
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "expired";
    if (diffDays <= 7) return "expiring_soon";
    return "valid";
  };

  const onSaveBatch = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const item = items.find((entry) => entry.id === formState.itemId);
    if (!item) {
      setErrorMessage("Please select an item.");
      return;
    }

    const batchNumber = formState.batchNumber.trim();
    if (!batchNumber) {
      setErrorMessage("Batch number is required.");
      return;
    }

    const quantity = Number(formState.quantity);
    if (Number.isNaN(quantity) || quantity <= 0) {
      setErrorMessage("Quantity must be greater than 0.");
      return;
    }

    if (!formState.expiryDate || !formState.receivedDate) {
      setErrorMessage("Received date and expiry date are required.");
      return;
    }

    const result = await createBatchWithFallback({
      itemId: item.id,
      itemName: item.name,
      batchNumber,
      quantity,
      unit: item.unit,
      expiryDate: formState.expiryDate,
      receivedAt: formState.receivedDate,
      status: getBatchStatus(formState.expiryDate),
    });
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setBatches((prev) => [result.data, ...prev]);
    setFormState({ ...defaultFormState, receivedDate: getTodayDateValue() });
    setIsModalOpen(false);
    setSuccessMessage("Batch added locally.");
  };

  return (
    <div className="space-y-6">
      <OpsSection
        title="Batch & Expiry"
        description="Track batch numbers, quantities, received dates, and expiry risk."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Stock Overview" href="/admin/inventory" tone="ghost" />
            <OpsActionButton label="Expiry Alerts" href="/admin/inventory/expiry-alerts" tone="ghost" />
            <OpsActionButton label="Stock In" href="/admin/inventory/stock-in" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection
        title="Batches"
        description="Search and monitor batch expiry status."
        action={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-full bg-[#2a2927] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1f1e1c]"
          >
            Add Batch
          </button>
        }
      >
        {isLoading && <p className="mb-3 text-sm text-[#6b6b6b]">Loading inventory data...</p>}
        {showFallbackBanner && <p className="mb-3 text-sm text-amber-700">Showing mock inventory data because backend is unavailable.</p>}
        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search batch number or item"
            className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as BatchFilter)}
            className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="valid">Valid</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as BatchSort)}
            className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"
          >
            <option value="expiry_date">Expiry Date</option>
            <option value="newest_received">Newest Received</option>
            <option value="item_name">Item Name</option>
            <option value="quantity">Quantity</option>
          </select>
        </div>

        {successMessage && <p className="mb-3 text-sm text-emerald-700">{successMessage}</p>}

        <OpsTable
          columns={[
            { key: "batch", label: "Batch Number" },
            { key: "item", label: "Item" },
            { key: "quantity", label: "Quantity" },
            { key: "receivedAt", label: "Received At" },
            { key: "expiryDate", label: "Expiry Date" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
          rows={filteredBatches.map((batch) => ({
            id: batch.id,
            cells: {
              batch: batch.batchNumber,
              item: batch.itemName,
              quantity: `${batch.quantity} ${batch.unit}`,
              receivedAt: formatDate(batch.receivedAt),
              expiryDate: formatDate(batch.expiryDate),
              status: (
                <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getBatchStatusClass(batch.status)}`}>
                  {getBatchStatusLabel(batch.status)}
                </span>
              ),
              actions: (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await markBatchReviewedWithFallback(batch.id);
                      setShowFallbackBanner((prev) => prev || result.usedMockFallback);
                      setReviewedBatchIds((prev) => (prev.includes(batch.id) ? prev : [...prev, batch.id]));
                    }}
                    className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-semibold hover:bg-[#f7f5f0]"
                  >
                    {reviewedBatchIds.includes(batch.id) ? "Reviewed" : "Mark Reviewed"}
                  </button>
                  <OpsActionButton label="Stock Out" href="/admin/inventory/issues" tone="ghost" />
                </div>
              ),
            },
          }))}
          emptyLabel="No batches found for selected filters."
        />
      </OpsSection>

      {isModalOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-[#efe5d8] bg-white p-6">
            <h3 className="text-xl font-semibold text-[#2a2927]">Add Batch</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Item *</span>
                <select value={formState.itemId} onChange={(e) => updateForm("itemId", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2">
                  <option value="">Select Item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Batch Number *</span>
                <input value={formState.batchNumber} onChange={(e) => updateForm("batchNumber", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Quantity *</span>
                <input type="number" min={0} step="0.01" value={formState.quantity} onChange={(e) => updateForm("quantity", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Expiry Date *</span>
                <input type="date" value={formState.expiryDate} onChange={(e) => updateForm("expiryDate", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Received Date *</span>
                <input type="date" value={formState.receivedDate} onChange={(e) => updateForm("receivedDate", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
              </label>
            </div>
            {errorMessage && <p className="mt-3 text-sm text-rose-700">{errorMessage}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-[#d9ccbb] px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="button" onClick={onSaveBatch} className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white">Save Batch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

