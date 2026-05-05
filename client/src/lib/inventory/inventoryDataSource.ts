import * as api from "@/services/inventoryApiService";
import type {
  InventoryBatch,
  InventoryGoodsReceived,
  InventoryItem,
  InventoryMovement,
  InventoryPurchaseOrder,
  InventoryPurchaseRequest,
  InventoryPurchaseReturn,
  StockOutReason,
  InventorySupplier,
  InventoryVendorBill,
  InventoryVendorPayment,
  InventoryVendorPrice,
} from "@/types/inventory";
import {
  adjustItemStock,
  calculateInventoryStatus,
  createBatchId,
  createGoodsReceivedId,
  createInventoryMovementId,
  createPurchaseOrderId,
  createPurchaseRequestId,
  createPurchaseReturnId,
  createVendorBillId,
  createVendorPaymentId,
  createVendorId,
  inventoryBatches,
  inventoryGoodsReceived,
  inventoryItems,
  inventoryMovements,
  inventoryPurchaseOrders,
  inventoryPurchaseRequests,
  inventoryPurchaseReturns,
  inventorySuppliers,
  inventoryVendorBills,
  inventoryVendorPayments,
  inventoryVendorPrices,
} from "@/lib/inventory/minimalInventoryMock";

type FallbackResult<T> = { data: T; usedMockFallback: boolean };

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const shouldUseInventoryApi = () => process.env.NEXT_PUBLIC_INVENTORY_USE_API === "true";

export const withInventoryMockFallback = async <T>(
  apiCall: () => Promise<T>,
  mockFactory: () => T
): Promise<FallbackResult<T>> => {
  if (!shouldUseInventoryApi()) {
    return { data: mockFactory(), usedMockFallback: false };
  }

  try {
    const data = await apiCall();
    return { data, usedMockFallback: false };
  } catch {
    return { data: mockFactory(), usedMockFallback: true };
  }
};

export const loadInventoryItems = () =>
  withInventoryMockFallback(() => api.getInventoryItems(), () => clone(inventoryItems));
export const loadInventorySuppliers = () =>
  withInventoryMockFallback(() => api.getInventorySuppliers(), () => clone(inventorySuppliers));
export const loadInventoryMovements = () =>
  withInventoryMockFallback(() => api.getInventoryMovements(), () => clone(inventoryMovements));
export const loadInventoryBatches = () =>
  withInventoryMockFallback(() => api.getInventoryBatches(), () => clone(inventoryBatches));
export const loadVendorPrices = () =>
  withInventoryMockFallback(() => api.getVendorPrices(), () => clone(inventoryVendorPrices));
export const loadPurchaseRequests = () =>
  withInventoryMockFallback(() => api.getPurchaseRequests(), () => clone(inventoryPurchaseRequests));
export const loadPurchaseOrders = () =>
  withInventoryMockFallback(() => api.getPurchaseOrders(), () => clone(inventoryPurchaseOrders));
export const loadGoodsReceived = () =>
  withInventoryMockFallback(() => api.getGoodsReceived(), () => clone(inventoryGoodsReceived));
export const loadVendorBills = () =>
  withInventoryMockFallback(() => api.getVendorBills(), () => clone(inventoryVendorBills));
export const loadVendorPayments = () =>
  withInventoryMockFallback(() => api.getVendorPayments(), () => clone(inventoryVendorPayments));
export const loadPurchaseReturns = () =>
  withInventoryMockFallback(() => api.getPurchaseReturns(), () => clone(inventoryPurchaseReturns));

export const createInventoryItemWithFallback = (payload: Partial<InventoryItem>) =>
  withInventoryMockFallback(
    () => api.createInventoryItem(payload),
    () =>
      ({
        id: createVendorId("itm-local"),
        name: payload.name || "",
        category: payload.category || "",
        unit: payload.unit || "kg",
        currentStock: Number(payload.currentStock ?? 0),
        minimumStock: Number(payload.minimumStock ?? 0),
        costPerUnit: Number(payload.costPerUnit ?? 0),
        supplierId: payload.supplierId || "",
        supplierName: payload.supplierName || "",
        status: calculateInventoryStatus(Number(payload.currentStock ?? 0), Number(payload.minimumStock ?? 0)),
        batchTracking: Boolean(payload.batchTracking),
        expiryTracking: Boolean(payload.expiryTracking),
        updatedAt: new Date().toISOString(),
      }) satisfies InventoryItem
  );

