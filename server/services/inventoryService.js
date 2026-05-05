import mongoose from "mongoose";
import InventoryItem from "../models/InventoryItem.js";
import InventorySupplier from "../models/InventorySupplier.js";
import InventoryMovement from "../models/InventoryMovement.js";
import InventoryBatch from "../models/InventoryBatch.js";
import InventoryVendorPrice from "../models/InventoryVendorPrice.js";
import InventoryPurchaseRequest from "../models/InventoryPurchaseRequest.js";
import InventoryPurchaseOrder from "../models/InventoryPurchaseOrder.js";
import InventoryGoodsReceived from "../models/InventoryGoodsReceived.js";
import InventoryVendorBill from "../models/InventoryVendorBill.js";
import InventoryVendorPayment from "../models/InventoryVendorPayment.js";
import InventoryPurchaseReturn from "../models/InventoryPurchaseReturn.js";

const getItemStatus = (currentStock, minimumStock) => {
  if (currentStock <= 0) return "out_of_stock";
  if (currentStock <= minimumStock) return "low_stock";
  return "in_stock";
};

const getBatchStatus = (expiryDateInput) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDate = new Date(expiryDateInput);
  const expiryStart = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());

  if (expiryStart < today) return "expired";
  const sevenDaysFromToday = new Date(today);
  sevenDaysFromToday.setDate(sevenDaysFromToday.getDate() + 7);
  if (expiryStart <= sevenDaysFromToday) return "expiring_soon";
  return "valid";
};

const toISO = (value) => (value ? new Date(value).toISOString() : null);

const mapItem = (itemDoc) => ({
  id: itemDoc._id.toString(),
  name: itemDoc.name,
  category: itemDoc.category,
  unit: itemDoc.unit,
  currentStock: itemDoc.currentStock,
  minimumStock: itemDoc.minimumStock,
  costPerUnit: itemDoc.costPerUnit,
  supplierId: itemDoc.supplier ? itemDoc.supplier.toString() : "",
  supplierName: itemDoc.supplierName || "",
  status: itemDoc.status,
  batchTracking: itemDoc.batchTracking,
  expiryTracking: itemDoc.expiryTracking,
  createdAt: toISO(itemDoc.createdAt),
  updatedAt: toISO(itemDoc.updatedAt),
});

const mapSupplier = (supplierDoc) => ({
  id: supplierDoc._id.toString(),
  name: supplierDoc.name,
  phone: supplierDoc.phone || "",
  email: supplierDoc.email || "",
  address: supplierDoc.address || "",
  itemsSupplied: Array.isArray(supplierDoc.itemsSupplied) ? supplierDoc.itemsSupplied : [],
  status: supplierDoc.status,
  createdAt: toISO(supplierDoc.createdAt),
  updatedAt: toISO(supplierDoc.updatedAt),
});

const mapMovement = (movementDoc) => ({
  id: movementDoc._id.toString(),
  itemId: movementDoc.item.toString(),
  itemName: movementDoc.itemName,
  type: movementDoc.type,
  quantity: movementDoc.quantity,
  unit: movementDoc.unit,
  supplierId: movementDoc.supplier ? movementDoc.supplier.toString() : "",
  supplierName: movementDoc.supplierName || "",
  reason: movementDoc.reason || "",
  cost: movementDoc.cost,
  note: movementDoc.note || "",
  fromLocation: movementDoc.fromLocation || "",
  toLocation: movementDoc.toLocation || "",
  createdBy: movementDoc.createdBy ? movementDoc.createdBy.toString() : "",
  createdAt: toISO(movementDoc.createdAt),
  updatedAt: toISO(movementDoc.updatedAt),
});

const mapBatch = (batchDoc) => ({
  id: batchDoc._id.toString(),
  itemId: batchDoc.item.toString(),
  itemName: batchDoc.itemName,
  batchNumber: batchDoc.batchNumber,
  quantity: batchDoc.quantity,
  unit: batchDoc.unit,
  expiryDate: toISO(batchDoc.expiryDate),
  receivedAt: toISO(batchDoc.receivedAt),
  status: batchDoc.status,
  createdAt: toISO(batchDoc.createdAt),
  updatedAt: toISO(batchDoc.updatedAt),
});

