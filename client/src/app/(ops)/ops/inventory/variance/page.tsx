"use client";

import { useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  calculateMovementCost,
  calculateVarianceSummary,
  formatCurrency,
  formatDate,
  getAdjustmentMovements,
  getInventoryStatusClass,
  getInventoryStatusLabel,
  inventoryItems,
  inventoryMovements,
} from "@/lib/inventory/minimalInventoryMock";
import type { InventoryMovement } from "@/types/inventory";

type DirectionFilter = "all" | "positive" | "negative";
type SortBy = "newest" | "oldest" | "highest_value_impact" | "item_name";

type AdjustmentRow = {
  movement: InventoryMovement;
  direction: "positive" | "negative";
  signedQuantity: number;
  signedValue: number;
};

const inferDirection = (movement: InventoryMovement): "positive" | "negative" => {
  const text = `${movement.note ?? ""} ${movement.reason ?? ""}`.toLowerCase();
  if (text.includes("decrease") || text.includes("negative")) return "negative";
  return "positive";
};

export default function Page() {
  const [searchText, setSearchText] = useState("");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  const adjustmentRows = useMemo(() => {
    const base = getAdjustmentMovements(inventoryMovements).map((movement) => {
      const direction = inferDirection(movement);
      const signedQuantity = direction === "negative" ? -movement.quantity : movement.quantity;
      const absoluteCost = calculateMovementCost(movement, inventoryItems);
      const signedValue = direction === "negative" ? -absoluteCost : absoluteCost;
      return { movement, direction, signedQuantity, signedValue } satisfies AdjustmentRow;
    });

    const normalized = searchText.trim().toLowerCase();
    const filtered = base.filter((row) => {
      const matchesSearch =
        normalized.length === 0 ||
        row.movement.itemName.toLowerCase().includes(normalized) ||
        (row.movement.note ?? "").toLowerCase().includes(normalized);
      const matchesDirection = directionFilter === "all" || row.direction === directionFilter;
      return matchesSearch && matchesDirection;
    });

    const copied = filtered.map((entry) => ({ ...entry }));
    if (sortBy === "oldest") {
      return copied.sort((a, b) => new Date(a.movement.createdAt).getTime() - new Date(b.movement.createdAt).getTime());
    }
    if (sortBy === "highest_value_impact") {
      return copied.sort((a, b) => Math.abs(b.signedValue) - Math.abs(a.signedValue));
    }
    if (sortBy === "item_name") {
      return copied.sort((a, b) => a.movement.itemName.localeCompare(b.movement.itemName));
    }
    return copied.sort((a, b) => new Date(b.movement.createdAt).getTime() - new Date(a.movement.createdAt).getTime());
  }, [searchText, directionFilter, sortBy]);

  const varianceKpis = useMemo(() => calculateVarianceSummary(adjustmentRows.map((row) => row.movement), inventoryItems), [adjustmentRows]);

  const varianceByItem = useMemo(() => {
    const grouped = new Map<string, { itemName: string; entries: number; netQty: number; netValue: number }>();
    adjustmentRows.forEach((row) => {
      const existing = grouped.get(row.movement.itemId);
      if (existing) {
        existing.entries += 1;
        existing.netQty += row.signedQuantity;
        existing.netValue += row.signedValue;
      } else {
        grouped.set(row.movement.itemId, {
          itemName: row.movement.itemName,
          entries: 1,
          netQty: row.signedQuantity,
          netValue: row.signedValue,
        });
      }
    });

    return Array.from(grouped.entries()).map(([itemId, value]) => {
      const item = inventoryItems.find((entry) => entry.id === itemId);
      return {
        itemId,
        itemName: value.itemName,
        adjustmentEntries: value.entries,
        netQuantityChange: value.netQty,
        estimatedValueImpact: value.netValue,
        currentStock: item?.currentStock ?? 0,
        status: item?.status ?? "in_stock",
      };
    });
  }, [adjustmentRows]);

  return (
    <div className="space-y-6">
      <OpsSection
        title="Variance Report"
        description="Review stock corrections, positive/negative adjustments, and estimated variance value."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Stock Counts" href="/admin/inventory/counts" tone="ghost" />
            <OpsActionButton label="Adjustments" href="/admin/inventory/adjustments" tone="ghost" />
            <OpsActionButton label="Stock Movements" href="/admin/inventory/movements" />
          </div>
        }
      >
        <OpsKpiGrid
          items={[
            { label: "Adjustment Entries", value: varianceKpis.adjustmentEntries },
            { label: "Positive Variance", value: varianceKpis.positiveVariance, tone: "positive" },
            { label: "Negative Variance", value: varianceKpis.negativeVariance, tone: "warning" },
            { label: "Net Variance Quantity", value: varianceKpis.netVarianceQuantity },
            { label: "Estimated Variance Value", value: formatCurrency(varianceKpis.estimatedVarianceValue) },
            { label: "Items Affected", value: varianceKpis.itemsAffected },
          ]}
        />
      </OpsSection>

      <OpsSection title="Filters" description="Search and slice adjustment variance rows.">
        <div className="grid gap-3 md:grid-cols-3">
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search item or note" className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm" />
          <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value as DirectionFilter)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm">
            <option value="all">All</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest_value_impact">Highest Value Impact</option>
            <option value="item_name">Item Name</option>
          </select>
        </div>
      </OpsSection>

      <OpsSection title="Adjustment Movements" description="Adjustment entries with inferred direction and value impact.">
        <OpsTable
          columns={[
            { key: "date", label: "Date" },
            { key: "item", label: "Item" },
            { key: "qty", label: "Quantity" },
            { key: "direction", label: "Direction" },
            { key: "value", label: "Estimated Value" },
            { key: "note", label: "Reason / Note" },
          ]}
          rows={adjustmentRows.map((row) => ({
            id: row.movement.id,
            cells: {
              date: formatDate(row.movement.createdAt),
              item: row.movement.itemName,
              qty: row.signedQuantity,
              direction: row.direction,
              value: formatCurrency(row.signedValue),
              note: row.movement.note ?? row.movement.reason ?? "-",
            },
          }))}
        />
      </OpsSection>

      <OpsSection title="Variance by Item" description="Net adjustment effect by inventory item.">
        <OpsTable
          columns={[
            { key: "item", label: "Item" },
            { key: "entries", label: "Adjustment Entries" },
            { key: "netQty", label: "Net Quantity Change" },
            { key: "value", label: "Estimated Value Impact" },
            { key: "stock", label: "Current Stock" },
            { key: "status", label: "Status" },
          ]}
          rows={varianceByItem.map((row) => ({
            id: row.itemId,
            cells: {
              item: row.itemName,
              entries: row.adjustmentEntries,
              netQty: row.netQuantityChange,
              value: formatCurrency(row.estimatedValueImpact),
              stock: row.currentStock,
              status: (
                <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getInventoryStatusClass(row.status)}`}>
                  {getInventoryStatusLabel(row.status)}
                </span>
              ),
            },
          }))}
        />
      </OpsSection>
    </div>
  );
}
