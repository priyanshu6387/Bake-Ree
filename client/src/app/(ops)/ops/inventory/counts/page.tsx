"use client";

import { useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import { createStockCountId, formatCurrency, inventoryItems } from "@/lib/inventory/minimalInventoryMock";
import type { InventoryItem } from "@/types/inventory";

type CountRecord = {
  id: string;
  itemId: string;
  itemName: string;
  systemStock: number;
  physicalCount: number;
  difference: number;
  valueDifference: number;
  createdAt: string;
};

export default function Page() {
  const [items] = useState<InventoryItem[]>(inventoryItems.map((item) => ({ ...item })));
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, string>>({});
  const [countRecords, setCountRecords] = useState<CountRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const rowsData = useMemo(
    () =>
      items.map((item) => {
        const raw = physicalCounts[item.id] ?? "";
        const parsed = raw === "" ? undefined : Number(raw);
        const hasValue = parsed !== undefined && !Number.isNaN(parsed);
        const physical = hasValue ? parsed : item.currentStock;
        const difference = physical - item.currentStock;
        const valueDifference = difference * item.costPerUnit;

        return { item, inputValue: raw, physical, difference, valueDifference };
      }),
    [items, physicalCounts]
  );

  const kpis = useMemo(() => {
    const countedRows = rowsData.filter((row) => row.inputValue !== "");
    const varianceRows = countedRows.filter((row) => row.difference !== 0);
    const positiveVariance = varianceRows.filter((row) => row.difference > 0).reduce((sum, row) => sum + row.difference, 0);
    const negativeVariance = varianceRows.filter((row) => row.difference < 0).reduce((sum, row) => sum + Math.abs(row.difference), 0);
    const varianceValue = varianceRows.reduce((sum, row) => sum + row.valueDifference, 0);

    return [
      { label: "Counted Items", value: countedRows.length },
      { label: "Variance Items", value: varianceRows.length, tone: "warning" },
      { label: "Positive Variance", value: positiveVariance },
      { label: "Negative Variance", value: negativeVariance, tone: "critical" },
      { label: "Estimated Variance Value", value: formatCurrency(varianceValue) },
    ];
  }, [rowsData]);

  const saveCount = () => {
    setErrorMessage(null);
    const invalid = rowsData.find((row) => {
      if (row.inputValue === "") return false;
      const parsed = Number(row.inputValue);
      return Number.isNaN(parsed) || parsed < 0;
    });

    if (invalid) {
      setErrorMessage("Physical count cannot be negative.");
      return;
    }

    const newRecords: CountRecord[] = rowsData
      .filter((row) => row.inputValue !== "")
      .map((row) => ({
        id: createStockCountId(),
        itemId: row.item.id,
        itemName: row.item.name,
        systemStock: row.item.currentStock,
        physicalCount: row.physical,
        difference: row.difference,
        valueDifference: row.valueDifference,
        createdAt: new Date().toISOString(),
      }));

    setCountRecords(newRecords);
    setSuccessMessage("Stock count saved locally. Use Adjustments to apply stock corrections.");
  };

  const clearCounts = () => {
    setPhysicalCounts({});
    setCountRecords([]);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div className="space-y-6">
      <OpsSection
        title="Stock Counts"
        description="Compare system stock with physical count and record variances."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Stock Overview" href="/admin/inventory" tone="ghost" />
            <OpsActionButton label="Adjustments" href="/admin/inventory/adjustments" tone="ghost" />
            <OpsActionButton label="Stock Movements" href="/admin/inventory/movements" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Count Entry" description="Enter physical counts to identify variance.">
        {errorMessage && <p className="mb-3 text-sm text-rose-700">{errorMessage}</p>}
        {successMessage && <p className="mb-3 text-sm text-emerald-700">{successMessage}</p>}

        <OpsTable
          columns={[
            { key: "item", label: "Item" },
            { key: "system", label: "System Stock" },
            { key: "physical", label: "Physical Count" },
            { key: "difference", label: "Difference" },
            { key: "value", label: "Estimated Value Difference" },
            { key: "status", label: "Status" },
          ]}
          rows={rowsData.map((row) => ({
            id: row.item.id,
            cells: {
              item: row.item.name,
              system: `${row.item.currentStock} ${row.item.unit}`,
              physical: (
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={row.inputValue}
                  onChange={(event) =>
                    setPhysicalCounts((prev) => ({ ...prev, [row.item.id]: event.target.value }))
                  }
                  className="w-28 rounded-lg border border-[#e7dfd2] px-2 py-1 text-xs"
                />
              ),
              difference: row.difference,
              value: formatCurrency(row.valueDifference),
              status:
                row.difference === 0 ? "Matched" : row.difference > 0 ? "Positive Variance" : "Negative Variance",
            },
          }))}
        />

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={clearCounts} className="rounded-full border border-[#d9ccbb] px-4 py-2 text-sm font-semibold">
            Clear Counts
          </button>
          <button type="button" onClick={saveCount} className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white">
            Save Count
          </button>
        </div>

        {countRecords.length > 0 && (
          <p className="mt-3 text-xs text-[#7a6f63]">Saved count records: {countRecords.length}</p>
        )}
      </OpsSection>
    </div>
  );
}
