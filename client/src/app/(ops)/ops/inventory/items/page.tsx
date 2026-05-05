"use client";

import { useEffect, useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsBadge from "@/components/ops/OpsBadge";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  calculateInventoryStatus,
  calculateItemStockValue,
  formatCurrency,
  formatDate,
  getInventoryCategories,
  inventoryItems,
  inventorySuppliers,
} from "@/lib/inventory/minimalInventoryMock";
import {
  createInventoryItemWithFallback,
  loadInventoryItems,
  loadInventorySuppliers,
  updateInventoryItemWithFallback,
} from "@/lib/inventory/inventoryDataSource";
import type { InventoryItem, InventoryStatus, InventoryUnit } from "@/types/inventory";

type ItemSortBy = "name" | "lowest_stock" | "highest_stock_value" | "recently_updated";
type StatusFilter = "all" | InventoryStatus;

type ItemFormState = {
  name: string;
  category: string;
  unit: InventoryUnit;
  currentStock: string;
  minimumStock: string;
  costPerUnit: string;
  supplierId: string;
  batchTracking: boolean;
  expiryTracking: boolean;
};

const defaultFormState: ItemFormState = {
  name: "",
  category: "",
  unit: "kg",
  currentStock: "0",
  minimumStock: "0",
  costPerUnit: "0",
  supplierId: "",
  batchTracking: false,
  expiryTracking: false,
};

const getStatusLabel = (status: InventoryStatus) =>
  status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getStatusTone = (status: InventoryStatus) => {
  if (status === "out_of_stock") return "danger" as const;
  if (status === "low_stock") return "warning" as const;
  return "success" as const;
};

