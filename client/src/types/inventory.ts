export type InventoryUnit = "kg" | "g" | "litre" | "ml" | "piece" | "box";

export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

export type InventoryMovementType = "stock_in" | "stock_out" | "adjustment" | "transfer" | "waste" | "return";

export type StockOutReason = "production" | "wastage" | "damage" | "manual_adjustment";

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  unit: InventoryUnit;
  currentStock: number;
  minimumStock: number;
  costPerUnit: number;
  supplierId: string;
  supplierName: string;
  status: InventoryStatus;
  batchTracking: boolean;
  expiryTracking: boolean;
  updatedAt: string;
};

export type InventorySupplier = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  itemsSupplied: string[];
  status: "active" | "inactive";
};

export type InventoryMovement = {
  id: string;
  itemId: string;
  itemName: string;
  type: InventoryMovementType;
  quantity: number;
  unit: InventoryUnit;
  supplierId?: string;
  supplierName?: string;
  reason?: string;
  cost?: number;
  note?: string;
  createdAt: string;
};

export type InventoryBatch = {
  id: string;
  itemId: string;
  itemName: string;
  batchNumber: string;
  quantity: number;
  unit: InventoryUnit;
  expiryDate: string;
  receivedAt: string;
  status: "valid" | "expiring_soon" | "expired";
};

export type InventoryPurchaseRequest = {
  id: string;
  requestNumber: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: InventoryUnit;
  status: "draft" | "submitted" | "approved" | "ordered";
  createdAt: string;
};

export type InventoryPurchaseOrder = {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: "draft" | "sent" | "partially_received" | "received" | "closed";
  totalAmount: number;
  createdAt: string;
};

export type InventoryVendorBill = {
  id: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  status: "unpaid" | "partially_paid" | "paid";
  dueDate: string;
  createdAt: string;
};

export type InventoryVendorPrice = {
  id: string;
  supplierId: string;
  supplierName: string;
  itemId: string;
  itemName: string;
  unit: InventoryUnit;
  pricePerUnit: number;
  leadTimeDays: number;
  updatedAt: string;
};

export type InventoryGoodsReceived = {
  id: string;
  grnNumber: string;
  poId?: string;
  poNumber?: string;
  supplierId: string;
  supplierName: string;
  receivedItems: {
    itemId: string;
    itemName: string;
    quantity: number;
    unit: InventoryUnit;
    cost: number;
  }[];
  status: "draft" | "received";
  receivedAt: string;
  createdAt: string;
};

export type InventoryVendorPayment = {
  id: string;
  paymentNumber: string;
  billId: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  method: "cash" | "bank" | "upi";
  paidAt: string;
  status: "recorded" | "reconciled";
};

export type InventoryPurchaseReturn = {
  id: string;
  returnNumber: string;
  supplierId: string;
  supplierName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: InventoryUnit;
  reason: string;
  value: number;
  status: "draft" | "sent" | "settled";
  createdAt: string;
};

export type Warehouse = {
  id: string;
  name: string;
  type: "central" | "store" | "kitchen";
  address?: string;
  zones?: string[];
  active: boolean;
};

export type StockBatch = {
  id: string;
  itemId: string;
  warehouseId: string;
  binId?: string;
  lotNumber: string;
  mfgDate?: string;
  expDate?: string;
  qtyOnHand: number;
  qtyReserved: number;
  unitCost: number;
  sourceRef?: string;
};

export type StockReservation = {
  id: string;
  itemId: string;
  warehouseId: string;
  orderId?: string;
  workOrderId?: string;
  qty: number;
  batchIdsAllocated: { batchId: string; qty: number }[];
  status: "reserved" | "released" | "consumed";
};

export type StockLedgerEntry = {
  id: string;
  ts: string;
  itemId: string;
  warehouseId: string;
  batchId?: string;
  type:
    | "IN"
    | "OUT"
    | "TRANSFER_IN"
    | "TRANSFER_OUT"
    | "ADJUST"
    | "WASTE"
    | "RETURN"
    | "ISSUE"
    | "PROD_OUT";
  qty: number;
  uom: string;
  unitCost: number;
  totalCost: number;
  refType:
    | "GRN"
    | "PO"
    | "ORDER"
    | "WORK_ORDER"
    | "ADJUSTMENT"
    | "TRANSFER"
    | "RTV"
    | "PRODUCTION";
  refId?: string;
  createdBy?: string;
  note?: string;
  beforeQty?: number;
  afterQty?: number;
  reasonCode?: string;
};
