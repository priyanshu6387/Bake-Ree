import type {
  InventoryBatch,
  InventoryItem,
  InventoryMovement,
  InventoryPurchaseOrder,
  InventoryPurchaseReturn,
  InventoryPurchaseRequest,
  InventorySupplier,
  InventoryVendorBill,
  InventoryVendorPayment,
  InventoryVendorPrice,
  InventoryGoodsReceived,
  InventoryStatus,
  InventoryUnit,
  InventoryMovementType,
} from "@/types/inventory";

export const inventorySuppliers: InventorySupplier[] = [
  { id: "sup-1", name: "Fresh Dairy Supplier", phone: "+91-9876500011", email: "ops@freshdairy.example", address: "Dairy Lane, Kolkata", itemsSupplied: ["Milk", "Cream", "Butter"], status: "active" },
  { id: "sup-2", name: "City Flour Mills", phone: "+91-9876500012", email: "sales@cityflour.example", address: "Mill Road, Kolkata", itemsSupplied: ["Flour", "Yeast", "Sugar"], status: "active" },
  { id: "sup-3", name: "ChocoTrade", phone: "+91-9876500013", email: "trade@chocotrade.example", address: "Market Street, Kolkata", itemsSupplied: ["Chocolate", "Almonds"], status: "active" },
  { id: "sup-4", name: "Packaging House", phone: "+91-9876500014", email: "support@packhouse.example", address: "Industrial Area, Kolkata", itemsSupplied: ["Packaging Boxes"], status: "active" },
  { id: "sup-5", name: "Farm Fresh Eggs", phone: "+91-9876500015", email: "orders@farmfresheggs.example", address: "Rural Belt, Kolkata", itemsSupplied: ["Eggs"], status: "active" },
];

export const inventoryItems: InventoryItem[] = [
  { id: "itm-1", name: "Flour", category: "Dry Ingredients", unit: "kg", currentStock: 420, minimumStock: 180, costPerUnit: 42, supplierId: "sup-2", supplierName: "City Flour Mills", status: "in_stock", batchTracking: true, expiryTracking: true, updatedAt: "2026-05-04T07:30:00Z" },
  { id: "itm-2", name: "Sugar", category: "Dry Ingredients", unit: "kg", currentStock: 140, minimumStock: 120, costPerUnit: 48, supplierId: "sup-2", supplierName: "City Flour Mills", status: "in_stock", batchTracking: true, expiryTracking: true, updatedAt: "2026-05-04T06:10:00Z" },
  { id: "itm-3", name: "Butter", category: "Dairy", unit: "kg", currentStock: 60, minimumStock: 80, costPerUnit: 410, supplierId: "sup-1", supplierName: "Fresh Dairy Supplier", status: "low_stock", batchTracking: true, expiryTracking: true, updatedAt: "2026-05-04T08:45:00Z" },
  { id: "itm-4", name: "Eggs", category: "Dairy", unit: "piece", currentStock: 0, minimumStock: 300, costPerUnit: 7, supplierId: "sup-5", supplierName: "Farm Fresh Eggs", status: "out_of_stock", batchTracking: true, expiryTracking: true, updatedAt: "2026-05-04T09:00:00Z" },
  { id: "itm-5", name: "Milk", category: "Dairy", unit: "litre", currentStock: 95, minimumStock: 110, costPerUnit: 62, supplierId: "sup-1", supplierName: "Fresh Dairy Supplier", status: "low_stock", batchTracking: true, expiryTracking: true, updatedAt: "2026-05-04T08:00:00Z" },
  { id: "itm-6", name: "Chocolate", category: "Flavoring", unit: "kg", currentStock: 52, minimumStock: 40, costPerUnit: 520, supplierId: "sup-3", supplierName: "ChocoTrade", status: "in_stock", batchTracking: true, expiryTracking: true, updatedAt: "2026-05-04T07:00:00Z" },
  { id: "itm-7", name: "Yeast", category: "Dry Ingredients", unit: "kg", currentStock: 12, minimumStock: 20, costPerUnit: 260, supplierId: "sup-2", supplierName: "City Flour Mills", status: "low_stock", batchTracking: true, expiryTracking: true, updatedAt: "2026-05-04T05:45:00Z" },
  { id: "itm-8", name: "Cream", category: "Dairy", unit: "litre", currentStock: 44, minimumStock: 35, costPerUnit: 185, supplierId: "sup-1", supplierName: "Fresh Dairy Supplier", status: "in_stock", batchTracking: true, expiryTracking: true, updatedAt: "2026-05-04T08:15:00Z" },
  { id: "itm-9", name: "Almonds", category: "Nuts", unit: "kg", currentStock: 18, minimumStock: 15, costPerUnit: 720, supplierId: "sup-3", supplierName: "ChocoTrade", status: "in_stock", batchTracking: true, expiryTracking: true, updatedAt: "2026-05-04T04:30:00Z" },
  { id: "itm-10", name: "Packaging Boxes", category: "Packaging", unit: "box", currentStock: 40, minimumStock: 50, costPerUnit: 35, supplierId: "sup-4", supplierName: "Packaging House", status: "low_stock", batchTracking: false, expiryTracking: false, updatedAt: "2026-05-04T06:50:00Z" },
];