const sortItems = (items: InventoryItem[], sortBy: ItemSortBy) => {
  const copied = items.map((item) => ({ ...item }));

  if (sortBy === "name") {
    return copied.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (sortBy === "lowest_stock") {
    return copied.sort((a, b) => a.currentStock - b.currentStock);
  }

  if (sortBy === "highest_stock_value") {
    return copied.sort((a, b) => calculateItemStockValue(b) - calculateItemStockValue(a));
  }

  return copied.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export default function Page() {
  const [items, setItems] = useState<InventoryItem[]>(inventoryItems.map((item) => ({ ...item })));
  const [suppliers, setSuppliers] = useState(inventorySuppliers.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [sortBy, setSortBy] = useState<ItemSortBy>("name");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ItemFormState>(defaultFormState);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      const [itemsResult, suppliersResult] = await Promise.all([loadInventoryItems(), loadInventorySuppliers()]);
      if (!mounted) return;
      setItems(itemsResult.data);
      setSuppliers(suppliersResult.data);
      setShowFallbackBanner(itemsResult.usedMockFallback || suppliersResult.usedMockFallback);
      setIsLoading(false);
    };
    void loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => getInventoryCategories(items), [items]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    const base = items.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch) ||
        item.supplierName.toLowerCase().includes(normalizedSearch);

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesSupplier = supplierFilter === "all" || item.supplierId === supplierFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesSupplier;
    });

    return sortItems(base, sortBy);
  }, [items, searchText, categoryFilter, statusFilter, supplierFilter, sortBy]);

  const kpis = useMemo(() => {
    const inStock = items.filter((item) => item.status === "in_stock").length;
    const lowStock = items.filter((item) => item.status === "low_stock").length;
    const outOfStock = items.filter((item) => item.status === "out_of_stock").length;
    const batchTracked = items.filter((item) => item.batchTracking).length;
    const expiryTracked = items.filter((item) => item.expiryTracking).length;

    return [
      { label: "Total Items", value: items.length, hint: "Ingredients and packaging tracked" },
      { label: "In Stock", value: inStock, tone: "positive" },
      { label: "Low Stock", value: lowStock, tone: "warning" },
      { label: "Out of Stock", value: outOfStock, tone: "critical" },
      { label: "Batch Tracked", value: batchTracked },
      { label: "Expiry Tracked", value: expiryTracked },
    ];
  }, [items]);

  const openAddModal = () => {
    setEditingItemId(null);
    setFormState({ ...defaultFormState });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setFormState({
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: String(item.currentStock),
      minimumStock: String(item.minimumStock),
      costPerUnit: String(item.costPerUnit),
      supplierId: item.supplierId,
      batchTracking: item.batchTracking,
      expiryTracking: item.expiryTracking,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItemId(null);
    setFormError(null);
  };

  const updateForm = <K extends keyof ItemFormState>(key: K, value: ItemFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const name = formState.name.trim();
    const category = formState.category.trim();

    if (!name || !category || !formState.unit || !formState.supplierId) {
      setFormError("Please fill all required fields.");
      return;
    }

    const currentStock = Number(formState.currentStock);
    const minimumStock = Number(formState.minimumStock);
    const costPerUnit = Number(formState.costPerUnit);

    if (
      Number.isNaN(currentStock) ||
      Number.isNaN(minimumStock) ||
      Number.isNaN(costPerUnit) ||
      currentStock < 0 ||
      minimumStock < 0 ||
      costPerUnit < 0
    ) {
      setFormError("Stock and cost values must be numbers greater than or equal to 0.");
      return;
    }

    const supplier = suppliers.find((entry) => entry.id === formState.supplierId);

    if (!supplier) {
      setFormError("Please select a valid supplier.");
      return;
    }

    const status = calculateInventoryStatus(currentStock, minimumStock);
    const updatedAt = new Date().toISOString();

    if (editingItemId) {
      const existing = items.find((entry) => entry.id === editingItemId);
      if (!existing) return;
      const result = await updateInventoryItemWithFallback(
        editingItemId,
        {
          name,
          category,
          unit: formState.unit,
          currentStock,
          minimumStock,
          costPerUnit,
          supplierId: supplier.id,
          supplierName: supplier.name,
          status,
          batchTracking: formState.batchTracking,
          expiryTracking: formState.expiryTracking,
          updatedAt,
        },
        existing
      );
      setShowFallbackBanner((prev) => prev || result.usedMockFallback);
      setItems((prev) => prev.map((item) => (item.id === editingItemId ? result.data : item)));
    } else {
      const result = await createInventoryItemWithFallback({
        name,
        category,
        unit: formState.unit,
        currentStock,
        minimumStock,
        costPerUnit,
        supplierId: supplier.id,
        supplierName: supplier.name,
        status,
        batchTracking: formState.batchTracking,
        expiryTracking: formState.expiryTracking,
        updatedAt,
      });
      setShowFallbackBanner((prev) => prev || result.usedMockFallback);
      setItems((prev) => [result.data, ...prev]);
    }

    closeModal();
  };

  return (
    <div className="space-y-6">
      <OpsSection
        title="Item Master"
        description="Manage bakery ingredients, packaging materials, stock thresholds, and suppliers."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Stock Overview" href="/admin/inventory" tone="ghost" />
            <OpsActionButton label="Stock In" href="/admin/inventory/stock-in" />
            <OpsActionButton label="Low Stock" href="/admin/inventory/reorder-alerts" tone="ghost" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection
        title="Items"
        description="Search, filter, and maintain item master records."
        action={<button type="button" onClick={openAddModal} className="rounded-full bg-[#2a2927] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1f1e1c]">Add Item</button>}
      >
        {isLoading && <p className="mb-3 text-sm text-[#6b6b6b]">Loading inventory data...</p>}
        {showFallbackBanner && <p className="mb-3 text-sm text-amber-700">Showing mock inventory data because backend is unavailable.</p>}
        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm text-[#2a2927] outline-none focus:border-[#1f7a6b]"
          >
            <option value="all">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <select
            value={supplierFilter}
            onChange={(event) => setSupplierFilter(event.target.value)}
            className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm text-[#2a2927] outline-none focus:border-[#1f7a6b]"
          >
            <option value="all">All Suppliers</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as ItemSortBy)}
            className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm text-[#2a2927] outline-none focus:border-[#1f7a6b]"
          >
            <option value="name">Name</option>
            <option value="lowest_stock">Lowest Stock</option>
            <option value="highest_stock_value">Highest Stock Value</option>
            <option value="recently_updated">Recently Updated</option>
          </select>
        </div>

        <OpsTable
          columns={[
            { key: "item", label: "Item" },
            { key: "category", label: "Category" },
            { key: "currentStock", label: "Current Stock" },
            { key: "minimumStock", label: "Minimum Stock" },
            { key: "unit", label: "Unit" },
            { key: "costPerUnit", label: "Cost Per Unit" },
            { key: "supplier", label: "Supplier" },
            { key: "batchExpiry", label: "Batch/Expiry" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
          rows={filteredItems.map((item) => ({
            id: item.id,
            cells: {
              item: (
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-[11px] text-[#7a6f63]">Updated {formatDate(item.updatedAt)}</p>
                </div>
              ),
              category: item.category,
              currentStock: item.currentStock,
              minimumStock: item.minimumStock,
              unit: item.unit,
              costPerUnit: formatCurrency(item.costPerUnit),
              supplier: item.supplierName,
              batchExpiry: (
                <div className="flex gap-1">
                  <OpsBadge label={item.batchTracking ? "Batch On" : "Batch Off"} tone={item.batchTracking ? "info" : "neutral"} />
                  <OpsBadge label={item.expiryTracking ? "Expiry On" : "Expiry Off"} tone={item.expiryTracking ? "warning" : "neutral"} />
                </div>
              ),
              status: <OpsBadge label={getStatusLabel(item.status)} tone={getStatusTone(item.status)} />,
              actions: (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => openEditModal(item)} className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-semibold text-[#2a2927] hover:bg-[#f7f5f0]">Edit</button>
                  <OpsActionButton label="Stock In" href="/admin/inventory/stock-in" tone="ghost" />
                  <OpsActionButton label="Stock Out" href="/admin/inventory/issues" tone="ghost" />
                </div>
              ),
            },
          }))}
          emptyLabel="No inventory items found for the selected filters."
        />
      </OpsSection>

      {isModalOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-[#efe5d8] bg-white p-6 shadow-[0_30px_80px_rgba(20,18,14,0.3)]">
            <h3 className="text-xl font-semibold text-[#2a2927]">{editingItemId ? "Edit Item" : "Add Item"}</h3>
            <p className="mt-1 text-sm text-[#6b6b6b]">Update local item details for this session.</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Name *</span>
                <input value={formState.name} onChange={(e) => updateForm("name", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Category *</span>
                <input value={formState.category} onChange={(e) => updateForm("category", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Unit *</span>
                <select value={formState.unit} onChange={(e) => updateForm("unit", e.target.value as InventoryUnit)} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2">
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="litre">litre</option>
                  <option value="ml">ml</option>
                  <option value="piece">piece</option>
                  <option value="box">box</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Supplier *</span>
                <select value={formState.supplierId} onChange={(e) => updateForm("supplierId", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2">
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Current Stock *</span>
                <input type="number" min={0} value={formState.currentStock} onChange={(e) => updateForm("currentStock", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Minimum Stock *</span>
                <input type="number" min={0} value={formState.minimumStock} onChange={(e) => updateForm("minimumStock", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
              </label>

              <label className="text-sm md:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Cost Per Unit *</span>
                <input type="number" min={0} value={formState.costPerUnit} onChange={(e) => updateForm("costPerUnit", e.target.value)} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
              </label>

              <label className="flex items-center gap-2 text-sm text-[#2a2927]">
                <input type="checkbox" checked={formState.batchTracking} onChange={(e) => updateForm("batchTracking", e.target.checked)} />
                Batch Tracking
              </label>

              <label className="flex items-center gap-2 text-sm text-[#2a2927]">
                <input type="checkbox" checked={formState.expiryTracking} onChange={(e) => updateForm("expiryTracking", e.target.checked)} />
                Expiry Tracking
              </label>
            </div>

            {formError && <p className="mt-3 text-sm text-rose-700">{formError}</p>}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" onClick={closeModal} className="rounded-full border border-[#d9ccbb] px-4 py-2 text-sm font-semibold text-[#6b5f53] hover:bg-[#f6efe6]">Cancel</button>
              <button type="button" onClick={handleSubmit} className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1f1e1c]">{editingItemId ? "Save Changes" : "Add Item"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
