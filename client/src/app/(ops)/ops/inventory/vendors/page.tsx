"use client";

import { useEffect, useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  inventorySuppliers,
} from "@/lib/inventory/minimalInventoryMock";
import {
  createSupplierWithFallback,
  loadInventorySuppliers,
  updateSupplierWithFallback,
} from "@/lib/inventory/inventoryDataSource";
import type { InventorySupplier } from "@/types/inventory";

type VendorFormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  itemsSupplied: string;
  status: "active" | "inactive";
};

const defaultForm: VendorFormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  itemsSupplied: "",
  status: "active",
};

export default function Page() {
  const [vendors, setVendors] = useState<InventorySupplier[]>(inventorySuppliers.map((entry) => ({ ...entry })));
  const [isLoading, setIsLoading] = useState(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VendorFormState>({ ...defaultForm });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredVendors = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    return vendors.filter((vendor) => {
      const matchesSearch =
        normalized.length === 0 ||
        vendor.name.toLowerCase().includes(normalized) ||
        vendor.phone.toLowerCase().includes(normalized) ||
        vendor.email.toLowerCase().includes(normalized) ||
        vendor.itemsSupplied.join(" ").toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || vendor.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vendors, searchText, statusFilter]);

  const kpis = useMemo(() => {
    const activeCount = vendors.filter((entry) => entry.status === "active").length;
    const inactiveCount = vendors.length - activeCount;
    const uniqueItems = new Set(vendors.flatMap((entry) => entry.itemsSupplied.map((item) => item.trim()).filter(Boolean)));

    return [
      { label: "Total Vendors", value: vendors.length },
      { label: "Active Vendors", value: activeCount },
      { label: "Inactive Vendors", value: inactiveCount },
      { label: "Items Covered", value: uniqueItems.size },
    ];
  }, [vendors]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEdit = (vendor: InventorySupplier) => {
    setEditingId(vendor.id);
    setForm({
      name: vendor.name,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
      itemsSupplied: vendor.itemsSupplied.join(", "),
      status: vendor.status,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const saveVendor = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!form.name.trim()) {
      setErrorMessage("Vendor name is required.");
      return;
    }

    if (!form.phone.trim()) {
      setErrorMessage("Phone is required.");
      return;
    }

    const payload: Partial<InventorySupplier> = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      itemsSupplied: form.itemsSupplied
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      status: form.status,
    };
    if (editingId) {
      const existing = vendors.find((entry) => entry.id === editingId);
      if (!existing) return;
      const result = await updateSupplierWithFallback(editingId, payload, existing);
      setShowFallbackBanner((prev) => prev || result.usedMockFallback);
      setVendors((prev) => prev.map((entry) => (entry.id === editingId ? result.data : entry)));
    } else {
      const result = await createSupplierWithFallback(payload);
      setShowFallbackBanner((prev) => prev || result.usedMockFallback);
      setVendors((prev) => [result.data, ...prev]);
    }

    setSuccessMessage(editingId ? "Vendor updated." : "Vendor added.");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <OpsSection
        title="Vendors"
        description="Manage bakery suppliers, contact details, and items supplied."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Supplier Mapping" href="/admin/inventory/supplier-mapping" tone="ghost" />
            <OpsActionButton label="Vendor Price Lists" href="/admin/inventory/vendor-prices" tone="ghost" />
            <OpsActionButton label="Purchase Orders" href="/admin/inventory/purchase-orders" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Vendor Directory" description="Search, filter, and update vendor master contacts.">
        {isLoading && <p className="mb-3 text-sm text-[#6b6b6b]">Loading inventory data...</p>}
        {showFallbackBanner && <p className="mb-3 text-sm text-amber-700">Showing mock inventory data because backend is unavailable.</p>}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="grid w-full gap-3 md:grid-cols-2 xl:max-w-3xl">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by vendor, phone, email, item supplied"
              className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm outline-none focus:border-[#1f7a6b]"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
              className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f7a6b]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1f1e1c]"
          >
            Add Vendor
          </button>
        </div>

        {errorMessage && <p className="mb-3 text-sm text-rose-700">{errorMessage}</p>}
        {successMessage && <p className="mb-3 text-sm text-emerald-700">{successMessage}</p>}

        <OpsTable
          columns={[
            { key: "vendor", label: "Vendor" },
            { key: "phone", label: "Phone" },
            { key: "email", label: "Email" },
            { key: "items", label: "Items Supplied" },
            { key: "address", label: "Address" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
          rows={filteredVendors.map((vendor) => ({
            id: vendor.id,
            cells: {
              vendor: vendor.name,
              phone: vendor.phone,
              email: vendor.email || "-",
              items: vendor.itemsSupplied.join(", ") || "-",
              address: vendor.address || "-",
              status: (
                <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${vendor.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                  {vendor.status === "active" ? "Active" : "Inactive"}
                </span>
              ),
              actions: (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => openEdit(vendor)} className="text-xs font-semibold text-[#1f7a6b] hover:underline">
                    Edit
                  </button>
                  <OpsActionButton label="View Prices" href="/admin/inventory/vendor-prices" tone="ghost" />
                </div>
              ),
            },
          }))}
          emptyLabel="No vendors found for selected filters."
        />
      </OpsSection>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-[#2a2927]">{editingId ? "Edit Vendor" : "Add Vendor"}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Name *</span>
                <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Phone *</span>
                <input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Email</span>
                <input value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Status</span>
                <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as "active" | "inactive" }))} className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Address</span>
                <input value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#7a6f63]">Items Supplied</span>
                <input value={form.itemsSupplied} onChange={(event) => setForm((prev) => ({ ...prev, itemsSupplied: event.target.value }))} placeholder="Flour, Sugar" className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-[#d8d2c7] px-4 py-2 text-sm">Cancel</button>
              <button type="button" onClick={saveVendor} className="rounded-full bg-[#2a2927] px-4 py-2 text-sm font-semibold text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

