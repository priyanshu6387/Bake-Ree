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
  inventorySuppliers,
} from "@/lib/inventory/minimalInventoryMock";
import {
  createReturnWithFallback,
  loadInventoryItems,
  loadInventoryMovements,
  loadInventorySuppliers,
} from "@/lib/inventory/inventoryDataSource";
import type { InventoryItem, InventoryMovement, StockOutReason } from "@/types/inventory";

type ReturnFormState = {
  itemId: string;
  supplierId: string;
  quantity: string;
  returnReason: string;
  returnDate: string;
  note: string;
};

const getTodayDateValue = () => new Date().toISOString().slice(0, 10);

const defaultFormState: ReturnFormState = {
  itemId: "",
  supplierId: "",
  quantity: "",
  returnReason: "",
  returnDate: getTodayDateValue(),
  note: "",
};

const mapReasonToStockOutReason = (reason: string): StockOutReason | undefined => {
  const normalized = reason.trim().toLowerCase();
  if (normalized === "damage") return "damage";
  if (normalized === "wastage") return "wastage";
  if (normalized === "manual_adjustment") return "manual_adjustment";
  return undefined;
};

export default function Page() {
  const [items, setItems] = useState<InventoryItem[]>(inventoryItems.map((item) => ({ ...item })));
  const [suppliers, setSuppliers] = useState(inventorySuppliers.map((entry) => ({ ...entry })));
  const [movements, setMovements] = useState<InventoryMovement[]>(inventoryMovements.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [formState, setFormState] = useState<ReturnFormState>({ ...defaultFormState });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      const [itemsResult, suppliersResult, movementsResult] = await Promise.all([
        loadInventoryItems(),
        loadInventorySuppliers(),
        loadInventoryMovements(),
      ]);
      if (!mounted) return;
      setItems(itemsResult.data);
      setSuppliers(suppliersResult.data);
      setMovements(movementsResult.data);
      setShowFallbackBanner(itemsResult.usedMockFallback || suppliersResult.usedMockFallback || movementsResult.usedMockFallback);
      setIsLoading(false);
    };
    void loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const supplierOptions = useMemo(() => suppliers.map((supplier) => ({ id: supplier.id, name: supplier.name })), [suppliers]);
  const returnMovements = useMemo(() => getMovementsByType("return", movements), [movements]);

  const kpis = useMemo(() => {
    const returnQty = returnMovements.reduce((sum, movement) => sum + movement.quantity, 0);
    const returnValue = returnMovements.reduce((sum, movement) => sum + (movement.cost ?? 0), 0);
    const suppliersAffected = new Set(returnMovements.map((movement) => movement.supplierId).filter(Boolean));

    return [
      { label: "Return Entries", value: returnMovements.length },
      { label: "Return Quantity", value: returnQty },
      { label: "Return Value", value: formatCurrency(returnValue), tone: "warning" },
      { label: "Suppliers Affected", value: suppliersAffected.size },
    ];
  }, [returnMovements]);

  const updateForm = <K extends keyof ReturnFormState>(key: K, value: ReturnFormState[K]) => {
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

    const supplier = suppliers.find((entry) => entry.id === formState.supplierId);
    if (!supplier) {
      setErrorMessage("Please select a supplier.");
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

    if (!formState.returnReason.trim()) {
      setErrorMessage("Return reason is required.");
      return;
    }

    if (!formState.returnDate) {
      setErrorMessage("Please provide return date.");
      return;
    }

    const createdAt = new Date(`${formState.returnDate}T09:00:00.000Z`).toISOString();
    const reasonValue = formState.returnReason.trim();
    const noteParts = [reasonValue, formState.note.trim()].filter((value) => value.length > 0).join(" | ");
    const result = await createReturnWithFallback(
      { itemId: item.id, supplierId: supplier.id, quantity, reason: mapReasonToStockOutReason(reasonValue), note: noteParts || undefined },
      items,
      suppliers
    );
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setMovements((prev) => [result.data, ...prev]);
    setItems((prev) =>
      prev.map((entry) => (entry.id === item.id ? adjustItemStock(entry, -quantity, new Date().toISOString()) : entry))
    );
    setFormState({ ...defaultFormState, returnDate: getTodayDateValue() });
    setSuccessMessage("Return to vendor recorded.");
  };

  return (
    <div className="space-y-6">
      <OpsSection
        title="Returns to Vendor"
        description="Record supplier returns for damaged, excess, or rejected inventory."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Vendors" href="/admin/inventory/vendors" tone="ghost" />
            <OpsActionButton label="Stock Movements" href="/admin/inventory/movements" tone="ghost" />
            <OpsActionButton label="Purchase Returns" href="/admin/inventory/purchase-returns" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Record Return" description="Track returned stock and reduce local item balance.">
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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Supplier *</span>
            <select
              value={formState.supplierId}
              onChange={(event) => updateForm("supplierId", event.target.value)}
              className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"
            >
              <option value="">Select Supplier</option>
              {supplierOptions.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Return Reason *</span>
            <input
              value={formState.returnReason}
              onChange={(event) => updateForm("returnReason", event.target.value)}
              className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2"
              placeholder="Damage, excess, rejected quality"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Return Date *</span>
            <input
              type="date"
              value={formState.returnDate}
              onChange={(event) => updateForm("returnDate", event.target.value)}
              className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2"
            />
          </label>

          <label className="text-sm md:col-span-2 xl:col-span-3">
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
            Save Return
          </button>
        </div>
      </OpsSection>

      <OpsSection title="Return Entries" description="Recent return-to-vendor records for this session.">
        <OpsTable
          columns={[
            { key: "date", label: "Date" },
            { key: "item", label: "Item" },
            { key: "supplier", label: "Supplier" },
            { key: "quantity", label: "Quantity" },
            { key: "value", label: "Value" },
            { key: "reason", label: "Reason / Note" },
          ]}
          rows={returnMovements.map((movement) => ({
            id: movement.id,
            cells: {
              date: formatDate(movement.createdAt),
              item: movement.itemName,
              supplier: movement.supplierName ?? "-",
              quantity: `${movement.quantity} ${movement.unit}`,
              value: formatCurrency(movement.cost ?? 0),
              reason: movement.note ?? movement.reason ?? "-",
            },
          }))}
          emptyLabel="No return entries recorded."
        />
      </OpsSection>
    </div>
  );
}
