"use client";

import { useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsBadge from "@/components/ops/OpsBadge";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import { formatCurrency, inventoryItems, inventorySuppliers } from "@/lib/inventory/minimalInventoryMock";

export default function Page() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const normalizedSearch = searchText.trim().toLowerCase();

  const filteredSuppliers = useMemo(() => {
    return inventorySuppliers.filter((supplier) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        supplier.name.toLowerCase().includes(normalizedSearch) ||
        supplier.itemsSupplied.join(" ").toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [normalizedSearch, statusFilter]);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const supplier = inventorySuppliers.find((entry) => entry.id === item.supplierId);
      const supplierName = supplier?.name ?? item.supplierName;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        supplierName.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || supplier?.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [normalizedSearch, statusFilter]);

  const kpis = useMemo(() => {
    const activeSuppliers = inventorySuppliers.filter((supplier) => supplier.status === "active").length;
    const mappedItems = inventoryItems.filter((item) => Boolean(item.supplierId)).length;
    const unmappedItems = inventoryItems.length - mappedItems;

    return [
      { label: "Active Suppliers", value: activeSuppliers },
      { label: "Mapped Items", value: mappedItems },
      { label: "Unmapped Items", value: unmappedItems, tone: unmappedItems > 0 ? "warning" : "positive" },
      { label: "Multi-Supplier Items", value: 0, hint: "Single-supplier model in mock data" },
    ];
  }, []);

  return (
    <div className="space-y-6">
      <OpsSection
        title="Supplier Mapping"
        description="See supplier coverage for bakery ingredients and packaging items."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Vendors" href="/admin/inventory/vendors" tone="ghost" />
            <OpsActionButton label="Item Master" href="/admin/inventory/items" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection title="Filters" description="Search by supplier or item and filter by supplier status.">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by supplier or item"
            className="rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm text-[#2a2927] outline-none focus:border-[#1f7a6b]"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
            className="rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm text-[#2a2927] outline-none focus:border-[#1f7a6b]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </OpsSection>

      <OpsSection title="Suppliers" description="Supplier contact info and supplied item coverage.">
        <OpsTable
          columns={[
            { key: "supplier", label: "Supplier" },
            { key: "phone", label: "Phone" },
            { key: "email", label: "Email" },
            { key: "itemsSupplied", label: "Items Supplied" },
            { key: "status", label: "Status" },
            { key: "action", label: "Action" },
          ]}
          rows={filteredSuppliers.map((supplier) => ({
            id: supplier.id,
            cells: {
              supplier: supplier.name,
              phone: supplier.phone,
              email: supplier.email,
              itemsSupplied: supplier.itemsSupplied.join(", "),
              status: <OpsBadge label={supplier.status === "active" ? "Active" : "Inactive"} tone={supplier.status === "active" ? "success" : "neutral"} />,
              action: <OpsActionButton label="View Vendor" href="/admin/inventory/vendors" tone="ghost" />,
            },
          }))}
          emptyLabel="No suppliers found for the selected filters."
        />
      </OpsSection>

      <OpsSection title="Item to Supplier Mapping" description="Primary supplier assignment per inventory item.">
        <OpsTable
          columns={[
            { key: "item", label: "Item" },
            { key: "category", label: "Category" },
            { key: "primarySupplier", label: "Primary Supplier" },
            { key: "supplierStatus", label: "Supplier Status" },
            { key: "costPerUnit", label: "Cost Per Unit" },
          ]}
          rows={filteredItems.map((item) => {
            const supplier = inventorySuppliers.find((entry) => entry.id === item.supplierId);
            const supplierStatus = supplier?.status ?? "inactive";

            return {
              id: item.id,
              cells: {
                item: item.name,
                category: item.category,
                primarySupplier: supplier?.name ?? item.supplierName,
                supplierStatus: <OpsBadge label={supplierStatus === "active" ? "Active" : "Inactive"} tone={supplierStatus === "active" ? "success" : "neutral"} />,
                costPerUnit: formatCurrency(item.costPerUnit),
              },
            };
          })}
          emptyLabel="No item-to-supplier mappings found for the selected filters."
        />
      </OpsSection>
    </div>
  );
}
