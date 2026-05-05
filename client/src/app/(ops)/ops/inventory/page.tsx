import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsBadge from "@/components/ops/OpsBadge";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  calculateTotalStockValue,
  formatCurrency,
  formatDate,
  getExpiredBatches,
  getExpiringBatches,
  getLowStockItems,
  getOutOfStockItems,
  getRecentMovements,
  getRecentStockIn,
  getRecentStockOut,
  getTopValueItems,
  inventoryBatches,
  inventoryItems,
  inventoryMovements,
} from "@/lib/inventory/minimalInventoryMock";
import type { InventoryMovementType } from "@/types/inventory";

const getStatusTone = (status: string) => {
  if (status === "out_of_stock" || status === "expired") return "danger" as const;
  if (status === "low_stock" || status === "expiring_soon") return "warning" as const;
  return "success" as const;
};

const getStatusLabel = (status: string) =>
  status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getMovementTypeTone = (type: InventoryMovementType) => {
  if (type === "stock_in") return "success" as const;
  if (type === "stock_out" || type === "transfer" || type === "adjustment") return "info" as const;
  if (type === "waste") return "danger" as const;
  return "warning" as const;
};

const getMovementTypeLabel = (type: InventoryMovementType) =>
  type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default function Page() {
  const lowStockItems = getLowStockItems(inventoryItems);
  const outOfStockItems = getOutOfStockItems(inventoryItems);
  const stockValue = calculateTotalStockValue(inventoryItems);
  const expiringSoonBatches = getExpiringBatches(inventoryBatches);
  const expiredBatches = getExpiredBatches(inventoryBatches);
  const recentStockIn = getRecentStockIn(inventoryMovements);
  const recentStockOut = getRecentStockOut(inventoryMovements);
  const recentMovements = getRecentMovements(8, inventoryMovements);
  const topValueItems = getTopValueItems(6, inventoryItems);
  const expiryRiskBatches = [...expiringSoonBatches, ...expiredBatches].sort(
    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  );

  const kpis = [
    { label: "Total Items", value: inventoryItems.length, hint: "Tracked ingredients and packaging" },
    { label: "Low Stock Items", value: lowStockItems.length, hint: "Below minimum stock", tone: "warning" },
    { label: "Out of Stock Items", value: outOfStockItems.length, hint: "Needs urgent replenishment", tone: "critical" },
    { label: "Total Stock Value", value: formatCurrency(stockValue), hint: "Current on-hand valuation" },
    { label: "Expiring Batches", value: expiringSoonBatches.length + expiredBatches.length, hint: "Expiring soon + expired", tone: "warning" },
    { label: "Recent Stock In", value: recentStockIn.length, hint: "Latest inbound entries" },
  ];

  return (
    <div className="space-y-6">
      <OpsSection
        title="Stock Overview"
        description="Track bakery inventory levels, low stock, expiry risk, and recent movements."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="View Items" href="/admin/inventory/items" tone="ghost" />
            <OpsActionButton label="Stock In" href="/admin/inventory/stock-in" />
            <OpsActionButton label="Stock Out" href="/admin/inventory/issues" tone="ghost" />
            <OpsActionButton label="View Alerts" href="/admin/inventory/reorder-alerts" tone="ghost" />
          </div>
        }
      >
        <OpsKpiGrid items={kpis} />
      </OpsSection>

      <OpsSection
        title="Low Stock Items"
        description="Items at or below minimum stock level."
      >
        <OpsTable
          columns={[
            { key: "item", label: "Item" },
            { key: "currentStock", label: "Current Stock" },
            { key: "minimumStock", label: "Minimum Stock" },
            { key: "supplier", label: "Supplier" },
            { key: "status", label: "Status" },
            { key: "action", label: "Action" },
          ]}
          rows={lowStockItems.map((item) => ({
            id: item.id,
            cells: {
              item: item.name,
              currentStock: `${item.currentStock} ${item.unit}`,
              minimumStock: `${item.minimumStock} ${item.unit}`,
              supplier: item.supplierName,
              status: <OpsBadge label={getStatusLabel(item.status)} tone={getStatusTone(item.status)} />,
              action: <OpsActionButton label="Stock In" href="/admin/inventory/stock-in" tone="ghost" />,
            },
          }))}
          emptyLabel="No low stock items right now."
        />
      </OpsSection>

      <OpsSection
        title="Recent Stock Movements"
        description="Most recent inventory transactions across movement types."
      >
        <OpsTable
          columns={[
            { key: "date", label: "Date" },
            { key: "item", label: "Item" },
            { key: "type", label: "Type" },
            { key: "quantity", label: "Quantity" },
            { key: "reasonSupplier", label: "Reason / Supplier" },
            { key: "note", label: "Note" },
          ]}
          rows={recentMovements.map((movement) => ({
            id: movement.id,
            cells: {
              date: formatDate(movement.createdAt),
              item: movement.itemName,
              type: (
                <OpsBadge
                  label={getMovementTypeLabel(movement.type)}
                  tone={getMovementTypeTone(movement.type)}
                />
              ),
              quantity: `${movement.quantity} ${movement.unit}`,
              reasonSupplier: movement.supplierName ?? movement.reason ?? "-",
              note: movement.note ?? "-",
            },
          }))}
          emptyLabel="No recent stock movements available."
        />
      </OpsSection>

      <OpsSection
        title="Top Value Items"
        description="Highest on-hand inventory value by item."
      >
        <OpsTable
          columns={[
            { key: "item", label: "Item" },
            { key: "category", label: "Category" },
            { key: "currentStock", label: "Current Stock" },
            { key: "costPerUnit", label: "Cost Per Unit" },
            { key: "totalValue", label: "Total Value" },
            { key: "supplier", label: "Supplier" },
          ]}
          rows={topValueItems.map((item) => ({
            id: item.id,
            cells: {
              item: item.name,
              category: item.category,
              currentStock: `${item.currentStock} ${item.unit}`,
              costPerUnit: formatCurrency(item.costPerUnit),
              totalValue: formatCurrency(item.stockValue),
              supplier: item.supplierName,
            },
          }))}
          emptyLabel="No item valuation data available."
        />
      </OpsSection>

      <OpsSection
        title="Expiry Risk"
        description={`Expiring and expired batches requiring action. Stock out entries: ${recentStockOut.length}.`}
      >
        <OpsTable
          columns={[
            { key: "batch", label: "Batch" },
            { key: "item", label: "Item" },
            { key: "quantity", label: "Quantity" },
            { key: "expiryDate", label: "Expiry Date" },
            { key: "status", label: "Status" },
          ]}
          rows={expiryRiskBatches.map((batch) => ({
            id: batch.id,
            cells: {
              batch: batch.batchNumber,
              item: batch.itemName,
              quantity: `${batch.quantity} ${batch.unit}`,
              expiryDate: formatDate(batch.expiryDate),
              status: (
                <OpsBadge
                  label={getStatusLabel(batch.status)}
                  tone={getStatusTone(batch.status)}
                />
              ),
            },
          }))}
          emptyLabel="No expiry risk batches right now."
        />
      </OpsSection>
    </div>
  );
}
