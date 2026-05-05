"use client";

import { useEffect, useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  formatCurrency,
  formatDate,
  inventoryItems,
  inventorySuppliers,
  inventoryVendorPrices,
} from "@/lib/inventory/minimalInventoryMock";
import {
  createVendorPriceWithFallback,
  loadInventoryItems,
  loadInventorySuppliers,
  loadVendorPrices,
  updateVendorPriceWithFallback,
} from "@/lib/inventory/inventoryDataSource";
import type { InventoryVendorPrice } from "@/types/inventory";

type SortBy = "lowest_price" | "highest_price" | "vendor" | "item" | "recent";

type PriceFormState = {
  supplierId: string;
  itemId: string;
  pricePerUnit: string;
  leadTimeDays: string;
  updatedAt: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const defaultForm: PriceFormState = {
  supplierId: "",
  itemId: "",
  pricePerUnit: "",
  leadTimeDays: "",
  updatedAt: today(),
};

export default function Page() {
  const [rows, setRows] = useState<InventoryVendorPrice[]>(inventoryVendorPrices.map((entry) => ({ ...entry })));
  const [suppliers, setSuppliers] = useState(inventorySuppliers.map((entry) => ({ ...entry })));
  const [items, setItems] = useState(inventoryItems.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PriceFormState>({ ...defaultForm });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    const base = rows.filter((entry) => {
      const matchesSearch =
        normalized.length === 0 ||
        entry.supplierName.toLowerCase().includes(normalized) ||
        entry.itemName.toLowerCase().includes(normalized);
      const matchesSupplier = supplierFilter === "all" || entry.supplierId === supplierFilter;
      const matchesItem = itemFilter === "all" || entry.itemId === itemFilter;
      return matchesSearch && matchesSupplier && matchesItem;
    });

    return [...base].sort((a, b) => {
      if (sortBy === "lowest_price") return a.pricePerUnit - b.pricePerUnit;
      if (sortBy === "highest_price") return b.pricePerUnit - a.pricePerUnit;
      if (sortBy === "vendor") return a.supplierName.localeCompare(b.supplierName);
      if (sortBy === "item") return a.itemName.localeCompare(b.itemName);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [rows, searchText, supplierFilter, itemFilter, sortBy]);

  const kpis = useMemo(() => {
    const leadAvg = rows.length > 0 ? rows.reduce((sum, entry) => sum + entry.leadTimeDays, 0) / rows.length : 0;
    const highest = rows.length > 0 ? Math.max(...rows.map((entry) => entry.pricePerUnit)) : 0;
    const activeVendors = new Set(rows.map((entry) => entry.supplierId)).size;

    return [
      { label: "Price List Entries", value: rows.length },
      { label: "Active Vendors", value: activeVendors },
      { label: "Average Lead Time", value: `${leadAvg.toFixed(1)} days` },
      { label: "Highest Unit Price", value: formatCurrency(highest) },
    ];
  }, [rows]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm, updatedAt: today() });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEdit = (entry: InventoryVendorPrice) => {
    setEditingId(entry.id);
    setForm({
      supplierId: entry.supplierId,
      itemId: entry.itemId,
      pricePerUnit: String(entry.pricePerUnit),
      leadTimeDays: String(entry.leadTimeDays),
      updatedAt: new Date(entry.updatedAt).toISOString().slice(0, 10),
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!form.supplierId) return setErrorMessage("Supplier is required.");
    if (!form.itemId) return setErrorMessage("Item is required.");

    const supplier = suppliers.find((entry) => entry.id === form.supplierId);
    const item = items.find((entry) => entry.id === form.itemId);
    if (!supplier || !item) return setErrorMessage("Select valid supplier and item.");

    const pricePerUnit = Number(form.pricePerUnit);
    if (Number.isNaN(pricePerUnit) || pricePerUnit < 0) return setErrorMessage("Price must be 0 or greater.");

    const leadTimeDays = Number(form.leadTimeDays);
    if (Number.isNaN(leadTimeDays) || leadTimeDays < 0) return setErrorMessage("Lead time must be 0 or greater.");

    if (!form.updatedAt) return setErrorMessage("Updated date is required.");

    const payload: Partial<InventoryVendorPrice> = {
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemId: item.id,
      itemName: item.name,
      unit: item.unit,
      pricePerUnit,
      leadTimeDays,
      updatedAt: new Date(`${form.updatedAt}T09:00:00.000Z`).toISOString(),
    };
    if (editingId) {
      const existing = rows.find((entry) => entry.id === editingId);
      if (!existing) return;
      const result = await updateVendorPriceWithFallback(editingId, payload, existing);
      setShowFallbackBanner((prev) => prev || result.usedMockFallback);
      setRows((prev) => prev.map((entry) => (entry.id === editingId ? result.data : entry)));
    } else {
      const result = await createVendorPriceWithFallback(payload);
      setShowFallbackBanner((prev) => prev || result.usedMockFallback);
      setRows((prev) => [result.data, ...prev]);
    }
    setSuccessMessage(editingId ? "Price entry updated." : "Price entry added.");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <OpsSection
        title="Vendor Price Lists"
        description="Track supplier prices, lead times, and item purchasing cost."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Vendors" href="/admin/inventory/vendors" tone="ghost" />
            <OpsActionButton label="Pricing & Cost" href="/admin/inventory/pricing" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Price List" description="Filter and maintain item pricing by supplier.">
        {isLoading && <p className="mb-3 text-sm text-[#6b6b6b]">Loading inventory data...</p>}
        {showFallbackBanner && <p className="mb-3 text-sm text-amber-700">Showing mock inventory data because backend is unavailable.</p>}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-4 xl:max-w-5xl">
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search by vendor or item" className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm" />
            <select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm">
              <option value="all">All Vendors</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
            <select value={itemFilter} onChange={(event) => setItemFilter(event.target.value)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm">
              <option value="all">All Items</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm">
              <option value="lowest_price">Lowest Price</option>
              <option value="highest_price">Highest Price</option>
              <option value="vendor">Vendor</option>
              <option value="item">Item</option>
              <option value="recent">Recently Updated</option>
            </select>
          </div>
          <button type="button" onClick={openCreate} className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white">Add Price</button>
        </div>

        {errorMessage && <p className="mb-3 text-sm text-rose-700">{errorMessage}</p>}
        {successMessage && <p className="mb-3 text-sm text-emerald-700">{successMessage}</p>}

        <OpsTable
          columns={[
            { key: "vendor", label: "Vendor" },
            { key: "item", label: "Item" },
            { key: "unit", label: "Unit" },
            { key: "price", label: "Price Per Unit" },
            { key: "lead", label: "Lead Time" },
            { key: "updated", label: "Updated At" },
            { key: "actions", label: "Actions" },
          ]}
          rows={filtered.map((entry) => ({
            id: entry.id,
            cells: {
              vendor: entry.supplierName,
              item: entry.itemName,
              unit: entry.unit,
              price: formatCurrency(entry.pricePerUnit),
              lead: `${entry.leadTimeDays} days`,
              updated: formatDate(entry.updatedAt),
              actions: <button type="button" onClick={() => openEdit(entry)} className="text-xs font-semibold text-[#1f7a6b] hover:underline">Edit Price</button>,
            },
          }))}
          emptyLabel="No vendor price entries found."
        />
      </OpsSection>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-[#2a2927]">{editingId ? "Edit Price" : "Add Price"}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Supplier *</span><select value={form.supplierId} onChange={(event) => setForm((prev) => ({ ...prev, supplierId: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="">Select Supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
              <label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Item *</span><select value={form.itemId} onChange={(event) => setForm((prev) => ({ ...prev, itemId: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2"><option value="">Select Item</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Price Per Unit *</span><input type="number" min={0} step="0.01" value={form.pricePerUnit} onChange={(event) => setForm((prev) => ({ ...prev, pricePerUnit: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label>
              <label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Lead Time Days *</span><input type="number" min={0} value={form.leadTimeDays} onChange={(event) => setForm((prev) => ({ ...prev, leadTimeDays: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label>
              <label className="text-sm md:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Updated At</span><input type="date" value={form.updatedAt} onChange={(event) => setForm((prev) => ({ ...prev, updatedAt: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-[#d8d2c7] px-4 py-2 text-sm">Cancel</button>
              <button type="button" onClick={handleSave} className="rounded-full bg-[#2a2927] px-4 py-2 text-sm font-semibold text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