const parsePositiveNumber = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
};

const validateObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const parseNonNegativeNumber = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
};
const makeDisplayNumber = (prefix) => {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
};
const PURCHASE_REQUEST_STATUSES = ["draft", "submitted", "approved", "ordered"];
const PURCHASE_ORDER_STATUSES = ["draft", "sent", "partially_received", "received", "closed"];
const GOODS_RECEIVED_STATUSES = ["draft", "received"];
const VENDOR_BILL_STATUSES = ["unpaid", "partially_paid", "paid"];
const VENDOR_PAYMENT_STATUSES = ["recorded", "reconciled"];
const VENDOR_PAYMENT_METHODS = ["cash", "bank", "upi"];
const PURCHASE_RETURN_STATUSES = ["draft", "sent", "settled"];

const findItemOrThrow = async (itemId) => {
  if (!validateObjectId(itemId)) throw new Error("Invalid item id");
  const item = await InventoryItem.findById(itemId);
  if (!item) throw new Error("Inventory item not found");
  return item;
};

const findSupplierOrThrow = async (supplierId) => {
  if (!validateObjectId(supplierId)) throw new Error("Invalid supplier id");
  const supplier = await InventorySupplier.findById(supplierId);
  if (!supplier) throw new Error("Inventory supplier not found");
  return supplier;
};

const findPurchaseOrderOrThrow = async (poId) => {
  if (!validateObjectId(poId)) throw new Error("Invalid purchase order id");
  const purchaseOrder = await InventoryPurchaseOrder.findById(poId);
  if (!purchaseOrder) throw new Error("Inventory purchase order not found");
  return purchaseOrder;
};

const findVendorBillOrThrow = async (billId) => {
  if (!validateObjectId(billId)) throw new Error("Invalid vendor bill id");
  const bill = await InventoryVendorBill.findById(billId);
  if (!bill) throw new Error("Inventory vendor bill not found");
  return bill;
};

const mapVendorPrice = (doc) => ({
  id: doc._id.toString(),
  supplierId: doc.supplier.toString(),
  supplierName: doc.supplierName,
  itemId: doc.item.toString(),
  itemName: doc.itemName,
  unit: doc.unit,
  pricePerUnit: doc.pricePerUnit,
  leadTimeDays: doc.leadTimeDays,
  updatedAt: toISO(doc.updatedAt),
  createdAt: toISO(doc.createdAt),
});

const mapPurchaseRequest = (doc) => ({
  id: doc._id.toString(),
  requestNumber: doc.requestNumber,
  itemId: doc.item.toString(),
  itemName: doc.itemName,
  quantity: doc.quantity,
  unit: doc.unit,
  status: doc.status,
  createdAt: toISO(doc.createdAt),
  updatedAt: toISO(doc.updatedAt),
});

const mapPurchaseOrder = (doc) => ({
  id: doc._id.toString(),
  poNumber: doc.poNumber,
  supplierId: doc.supplier.toString(),
  supplierName: doc.supplierName,
  status: doc.status,
  totalAmount: doc.totalAmount,
  createdAt: toISO(doc.createdAt),
  updatedAt: toISO(doc.updatedAt),
});

const mapGoodsReceived = (doc) => ({
  id: doc._id.toString(),
  grnNumber: doc.grnNumber,
  poId: doc.po ? doc.po.toString() : "",
  poNumber: doc.poNumber || "",
  supplierId: doc.supplier.toString(),
  supplierName: doc.supplierName,
  receivedItems: doc.receivedItems.map((line) => ({
    itemId: line.item.toString(),
    itemName: line.itemName,
    quantity: line.quantity,
    unit: line.unit,
    cost: line.cost,
  })),
  status: doc.status,
  receivedAt: toISO(doc.receivedAt),
  createdAt: toISO(doc.createdAt),
  updatedAt: toISO(doc.updatedAt),
});

