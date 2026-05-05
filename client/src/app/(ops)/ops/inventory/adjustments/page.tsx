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
  inventoryItems,
  inventoryMovements,
} from "@/lib/inventory/minimalInventoryMock";
import {
  createAdjustmentWithFallback,
  loadInventoryItems,
  loadInventoryMovements,
} from "@/lib/inventory/inventoryDataSource";
import type { InventoryItem, InventoryMovement } from "@/types/inventory";

type AdjustmentType = "increase" | "decrease";

type AdjustmentFormState = {
  itemId: string;
  adjustmentType: AdjustmentType;
  quantity: string;
  reason: string;
  date: string;
  note: string;
};

const getTodayDateValue = () => new Date().toISOString().slice(0, 10);

const defaultFormState: AdjustmentFormState = {
  itemId: "",
  adjustmentType: "increase",
  quantity: "",
  reason: "",
  date: getTodayDateValue(),
  note: "",
};

export default function Page() {
  const [items, setItems] = useState<InventoryItem[]>(inventoryItems.map((item) => ({ ...item })));
  const [movements, setMovements] = useState<InventoryMovement[]>(inventoryMovements.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [formState, setFormState] = useState<AdjustmentFormState>({ ...defaultFormState });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const adjustmentMovements = useMemo(() => getMovementsByType("adjustment", movements), [movements]);

  const kpis = useMemo(() => {
    const positive = adjustmentMovements.filter((movement) => (movement.note ?? "").includes("increase")).length;
    const negative = adjustmentMovements.length - positive;
    const totalValue = adjustmentMovements.reduce((sum, movement) => sum + (movement.cost ?? 0), 0);

    return [
      { label: "Adjustment Entries", value: adjustmentMovements.length },
      { label: "Positive Adjustments", value: positive, tone: "positive" },
      { label: "Negative Adjustments", value: negative, tone: "warning" },
      { label: "Adjustment Value", value: formatCurrency(totalValue) },
    ];
  }, [adjustmentMovements]);

  const updateForm = <K extends keyof AdjustmentFormState>(key: K, value: AdjustmentFormState[K]) => {
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

    if (!formState.reason.trim()) {
      setErrorMessage("Reason is required.");
      return;
    }

    if (formState.adjustmentType === "decrease" && quantity > item.currentStock) {
      setErrorMessage("Decrease quantity cannot exceed current stock.");
      return;
    }

    const delta = formState.adjustmentType === "increase" ? quantity : -quantity;
    const createdAt = new Date(`${formState.date}T09:00:00.000Z`).toISOString();
    const updatedAt = new Date().toISOString();

    const result = await createAdjustmentWithFallback(
      {
        itemId: item.id,
        quantity,
        operation: formState.adjustmentType,
        reason: formState.reason.trim(),
        note: formState.note.trim() || undefined,
      },
      items
    );
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setMovements((prev) => [result.data, ...prev]);
    setItems((prev) => prev.map((entry) => (entry.id === item.id ? adjustItemStock(entry, delta, updatedAt) : entry)));
    setFormState({ ...defaultFormState, date: getTodayDateValue() });
    setSuccessMessage("Adjustment saved locally.");
  };

  return (
    <div className="space-y-6">
      <OpsSection
        title="Adjustments"
        description="Apply manual stock corrections for count variance or data cleanup."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Stock Counts" href="/admin/inventory/counts" tone="ghost" />
            <OpsActionButton label="Stock Movements" href="/admin/inventory/movements" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="New Adjustment" description="Post a manual increase or decrease.">
        {isLoading && <p className="mb-3 text-sm text-[#6b6b6b]">Loading inventory data...</p>}
        {showFallbackBanner && <p className="mb-3 text-sm text-amber-700">Showing mock inventory data because backend is unavailable.</p>}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Adjustment Type *</span>
            <select value={formState.adjustmentType} onChange={(e) => updateForm("adjustmentType", e.target.value as AdjustmentType)} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2">
              <option value="increase">increase</option>
              <option value="decrease">decrease</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Quantity *</span>
            <input type="number" min={0} step="0.01" value={formState.quantity} onChange={(e) => updateForm("quantity", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Reason *</span>
            <input value={formState.reason} onChange={(e) => updateForm("reason", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Date *</span>
            <input type="date" value={formState.date} onChange={(e) => updateForm("date", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
          </label>
          <label className="text-sm md:col-span-2 xl:col-span-1">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Note</span>
            <input value={formState.note} onChange={(e) => updateForm("note", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
          </label>
        </div>

        {errorMessage && <p className="mt-3 text-sm text-rose-700">{errorMessage}</p>}
        {successMessage && <p className="mt-3 text-sm text-emerald-700">{successMessage}</p>}

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={handleSave} className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white">Save Adjustment</button>
        </div>
      </OpsSection>

      <OpsSection title="Recent Adjustments" description="Latest manual adjustment entries.">
        <OpsTable
          columns={[
            { key: "date", label: "Date" },
            { key: "item", label: "Item" },
            { key: "type", label: "Type" },
            { key: "quantity", label: "Quantity" },
            { key: "value", label: "Estimated Value" },
            { key: "reason", label: "Reason / Note" },
          ]}
          rows={adjustmentMovements.map((movement) => ({
            id: movement.id,
            cells: {
              date: formatDate(movement.createdAt),
              item: movement.itemName,
              type: (movement.note ?? "").includes("decrease") ? "decrease" : "increase",
              quantity: `${movement.quantity} ${movement.unit}`,
              value: formatCurrency(movement.cost ?? 0),
              reason: movement.note ?? movement.reason ?? "-",
            },
          }))}
          emptyLabel="No adjustments recorded yet."
        />
      </OpsSection>
    </div>
  );
}

