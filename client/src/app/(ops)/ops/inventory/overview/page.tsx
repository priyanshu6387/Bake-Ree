import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsBadge from "@/components/ops/OpsBadge";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsMiniChart from "@/components/ops/OpsMiniChart";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  criticalItems,
  inventoryKpis,
  stockValueTrend,
  wasteTrend,
} from "@/lib/ops/inventoryMock";

export default function InventoryOverviewPage() {
  return (
    <div className="space-y-6">
      <OpsKpiGrid items={inventoryKpis} />

      <div className="grid gap-4 lg:grid-cols-3">
        <OpsMiniChart label="Stock Value Trend" value="$2.48M" trend={stockValueTrend} />
        <OpsMiniChart label="Waste Trend" value="$12.4K" trend={wasteTrend} tone="warning" />
        <OpsSection
          title="Quick Actions"
          description="Fast access to the most common inventory tasks."
          compact
        >
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Create Adjustment" href="/admin/inventory/adjustments" />
            <OpsActionButton label="Post GRN" href="/admin/inventory/goods-received" tone="ghost" />
            <OpsActionButton label="Generate PR" href="/admin/inventory/purchase-requests" tone="ghost" />
          </div>
        </OpsSection>
      </div>

      <OpsSection
        title="Critical Items"
        description="Low stock and expiring items needing attention."
        action={<OpsActionButton label="Open Alerts" href="/admin/inventory/reorder-alerts" tone="ghost" />}
      >
        <OpsTable
          columns={[
            { key: "item", label: "Item" },
            { key: "warehouse", label: "Warehouse" },
            { key: "available", label: "Available" },
            { key: "daysCover", label: "Days Cover" },
            { key: "status", label: "Status" },
          ]}
          rows={criticalItems.map((row) => ({
            id: row.id,
            cells: {
              item: row.item,
              warehouse: row.warehouse,
              available: row.available,
              daysCover: row.daysCover,
              status: (
                <OpsBadge
                  label={row.status}
                  tone={row.status === "Critical" ? "danger" : row.status === "Low" ? "warning" : "info"}
                />
              ),
            },
          }))}
        />
      </OpsSection>
    </div>
  );
}
