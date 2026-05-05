import OpsSection from "@/components/ops/OpsSection";
import OpsTable from "@/components/ops/OpsTable";
import {
  formatCurrency,
  getCategorySummary,
  getUnitUsageSummary,
  inventoryItems,
} from "@/lib/inventory/minimalInventoryMock";

export default function Page() {
  const categorySummary = getCategorySummary(inventoryItems);
  const unitSummary = getUnitUsageSummary(inventoryItems);

  return (
    <div className="space-y-6">
      <OpsSection
        title="Categories & Units"
        description="Organize inventory items by category and standard measurement units."
      >
        <OpsTable
          columns={[
            { key: "category", label: "Category" },
            { key: "itemCount", label: "Item Count" },
            { key: "totalStockValue", label: "Total Stock Value" },
            { key: "lowStockItems", label: "Low Stock Items" },
          ]}
          rows={categorySummary.map((row) => ({
            id: row.category,
            cells: {
              category: row.category,
              itemCount: row.itemCount,
              totalStockValue: formatCurrency(row.totalStockValue),
              lowStockItems: row.lowStockItems,
            },
          }))}
          emptyLabel="No categories available."
        />
      </OpsSection>

      <OpsSection
        title="Units Reference"
        description="Supported units and where they are used."
      >
        <OpsTable
          columns={[
            { key: "unit", label: "Unit" },
            { key: "usedByItemsCount", label: "Used By Items Count" },
            { key: "exampleItems", label: "Example Items" },
          ]}
          rows={unitSummary.map((row) => ({
            id: row.unit,
            cells: {
              unit: row.unit,
              usedByItemsCount: row.usedByItemsCount,
              exampleItems: row.exampleItems.length > 0 ? row.exampleItems.join(", ") : "-",
            },
          }))}
          emptyLabel="No unit usage data available."
        />
      </OpsSection>
    </div>
  );
}
