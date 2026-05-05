"use client";

import { useEffect, useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  adjustItemStock,
  formatCurrency,
  formatDate,
  getMovementsByType,
  inventoryBatches,
  inventoryItems,
  inventoryMovements,
} from "@/lib/inventory/minimalInventoryMock";
import {
  createWasteWithFallback,
  loadInventoryBatches,
  loadInventoryItems,
  loadInventoryMovements,
} from "@/lib/inventory/inventoryDataSource";
import type { InventoryItem, InventoryMovement, StockOutReason } from "@/types/inventory";

type WasteFormState = {
  itemId: string;
  quantity: string;
  reason: StockOutReason | "";
  wasteDate: string;
  note: string;
};

const getTodayDateValue = () => new Date().toISOString().slice(0, 10);

const defaultFormState: WasteFormState = {
  itemId: "",
  quantity: "",
  reason: "",
  wasteDate: getTodayDateValue(),
  note: "",
};

export default function Page() {
  const [items, setItems] = useState<InventoryItem[]>(inventoryItems.map((item) => ({ ...item })));
  const [movements, setMovements] = useState<InventoryMovement[]>(inventoryMovements.map((entry) => ({ ...entry })));
  const [batches, setBatches] = useState(inventoryBatches.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [formState, setFormState] = useState<WasteFormState>({ ...defaultFormState });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const wasteMovements = useMemo(() => getMovementsByType("waste", movements), [movements]);
  const expiredBatchRisk = useMemo(
    () => batches.filter((batch) => batch.status === "expired" || batch.status === "expiring_soon").length,
    [batches]
  );
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      const [itemsResult, movementsResult, batchesResult] = await Promise.all([
        loadInventoryItems(),
        loadInventoryMovements(),
        loadInventoryBatches(),
      ]);
      if (!mounted) return;
      setItems(itemsResult.data);
      setMovements(movementsResult.data);
      setBatches(batchesResult.data);
      setShowFallbackBanner(itemsResult.usedMockFallback || movementsResult.usedMockFallback || batchesResult.usedMockFallback);
      setIsLoading(false);
    };
    void loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = useMemo(() => {
    const wasteQty = wasteMovements.reduce((sum, movement) => sum + movement.quantity, 0);
    const wasteCost = wasteMovements.reduce((sum, movement) => sum + (movement.cost ?? 0), 0);
    return [
      { label: "Waste Entries", value: wasteMovements.length },
      { label: "Waste Quantity", value: wasteQty },
      { label: "Waste Cost", value: formatCurrency(wasteCost), tone: "warning" },
      { label: "Expired Batch Risk", value: expiredBatchRisk, tone: "critical" },
    ];
  }, [wasteMovements, expiredBatchRisk]);

  const updateForm = <K extends keyof WasteFormState>(key: K, value: WasteFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const item = items.find((entry) => entry.id === formState.itemId);
    if (!item) {
      setErrorMessage("Please select an item.");
      return;
    }

    const quantity = Number(formState.quantity);
    if (Number.isNaN(quantity) || quantity <= 0) {
      setErrorMessage("Quantity must be greater than 0.");
      return;
    }

    if (quantity > item.currentStock) {
      setErrorMessage("Quantity cannot exceed current stock.");
      return;
    }

    if (!formState.reason) {
      setErrorMessage("Please select a waste reason.");
      return;
    }

    if (!formState.wasteDate) {
      setErrorMessage("Please provide waste date.");
      return;
    }

    const createdAt = new Date(`${formState.wasteDate}T09:00:00.000Z`).toISOString();
    const result = await createWasteWithFallback(
      { itemId: item.id, quantity, reason: formState.reason, note: formState.note.trim() || undefined },
      items
    );
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setMovements((prev) => [result.data, ...prev]);
    setItems((prev) =>
      prev.map((entry) => (entry.id === item.id ? adjustItemStock(entry, -quantity, new Date().toISOString()) : entry))
    );
    setFormState({ ...defaultFormState, wasteDate: getTodayDateValue() });
    setSuccessMessage("Waste entry recorded.");
  };

  return (
    <div className="space-y-6">
      <OpsSection
        title="Waste & Spoilage"
        description="Track ingredient waste, spoilage, and damage to control cost loss."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Stock Overview" href="/admin/inventory" tone="ghost" />
            <OpsActionButton label="Expiry Alerts" href="/admin/inventory/expiry-alerts" tone="ghost" />
            <OpsActionButton label="Stock Movements" href="/admin/inventory/movements" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Record Waste" description="Capture spoilage and stock loss for the current session.">
        {isLoading && <p className="mb-3 text-sm text-[#6b6b6b]">Loading inventory data...</p>}
        {showFallbackBanner && <p className="mb-3 text-sm text-amber-700">Showing mock inventory data because backend is unavailable.</p>}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Item *</span>
            <select
              value={formState.itemId}
              onChange={(event) => updateForm("itemId", event.target.value)}
              className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"
            >
              <option value="">Select Item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Quantity *</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={formState.quantity}
              onChange={(event) => updateForm("quantity", event.target.value)}
              className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Reason *</span>
            <select
              value={formState.reason}
              onChange={(event) => updateForm("reason", event.target.value as StockOutReason)}
              className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"
            >
              <option value="">Select Reason</option>
              <option value="wastage">wastage</option>
              <option value="damage">damage</option>
              <option value="manual_adjustment">manual_adjustment</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Waste Date *</span>
            <input
              type="date"
              value={formState.wasteDate}
              onChange={(event) => updateForm("wasteDate", event.target.value)}
              className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2"
            />
          </label>

          <label className="text-sm md:col-span-2 xl:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Note</span>
            <textarea
              rows={3}
              value={formState.note}
              onChange={(event) => updateForm("note", event.target.value)}
              className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2"
            />
          </label>
        </div>

        {errorMessage && <p className="mt-3 text-sm text-rose-700">{errorMessage}</p>}
        {successMessage && <p className="mt-3 text-sm text-emerald-700">{successMessage}</p>}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1f1e1c]"
          >
            Save Waste
          </button>
        </div>
      </OpsSection>

      <OpsSection title="Waste Entries" description="Latest waste and spoilage records.">
        <OpsTable
          columns={[
            { key: "date", label: "Date" },
            { key: "item", label: "Item" },
            { key: "quantity", label: "Quantity" },
            { key: "reason", label: "Reason" },
            { key: "cost", label: "Estimated Cost" },
            { key: "note", label: "Note" },
          ]}
          rows={wasteMovements.map((movement) => ({
            id: movement.id,
            cells: {
              date: formatDate(movement.createdAt),
              item: movement.itemName,
              quantity: `${movement.quantity} ${movement.unit}`,
              reason: movement.reason ?? "-",
              cost: formatCurrency(movement.cost ?? 0),
              note: movement.note ?? "-",
            },
          }))}
          emptyLabel="No waste entries recorded."
        />
      </OpsSection>
    </div>
  );
}
