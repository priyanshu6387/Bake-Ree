"use client";

import { useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  calculateCogsSummary,
  calculateMovementCost,
  formatCurrency,
  formatDate,
  inventoryItems,
  inventoryMovements,
} from "@/lib/inventory/minimalInventoryMock";
import type { InventoryMovement } from "@/types/inventory";

type DateRangeFilter = "all" | "last_7_days" | "last_30_days";
type TypeFilter = "all" | "production" | "waste" | "returns" | "adjustments";

const matchesType = (movement: InventoryMovement, typeFilter: TypeFilter) => {
  if (typeFilter === "all") return true;
  if (typeFilter === "production") return movement.type === "stock_out" && movement.reason === "production";
  if (typeFilter === "waste") return movement.type === "waste";
  if (typeFilter === "returns") return movement.type === "return";
  return movement.type === "adjustment";
};

const matchesDateRange = (movement: InventoryMovement, dateRange: DateRangeFilter) => {
  if (dateRange === "all") return true;
  const movementDate = new Date(movement.createdAt);
  const today = new Date();
  const cutoffDays = dateRange === "last_7_days" ? 7 : 30;
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - cutoffDays);
  return movementDate >= cutoff;
};

export default function Page() {
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [searchText, setSearchText] = useState("");

  const filteredMovements = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    return inventoryMovements
      .filter((movement) => {
        const matchesSearch =
          normalized.length === 0 ||
          movement.itemName.toLowerCase().includes(normalized) ||
          (movement.note ?? "").toLowerCase().includes(normalized);
        return matchesSearch && matchesType(movement, typeFilter) && matchesDateRange(movement, dateRange);
      })
      .map((movement) => ({ ...movement }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [dateRange, typeFilter, searchText]);

  const cogsSummary = useMemo(() => calculateCogsSummary(filteredMovements, inventoryItems), [filteredMovements]);

  const costByTypeRows = useMemo(() => {
    const groups = [
      { key: "stock_out", label: "Production Issues", matcher: (m: InventoryMovement) => m.type === "stock_out" && m.reason === "production" },
      { key: "waste", label: "Waste", matcher: (m: InventoryMovement) => m.type === "waste" },
      { key: "return", label: "Returns", matcher: (m: InventoryMovement) => m.type === "return" },
      { key: "adjustment", label: "Adjustments", matcher: (m: InventoryMovement) => m.type === "adjustment" },
    ] as const;

    return groups.map((group) => {
      const rows = filteredMovements.filter(group.matcher);
      return {
        id: group.key,
        label: group.label,
        entries: rows.length,
        totalQuantity: rows.reduce((sum, row) => sum + row.quantity, 0),
        estimatedCost: rows.reduce((sum, row) => sum + calculateMovementCost(row, inventoryItems), 0),
      };
    });
  }, [filteredMovements]);

  const productionRows = filteredMovements.filter((m) => m.type === "stock_out" && m.reason === "production");
  const wasteRows = filteredMovements.filter((m) => m.type === "waste");

  return (
    <div className="space-y-6">
      <OpsSection
        title="COGS Summary"
        description="Estimate bakery ingredient usage cost from inventory movements."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Stock Movements" href="/admin/inventory/movements" tone="ghost" />
            <OpsActionButton label="Issues to Production" href="/admin/inventory/issues" tone="ghost" />
            <OpsActionButton label="Waste & Spoilage" href="/admin/inventory/waste" />
          </div>
        }
      >
        <OpsKpiGrid
          items={[
            { label: "Estimated COGS", value: formatCurrency(cogsSummary.estimatedCogs) },
            { label: "Production Issue Cost", value: formatCurrency(cogsSummary.productionIssueCost) },
            { label: "Waste Cost", value: formatCurrency(cogsSummary.wasteCost), tone: "warning" },
            { label: "Return Value", value: formatCurrency(cogsSummary.returnValue) },
            { label: "Adjustment Value", value: formatCurrency(cogsSummary.adjustmentValue) },
            { label: "Total Stock Out Quantity", value: cogsSummary.totalStockOutQuantity },
          ]}
        />
      </OpsSection>

      <OpsSection title="Filters" description="Filter movement rows used in COGS estimates.">
        <div className="grid gap-3 md:grid-cols-3">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRangeFilter)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm">
            <option value="all">All Time</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm">
            <option value="all">All</option>
            <option value="production">Production Issues</option>
            <option value="waste">Waste</option>
            <option value="returns">Returns</option>
            <option value="adjustments">Adjustments</option>
          </select>
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search item or note" className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm" />
        </div>
      </OpsSection>

      <OpsSection title="Cost by Movement Type" description="Entry count, quantity, and estimated cost by movement type.">
        <OpsTable
          columns={[
            { key: "type", label: "Type" },
            { key: "entries", label: "Entries" },
            { key: "qty", label: "Total Quantity" },
            { key: "cost", label: "Estimated Cost" },
          ]}
          rows={costByTypeRows.map((row) => ({
            id: row.id,
            cells: {
              type: row.label,
              entries: row.entries,
              qty: row.totalQuantity,
              cost: formatCurrency(row.estimatedCost),
            },
          }))}
        />
      </OpsSection>

      <OpsSection title="Production Issue Cost" description="Production issue movements and estimated cost.">
        <OpsTable
          columns={[
            { key: "date", label: "Date" },
            { key: "item", label: "Item" },
            { key: "qty", label: "Quantity" },
            { key: "unit", label: "Unit" },
            { key: "cost", label: "Estimated Cost" },
            { key: "note", label: "Note" },
          ]}
          rows={productionRows.map((row) => ({
            id: row.id,
            cells: {
              date: formatDate(row.createdAt),
              item: row.itemName,
              qty: row.quantity,
              unit: row.unit,
              cost: formatCurrency(calculateMovementCost(row, inventoryItems)),
              note: row.note ?? "-",
            },
          }))}
          emptyLabel="No production issue movements for selected filters."
        />
      </OpsSection>

      <OpsSection title="Waste Cost" description="Waste movements and estimated cost impact.">
        <OpsTable
          columns={[
            { key: "date", label: "Date" },
            { key: "item", label: "Item" },
            { key: "qty", label: "Quantity" },
            { key: "unit", label: "Unit" },
            { key: "cost", label: "Estimated Cost" },
            { key: "note", label: "Note" },
          ]}
          rows={wasteRows.map((row) => ({
            id: row.id,
            cells: {
              date: formatDate(row.createdAt),
              item: row.itemName,
              qty: row.quantity,
              unit: row.unit,
              cost: formatCurrency(calculateMovementCost(row, inventoryItems)),
              note: row.note ?? "-",
            },
          }))}
          emptyLabel="No waste movements for selected filters."
        />
      </OpsSection>
    </div>
  );
}