export const updateInventoryItemWithFallback = (id: string, payload: Partial<InventoryItem>, existing: InventoryItem) =>
  withInventoryMockFallback(
    () => api.updateInventoryItem(id, payload),
    () =>
      ({
        ...existing,
        ...payload,
        id,
        status: calculateInventoryStatus(
          Number(payload.currentStock ?? existing.currentStock),
          Number(payload.minimumStock ?? existing.minimumStock)
        ),
        updatedAt: new Date().toISOString(),
      }) satisfies InventoryItem
  );

export const createSupplierWithFallback = (payload: Partial<InventorySupplier>) =>
  withInventoryMockFallback(
    () => api.createInventorySupplier(payload),
    () =>
      ({
        id: createVendorId(),
        name: payload.name || "",
        phone: payload.phone || "",
        email: payload.email || "",
        address: payload.address || "",
        itemsSupplied: payload.itemsSupplied || [],
        status: payload.status || "active",
      }) satisfies InventorySupplier
  );

export const updateSupplierWithFallback = (
  id: string,
  payload: Partial<InventorySupplier>,
  existing: InventorySupplier
) => withInventoryMockFallback(() => api.updateInventorySupplier(id, payload), () => ({ ...existing, ...payload, id }));

export const createStockInWithFallback = (
  payload: { itemId: string; supplierId: string; quantity: number; cost?: number; note?: string },
  items: InventoryItem[],
  suppliers: InventorySupplier[]
) =>
  withInventoryMockFallback(
    () => api.createStockIn(payload),
    () => {
      const item = items.find((entry) => entry.id === payload.itemId);
      const supplier = suppliers.find((entry) => entry.id === payload.supplierId);
      return {
        id: createInventoryMovementId(),
        itemId: payload.itemId,
        itemName: item?.name || "",
        type: "stock_in",
        quantity: payload.quantity,
        unit: item?.unit || "kg",
        supplierId: payload.supplierId,
        supplierName: supplier?.name || "",
        cost: payload.cost,
        note: payload.note,
        createdAt: new Date().toISOString(),
      } satisfies InventoryMovement;
    }
  );

export const createIssueWithFallback = (
  payload: { itemId: string; quantity: number; note?: string },
  items: InventoryItem[]
) =>
  withInventoryMockFallback(
    () => api.createProductionIssue(payload),
    () => {
      const item = items.find((entry) => entry.id === payload.itemId);
      return {
        id: createInventoryMovementId(),
        itemId: payload.itemId,
        itemName: item?.name || "",
        type: "stock_out",
        quantity: payload.quantity,
        unit: item?.unit || "kg",
        reason: "production",
        note: payload.note,
        createdAt: new Date().toISOString(),
      } satisfies InventoryMovement;
    }
  );

export const createWasteWithFallback = (payload: { itemId: string; quantity: number; reason?: string; note?: string }, items: InventoryItem[]) =>
  withInventoryMockFallback(
    () => api.createWaste(payload),
    () => {
      const item = items.find((entry) => entry.id === payload.itemId);
      return {
        id: createInventoryMovementId(),
        itemId: payload.itemId,
        itemName: item?.name || "",
        type: "waste",
        quantity: payload.quantity,
        unit: item?.unit || "kg",
        reason: "wastage",
        note: payload.note,
        createdAt: new Date().toISOString(),
      } satisfies InventoryMovement;
    }
  );

export const createReturnWithFallback = (
  payload: { itemId: string; supplierId: string; quantity: number; reason?: StockOutReason; note?: string },
  items: InventoryItem[],
  suppliers: InventorySupplier[]
) =>
  withInventoryMockFallback(
    () => api.createReturn(payload),
    () => {
      const item = items.find((entry) => entry.id === payload.itemId);
      const supplier = suppliers.find((entry) => entry.id === payload.supplierId);
      return {
        id: createInventoryMovementId(),
        itemId: payload.itemId,
        itemName: item?.name || "",
        type: "return",
        quantity: payload.quantity,
        unit: item?.unit || "kg",
        supplierId: payload.supplierId,
        supplierName: supplier?.name || "",
        reason: "damage",
        note: payload.note,
        createdAt: new Date().toISOString(),
      } satisfies InventoryMovement;
    }
  );