const mapVendorBill = (doc) => ({
  id: doc._id.toString(),
  billNumber: doc.billNumber,
  supplierId: doc.supplier.toString(),
  supplierName: doc.supplierName,
  amount: doc.amount,
  status: doc.status,
  dueDate: toISO(doc.dueDate),
  createdAt: toISO(doc.createdAt),
  updatedAt: toISO(doc.updatedAt),
});

const mapVendorPayment = (doc) => ({
  id: doc._id.toString(),
  paymentNumber: doc.paymentNumber,
  billId: doc.bill.toString(),
  billNumber: doc.billNumber,
  supplierId: doc.supplier.toString(),
  supplierName: doc.supplierName,
  amount: doc.amount,
  method: doc.method,
  paidAt: toISO(doc.paidAt),
  status: doc.status,
  createdAt: toISO(doc.createdAt),
  updatedAt: toISO(doc.updatedAt),
});

const mapPurchaseReturn = (doc) => ({
  id: doc._id.toString(),
  returnNumber: doc.returnNumber,
  supplierId: doc.supplier.toString(),
  supplierName: doc.supplierName,
  itemId: doc.item.toString(),
  itemName: doc.itemName,
  quantity: doc.quantity,
  unit: doc.unit,
  reason: doc.reason,
  value: doc.value,
  status: doc.status,
  createdAt: toISO(doc.createdAt),
  updatedAt: toISO(doc.updatedAt),
});

const createMovement = async ({
  item,
  type,
  quantity,
  supplier = null,
  reason = "",
  cost,
  note = "",
  fromLocation = "",
  toLocation = "",
  createdBy,
}) => {
  const movement = await InventoryMovement.create({
    item: item._id,
    itemName: item.name,
    type,
    quantity,
    unit: item.unit,
    supplier: supplier?._id,
    supplierName: supplier?.name || "",
    reason,
    cost,
    note,
    fromLocation,
    toLocation,
    createdBy,
  });

  return mapMovement(movement);
};

export const listItems = async () => {
  const items = await InventoryItem.find().sort({ updatedAt: -1 });
  return items.map(mapItem);
};

export const createItem = async (payload) => {
  const supplier = payload.supplierId ? await findSupplierOrThrow(payload.supplierId) : null;
  const currentStock = Number(payload.currentStock ?? 0);
  const minimumStock = Number(payload.minimumStock ?? 0);
  const item = await InventoryItem.create({
    name: payload.name,
    category: payload.category,
    unit: payload.unit,
    currentStock,
    minimumStock,
    costPerUnit: Number(payload.costPerUnit ?? 0),
    supplier: supplier?._id,
    supplierName: payload.supplierName || supplier?.name || "",
    status: getItemStatus(currentStock, minimumStock),
    batchTracking: Boolean(payload.batchTracking),
    expiryTracking: Boolean(payload.expiryTracking),
  });
  return mapItem(item);
};

export const updateItem = async (id, payload) => {
  const item = await findItemOrThrow(id);
  let supplier = null;
  if (payload.supplierId !== undefined) {
    supplier = payload.supplierId ? await findSupplierOrThrow(payload.supplierId) : null;
    item.supplier = supplier?._id;
    item.supplierName = payload.supplierName || supplier?.name || "";
  }

  if (payload.name !== undefined) item.name = payload.name;
  if (payload.category !== undefined) item.category = payload.category;
  if (payload.unit !== undefined) item.unit = payload.unit;
  if (payload.currentStock !== undefined) item.currentStock = Number(payload.currentStock);
  if (payload.minimumStock !== undefined) item.minimumStock = Number(payload.minimumStock);
  if (payload.costPerUnit !== undefined) item.costPerUnit = Number(payload.costPerUnit);
  if (payload.batchTracking !== undefined) item.batchTracking = Boolean(payload.batchTracking);
  if (payload.expiryTracking !== undefined) item.expiryTracking = Boolean(payload.expiryTracking);
  if (payload.supplierName !== undefined && payload.supplierId === undefined) {
    item.supplierName = payload.supplierName;
  }

  item.status = getItemStatus(item.currentStock, item.minimumStock);
  await item.save();
  return mapItem(item);
};