export const inventoryMovements: InventoryMovement[] = [
  { id: "mov-1", itemId: "itm-1", itemName: "Flour", type: "stock_in", quantity: 100, unit: "kg", supplierId: "sup-2", supplierName: "City Flour Mills", cost: 4200, note: "Morning delivery", createdAt: "2026-05-04T08:10:00Z" },
  { id: "mov-2", itemId: "itm-3", itemName: "Butter", type: "stock_out", quantity: 12, unit: "kg", reason: "production", note: "Issued for croissant batch", createdAt: "2026-05-04T10:00:00Z" },
  { id: "mov-3", itemId: "itm-5", itemName: "Milk", type: "adjustment", quantity: 5, unit: "litre", reason: "manual_adjustment", note: "Temperature check correction", createdAt: "2026-05-03T12:15:00Z" },
  { id: "mov-4", itemId: "itm-8", itemName: "Cream", type: "waste", quantity: 3, unit: "litre", reason: "wastage", note: "Expired opened container", createdAt: "2026-05-03T17:20:00Z" },
  { id: "mov-5", itemId: "itm-6", itemName: "Chocolate", type: "return", quantity: 4, unit: "kg", supplierId: "sup-3", supplierName: "ChocoTrade", reason: "damage", note: "Damaged bags returned", createdAt: "2026-05-02T09:40:00Z" },
  { id: "mov-6", itemId: "itm-10", itemName: "Packaging Boxes", type: "stock_out", quantity: 8, unit: "box", reason: "production", note: "Dispatch packing", createdAt: "2026-05-04T11:30:00Z" },
];

export const inventoryBatches: InventoryBatch[] = [
  { id: "bat-1", itemId: "itm-1", itemName: "Flour", batchNumber: "FLR-2604-A", quantity: 160, unit: "kg", expiryDate: "2026-09-30", receivedAt: "2026-04-26", status: "valid" },
  { id: "bat-2", itemId: "itm-3", itemName: "Butter", batchNumber: "BTR-2904-C", quantity: 20, unit: "kg", expiryDate: "2026-05-09", receivedAt: "2026-04-29", status: "expiring_soon" },
  { id: "bat-3", itemId: "itm-5", itemName: "Milk", batchNumber: "MLK-0105-B", quantity: 30, unit: "litre", expiryDate: "2026-05-03", receivedAt: "2026-05-01", status: "expired" },
  { id: "bat-4", itemId: "itm-6", itemName: "Chocolate", batchNumber: "CHO-2204-D", quantity: 24, unit: "kg", expiryDate: "2026-11-15", receivedAt: "2026-04-22", status: "valid" },
];