export const createAdjustmentWithFallback = (
  payload: { itemId: string; quantity: number; operation: "increase" | "decrease"; reason?: string; note?: string },
  items: InventoryItem[]
) =>
  withInventoryMockFallback(
    () => api.createAdjustment(payload),
    () => {
      const item = items.find((entry) => entry.id === payload.itemId);
      return {
        id: createInventoryMovementId(),
        itemId: payload.itemId,
        itemName: item?.name || "",
        type: "adjustment",
        quantity: payload.quantity,
        unit: item?.unit || "kg",
        reason: "manual_adjustment",
        note: payload.note,
        createdAt: new Date().toISOString(),
      } satisfies InventoryMovement;
    }
  );

export const createTransferWithFallback = (payload: {
  itemId: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  reason?: string;
  note?: string;
}, items: InventoryItem[]) =>
  withInventoryMockFallback(
    () => api.createTransfer(payload),
    () => {
      const item = items.find((entry) => entry.id === payload.itemId);
      return {
        id: createInventoryMovementId(),
        itemId: payload.itemId,
        itemName: item?.name || "",
        type: "transfer",
        quantity: payload.quantity,
        unit: item?.unit || "kg",
        reason: payload.reason || "location_transfer",
        note: payload.note,
        createdAt: new Date().toISOString(),
      } satisfies InventoryMovement;
    }
  );

export const createBatchWithFallback = (payload: Partial<InventoryBatch>) =>
  withInventoryMockFallback(
    () => api.createInventoryBatch(payload),
    () =>
      ({
        id: createBatchId(),
        itemId: payload.itemId || "",
        itemName: payload.itemName || "",
        batchNumber: payload.batchNumber || "",
        quantity: Number(payload.quantity ?? 0),
        unit: payload.unit || "kg",
        expiryDate: payload.expiryDate || new Date().toISOString(),
        receivedAt: payload.receivedAt || new Date().toISOString(),
        status: payload.status || "valid",
      }) satisfies InventoryBatch
  );

export const markBatchReviewedWithFallback = (id: string) =>
  withInventoryMockFallback(() => api.markInventoryBatchReviewed(id), () => clone(inventoryBatches.find((row) => row.id === id)));

export const createVendorPriceWithFallback = (payload: Partial<InventoryVendorPrice>) =>
  withInventoryMockFallback(
    () => api.createVendorPrice(payload),
    () =>
      ({
        id: createVendorId("vpr-local"),
        supplierId: payload.supplierId || "",
        supplierName: payload.supplierName || "",
        itemId: payload.itemId || "",
        itemName: payload.itemName || "",
        unit: payload.unit || "kg",
        pricePerUnit: Number(payload.pricePerUnit ?? 0),
        leadTimeDays: Number(payload.leadTimeDays ?? 0),
        updatedAt: new Date().toISOString(),
      }) satisfies InventoryVendorPrice
  );

export const updateVendorPriceWithFallback = (
  id: string,
  payload: Partial<InventoryVendorPrice>,
  existing: InventoryVendorPrice
) => withInventoryMockFallback(() => api.updateVendorPrice(id, payload), () => ({ ...existing, ...payload, id, updatedAt: new Date().toISOString() }));

export const createPurchaseRequestWithFallback = (payload: Partial<InventoryPurchaseRequest>) =>
  withInventoryMockFallback(
    () => api.createPurchaseRequest(payload),
    () =>
      ({
        id: createPurchaseRequestId(),
        requestNumber: payload.requestNumber || `PR-${Date.now()}`,
        itemId: payload.itemId || "",
        itemName: payload.itemName || "",
        quantity: Number(payload.quantity ?? 0),
        unit: payload.unit || "kg",
        status: payload.status || "draft",
        createdAt: new Date().toISOString(),
      }) satisfies InventoryPurchaseRequest
  );

export const updatePurchaseRequestStatusWithFallback = (
  id: string,
  payload: Partial<InventoryPurchaseRequest>,
  existing: InventoryPurchaseRequest
) => withInventoryMockFallback(() => api.updatePurchaseRequestStatus(id, payload), () => ({ ...existing, ...payload, id }));