export const listSuppliers = async () => {
  const suppliers = await InventorySupplier.find().sort({ updatedAt: -1 });
  return suppliers.map(mapSupplier);
};

export const createSupplier = async (payload) => {
  const supplier = await InventorySupplier.create({
    name: payload.name,
    phone: payload.phone || "",
    email: payload.email || "",
    address: payload.address || "",
    itemsSupplied: Array.isArray(payload.itemsSupplied) ? payload.itemsSupplied : [],
    status: payload.status || "active",
  });
  return mapSupplier(supplier);
};

export const updateSupplier = async (id, payload) => {
  if (!validateObjectId(id)) throw new Error("Invalid supplier id");
  const supplier = await InventorySupplier.findById(id);
  if (!supplier) throw new Error("Inventory supplier not found");
  if (payload.name !== undefined) supplier.name = payload.name;
  if (payload.phone !== undefined) supplier.phone = payload.phone;
  if (payload.email !== undefined) supplier.email = payload.email;
  if (payload.address !== undefined) supplier.address = payload.address;
  if (payload.itemsSupplied !== undefined) {
    supplier.itemsSupplied = Array.isArray(payload.itemsSupplied) ? payload.itemsSupplied : [];
  }
  if (payload.status !== undefined) supplier.status = payload.status;
  await supplier.save();
  return mapSupplier(supplier);
};

export const listMovements = async () => {
  const movements = await InventoryMovement.find().sort({ createdAt: -1 });
  return movements.map(mapMovement);
};

export const stockIn = async (payload, userId) => {
  const quantity = parsePositiveNumber(payload.quantity);
  if (!quantity) throw new Error("quantity must be greater than 0");
  if (!payload.supplierId) throw new Error("supplierId is required");

  const [item, supplier] = await Promise.all([
    findItemOrThrow(payload.itemId),
    findSupplierOrThrow(payload.supplierId),
  ]);

  item.currentStock += quantity;
  item.status = getItemStatus(item.currentStock, item.minimumStock);
  if (!item.supplier && supplier) {
    item.supplier = supplier._id;
    item.supplierName = supplier.name;
  }
  await item.save();

  return createMovement({
    item,
    type: "stock_in",
    quantity,
    supplier,
    reason: payload.reason || "stock_in",
    cost: payload.cost,
    note: payload.note || "",
    createdBy: userId,
  });
};

export const issueStock = async (payload, userId) => {
  const quantity = parsePositiveNumber(payload.quantity);
  if (!quantity) throw new Error("quantity must be greater than 0");
  const item = await findItemOrThrow(payload.itemId);
  if (quantity > item.currentStock) throw new Error("quantity cannot exceed currentStock");

  item.currentStock -= quantity;
  item.status = getItemStatus(item.currentStock, item.minimumStock);
  await item.save();

  return createMovement({
    item,
    type: "stock_out",
    quantity,
    reason: "production",
    note: payload.note || "",
    createdBy: userId,
  });
};

export const recordWaste = async (payload, userId) => {
  const quantity = parsePositiveNumber(payload.quantity);
  if (!quantity) throw new Error("quantity must be greater than 0");
  const item = await findItemOrThrow(payload.itemId);
  if (quantity > item.currentStock) throw new Error("quantity cannot exceed currentStock");

  item.currentStock -= quantity;
  item.status = getItemStatus(item.currentStock, item.minimumStock);
  await item.save();

  return createMovement({
    item,
    type: "waste",
    quantity,
    reason: payload.reason || "wastage",
    note: payload.note || "",
    createdBy: userId,
  });
};

