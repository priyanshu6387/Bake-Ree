"use client";

import { useEffect, useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  createTransferId,
  formatDate,
  inventoryItems,
  inventoryMovements,
} from "@/lib/inventory/minimalInventoryMock";
import {
  createTransferWithFallback,
  loadInventoryItems,
  loadInventoryMovements,
} from "@/lib/inventory/inventoryDataSource";
import type { InventoryItem, InventoryMovement } from "@/types/inventory";

type TransferFormState = {
  itemId: string;
  quantity: string;
  fromLocation: string;
  toLocation: string;
  date: string;
  note: string;
};

type TransferEntry = {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: InventoryItem["unit"];
  fromLocation: string;
  toLocation: string;
  note?: string;
  createdAt: string;
};

const locations = ["Main Store", "Kitchen", "Display Counter", "Packaging Area"];
const getTodayDateValue = () => new Date().toISOString().slice(0, 10);

const defaultFormState: TransferFormState = {
  itemId: "",
  quantity: "",
  fromLocation: "",
  toLocation: "",
  date: getTodayDateValue(),
  note: "",
};

export default function Page() {
  const [loadedItems, setLoadedItems] = useState<InventoryItem[]>(inventoryItems.map((item) => ({ ...item })));
  const [, setMovements] = useState<InventoryMovement[]>(inventoryMovements.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [transfers, setTransfers] = useState<TransferEntry[]>([]);
  const [formState, setFormState] = useState<TransferFormState>({ ...defaultFormState });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const kpis = useMemo(() => {
    const totalQty = transfers.reduce((sum, transfer) => sum + transfer.quantity, 0);
    const destinationMap = new Map<string, number>();
    transfers.forEach((transfer) => {
      destinationMap.set(transfer.toLocation, (destinationMap.get(transfer.toLocation) ?? 0) + 1);
    });
    const mostUsedDestination = Array.from(destinationMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
    const itemsTransferred = new Set(transfers.map((transfer) => transfer.itemId)).size;

    return [
      { label: "Transfer Entries", value: transfers.length },
      { label: "Quantity Transferred", value: totalQty },
      { label: "Most Used Destination", value: mostUsedDestination },
      { label: "Items Transferred", value: itemsTransferred },
    ];
  }, [transfers]);

  const updateForm = <K extends keyof TransferFormState>(key: K, value: TransferFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const item = loadedItems.find((entry) => entry.id === formState.itemId);
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

    if (!formState.fromLocation || !formState.toLocation) {
      setErrorMessage("From and To locations are required.");
      return;
    }

    if (formState.fromLocation === formState.toLocation) {
      setErrorMessage("From location and To location cannot be the same.");
      return;
    }

    const createdAt = new Date(`${formState.date}T09:00:00.000Z`).toISOString();
    const transfer: TransferEntry = {
      id: createTransferId(),
      itemId: item.id,
      itemName: item.name,
      quantity,
      unit: item.unit,
      fromLocation: formState.fromLocation,
      toLocation: formState.toLocation,
      note: formState.note.trim() || undefined,
      createdAt,
    };

    const movementResult = await createTransferWithFallback(
      {
        itemId: item.id,
        quantity,
        fromLocation: formState.fromLocation,
        toLocation: formState.toLocation,
        note: `From ${formState.fromLocation} to ${formState.toLocation}${formState.note.trim() ? ` | ${formState.note.trim()}` : ""}`,
      },
      loadedItems
    );

    setTransfers((prev) => [transfer, ...prev]);
    setShowFallbackBanner((prev) => prev || movementResult.usedMockFallback);
    setMovements((prev) => [movementResult.data, ...prev]);
    setFormState({ ...defaultFormState, date: getTodayDateValue() });
    setSuccessMessage("Transfer recorded locally.");
  };

  return (
    <div className="space-y-6">
      <OpsSection
        title="Transfers"
        description="Track stock moved between storage, kitchen, display, and packaging areas."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Stock Overview" href="/admin/inventory" tone="ghost" />
            <OpsActionButton label="Stock Movements" href="/admin/inventory/movements" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Record Transfer" description="Track internal inventory movement without changing total stock.">
        {isLoading && <p className="mb-3 text-sm text-[#6b6b6b]">Loading inventory data...</p>}
        {showFallbackBanner && <p className="mb-3 text-sm text-amber-700">Showing mock inventory data because backend is unavailable.</p>}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Item *</span>
            <select value={formState.itemId} onChange={(e) => updateForm("itemId", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2">
              <option value="">Select Item</option>
              {loadedItems.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Quantity *</span>
            <input type="number" min={0} step="0.01" value={formState.quantity} onChange={(e) => updateForm("quantity", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">From Location *</span>
            <select value={formState.fromLocation} onChange={(e) => updateForm("fromLocation", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2">
              <option value="">Select Location</option>
              {locations.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">To Location *</span>
            <select value={formState.toLocation} onChange={(e) => updateForm("toLocation", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2">
              <option value="">Select Location</option>
              {locations.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
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
          <button type="button" onClick={handleSave} className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white">Save Transfer</button>
        </div>
      </OpsSection>

      <OpsSection title="Recent Transfers" description="Latest local transfer entries.">
        <OpsTable
          columns={[
            { key: "date", label: "Date" },
            { key: "item", label: "Item" },
            { key: "quantity", label: "Quantity" },
            { key: "from", label: "From" },
            { key: "to", label: "To" },
            { key: "note", label: "Note" },
          ]}
          rows={transfers.map((transfer) => ({
            id: transfer.id,
            cells: {
              date: formatDate(transfer.createdAt),
              item: transfer.itemName,
              quantity: `${transfer.quantity} ${transfer.unit}`,
              from: transfer.fromLocation,
              to: transfer.toLocation,
              note: transfer.note ?? "-",
            },
          }))}
          emptyLabel="No transfers recorded yet."
        />
      </OpsSection>
    </div>
  );
}

