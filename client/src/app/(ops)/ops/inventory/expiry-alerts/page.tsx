"use client";

import { useMemo, useState } from "react";
import OpsActionButton from "@/components/ops/OpsActionButton";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  formatDate,
  getBatchStatusClass,
  getBatchStatusLabel,
  getExpiryAlertBatches,
  inventoryBatches,
} from "@/lib/inventory/minimalInventoryMock";
import type { InventoryBatch } from "@/types/inventory";

export default function Page() {
  const [reviewedBatchIds, setReviewedBatchIds] = useState<string[]>([]);

  const expiryBatches: InventoryBatch[] = useMemo(() => getExpiryAlertBatches(inventoryBatches), []);

  const expiringSoon = expiryBatches.filter((batch) => batch.status === "expiring_soon").length;
  const expired = expiryBatches.filter((batch) => batch.status === "expired").length;
  const expiryRiskQuantity = expiryBatches.reduce((sum, batch) => sum + batch.quantity, 0);
  const itemsAtRisk = new Set(expiryBatches.map((batch) => batch.itemId)).size;

  return (
    <div className="space-y-6">
      <OpsSection
        title="Expiry Alerts"
        description="Monitor expiring and expired batches to reduce spoilage and waste."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsActionButton label="Batch & Expiry" href="/admin/inventory/batches" tone="ghost" />
            <OpsActionButton label="Waste & Spoilage" href="/admin/inventory/waste" />
          </div>
        }
      >
        <OpsKpiGrid
          items={[
            { label: "Expiring Soon", value: expiringSoon, tone: "warning" },
            { label: "Expired", value: expired, tone: "critical" },
            { label: "Expiry Risk Quantity", value: expiryRiskQuantity },
            { label: "Items at Risk", value: itemsAtRisk, tone: "warning" },
          ]}
        />
      </OpsSection>

      <OpsSection title="Expiry Risk Batches" description="Batches requiring immediate review or disposal action.">
        <OpsTable
          columns={[
            { key: "batch", label: "Batch" },
            { key: "item", label: "Item" },
            { key: "quantity", label: "Quantity" },
            { key: "receivedAt", label: "Received At" },
            { key: "expiryDate", label: "Expiry Date" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
          rows={expiryBatches.map((batch) => ({
            id: batch.id,
            cells: {
              batch: batch.batchNumber,
              item: batch.itemName,
              quantity: `${batch.quantity} ${batch.unit}`,
              receivedAt: formatDate(batch.receivedAt),
              expiryDate: formatDate(batch.expiryDate),
              status: (
                <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getBatchStatusClass(batch.status)}`}>
                  {getBatchStatusLabel(batch.status)}
                </span>
              ),
              actions: (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewedBatchIds((prev) => (prev.includes(batch.id) ? prev : [...prev, batch.id]))}
                    className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-semibold hover:bg-[#f7f5f0]"
                  >
                    {reviewedBatchIds.includes(batch.id) ? "Reviewed" : "Mark Reviewed"}
                  </button>
                  <OpsActionButton label="Record Waste" href="/admin/inventory/waste" tone="ghost" />
                </div>
              ),
            },
          }))}
          emptyLabel="No expiry alerts found."
        />
      </OpsSection>
    </div>
  );
}