export const inventoryPurchaseRequests: InventoryPurchaseRequest[] = [
  { id: "pr-1", requestNumber: "PR-2026-051", itemId: "itm-3", itemName: "Butter", quantity: 40, unit: "kg", status: "submitted", createdAt: "2026-05-03T10:30:00Z" },
  { id: "pr-2", requestNumber: "PR-2026-052", itemId: "itm-4", itemName: "Eggs", quantity: 500, unit: "piece", status: "approved", createdAt: "2026-05-03T13:00:00Z" },
  { id: "pr-3", requestNumber: "PR-2026-053", itemId: "itm-7", itemName: "Yeast", quantity: 20, unit: "kg", status: "draft", createdAt: "2026-05-04T07:20:00Z" },
  { id: "pr-4", requestNumber: "PR-2026-054", itemId: "itm-10", itemName: "Packaging Boxes", quantity: 50, unit: "box", status: "ordered", createdAt: "2026-05-04T09:10:00Z" },
];

export const inventoryPurchaseOrders: InventoryPurchaseOrder[] = [
  { id: "po-1", poNumber: "PO-2026-301", supplierId: "sup-2", supplierName: "City Flour Mills", status: "sent", totalAmount: 38200, createdAt: "2026-05-01T08:00:00Z" },
  { id: "po-2", poNumber: "PO-2026-302", supplierId: "sup-1", supplierName: "Fresh Dairy Supplier", status: "partially_received", totalAmount: 44600, createdAt: "2026-05-02T09:00:00Z" },
  { id: "po-3", poNumber: "PO-2026-303", supplierId: "sup-5", supplierName: "Farm Fresh Eggs", status: "received", totalAmount: 4200, createdAt: "2026-05-03T06:45:00Z" },
  { id: "po-4", poNumber: "PO-2026-304", supplierId: "sup-4", supplierName: "Packaging House", status: "draft", totalAmount: 6800, createdAt: "2026-05-04T09:40:00Z" },
];

export const inventoryVendorBills: InventoryVendorBill[] = [
  { id: "vb-1", billNumber: "BILL-2026-811", supplierId: "sup-2", supplierName: "City Flour Mills", amount: 19100, status: "partially_paid", dueDate: "2026-05-20", createdAt: "2026-05-02T11:00:00Z" },
  { id: "vb-2", billNumber: "BILL-2026-812", supplierId: "sup-1", supplierName: "Fresh Dairy Supplier", amount: 22300, status: "unpaid", dueDate: "2026-05-18", createdAt: "2026-05-03T12:00:00Z" },
  { id: "vb-3", billNumber: "BILL-2026-813", supplierId: "sup-5", supplierName: "Farm Fresh Eggs", amount: 4200, status: "paid", dueDate: "2026-05-10", createdAt: "2026-05-03T15:00:00Z" },
  { id: "vb-4", billNumber: "BILL-2026-814", supplierId: "sup-4", supplierName: "Packaging House", amount: 6800, status: "unpaid", dueDate: "2026-05-22", createdAt: "2026-05-04T10:00:00Z" },
];

export const inventoryVendorPrices: InventoryVendorPrice[] = [
  { id: "vpr-1", supplierId: "sup-2", supplierName: "City Flour Mills", itemId: "itm-1", itemName: "Flour", unit: "kg", pricePerUnit: 41, leadTimeDays: 2, updatedAt: "2026-05-03T10:00:00Z" },
  { id: "vpr-2", supplierId: "sup-2", supplierName: "City Flour Mills", itemId: "itm-2", itemName: "Sugar", unit: "kg", pricePerUnit: 47, leadTimeDays: 3, updatedAt: "2026-05-02T10:00:00Z" },
  { id: "vpr-3", supplierId: "sup-1", supplierName: "Fresh Dairy Supplier", itemId: "itm-3", itemName: "Butter", unit: "kg", pricePerUnit: 405, leadTimeDays: 1, updatedAt: "2026-05-04T09:00:00Z" },
  { id: "vpr-4", supplierId: "sup-1", supplierName: "Fresh Dairy Supplier", itemId: "itm-5", itemName: "Milk", unit: "litre", pricePerUnit: 61, leadTimeDays: 1, updatedAt: "2026-05-04T08:00:00Z" },
  { id: "vpr-5", supplierId: "sup-4", supplierName: "Packaging House", itemId: "itm-10", itemName: "Packaging Boxes", unit: "box", pricePerUnit: 34, leadTimeDays: 4, updatedAt: "2026-05-01T08:00:00Z" },
];

