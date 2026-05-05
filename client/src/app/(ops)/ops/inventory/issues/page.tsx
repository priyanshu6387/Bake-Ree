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
  createIssueWithFallback,
  loadInventoryItems,
  loadInventoryMovements,
} from "@/lib/inventory/inventoryDataSource";
import type { InventoryItem, InventoryMovement } from "@/types/inventory";

type IssueFormState = {
  itemId: string;
  quantity: string;
  issueDate: string;
  note: string;
};

const getTodayDateValue = () => new Date().toISOString().slice(0, 10);
const getDateKey = (dateValue: string) => new Date(dateValue).toISOString().slice(0, 10);

const defaultFormState: IssueFormState = {
  itemId: "",
  quantity: "",
  issueDate: getTodayDateValue(),
  note: "",
};

export default function Page() {
  const [items, setItems] = useState<InventoryItem[]>(inventoryItems.map((item) => ({ ...item })));
  const [movements, setMovements] = useState<InventoryMovement[]>(inventoryMovements.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [formState, setFormState] = useState<IssueFormState>({ ...defaultFormState });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === formState.itemId),
    [items, formState.itemId]
  );
  const issueMovements = useMemo(
    () => getMovementsByType("stock_out", movements).filter((movement) => movement.reason === "production"),
    [movements]
  );

  const kpis = useMemo(() => {
    const todayKey = getTodayDateValue();
    const todayRows = issueMovements.filter((movement) => getDateKey(movement.createdAt) === todayKey);
    const lowStockAfterIssue = items.filter(
      (item) => item.status === "low_stock" || item.status === "out_of_stock"
    ).length;
    const totalIssueCost = issueMovements.reduce((sum, movement) => sum + (movement.cost ?? 0), 0);

    return [
      { label: "Production Issues", value: issueMovements.length },
      { label: "Quantity Issued Today", value: todayRows.reduce((sum, row) => sum + row.quantity, 0) },
      { label: "Low Stock After Issue", value: lowStockAfterIssue, tone: "warning" },
      { label: "Total Issue Cost", value: formatCurrency(totalIssueCost) },
    ];
  }, [issueMovements, items]);

  const updateForm = <K extends keyof IssueFormState>(key: K, value: IssueFormState[K]) => {
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

    if (!formState.issueDate) {
      setErrorMessage("Please provide issue date.");
      return;
    }

    const createdAt = new Date(`${formState.issueDate}T09:00:00.000Z`).toISOString();
    const result = await createIssueWithFallback(
      { itemId: item.id, quantity, note: formState.note.trim() || undefined },
      items
    );
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setMovements((prev) => [result.data, ...prev]);
    setItems((prev) =>
      prev.map((entry) => (entry.id === item.id ? adjustItemStock(entry, -quantity, new Date().toISOString()) : entry))
    );
    setFormState({ ...defaultFormState, issueDate: getTodayDateValue() });
    setSuccessMessage("Production issue recorded.");
  };

  return (
    <div className="space-y-6">
      <OpsSection
        title="Issues to Production"
        description="Track ingredients consumed by bakery production and kitchen use."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Stock Overview" href="/admin/inventory" tone="ghost" />
            <OpsActionButton label="Stock Movements" href="/admin/inventory/movements" tone="ghost" />
            <OpsActionButton label="Waste & Spoilage" href="/admin/inventory/waste" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Record Issue" description="Post production consumption and reduce local stock.">
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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Quantity Used *</span>
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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Unit</span>
            <input
              readOnly
              value={selectedItem?.unit ?? ""}
              className="w-full rounded-lg border border-[#e7dfd2] bg-[#faf8f4] px-3 py-2 text-[#6b6b6b]"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Issue Date *</span>
            <input
              type="date"
              value={formState.issueDate}
              onChange={(event) => updateForm("issueDate", event.target.value)}
              className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2"
            />
          </label>

          <label className="text-sm md:col-span-2 xl:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">
              Production Note / Batch Reference
            </span>
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
            Save Issue
          </button>
        </div>
      </OpsSection>

      <OpsSection title="Recent Production Issues" description="Latest stock-out entries for production usage.">
        <OpsTable
          columns={[
            { key: "date", label: "Date" },
            { key: "item", label: "Item" },
            { key: "quantity", label: "Quantity" },
            { key: "unit", label: "Unit" },
            { key: "cost", label: "Estimated Cost" },
            { key: "note", label: "Note" },
          ]}
          rows={issueMovements.map((movement) => ({
            id: movement.id,
            cells: {
              date: formatDate(movement.createdAt),
              item: movement.itemName,
              quantity: movement.quantity,
              unit: movement.unit,
              cost: formatCurrency(movement.cost ?? 0),
              note: movement.note ?? "-",
            },
          }))}
          emptyLabel="No production issues recorded."
        />
      </OpsSection>
    </div>
  );
}