export const createPurchaseOrderWithFallback = (payload: Partial<InventoryPurchaseOrder>) =>
  withInventoryMockFallback(
    () => api.createPurchaseOrder(payload),
    () =>
      ({
        id: createPurchaseOrderId(),
        poNumber: payload.poNumber || `PO-${Date.now()}`,
        supplierId: payload.supplierId || "",
        supplierName: payload.supplierName || "",
        status: payload.status || "draft",
        totalAmount: Number(payload.totalAmount ?? 0),
        createdAt: new Date().toISOString(),
      }) satisfies InventoryPurchaseOrder
  );

export const updatePurchaseOrderStatusWithFallback = (
  id: string,
  payload: Partial<InventoryPurchaseOrder>,
  existing: InventoryPurchaseOrder
) => withInventoryMockFallback(() => api.updatePurchaseOrderStatus(id, payload), () => ({ ...existing, ...payload, id }));

export const createGoodsReceivedWithFallback = (payload: Partial<InventoryGoodsReceived>) =>
  withInventoryMockFallback(
    () => api.createGoodsReceived(payload),
    () =>
      ({
        id: createGoodsReceivedId(),
        grnNumber: payload.grnNumber || `GRN-${Date.now()}`,
        poId: payload.poId,
        poNumber: payload.poNumber,
        supplierId: payload.supplierId || "",
        supplierName: payload.supplierName || "",
        receivedItems: clone(payload.receivedItems || []),
        status: payload.status || "draft",
        receivedAt: payload.receivedAt || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }) satisfies InventoryGoodsReceived
  );

export const createVendorBillWithFallback = (payload: Partial<InventoryVendorBill>) =>
  withInventoryMockFallback(
    () => api.createVendorBill(payload),
    () =>
      ({
        id: createVendorBillId(),
        billNumber: payload.billNumber || `BILL-${Date.now()}`,
        supplierId: payload.supplierId || "",
        supplierName: payload.supplierName || "",
        amount: Number(payload.amount ?? 0),
        status: payload.status || "unpaid",
        dueDate: payload.dueDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }) satisfies InventoryVendorBill
  );

export const updateVendorBillStatusWithFallback = (
  id: string,
  payload: Partial<InventoryVendorBill>,
  existing: InventoryVendorBill
) => withInventoryMockFallback(() => api.updateVendorBillStatus(id, payload), () => ({ ...existing, ...payload, id }));

export const createVendorPaymentWithFallback = (payload: Partial<InventoryVendorPayment>) =>
  withInventoryMockFallback(
    () => api.createVendorPayment(payload),
    () =>
      ({
        id: createVendorPaymentId(),
        paymentNumber: payload.paymentNumber || `PAY-${Date.now()}`,
        billId: payload.billId || "",
        billNumber: payload.billNumber || "",
        supplierId: payload.supplierId || "",
        supplierName: payload.supplierName || "",
        amount: Number(payload.amount ?? 0),
        method: payload.method || "cash",
        paidAt: payload.paidAt || new Date().toISOString(),
        status: payload.status || "recorded",
      }) satisfies InventoryVendorPayment
  );

export const createPurchaseReturnWithFallback = (payload: Partial<InventoryPurchaseReturn>) =>
  withInventoryMockFallback(
    () => api.createPurchaseReturn(payload),
    () =>
      ({
        id: createPurchaseReturnId(),
        returnNumber: payload.returnNumber || `PRET-${Date.now()}`,
        supplierId: payload.supplierId || "",
        supplierName: payload.supplierName || "",
        itemId: payload.itemId || "",
        itemName: payload.itemName || "",
        quantity: Number(payload.quantity ?? 0),
        unit: payload.unit || "kg",
        reason: payload.reason || "",
        value: Number(payload.value ?? 0),
        status: payload.status || "draft",
        createdAt: new Date().toISOString(),
      }) satisfies InventoryPurchaseReturn
  );

export const updatePurchaseReturnStatusWithFallback = (
  id: string,
  payload: Partial<InventoryPurchaseReturn>,
  existing: InventoryPurchaseReturn
) => withInventoryMockFallback(() => api.updatePurchaseReturnStatus(id, payload), () => ({ ...existing, ...payload, id }));

export const applyStockDelta = (item: InventoryItem, delta: number) =>
  adjustItemStock(item, delta, new Date().toISOString());