export const returnStock = async (payload, userId) => {
  const quantity = parsePositiveNumber(payload.quantity);
  if (!quantity) throw new Error("quantity must be greater than 0");
  if (!payload.supplierId) throw new Error("supplierId is required");
  const [item, supplier] = await Promise.all([
    findItemOrThrow(payload.itemId),
    findSupplierOrThrow(payload.supplierId),
  ]);
  if (quantity > item.currentStock) throw new Error("quantity cannot exceed currentStock");

  item.currentStock -= quantity;
  item.status = getItemStatus(item.currentStock, item.minimumStock);
  await item.save();

  return createMovement({
    item,
    type: "return",
    quantity,
    supplier,
    reason: payload.reason || "return_to_supplier",
    note: payload.note || "",
    createdBy: userId,
  });
};

export const adjustStock = async (payload, userId) => {
  const quantity = parsePositiveNumber(payload.quantity);
  if (!quantity) throw new Error("quantity must be greater than 0");
  const operation = payload.operation === "decrease" ? "decrease" : "increase";
  const item = await findItemOrThrow(payload.itemId);

  if (operation === "decrease") {
    if (quantity > item.currentStock) throw new Error("quantity cannot exceed currentStock");
    item.currentStock -= quantity;
  } else {
    item.currentStock += quantity;
  }

  item.status = getItemStatus(item.currentStock, item.minimumStock);
  await item.save();

  return createMovement({
    item,
    type: "adjustment",
    quantity,
    reason: payload.reason || `manual_${operation}`,
    note: payload.note || "",
    createdBy: userId,
  });
};

export const transferStock = async (payload, userId) => {
  const quantity = parsePositiveNumber(payload.quantity);
  if (!quantity) throw new Error("quantity must be greater than 0");
  if (!payload.fromLocation || !payload.toLocation) {
    throw new Error("fromLocation and toLocation are required");
  }
  if (payload.fromLocation === payload.toLocation) {
    throw new Error("fromLocation and toLocation must be different");
  }

  const item = await findItemOrThrow(payload.itemId);
  if (quantity > item.currentStock) throw new Error("quantity cannot exceed currentStock");

  return createMovement({
    item,
    type: "transfer",
    quantity,
    reason: payload.reason || "location_transfer",
    note: payload.note || "",
    fromLocation: payload.fromLocation,
    toLocation: payload.toLocation,
    createdBy: userId,
  });
};

export const listBatches = async () => {
  const batches = await InventoryBatch.find().sort({ expiryDate: 1, createdAt: -1 });
  return batches.map(mapBatch);
};

export const createBatch = async (payload) => {
  const quantity = parsePositiveNumber(payload.quantity);
  if (!quantity) throw new Error("quantity must be greater than 0");
  if (!payload.batchNumber) throw new Error("batchNumber is required");
  if (!payload.expiryDate) throw new Error("expiryDate is required");
  if (!payload.receivedAt) throw new Error("receivedAt is required");
  const item = await findItemOrThrow(payload.itemId);

  const batch = await InventoryBatch.create({
    item: item._id,
    itemName: item.name,
    batchNumber: payload.batchNumber,
    quantity,
    unit: payload.unit || item.unit,
    expiryDate: new Date(payload.expiryDate),
    receivedAt: new Date(payload.receivedAt),
    status: getBatchStatus(payload.expiryDate),
  });

  return mapBatch(batch);
};

export const reviewBatch = async (id, payload) => {
  if (!validateObjectId(id)) throw new Error("Invalid batch id");
  const batch = await InventoryBatch.findById(id);
  if (!batch) throw new Error("Inventory batch not found");

  if (payload.expiryDate !== undefined) batch.expiryDate = new Date(payload.expiryDate);
  if (payload.receivedAt !== undefined) batch.receivedAt = new Date(payload.receivedAt);
  if (payload.quantity !== undefined) batch.quantity = Number(payload.quantity);
  if (payload.batchNumber !== undefined) batch.batchNumber = payload.batchNumber;
  if (payload.unit !== undefined) batch.unit = payload.unit;

  batch.status = getBatchStatus(batch.expiryDate);
  await batch.save();
  return mapBatch(batch);
};

export const getReorderAlerts = async () => {
  const items = await InventoryItem.find({
    $expr: { $lte: ["$currentStock", "$minimumStock"] },
  }).sort({ currentStock: 1, updatedAt: -1 });

  return items.map(mapItem);
};

