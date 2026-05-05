import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  formatCurrency,
  getInventoryStatusClass,
  getInventoryStatusLabel,
  getReorderAlertItems,
  inventoryItems,
} from "@/lib/inventory/minimalInventoryMock";

export default function Page() {
  const reorderItems = getReorderAlertItems(inventoryItems);
  const outOfStock = reorderItems.filter((item) => item.status === "out_of_stock").length;
  const estimatedReorderCost = reorderItems.reduce(
    (sum, item) => sum + item.suggestedReorderQuantity * item.costPerUnit,
    0
  );
  const suppliersNeeded = new Set(reorderItems.map((item) => item.supplierId)).size;

  return (
    <div className="space-y-6">
      <OpsSection
        title="Reorder Alerts"
        description="Review items below minimum stock and plan replenishment."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Stock In" href="/admin/inventory/stock-in" />
            <OpsActionButton label="Purchase Requests" href="/admin/inventory/purchase-requests" tone="ghost" />
            <OpsActionButton label="Item Master" href="/admin/inventory/items" tone="ghost" />
          </div>
        }
      >
        <OpsKpiGrid
          items={[
            { label: "Reorder Items", value: reorderItems.length, tone: "warning" },
            { label: "Out of Stock", value: outOfStock, tone: "critical" },
            { label: "Estimated Reorder Cost", value: formatCurrency(estimatedReorderCost) },
            { label: "Suppliers Needed", value: suppliersNeeded },
          ]}
        />
      </OpsSection>

      <OpsSection title="Items to Reorder" description="Local reorder suggestions based on minimum stock thresholds.">
        <OpsTable
          columns={[
            { key: "item", label: "Item" },
            { key: "current", label: "Current Stock" },
            { key: "minimum", label: "Minimum Stock" },
            { key: "suggested", label: "Suggested Reorder Quantity" },
            { key: "supplier", label: "Supplier" },
            { key: "cost", label: "Estimated Cost" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
          rows={reorderItems.map((item) => ({
            id: item.id,
            cells: {
              item: item.name,
              current: `${item.currentStock} ${item.unit}`,
              minimum: `${item.minimumStock} ${item.unit}`,
              suggested: `${item.suggestedReorderQuantity} ${item.unit}`,
              supplier: item.supplierName,
              cost: formatCurrency(item.suggestedReorderQuantity * item.costPerUnit),
              status: (
                <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getInventoryStatusClass(item.status)}`}>
                  {getInventoryStatusLabel(item.status)}
                </span>
              ),
              actions: (
                <div className="flex flex-wrap gap-2">
                  <OpsActionButton label="Stock In" href="/admin/inventory/stock-in" tone="ghost" />
                  <OpsActionButton label="Create Purchase Request" href="/admin/inventory/purchase-requests" tone="ghost" />
                </div>
              ),
            },
          }))}
          emptyLabel="No reorder alerts right now."
        />
      </OpsSection>
    </div>
  );
}
