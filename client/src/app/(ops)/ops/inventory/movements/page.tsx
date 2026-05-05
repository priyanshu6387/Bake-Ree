"use client";

import { useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsBadge from "@/components/ops/OpsBadge";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import { formatCurrency, formatDate, inventoryMovements } from "@/lib/inventory/minimalInventoryMock";
import type { InventoryMovement, InventoryMovementType, StockOutReason } from "@/types/inventory";

type MovementTypeFilter = "all" | InventoryMovementType;
type DateRangeFilter = "all" | "last_7_days" | "last_30_days";
type SortBy = "newest" | "oldest" | "item_name" | "quantity";

type MovementKpis = {
  total: number;
  stockIn: number;
  stockOut: number;
  waste: number;
  adjustments: number;
  returns: number;
};

const getMovementTypeLabel = (type: InventoryMovementType) => {
  const labels: Record<InventoryMovementType, string> = {
    stock_in: "Stock In",
    stock_out: "Stock Out",
    adjustment: "Adjustment",
    transfer: "Transfer",
    waste: "Waste",
    return: "Return",
  };

  return labels[type];
};

const getMovementTypeBadgeVariant = (type: InventoryMovementType): "success" | "warning" | "danger" | "info" => {
  if (type === "stock_in") return "success";
  if (type === "waste") return "danger";
  if (type === "return") return "warning";
  return "info";
};

const getDateRangeStart = (range: DateRangeFilter): Date | null => {
  if (range === "all") return null;

  const now = new Date();
  const days = range === "last_7_days" ? 7 : 30;
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return start;
};

const filterMovements = (
  movements: InventoryMovement[],
  searchText: string,
  typeFilter: MovementTypeFilter,
  dateRange: DateRangeFilter
): InventoryMovement[] => {
  const search = searchText.trim().toLowerCase();
  const dateStart = getDateRangeStart(dateRange);

  return movements.filter((movement) => {
    const matchesType = typeFilter === "all" ? true : movement.type === typeFilter;

    const movementDate = new Date(movement.createdAt);
    const matchesDate = dateStart ? movementDate >= dateStart : true;

    if (!search) {
      return matchesType && matchesDate;
    }

    const searchFields = [
      movement.id,
      movement.itemName,
      movement.supplierName ?? "",
      movement.note ?? "",
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchFields.includes(search);

    return matchesType && matchesDate && matchesSearch;
  });
};

const sortMovements = (movements: InventoryMovement[], sortBy: SortBy): InventoryMovement[] => {
  const rows = movements.map((movement) => ({ ...movement }));

  if (sortBy === "newest") {
    return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (sortBy === "oldest") {
    return rows.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  if (sortBy === "item_name") {
    return rows.sort((a, b) => a.itemName.localeCompare(b.itemName));
  }

  return rows.sort((a, b) => b.quantity - a.quantity);
};

const calculateMovementKpis = (movements: InventoryMovement[]): MovementKpis => ({
  total: movements.length,
  stockIn: movements.filter((movement) => movement.type === "stock_in").length,
  stockOut: movements.filter((movement) => movement.type === "stock_out").length,
  waste: movements.filter((movement) => movement.type === "waste").length,
  adjustments: movements.filter((movement) => movement.type === "adjustment").length,
  returns: movements.filter((movement) => movement.type === "return").length,
});

const getSupplierOrReason = (movement: InventoryMovement): string => {
  if (movement.supplierName) return movement.supplierName;
  if (movement.reason) {
    const reason = movement.reason as StockOutReason;
    return reason
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return "-";
};

export default function Page() {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<MovementTypeFilter>("all");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  const filteredMovements = useMemo(
    () => filterMovements(inventoryMovements, searchText, typeFilter, dateRange),
    [searchText, typeFilter, dateRange]
  );

  const sortedMovements = useMemo(
    () => sortMovements(filteredMovements, sortBy),
    [filteredMovements, sortBy]
  );

  const kpis = calculateMovementKpis(inventoryMovements);

  const kpiItems = [
    { label: "Total Movements", value: kpis.total, hint: "All recorded movement entries" },
    { label: "Stock In Entries", value: kpis.stockIn, hint: "Inbound stock receipts", tone: "positive" },
    { label: "Stock Out Entries", value: kpis.stockOut, hint: "Issues and consumptions", tone: "warning" },
    { label: "Waste Entries", value: kpis.waste, hint: "Spoilage and wastage", tone: "critical" },
    { label: "Adjustments", value: kpis.adjustments, hint: "Manual stock corrections" },
    { label: "Returns", value: kpis.returns, hint: "Vendor return postings", tone: "warning" },
  ];

  return (
    <div className="space-y-6">
      <OpsSection
        title="Stock Movements"
        description="Review recent stock in, stock out, transfers, adjustments, waste, and returns."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Stock In" href="/admin/inventory/stock-in" />
            <OpsActionButton label="Stock Out" href="/admin/inventory/issues" tone="ghost" />
            <OpsActionButton label="Adjustments" href="/admin/inventory/adjustments" tone="ghost" />
            <OpsActionButton label="Transfers" href="/admin/inventory/transfers" tone="ghost" />
          </div>
        }
      >
        <OpsKpiGrid items={kpiItems} />
      </OpsSection>

      <OpsSection title="Filters" description="Search and refine stock movement entries.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6b4f2a]">
            Search
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search item, note, supplier, movement ID"
              className="w-full rounded-lg border border-[#e7dfd2] px-3 py-2 text-sm font-normal tracking-normal text-[#2a2927] outline-none focus:border-[#1f7a6b]"
            />
          </label>

          <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6b4f2a]">
            Type
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as MovementTypeFilter)}
              className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm font-normal tracking-normal text-[#2a2927] outline-none focus:border-[#1f7a6b]"
            >
              <option value="all">All</option>
              <option value="stock_in">Stock In</option>
              <option value="stock_out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
              <option value="transfer">Transfer</option>
              <option value="waste">Waste</option>
              <option value="return">Return</option>
            </select>
          </label>

          <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6b4f2a]">
            Date Range
            <select
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value as DateRangeFilter)}
              className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm font-normal tracking-normal text-[#2a2927] outline-none focus:border-[#1f7a6b]"
            >
              <option value="all">All Time</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
            </select>
          </label>

          <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6b4f2a]">
            Sort
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortBy)}
              className="w-full rounded-lg border border-[#e7dfd2] bg-white px-3 py-2 text-sm font-normal tracking-normal text-[#2a2927] outline-none focus:border-[#1f7a6b]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="item_name">Item Name</option>
              <option value="quantity">Quantity</option>
            </select>
          </label>
        </div>
      </OpsSection>

      <OpsSection title="Movement Ledger" description="Ledger-style view of stock movement entries.">
        <OpsTable
          columns={[
            { key: "movementId", label: "Movement ID" },
            { key: "date", label: "Date" },
            { key: "item", label: "Item" },
            { key: "type", label: "Type" },
            { key: "quantity", label: "Quantity" },
            { key: "supplierReason", label: "Supplier / Reason" },
            { key: "cost", label: "Cost" },
            { key: "note", label: "Note" },
          ]}
          rows={sortedMovements.map((movement) => ({
            id: movement.id,
            cells: {
              movementId: movement.id,
              date: formatDate(movement.createdAt),
              item: movement.itemName,
              type: (
                <OpsBadge
                  label={getMovementTypeLabel(movement.type)}
                  tone={getMovementTypeBadgeVariant(movement.type)}
                />
              ),
              quantity: `${movement.quantity} ${movement.unit}`,
              supplierReason: getSupplierOrReason(movement),
              cost: movement.cost ? formatCurrency(movement.cost) : "-",
              note: movement.note ?? "-",
            },
          }))}
          emptyLabel="No stock movements found for the selected filters."
        />
      </OpsSection>
    </div>
  );
}