export const getExpiryAlerts = async () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysFromToday = new Date(today);
  sevenDaysFromToday.setDate(sevenDaysFromToday.getDate() + 7);

  const batches = await InventoryBatch.find({
    expiryDate: { $lte: sevenDaysFromToday },
  }).sort({ expiryDate: 1 });

  const hydrated = [];
  for (const batch of batches) {
    batch.status = getBatchStatus(batch.expiryDate);
    await batch.save();
    hydrated.push(mapBatch(batch));
  }
  return hydrated;
};

export const listVendorPrices = async () => {
  const rows = await InventoryVendorPrice.find().sort({ updatedAt: -1 });
  return rows.map(mapVendorPrice);
};

export const createVendorPrice = async (payload) => {
  const pricePerUnit = parseNonNegativeNumber(payload.pricePerUnit);
  if (pricePerUnit === null) throw new Error("pricePerUnit must be greater than or equal to 0");
  const leadTimeDays = parseNonNegativeNumber(payload.leadTimeDays ?? 0);
  if (leadTimeDays === null) throw new Error("leadTimeDays must be greater than or equal to 0");

  const [supplier, item] = await Promise.all([
    findSupplierOrThrow(payload.supplierId),
    findItemOrThrow(payload.itemId),
  ]);

  const row = await InventoryVendorPrice.create({
    supplier: supplier._id,
    supplierName: payload.supplierName || supplier.name,
    item: item._id,
    itemName: payload.itemName || item.name,
    unit: payload.unit || item.unit,
    pricePerUnit,
    leadTimeDays,
    updatedAt: new Date(),
  });

  return mapVendorPrice(row);
};

export const updateVendorPrice = async (id, payload) => {
  if (!validateObjectId(id)) throw new Error("Invalid vendor price id");
  const row = await InventoryVendorPrice.findById(id);
  if (!row) throw new Error("Inventory vendor price not found");

  if (payload.supplierId !== undefined) {
    const supplier = await findSupplierOrThrow(payload.supplierId);
    row.supplier = supplier._id;
    row.supplierName = payload.supplierName || supplier.name;
  } else if (payload.supplierName !== undefined) {
    row.supplierName = payload.supplierName;
  }

  if (payload.itemId !== undefined) {
    const item = await findItemOrThrow(payload.itemId);
    row.item = item._id;
    row.itemName = payload.itemName || item.name;
    if (payload.unit === undefined) row.unit = item.unit;
  } else if (payload.itemName !== undefined) {
    row.itemName = payload.itemName;
  }

  if (payload.unit !== undefined) row.unit = payload.unit;
  if (payload.pricePerUnit !== undefined) {
    const parsed = parseNonNegativeNumber(payload.pricePerUnit);
    if (parsed === null) throw new Error("pricePerUnit must be greater than or equal to 0");
    row.pricePerUnit = parsed;
  }
  if (payload.leadTimeDays !== undefined) {
    const parsed = parseNonNegativeNumber(payload.leadTimeDays);
    if (parsed === null) throw new Error("leadTimeDays must be greater than or equal to 0");
    row.leadTimeDays = parsed;
  }

  row.updatedAt = new Date();
  await row.save();
  return mapVendorPrice(row);
};

export const listPurchaseRequests = async () => {
  const rows = await InventoryPurchaseRequest.find().sort({ createdAt: -1 });
  return rows.map(mapPurchaseRequest);
};

export const createPurchaseRequest = async (payload) => {
  const quantity = parsePositiveNumber(payload.quantity);
  if (!quantity) throw new Error("quantity must be greater than 0");
  const item = await findItemOrThrow(payload.itemId);

  const row = await InventoryPurchaseRequest.create({
    requestNumber: payload.requestNumber || makeDisplayNumber("PR"),
    item: item._id,
    itemName: payload.itemName || item.name,
    quantity,
    unit: payload.unit || item.unit,
    status: payload.status || "draft",
  });

  if (!PURCHASE_REQUEST_STATUSES.includes(row.status)) throw new Error("Invalid purchase request status");
  return mapPurchaseRequest(row);
};

