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
  createStockInWithFallback,
  loadInventoryItems,
  loadInventoryMovements,
  loadInventorySuppliers,
} from "@/lib/inventory/inventoryDataSource";
import type { InventoryItem, InventoryMovement } from "@/types/inventory";

type StockInFormState = {
  itemId: string;
  supplierId: string;
  quantity: string;
  cost: string;
  receivedDate: string;
  note: string;
};

const getTodayDateValue = () => new Date().toISOString().slice(0, 10);
const getDateKey = (dateValue: string) => new Date(dateValue).toISOString().slice(0, 10);

const defaultFormState: StockInFormState = {
  itemId: "",
  supplierId: "",
  quantity: "",
  cost: "",
  receivedDate: getTodayDateValue(),
  note: "",
};

export default function Page() {
  const [items, setItems] = useState<InventoryItem[]>(inventoryItems.map((item) => ({ ...item })));
  const [suppliers, setSuppliers] = useState(inventorySuppliers.map((entry) => ({ ...entry })));
  const [movements, setMovements] = useState<InventoryMovement[]>(inventoryMovements.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [formState, setFormState] = useState<StockInFormState>({ ...defaultFormState });
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
  const selectedItem = useMemo(
    () => items.find((item) => item.id === formState.itemId),
    [items, formState.itemId]
  );

  const stockInMovements = useMemo(() => getMovementsByType("stock_in", movements), [movements]);

  const kpis = useMemo(() => {
    const todayKey = getTodayDateValue();
    const todayRows = stockInMovements.filter((movement) => getDateKey(movement.createdAt) === todayKey);
    const suppliersUsed = new Set(stockInMovements.map((movement) => movement.supplierId).filter(Boolean));
    const receivingValue = stockInMovements.reduce((sum, movement) => sum + (movement.cost ?? 0), 0);

    return [
      { label: "Total Stock In Entries", value: stockInMovements.length },
      { label: "Quantity Received Today", value: todayRows.reduce((sum, row) => sum + row.quantity, 0) },
      { label: "Suppliers Used", value: suppliersUsed.size },
      { label: "Receiving Value", value: formatCurrency(receivingValue) },
    ];
  }, [stockInMovements]);

  const updateForm = <K extends keyof StockInFormState>(key: K, value: StockInFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setFormState({ ...defaultFormState, receivedDate: getTodayDateValue() });
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formState.itemId) {
      setErrorMessage("Please select an item.");
      return;
    }

    if (!formState.supplierId) {
      setErrorMessage("Please select a supplier.");
      return;
    }

    const selectedSupplier = suppliers.find((supplier) => supplier.id === formState.supplierId);
    const item = items.find((entry) => entry.id === formState.itemId);

    if (!selectedSupplier || !item) {
      setErrorMessage("Please select valid item and supplier.");
      return;
    }

    const quantity = Number(formState.quantity);
    if (Number.isNaN(quantity) || quantity <= 0) {
      setErrorMessage("Quantity must be greater than 0.");
      return;
    }

    const costValue = formState.cost.trim();
    const parsedCost = costValue === "" ? undefined : Number(costValue);
    if (parsedCost !== undefined && (Number.isNaN(parsedCost) || parsedCost < 0)) {
      setErrorMessage("Cost must be 0 or greater.");
      return;
    }

    if (!formState.receivedDate) {
      setErrorMessage("Please provide received date.");
      return;
    }

    const createdAt = new Date(`${formState.receivedDate}T09:00:00.000Z`).toISOString();
    const result = await createStockInWithFallback(
      { itemId: item.id, supplierId: selectedSupplier.id, quantity, cost: parsedCost, note: formState.note.trim() || undefined },
      items,
      suppliers
    );
    setShowFallbackBanner((prev) => prev || result.usedMockFallback);
    setMovements((prev) => [result.data, ...prev]);
    setItems((prev) =>
      prev.map((entry) => (entry.id === item.id ? adjustItemStock(entry, quantity, new Date().toISOString()) : entry))
    );

    setSuccessMessage("Stock-in entry saved successfully.");
    resetForm();
  };

  return (
    <div className="space-y-6">
      <OpsSection
        title="Receiving / Stock In"
        description="Record incoming bakery ingredients, packaging, and supplier deliveries."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Stock Overview" href="/admin/inventory" tone="ghost" />
            <OpsActionButton label="Item Master" href="/admin/inventory/items" tone="ghost" />
            <OpsActionButton label="Goods Received" href="/admin/inventory/goods-received" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Record Receiving" description="Capture supplier receipts and update local stock position.">
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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Unit</span>
            <input
              value={selectedItem?.unit ?? ""}
              readOnly
              className="w-full rounded-lg border border-[#e7dfd2] bg-[#faf8f4] px-3 py-2 text-[#6b6b6b]"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Cost</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={formState.cost}
              onChange={(event) => updateForm("cost", event.target.value)}
              className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Received Date *</span>
            <input
              type="date"
              value={formState.receivedDate}
              onChange={(event) => updateForm("receivedDate", event.target.value)}
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
            Save Stock In
          </button>
        </div>
      </OpsSection>

      <OpsSection title="Recent Stock In" description="Latest received entries in this session.">
        <OpsTable
          columns={[
            { key: "date", label: "Date" },
            { key: "item", label: "Item" },
            { key: "quantity", label: "Quantity" },
            { key: "supplier", label: "Supplier" },
            { key: "cost", label: "Cost" },
            { key: "note", label: "Note" },
          ]}
          rows={stockInMovements.map((movement) => ({
            id: movement.id,
            cells: {
              date: formatDate(movement.createdAt),
              item: movement.itemName,
              quantity: `${movement.quantity} ${movement.unit}`,
              supplier: movement.supplierName ?? "-",
              cost: movement.cost !== undefined ? formatCurrency(movement.cost) : "-",
              note: movement.note ?? "-",
            },
          }))}
          emptyLabel="No stock-in entries yet."
        />
      </OpsSection>
    </div>
  );
}