export const inventoryGoodsReceived: InventoryGoodsReceived[] = [
  {
    id: "grn-1",
    grnNumber: "GRN-2026-101",
    poId: "po-2",
    poNumber: "PO-2026-302",
    supplierId: "sup-1",
    supplierName: "Fresh Dairy Supplier",
    receivedItems: [
      { itemId: "itm-3", itemName: "Butter", quantity: 20, unit: "kg", cost: 8100 },
      { itemId: "itm-5", itemName: "Milk", quantity: 30, unit: "litre", cost: 1830 },
    ],
    status: "received",
    receivedAt: "2026-05-04T08:30:00Z",
    createdAt: "2026-05-04T08:45:00Z",
  },
  {
    id: "grn-2",
    grnNumber: "GRN-2026-102",
    poId: "po-3",
    poNumber: "PO-2026-303",
    supplierId: "sup-5",
    supplierName: "Farm Fresh Eggs",
    receivedItems: [{ itemId: "itm-4", itemName: "Eggs", quantity: 500, unit: "piece", cost: 4200 }],
    status: "received",
    receivedAt: "2026-05-03T06:50:00Z",
    createdAt: "2026-05-03T07:00:00Z",
  },
];

export const inventoryVendorPayments: InventoryVendorPayment[] = [
  {
    id: "vpay-1",
    paymentNumber: "PAY-2026-201",
    billId: "vb-1",
    billNumber: "BILL-2026-811",
    supplierId: "sup-2",
    supplierName: "City Flour Mills",
    amount: 10000,
    method: "bank",
    paidAt: "2026-05-04T11:00:00Z",
    status: "recorded",
  },
  {
    id: "vpay-2",
    paymentNumber: "PAY-2026-202",
    billId: "vb-3",
    billNumber: "BILL-2026-813",
    supplierId: "sup-5",
    supplierName: "Farm Fresh Eggs",
    amount: 4200,
    method: "upi",
    paidAt: "2026-05-03T15:30:00Z",
    status: "reconciled",
  },
];

export const inventoryPurchaseReturns: InventoryPurchaseReturn[] = [
  {
    id: "pret-1",
    returnNumber: "PRTN-2026-41",
    supplierId: "sup-3",
    supplierName: "ChocoTrade",
    itemId: "itm-6",
    itemName: "Chocolate",
    quantity: 4,
    unit: "kg",
    reason: "Damaged packaging",
    value: 2080,
    status: "sent",
    createdAt: "2026-05-02T10:00:00Z",
  },
];

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));

export const calculateInventoryStatus = (currentStock: number, minimumStock: number): InventoryStatus => {
  if (currentStock <= 0) return "out_of_stock";
  if (currentStock <= minimumStock) return "low_stock";
  return "in_stock";
};

export const getLowStockItems = (items: InventoryItem[] = inventoryItems) =>
  items.filter((item) => item.status === "low_stock").map((item) => ({ ...item }));

export const getOutOfStockItems = (items: InventoryItem[] = inventoryItems) =>
  items.filter((item) => item.status === "out_of_stock").map((item) => ({ ...item }));

export const calculateTotalStockValue = (items: InventoryItem[] = inventoryItems) =>
  items.reduce((total, item) => total + item.currentStock * item.costPerUnit, 0);