export const updatePurchaseRequestStatus = async (id, payload) => {
  if (!validateObjectId(id)) throw new Error("Invalid purchase request id");
  const status = payload.status;
  if (!PURCHASE_REQUEST_STATUSES.includes(status)) throw new Error("Invalid purchase request status");

  const row = await InventoryPurchaseRequest.findById(id);
  if (!row) throw new Error("Inventory purchase request not found");
  row.status = status;
  await row.save();
  return mapPurchaseRequest(row);
};

export const listPurchaseOrders = async () => {
  const rows = await InventoryPurchaseOrder.find().sort({ createdAt: -1 });
  return rows.map(mapPurchaseOrder);
};

export const createPurchaseOrder = async (payload) => {
  const supplier = await findSupplierOrThrow(payload.supplierId);
  const totalAmount = parseNonNegativeNumber(payload.totalAmount ?? 0);
  if (totalAmount === null) throw new Error("totalAmount must be greater than or equal to 0");

  const status = payload.status || "draft";
  if (!PURCHASE_ORDER_STATUSES.includes(status)) throw new Error("Invalid purchase order status");

  const row = await InventoryPurchaseOrder.create({
    poNumber: payload.poNumber || makeDisplayNumber("PO"),
    supplier: supplier._id,
    supplierName: payload.supplierName || supplier.name,
    status,
    totalAmount,
  });

  return mapPurchaseOrder(row);
};

export const updatePurchaseOrderStatus = async (id, payload) => {
  if (!validateObjectId(id)) throw new Error("Invalid purchase order id");
  const status = payload.status;
  if (!PURCHASE_ORDER_STATUSES.includes(status)) throw new Error("Invalid purchase order status");

  const row = await InventoryPurchaseOrder.findById(id);
  if (!row) throw new Error("Inventory purchase order not found");
  row.status = status;
  await row.save();
  return mapPurchaseOrder(row);
};

export const listGoodsReceived = async () => {
  const rows = await InventoryGoodsReceived.find().sort({ createdAt: -1 });
  return rows.map(mapGoodsReceived);
};

export const createGoodsReceived = async (payload) => {
  const supplier = await findSupplierOrThrow(payload.supplierId);
  let po = null;
  if (payload.poId) po = await findPurchaseOrderOrThrow(payload.poId);

  const lines = Array.isArray(payload.receivedItems) ? payload.receivedItems : [];
  if (lines.length === 0) throw new Error("receivedItems is required");

  const receivedItems = [];
  for (const line of lines) {
    const quantity = parsePositiveNumber(line.quantity);
    if (!quantity) throw new Error("quantity must be greater than 0");
    const cost = parseNonNegativeNumber(line.cost);
    if (cost === null) throw new Error("cost must be greater than or equal to 0");
    const item = await findItemOrThrow(line.itemId);
    receivedItems.push({
      item: item._id,
      itemName: line.itemName || item.name,
      quantity,
      unit: line.unit || item.unit,
      cost,
    });
  }

  const status = payload.status || "draft";
  if (!GOODS_RECEIVED_STATUSES.includes(status)) throw new Error("Invalid goods received status");

  const row = await InventoryGoodsReceived.create({
    grnNumber: payload.grnNumber || makeDisplayNumber("GRN"),
    po: po?._id || null,
    poNumber: payload.poNumber || po?.poNumber || "",
    supplier: supplier._id,
    supplierName: payload.supplierName || supplier.name,
    receivedItems,
    status,
    receivedAt: payload.receivedAt ? new Date(payload.receivedAt) : new Date(),
  });

  return mapGoodsReceived(row);
};

export const listVendorBills = async () => {
  const rows = await InventoryVendorBill.find().sort({ createdAt: -1 });
  return rows.map(mapVendorBill);
};

