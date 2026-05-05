import http from "@/services/http";
import type {
  InventoryBatch,
  InventoryGoodsReceived,
  InventoryItem,
  InventoryMovement,
  InventoryPurchaseOrder,
  InventoryPurchaseRequest,
  InventoryPurchaseReturn,
  InventorySupplier,
  InventoryVendorBill,
  InventoryVendorPayment,
  InventoryVendorPrice,
} from "@/types/inventory";

const unwrap = <T>(data: { success?: boolean; message?: string } & Record<string, unknown>, key: string): T => {
  if (!data?.success) {
    throw new Error(data?.message || "Inventory API request failed");
  }
  return data[key] as T;
};

const get = async <T>(url: string, key: string, params?: Record<string, unknown>) => {
  const { data } = await http.get(url, { params });
  return unwrap<T>(data, key);
};

const post = async <T>(url: string, key: string, payload: unknown) => {
  const { data } = await http.post(url, payload);
  return unwrap<T>(data, key);
};

const patch = async <T>(url: string, key: string, payload: unknown) => {
  const { data } = await http.patch(url, payload);
  return unwrap<T>(data, key);
};

export const getInventoryItems = (params?: Record<string, unknown>) =>
  get<InventoryItem[]>("/inventory/items", "items", params);
export const createInventoryItem = (payload: unknown) => post<InventoryItem>("/inventory/items", "item", payload);
export const updateInventoryItem = (id: string, payload: unknown) =>
  patch<InventoryItem>(`/inventory/items/${id}`, "item", payload);

export const getInventorySuppliers = (params?: Record<string, unknown>) =>
  get<InventorySupplier[]>("/inventory/suppliers", "suppliers", params);
export const createInventorySupplier = (payload: unknown) =>
  post<InventorySupplier>("/inventory/suppliers", "supplier", payload);
export const updateInventorySupplier = (id: string, payload: unknown) =>
  patch<InventorySupplier>(`/inventory/suppliers/${id}`, "supplier", payload);

export const getInventoryMovements = (params?: Record<string, unknown>) =>
  get<InventoryMovement[]>("/inventory/movements", "movements", params);
export const createStockIn = (payload: unknown) => post<InventoryMovement>("/inventory/stock-in", "movement", payload);
export const createProductionIssue = (payload: unknown) => post<InventoryMovement>("/inventory/issues", "movement", payload);
export const createWaste = (payload: unknown) => post<InventoryMovement>("/inventory/waste", "movement", payload);
export const createReturn = (payload: unknown) => post<InventoryMovement>("/inventory/returns", "movement", payload);
export const createAdjustment = (payload: unknown) =>
  post<InventoryMovement>("/inventory/adjustments", "movement", payload);
export const createTransfer = (payload: unknown) => post<InventoryMovement>("/inventory/transfers", "movement", payload);

export const getInventoryBatches = (params?: Record<string, unknown>) =>
  get<InventoryBatch[]>("/inventory/batches", "batches", params);
export const createInventoryBatch = (payload: unknown) => post<InventoryBatch>("/inventory/batches", "batch", payload);
export const markInventoryBatchReviewed = (id: string, payload: unknown = {}) =>
  patch<InventoryBatch>(`/inventory/batches/${id}/review`, "batch", payload);
export const getReorderAlerts = () => get<InventoryItem[]>("/inventory/reorder-alerts", "items");
export const getExpiryAlerts = () => get<InventoryBatch[]>("/inventory/expiry-alerts", "batches");

export const getVendorPrices = (params?: Record<string, unknown>) =>
  get<InventoryVendorPrice[]>("/inventory/vendor-prices", "vendorPrices", params);
export const createVendorPrice = (payload: unknown) =>
  post<InventoryVendorPrice>("/inventory/vendor-prices", "vendorPrice", payload);
export const updateVendorPrice = (id: string, payload: unknown) =>
  patch<InventoryVendorPrice>(`/inventory/vendor-prices/${id}`, "vendorPrice", payload);

export const getPurchaseRequests = (params?: Record<string, unknown>) =>
  get<InventoryPurchaseRequest[]>("/inventory/purchase-requests", "purchaseRequests", params);
export const createPurchaseRequest = (payload: unknown) =>
  post<InventoryPurchaseRequest>("/inventory/purchase-requests", "purchaseRequest", payload);
export const updatePurchaseRequestStatus = (id: string, payload: unknown) =>
  patch<InventoryPurchaseRequest>(`/inventory/purchase-requests/${id}/status`, "purchaseRequest", payload);

export const getPurchaseOrders = (params?: Record<string, unknown>) =>
  get<InventoryPurchaseOrder[]>("/inventory/purchase-orders", "purchaseOrders", params);
export const createPurchaseOrder = (payload: unknown) =>
  post<InventoryPurchaseOrder>("/inventory/purchase-orders", "purchaseOrder", payload);
export const updatePurchaseOrderStatus = (id: string, payload: unknown) =>
  patch<InventoryPurchaseOrder>(`/inventory/purchase-orders/${id}/status`, "purchaseOrder", payload);

export const getGoodsReceived = (params?: Record<string, unknown>) =>
  get<InventoryGoodsReceived[]>("/inventory/goods-received", "goodsReceived", params);
export const createGoodsReceived = (payload: unknown) =>
  post<InventoryGoodsReceived>("/inventory/goods-received", "goodsReceipt", payload);

export const getVendorBills = (params?: Record<string, unknown>) =>
  get<InventoryVendorBill[]>("/inventory/vendor-bills", "vendorBills", params);
export const createVendorBill = (payload: unknown) =>
  post<InventoryVendorBill>("/inventory/vendor-bills", "vendorBill", payload);
export const updateVendorBillStatus = (id: string, payload: unknown) =>
  patch<InventoryVendorBill>(`/inventory/vendor-bills/${id}/status`, "vendorBill", payload);

export const getVendorPayments = (params?: Record<string, unknown>) =>
  get<InventoryVendorPayment[]>("/inventory/vendor-payments", "vendorPayments", params);
export const createVendorPayment = (payload: unknown) =>
  post<InventoryVendorPayment>("/inventory/vendor-payments", "vendorPayment", payload);

export const getPurchaseReturns = (params?: Record<string, unknown>) =>
  get<InventoryPurchaseReturn[]>("/inventory/purchase-returns", "purchaseReturns", params);
export const createPurchaseReturn = (payload: unknown) =>
  post<InventoryPurchaseReturn>("/inventory/purchase-returns", "purchaseReturn", payload);
export const updatePurchaseReturnStatus = (id: string, payload: unknown) =>
  patch<InventoryPurchaseReturn>(`/inventory/purchase-returns/${id}/status`, "purchaseReturn", payload);
