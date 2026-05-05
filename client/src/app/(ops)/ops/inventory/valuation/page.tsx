"use client";

import { useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  calculateCategoryValuation,
  calculateItemStockValue,
  formatCurrency,
  getInventoryReportKpis,
  getInventoryStatusClass,
  getInventoryStatusLabel,
  getInventoryValueBySupplier,
  inventoryItems,
  inventorySuppliers,
} from "@/lib/inventory/minimalInventoryMock";
import type { InventoryItem } from "@/types/inventory";

type SortBy = "highest_value" | "lowest_value" | "item_name" | "recently_updated";

const sortItems = (items: InventoryItem[], sortBy: SortBy) => {
  const copied = items.map((item) => ({ ...item }));
  if (sortBy === "lowest_value") {
    return copied.sort((a, b) => calculateItemStockValue(a) - calculateItemStockValue(b));
  }
  if (sortBy === "item_name") {
    return copied.sort((a, b) => a.name.localeCompare(b.name));
  }
  if (sortBy === "recently_updated") {
    return copied.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  return copied.sort((a, b) => calculateItemStockValue(b) - calculateItemStockValue(a));
};

export default function Page() {
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("highest_value");

  const categories = useMemo(
    () => Array.from(new Set(inventoryItems.map((item) => item.category))).sort((a, b) => a.localeCompare(b)),
    []
  );

  const filteredItems = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    const base = inventoryItems.filter((item) => {
      const matchesSearch =
        normalized.length === 0 ||
        item.name.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized) ||
        item.supplierName.toLowerCase().includes(normalized);
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesSupplier = supplierFilter === "all" || item.supplierId === supplierFilter;
      return matchesSearch && matchesCategory && matchesSupplier;
    });
    return sortItems(base, sortBy);
  }, [searchText, categoryFilter, supplierFilter, sortBy]);

  const categoryRows = useMemo(() => calculateCategoryValuation(filteredItems), [filteredItems]);
  const supplierRows = useMemo(
    () => getInventoryValueBySupplier(filteredItems, inventorySuppliers).filter((row) => row.itemsSupplied > 0),
    [filteredItems]
  );
  const reportKpis = useMemo(() => getInventoryReportKpis(filteredItems), [filteredItems]);

  return (
    <div className="space-y-6">
      <OpsSection
        title="Inventory Valuation"
        description="Review current inventory value by item, category, and supplier."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Stock Overview" href="/admin/inventory" tone="ghost" />
            <OpsActionButton label="Pricing & Cost" href="/admin/inventory/pricing" tone="ghost" />
            <OpsActionButton label="Item Master" href="/admin/inventory/items" />
          </div>
        }
      >
        <OpsKpiGrid
          items={[
            { label: "Total Stock Value", value: formatCurrency(reportKpis.totalStockValue) },
            { label: "Total Items", value: reportKpis.totalItems },
            {
              label: "Highest Value Item",
              value: reportKpis.highestValueItem ? reportKpis.highestValueItem.name : "-",
              hint: reportKpis.highestValueItem
                ? formatCurrency(reportKpis.highestValueItem.stockValue)
                : "No items",
            },
            { label: "Low Stock Value at Risk", value: formatCurrency(reportKpis.lowStockValueAtRisk), tone: "warning" },
            { label: "Out of Stock Items", value: reportKpis.outOfStockItems, tone: "critical" },
            { label: "Average Item Value", value: formatCurrency(reportKpis.averageItemValue) },
          ]}
        />
      </OpsSection>

      <OpsSection title="Filters" description="Search and filter valuation rows.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search item/category/supplier"
            className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm"
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={supplierFilter}
            onChange={(event) => setSupplierFilter(event.target.value)}
            className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"
          >
            <option value="all">All Suppliers</option>
            {inventorySuppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortBy)}
            className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm"
          >
            <option value="highest_value">Highest Value</option>
            <option value="lowest_value">Lowest Value</option>
            <option value="item_name">Item Name</option>
            <option value="recently_updated">Recently Updated</option>
          </select>
        </div>
      </OpsSection>

      <OpsSection title="Valuation by Item" description="Current stock value per item.">
        <OpsTable
          columns={[
            { key: "item", label: "Item" },
            { key: "category", label: "Category" },
            { key: "currentStock", label: "Current Stock" },
            { key: "unit", label: "Unit" },
            { key: "costPerUnit", label: "Cost Per Unit" },
            { key: "totalValue", label: "Total Value" },
            { key: "supplier", label: "Supplier" },
            { key: "status", label: "Status" },
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
              status: (
                <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getInventoryStatusClass(item.status)}`}>
                  {getInventoryStatusLabel(item.status)}
                </span>
              ),
            },
          }))}
        />
      </OpsSection>

      <OpsSection title="Valuation by Category" description="Inventory value split by item category.">
        <OpsTable
          columns={[
            { key: "category", label: "Category" },
            { key: "items", label: "Items" },
            { key: "totalStockValue", label: "Total Stock Value" },
            { key: "lowStockItems", label: "Low Stock Items" },
            { key: "averageValue", label: "Average Value" },
          ]}
          rows={categoryRows.map((row) => ({
            id: row.category,
            cells: {
              category: row.category,
              items: row.items,
              totalStockValue: formatCurrency(row.totalStockValue),
              lowStockItems: row.lowStockItems,
              averageValue: formatCurrency(row.averageValue),
            },
          }))}
        />
      </OpsSection>

      <OpsSection title="Valuation by Supplier" description="Supplier-level inventory value exposure.">
        <OpsTable
          columns={[
            { key: "supplier", label: "Supplier" },
            { key: "itemsSupplied", label: "Items Supplied" },
            { key: "totalStockValue", label: "Total Stock Value" },
            { key: "lowStockItems", label: "Low Stock Items" },
          ]}
          rows={supplierRows.map((row) => ({
            id: row.supplierId,
            cells: {
              supplier: row.supplierName,
              itemsSupplied: row.itemsSupplied,
              totalStockValue: formatCurrency(row.totalStockValue),
              lowStockItems: row.lowStockItems,
            },
          }))}
        />
      </OpsSection>
    </div>
  );
}
