"use client";

import { useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  formatCurrency,
  formatDate,
  getSlowMovingItems,
  inventoryBatches,
  inventoryItems,
  inventoryMovements,
} from "@/lib/inventory/minimalInventoryMock";

type SortBy = "highest_value" | "oldest_movement" | "item_name" | "stock_quantity";

const suggestedActionForItem = (daysSinceMovement: number, expiryTracking: boolean) => {
  if (daysSinceMovement > 45 && expiryTracking) return "Record waste if expired";
  if (daysSinceMovement > 40) return "Discount product using this ingredient";
  if (daysSinceMovement > 35) return "Use in production";
  return "Review stock level";
};

export default function Page() {
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("highest_value");

  const categories = useMemo(
    () => Array.from(new Set(inventoryItems.map((item) => item.category))).sort((a, b) => a.localeCompare(b)),
    []
  );

  const slowItems = useMemo(() => getSlowMovingItems(inventoryItems, inventoryMovements, 30, new Date()), []);

  const filteredItems = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    const base = slowItems.filter((item) => {
      const matchesSearch =
        normalized.length === 0 ||
        item.name.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized) ||
        item.supplierName.toLowerCase().includes(normalized);
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    const copied = base.map((item) => ({ ...item }));
    if (sortBy === "oldest_movement") return copied.sort((a, b) => b.daysSinceMovement - a.daysSinceMovement);
    if (sortBy === "item_name") return copied.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "stock_quantity") return copied.sort((a, b) => b.currentStock - a.currentStock);
    return copied.sort((a, b) => b.totalValue - a.totalValue);
  }, [slowItems, searchText, categoryFilter, sortBy]);

  const kpis = useMemo(() => {
    const slowMovingValue = filteredItems.reduce((sum, item) => sum + item.totalValue, 0);
    const noUsageCount = filteredItems.filter((item) => item.noUsageRecently).length;
    const expiryRiskItemIds = new Set(
      inventoryBatches
        .filter((batch) => (batch.status === "expiring_soon" || batch.status === "expired") && filteredItems.some((item) => item.id === batch.itemId))
        .map((batch) => batch.itemId)
    );
    const averageDays =
      filteredItems.length > 0
        ? filteredItems.reduce((sum, item) => sum + item.daysSinceMovement, 0) / filteredItems.length
        : 0;

    return [
      { label: "Slow Moving Items", value: filteredItems.length, tone: "warning" },
      { label: "Slow Moving Value", value: formatCurrency(slowMovingValue) },
      { label: "No Usage in 30 Days", value: noUsageCount },
      { label: "Expiry Risk Among Slow Items", value: expiryRiskItemIds.size, tone: "critical" },
      { label: "Average Days Since Movement", value: averageDays.toFixed(1) },
    ];
  }, [filteredItems]);

  const categoryImpactRows = useMemo(() => {
    const grouped = new Map<string, { slowItems: number; slowValue: number; expiryTrackedItems: number }>();
    filteredItems.forEach((item) => {
      const existing = grouped.get(item.category);
      if (existing) {
        existing.slowItems += 1;
        existing.slowValue += item.totalValue;
        if (item.expiryTracking) existing.expiryTrackedItems += 1;
      } else {
        grouped.set(item.category, {
          slowItems: 1,
          slowValue: item.totalValue,
          expiryTrackedItems: item.expiryTracking ? 1 : 0,
        });
      }
    });

    return Array.from(grouped.entries()).map(([category, value]) => ({ category, ...value }));
  }, [filteredItems]);

  return (
    <div className="space-y-6">
      <OpsSection
        title="Slow Moving Stock"
        description="Find inventory items with low usage or no recent movement to reduce waste and tied-up value."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Inventory Valuation" href="/admin/inventory/valuation" tone="ghost" />
            <OpsActionButton label="Stock Movements" href="/admin/inventory/movements" tone="ghost" />
            <OpsActionButton label="Waste & Spoilage" href="/admin/inventory/waste" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Filters" description="Search and sort slow-moving items.">
        <div className="grid gap-3 md:grid-cols-3">
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search item/category/supplier" className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm" />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm">
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm">
            <option value="highest_value">Highest Value</option>
            <option value="oldest_movement">Oldest Movement</option>
            <option value="item_name">Item Name</option>
            <option value="stock_quantity">Stock Quantity</option>
          </select>
        </div>
      </OpsSection>

      <OpsSection title="Slow Moving Items" description="Items with no stock-out/waste usage in last 30 days.">
        <OpsTable
          columns={[
            { key: "item", label: "Item" },
            { key: "category", label: "Category" },
            { key: "stock", label: "Current Stock" },
            { key: "value", label: "Total Value" },
            { key: "last", label: "Last Movement Date" },
            { key: "days", label: "Days Since Movement" },
            { key: "expiry", label: "Expiry Tracking" },
            { key: "action", label: "Suggested Action" },
          ]}
          rows={filteredItems.map((item) => ({
            id: item.id,
            cells: {
              item: item.name,
              category: item.category,
              stock: `${item.currentStock} ${item.unit}`,
              value: formatCurrency(item.totalValue),
              last: item.lastMovementDate ? formatDate(item.lastMovementDate) : "No usage",
              days: item.daysSinceMovement,
              expiry: item.expiryTracking ? "Enabled" : "Disabled",
              action: suggestedActionForItem(item.daysSinceMovement, item.expiryTracking),
            },
          }))}
          emptyLabel="No slow moving items detected for current filters."
        />
      </OpsSection>

      <OpsSection title="Category Impact" description="Slow-moving value impact by category.">
        <OpsTable
          columns={[
            { key: "category", label: "Category" },
            { key: "slowItems", label: "Slow Items" },
            { key: "slowValue", label: "Slow Value" },
            { key: "expiryTracked", label: "Expiry Tracked Items" },
          ]}
          rows={categoryImpactRows.map((row) => ({
            id: row.category,
            cells: {
              category: row.category,
              slowItems: row.slowItems,
              slowValue: formatCurrency(row.slowValue),
              expiryTracked: row.expiryTrackedItems,
            },
          }))}
        />
      </OpsSection>
    </div>
  );
}