export const getRecentStockIn = (movements: InventoryMovement[] = inventoryMovements) =>
  movements
    .filter((movement) => movement.type === "stock_in")
    .map((movement) => ({ ...movement }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const getRecentStockOut = (movements: InventoryMovement[] = inventoryMovements) =>
  movements
    .filter((movement) => movement.type === "stock_out")
    .map((movement) => ({ ...movement }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const getExpiringBatches = (batches: InventoryBatch[] = inventoryBatches) =>
  batches.filter((batch) => batch.status === "expiring_soon").map((batch) => ({ ...batch }));

export const getExpiredBatches = (batches: InventoryBatch[] = inventoryBatches) =>
  batches.filter((batch) => batch.status === "expired").map((batch) => ({ ...batch }));

export const getRecentMovements = (limit = 5, movements: InventoryMovement[] = inventoryMovements) =>
  movements
    .map((movement) => ({ ...movement }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

export const getTopValueItems = (limit = 5, items: InventoryItem[] = inventoryItems) =>
  items
    .map((item) => ({ ...item, stockValue: item.currentStock * item.costPerUnit }))
    .sort((a, b) => b.stockValue - a.stockValue)
    .slice(0, limit);

export const getSupplierById = (supplierId: string, suppliers: InventorySupplier[] = inventorySuppliers) => {
  const supplier = suppliers.find((entry) => entry.id === supplierId);
  return supplier ? { ...supplier } : undefined;
};

export const getInventoryCategories = (items: InventoryItem[] = inventoryItems) =>
  Array.from(new Set(items.map((item) => item.category))).sort((a, b) => a.localeCompare(b));

export const getItemsByCategory = (category: string, items: InventoryItem[] = inventoryItems) =>
  items.filter((item) => item.category === category).map((item) => ({ ...item }));

export const calculateItemStockValue = (item: InventoryItem) => item.currentStock * item.costPerUnit;

export const getItemsBySupplier = (supplierId: string, items: InventoryItem[] = inventoryItems) =>
  items.filter((item) => item.supplierId === supplierId).map((item) => ({ ...item }));

export const getUnitUsageSummary = (items: InventoryItem[] = inventoryItems) => {
  const units: InventoryUnit[] = ["kg", "g", "litre", "ml", "piece", "box"];

  return units.map((unit) => {
    const unitItems = items.filter((item) => item.unit === unit);
    return {
      unit,
      usedByItemsCount: unitItems.length,
      exampleItems: unitItems.slice(0, 3).map((item) => item.name),
    };
  });
};

export const getCategorySummary = (items: InventoryItem[] = inventoryItems) => {
  const categories = getInventoryCategories(items);

  return categories
    .map((category) => {
      const categoryItems = items.filter((item) => item.category === category);
      return {
        category,
        itemCount: categoryItems.length,
        totalStockValue: categoryItems.reduce((sum, item) => sum + calculateItemStockValue(item), 0),
        lowStockItems: categoryItems.filter((item) => item.status === "low_stock" || item.status === "out_of_stock")
          .length,
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category));
};

export const createInventoryMovementId = (prefix = "mov-local") => `${prefix}-${Date.now()}`;

export const adjustItemStock = (item: InventoryItem, quantityDelta: number, updatedAt: string): InventoryItem => {
  const nextStock = Math.max(0, item.currentStock + quantityDelta);
  return {
    ...item,
    currentStock: nextStock,
    status: calculateInventoryStatus(nextStock, item.minimumStock),
    updatedAt,
  };
};

export const getMovementsByType = (
  type: InventoryMovementType,
  movements: InventoryMovement[] = inventoryMovements
) =>
  movements
    .filter((movement) => movement.type === type)
    .map((movement) => ({ ...movement }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const getItemDisplayStock = (item: InventoryItem) => `${item.currentStock} ${item.unit}`;

export const getSupplierOptions = (suppliers: InventorySupplier[] = inventorySuppliers) =>
  suppliers
    .filter((supplier) => supplier.status === "active")
    .map((supplier) => ({ id: supplier.id, name: supplier.name }));

export const getBatchStatusLabel = (status: InventoryBatch["status"]) => {
  if (status === "expiring_soon") return "Expiring Soon";
  if (status === "expired") return "Expired";
  return "Valid";
};

export const getBatchStatusClass = (status: InventoryBatch["status"]) => {
  if (status === "expiring_soon") return "bg-amber-50 text-amber-800 border-amber-200";
  if (status === "expired") return "bg-rose-50 text-rose-800 border-rose-200";
  return "bg-emerald-50 text-emerald-800 border-emerald-200";
};

export const getInventoryStatusLabel = (status: InventoryStatus) => {
  if (status === "in_stock") return "In Stock";
  if (status === "low_stock") return "Low Stock";
  return "Out of Stock";
};

export const getInventoryStatusClass = (status: InventoryStatus) => {
  if (status === "low_stock") return "bg-amber-50 text-amber-800 border-amber-200";
  if (status === "out_of_stock") return "bg-rose-50 text-rose-800 border-rose-200";
  return "bg-emerald-50 text-emerald-800 border-emerald-200";
};

export const calculateReorderQuantity = (item: InventoryItem) =>
  Math.max(item.minimumStock * 2 - item.currentStock, item.minimumStock);

export const getReorderAlertItems = (items: InventoryItem[] = inventoryItems) =>
  items
    .filter((item) => item.status === "low_stock" || item.status === "out_of_stock")
    .map((item) => ({ ...item, suggestedReorderQuantity: calculateReorderQuantity(item) }))
    .sort((a, b) => a.currentStock - b.currentStock);

export const getExpiryAlertBatches = (batches: InventoryBatch[] = inventoryBatches) =>
  batches
    .filter((batch) => batch.status === "expiring_soon" || batch.status === "expired")
    .map((batch) => ({ ...batch }))
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

export const createBatchId = (prefix = "bat-local") => `${prefix}-${Date.now()}`;
export const createTransferId = (prefix = "trf-local") => `${prefix}-${Date.now()}`;
export const createStockCountId = (prefix = "cnt-local") => `${prefix}-${Date.now()}`;
export const createVendorId = (prefix = "sup-local") => `${prefix}-${Date.now()}`;
export const createPurchaseRequestId = (prefix = "pr-local") => `${prefix}-${Date.now()}`;
export const createPurchaseOrderId = (prefix = "po-local") => `${prefix}-${Date.now()}`;
export const createGoodsReceivedId = (prefix = "grn-local") => `${prefix}-${Date.now()}`;
export const createVendorBillId = (prefix = "vb-local") => `${prefix}-${Date.now()}`;
export const createVendorPaymentId = (prefix = "vpay-local") => `${prefix}-${Date.now()}`;
export const createPurchaseReturnId = (prefix = "pret-local") => `${prefix}-${Date.now()}`;

export const calculateCategoryValuation = (items: InventoryItem[] = inventoryItems) => {
  const categories = getInventoryCategories(items);
  return categories.map((category) => {
    const categoryItems = items.filter((item) => item.category === category);
    const totalStockValue = categoryItems.reduce((sum, item) => sum + calculateItemStockValue(item), 0);
    return {
      category,
      items: categoryItems.length,
      totalStockValue,
      lowStockItems: categoryItems.filter((item) => item.status !== "in_stock").length,
      averageValue: categoryItems.length > 0 ? totalStockValue / categoryItems.length : 0,
    };
  });
};

export const calculateMovementCost = (
  movement: InventoryMovement,
  items: InventoryItem[] = inventoryItems
) => {
  const item = items.find((entry) => entry.id === movement.itemId);
  if (!item) return movement.cost ?? 0;
  const computedCost = movement.quantity * item.costPerUnit;
  return movement.cost !== undefined && movement.cost >= computedCost ? movement.cost : computedCost;
};

export const getStockOutMovements = (movements: InventoryMovement[] = inventoryMovements) =>
  getMovementsByType("stock_out", movements);

export const getWasteMovements = (movements: InventoryMovement[] = inventoryMovements) =>
  getMovementsByType("waste", movements);

export const getAdjustmentMovements = (movements: InventoryMovement[] = inventoryMovements) =>
  getMovementsByType("adjustment", movements);

export const calculateCogsSummary = (
  movements: InventoryMovement[] = inventoryMovements,
  items: InventoryItem[] = inventoryItems
) => {
  const stockOutMovements = getStockOutMovements(movements);
  const wasteMovements = getWasteMovements(movements);
  const returnMovements = getMovementsByType("return", movements);
  const adjustmentMovements = getAdjustmentMovements(movements);

  const productionIssueCost = stockOutMovements.reduce((sum, entry) => sum + calculateMovementCost(entry, items), 0);
  const wasteCost = wasteMovements.reduce((sum, entry) => sum + calculateMovementCost(entry, items), 0);
  const returnValue = returnMovements.reduce((sum, entry) => sum + calculateMovementCost(entry, items), 0);
  const adjustmentValue = adjustmentMovements.reduce((sum, entry) => sum + calculateMovementCost(entry, items), 0);
  const totalStockOutQuantity = stockOutMovements.reduce((sum, entry) => sum + entry.quantity, 0);

  return {
    estimatedCogs: productionIssueCost + wasteCost,
    productionIssueCost,
    wasteCost,
    returnValue,
    adjustmentValue,
    totalStockOutQuantity,
  };
};

export const calculateVarianceSummary = (
  movements: InventoryMovement[] = inventoryMovements,
  items: InventoryItem[] = inventoryItems
) => {
  const adjustmentMovements = getAdjustmentMovements(movements);
  const adjustedRows = adjustmentMovements.map((movement) => {
    // TODO: Adjustments do not carry explicit direction yet, infer from note text.
    const note = (movement.note ?? "").toLowerCase();
    const isNegative = note.includes("decrease") || note.includes("negative");
    const signedQuantity = isNegative ? -movement.quantity : movement.quantity;
    const signedValue = isNegative ? -calculateMovementCost(movement, items) : calculateMovementCost(movement, items);
    return { movement, signedQuantity, signedValue };
  });

  return {
    adjustmentEntries: adjustedRows.length,
    positiveVariance: adjustedRows.filter((row) => row.signedQuantity > 0).reduce((sum, row) => sum + row.signedQuantity, 0),
    negativeVariance: adjustedRows.filter((row) => row.signedQuantity < 0).reduce((sum, row) => sum + Math.abs(row.signedQuantity), 0),
    netVarianceQuantity: adjustedRows.reduce((sum, row) => sum + row.signedQuantity, 0),
    estimatedVarianceValue: adjustedRows.reduce((sum, row) => sum + row.signedValue, 0),
    itemsAffected: new Set(adjustedRows.map((row) => row.movement.itemId)).size,
  };
};

export const getSlowMovingItems = (
  items: InventoryItem[] = inventoryItems,
  movements: InventoryMovement[] = inventoryMovements,
  days = 30,
  referenceDate = new Date()
) => {
  const cutoff = new Date(referenceDate);
  cutoff.setDate(cutoff.getDate() - days);

  return items
    .filter((item) => item.currentStock > 0)
    .map((item) => {
      const relatedOutMovements = movements
        .filter(
          (movement) =>
            movement.itemId === item.id && (movement.type === "stock_out" || movement.type === "waste")
        )
        .map((movement) => ({ ...movement }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const lastMovement = relatedOutMovements[0];
      const lastMovementDate = lastMovement ? new Date(lastMovement.createdAt) : undefined;
      const noUsageRecently = !lastMovementDate || lastMovementDate < cutoff;
      const daysSinceMovement = lastMovementDate
        ? Math.floor((referenceDate.getTime() - lastMovementDate.getTime()) / (1000 * 60 * 60 * 24))
        : days + 1;

      return {
        ...item,
        totalValue: calculateItemStockValue(item),
        lastMovementDate: lastMovement?.createdAt,
        daysSinceMovement,
        noUsageRecently,
      };
    })
    .filter((item) => item.noUsageRecently)
    .sort((a, b) => b.totalValue - a.totalValue);
};

export const getInventoryValueBySupplier = (
  items: InventoryItem[] = inventoryItems,
  suppliers: InventorySupplier[] = inventorySuppliers
) =>
  suppliers.map((supplier) => {
    const suppliedItems = items.filter((item) => item.supplierId === supplier.id);
    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemsSupplied: suppliedItems.length,
      totalStockValue: suppliedItems.reduce((sum, item) => sum + calculateItemStockValue(item), 0),
      lowStockItems: suppliedItems.filter((item) => item.status !== "in_stock").length,
    };
  });

export const getInventoryReportKpis = (items: InventoryItem[] = inventoryItems) => {
  const totalStockValue = calculateTotalStockValue(items);
  const lowStockValueAtRisk = items
    .filter((item) => item.status !== "in_stock")
    .reduce((sum, item) => sum + calculateItemStockValue(item), 0);
  const highestValueItem = getTopValueItems(1, items)[0];
  const outOfStockItems = getOutOfStockItems(items).length;

  return {
    totalStockValue,
    totalItems: items.length,
    highestValueItem,
    lowStockValueAtRisk,
    outOfStockItems,
    averageItemValue: items.length > 0 ? totalStockValue / items.length : 0,
  };
};

export const getProcurementKpis = (
  purchaseRequests: InventoryPurchaseRequest[] = inventoryPurchaseRequests,
  purchaseOrders: InventoryPurchaseOrder[] = inventoryPurchaseOrders,
  vendorBills: InventoryVendorBill[] = inventoryVendorBills
) => {
  const openRequests = purchaseRequests.filter((entry) => entry.status !== "ordered").length;
  const openOrders = purchaseOrders.filter((entry) => entry.status !== "received" && entry.status !== "closed").length;
  const unpaidBills = vendorBills.filter((entry) => entry.status !== "paid").length;
  const openPoValue = purchaseOrders
    .filter((entry) => entry.status !== "received" && entry.status !== "closed")
    .reduce((sum, entry) => sum + entry.totalAmount, 0);

  return { openRequests, openOrders, unpaidBills, openPoValue };
};

export const getSupplierSpendSummary = (
  bills: InventoryVendorBill[] = inventoryVendorBills,
  suppliers: InventorySupplier[] = inventorySuppliers
) =>
  suppliers.map((supplier) => {
    const supplierBills = bills.filter((bill) => bill.supplierId === supplier.id);
    const totalBilled = supplierBills.reduce((sum, bill) => sum + bill.amount, 0);
    const unpaidAmount = supplierBills
      .filter((bill) => bill.status !== "paid")
      .reduce((sum, bill) => sum + bill.amount, 0);
    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      bills: supplierBills.length,
      totalBilled,
      unpaidAmount,
    };
  });

export const getOpenPurchaseRequests = (purchaseRequests: InventoryPurchaseRequest[] = inventoryPurchaseRequests) =>
  purchaseRequests.filter((entry) => entry.status !== "ordered").map((entry) => ({ ...entry }));

export const getOpenPurchaseOrders = (purchaseOrders: InventoryPurchaseOrder[] = inventoryPurchaseOrders) =>
  purchaseOrders
    .filter((entry) => entry.status !== "received" && entry.status !== "closed")
    .map((entry) => ({ ...entry }));

export const getUnpaidVendorBills = (vendorBills: InventoryVendorBill[] = inventoryVendorBills) =>
  vendorBills.filter((entry) => entry.status !== "paid").map((entry) => ({ ...entry }));

export const getRecentGoodsReceived = (
  limit = 5,
  goodsReceived: InventoryGoodsReceived[] = inventoryGoodsReceived
) =>
  goodsReceived
    .map((entry) => ({ ...entry, receivedItems: entry.receivedItems.map((item) => ({ ...item })) }))
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
    .slice(0, limit);

export const getVendorPricesBySupplier = (
  supplierId: string,
  vendorPrices: InventoryVendorPrice[] = inventoryVendorPrices
) => vendorPrices.filter((entry) => entry.supplierId === supplierId).map((entry) => ({ ...entry }));

export const getVendorPricesByItem = (itemId: string, vendorPrices: InventoryVendorPrice[] = inventoryVendorPrices) =>
  vendorPrices.filter((entry) => entry.itemId === itemId).map((entry) => ({ ...entry }));
