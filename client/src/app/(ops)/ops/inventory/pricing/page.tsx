"use client";

import { useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  calculateItemStockValue,
  formatCurrency,
  formatDate,
  getInventoryCategories,
  inventoryItems,
} from "@/lib/inventory/minimalInventoryMock";
import type { InventoryItem } from "@/types/inventory";

type PricingSortBy =
  | "highest_total_value"
  | "lowest_total_value"
  | "highest_unit_cost"
  | "lowest_unit_cost"
  | "recently_updated";

const sortItems = (items: InventoryItem[], sortBy: PricingSortBy) => {
  const copied = items.map((item) => ({ ...item }));

  if (sortBy === "highest_total_value") {
    return copied.sort((a, b) => calculateItemStockValue(b) - calculateItemStockValue(a));
  }

  if (sortBy === "lowest_total_value") {
    return copied.sort((a, b) => calculateItemStockValue(a) - calculateItemStockValue(b));
  }

  if (sortBy === "highest_unit_cost") {
    return copied.sort((a, b) => b.costPerUnit - a.costPerUnit);
  }

  if (sortBy === "lowest_unit_cost") {
    return copied.sort((a, b) => a.costPerUnit - b.costPerUnit);
  }

  return copied.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export default function Page() {
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<PricingSortBy>("highest_total_value");

  const categories = useMemo(() => getInventoryCategories(inventoryItems), []);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    const base = inventoryItems.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch) ||
        item.supplierName.toLowerCase().includes(normalizedSearch);

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    return sortItems(base, sortBy);
  }, [searchText, categoryFilter, sortBy]);

  const kpis = useMemo(() => {
    const totalStockValue = inventoryItems.reduce((sum, item) => sum + calculateItemStockValue(item), 0);
    const averageCost =
      inventoryItems.length > 0
        ? inventoryItems.reduce((sum, item) => sum + item.costPerUnit, 0) / inventoryItems.length
        : 0;

    const highestValueItem = inventoryItems.reduce((top, item) => {
      if (!top) return item;
      return calculateItemStockValue(item) > calculateItemStockValue(top) ? item : top;
    }, null as InventoryItem | null);

    const lowStockValueAtRisk = inventoryItems
      .filter((item) => item.status === "low_stock" || item.status === "out_of_stock")
      .reduce((sum, item) => sum + calculateItemStockValue(item), 0);

    return [
      { label: "Total Stock Value", value: formatCurrency(totalStockValue) },
      { label: "Average Cost Per Item", value: formatCurrency(averageCost) },
      {
        label: "Highest Value Item",
        value: highestValueItem ? highestValueItem.name : "-",
        hint: highestValueItem ? formatCurrency(calculateItemStockValue(highestValueItem)) : "No item data",
      },
      { label: "Low Stock Value at Risk", value: formatCurrency(lowStockValueAtRisk), tone: "warning" },
    ];
  }, []);

  return (
    <div className="space-y-6">
      <OpsSection
        title="Pricing & Cost"
        description="Track item costs, total stock value, and bakery ingredient cost visibility."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Item Master" href="/admin/inventory/items" tone="ghost" />
            <OpsActionButton label="Inventory Valuation" href="/admin/inventory/valuation" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Cost Visibility" description="Search and compare per-item cost and value.">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by item, category, supplier"
            className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm text-[#2a2927] outline-none focus:border-[#1f7a6b]"
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm text-[#2a2927] outline-none focus:border-[#1f7a6b]"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as PricingSortBy)}
            className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm text-[#2a2927] outline-none focus:border-[#1f7a6b]"
          >
            <option value="highest_total_value">Highest Total Value</option>
            <option value="lowest_total_value">Lowest Total Value</option>
            <option value="highest_unit_cost">Highest Unit Cost</option>
            <option value="lowest_unit_cost">Lowest Unit Cost</option>
            <option value="recently_updated">Recently Updated</option>
          </select>
        </div>

        <OpsTable
          columns={[
            { key: "item", label: "Item" },
            { key: "category", label: "Category" },
            { key: "currentStock", label: "Current Stock" },
            { key: "unit", label: "Unit" },
            { key: "costPerUnit", label: "Cost Per Unit" },
            { key: "totalValue", label: "Total Value" },
            { key: "supplier", label: "Supplier" },
            { key: "updatedAt", label: "Updated At" },
          ]}
          rows={filteredItems.map((item) => ({
            id: item.id,
            cells: {
              item: item.name,
              category: item.category,
              currentStock: item.currentStock,
              unit: item.unit,
              costPerUnit: formatCurrency(item.costPerUnit),
              totalValue: formatCurrency(calculateItemStockValue(item)),
              supplier: item.supplierName,
              updatedAt: formatDate(item.updatedAt),
            },
          }))}
          emptyLabel="No pricing records found for the selected filters."
        />
      </OpsSection>
    </div>
  );
}