export const createVendorBill = async (payload) => {
  const supplier = await findSupplierOrThrow(payload.supplierId);
  const amount = parseNonNegativeNumber(payload.amount);
  if (amount === null) throw new Error("amount must be greater than or equal to 0");
  if (!payload.dueDate) throw new Error("dueDate is required");

  const status = payload.status || "unpaid";
  if (!VENDOR_BILL_STATUSES.includes(status)) throw new Error("Invalid vendor bill status");

  const row = await InventoryVendorBill.create({
    billNumber: payload.billNumber || makeDisplayNumber("BILL"),
    supplier: supplier._id,
    supplierName: payload.supplierName || supplier.name,
    amount,
    status,
    dueDate: new Date(payload.dueDate),
  });

  return mapVendorBill(row);
};

export const updateVendorBillStatus = async (id, payload) => {
  if (!validateObjectId(id)) throw new Error("Invalid vendor bill id");
  const status = payload.status;
  if (!VENDOR_BILL_STATUSES.includes(status)) throw new Error("Invalid vendor bill status");

  const row = await InventoryVendorBill.findById(id);
  if (!row) throw new Error("Inventory vendor bill not found");
  row.status = status;
  await row.save();
  return mapVendorBill(row);
};

export const listVendorPayments = async () => {
  const rows = await InventoryVendorPayment.find().sort({ createdAt: -1 });
  return rows.map(mapVendorPayment);
};

export const createVendorPayment = async (payload) => {
  const amount = parseNonNegativeNumber(payload.amount);
  if (amount === null) throw new Error("amount must be greater than or equal to 0");
  if (!VENDOR_PAYMENT_METHODS.includes(payload.method)) throw new Error("Invalid payment method");
  const status = payload.status || "recorded";
  if (!VENDOR_PAYMENT_STATUSES.includes(status)) throw new Error("Invalid vendor payment status");

  const [bill, supplier] = await Promise.all([
    findVendorBillOrThrow(payload.billId),
    findSupplierOrThrow(payload.supplierId),
  ]);

  const row = await InventoryVendorPayment.create({
    paymentNumber: payload.paymentNumber || makeDisplayNumber("PAY"),
    bill: bill._id,
    billNumber: payload.billNumber || bill.billNumber,
    supplier: supplier._id,
    supplierName: payload.supplierName || supplier.name,
    amount,
    method: payload.method,
    paidAt: payload.paidAt ? new Date(payload.paidAt) : new Date(),
    status,
  });

  return mapVendorPayment(row);
};

export const listPurchaseReturns = async () => {
  const rows = await InventoryPurchaseReturn.find().sort({ createdAt: -1 });
  return rows.map(mapPurchaseReturn);
};

export const createPurchaseReturn = async (payload) => {
  const quantity = parsePositiveNumber(payload.quantity);
  if (!quantity) throw new Error("quantity must be greater than 0");
  const value = parseNonNegativeNumber(payload.value);
  if (value === null) throw new Error("value must be greater than or equal to 0");
  if (!payload.reason) throw new Error("reason is required");

  const [supplier, item] = await Promise.all([
    findSupplierOrThrow(payload.supplierId),
    findItemOrThrow(payload.itemId),
  ]);

  const status = payload.status || "draft";
  if (!PURCHASE_RETURN_STATUSES.includes(status)) throw new Error("Invalid purchase return status");

  const row = await InventoryPurchaseReturn.create({
    returnNumber: payload.returnNumber || makeDisplayNumber("PRET"),
    supplier: supplier._id,
    supplierName: payload.supplierName || supplier.name,
    item: item._id,
    itemName: payload.itemName || item.name,
    quantity,
    unit: payload.unit || item.unit,
    reason: payload.reason,
    value,
    status,
  });

  return mapPurchaseReturn(row);
};

export const updatePurchaseReturnStatus = async (id, payload) => {
  if (!validateObjectId(id)) throw new Error("Invalid purchase return id");
  const status = payload.status;
  if (!PURCHASE_RETURN_STATUSES.includes(status)) throw new Error("Invalid purchase return status");

  const row = await InventoryPurchaseReturn.findById(id);
  if (!row) throw new Error("Inventory purchase return not found");
  row.status = status;
  await row.save();
  return mapPurchaseReturn(row);
};
