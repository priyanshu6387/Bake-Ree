import {
  adjustStock,
  createGoodsReceived,
  createBatch,
  createItem,
  createPurchaseOrder,
  createPurchaseRequest,
  createPurchaseReturn,
  createSupplier,
  createVendorBill,
  createVendorPayment,
  createVendorPrice,
  getExpiryAlerts,
  getReorderAlerts,
  issueStock,
  listBatches,
  listGoodsReceived,
  listItems,
  listMovements,
  listPurchaseOrders,
  listPurchaseRequests,
  listPurchaseReturns,
  listSuppliers,
  listVendorBills,
  listVendorPayments,
  listVendorPrices,
  recordWaste,
  returnStock,
  reviewBatch,
  stockIn,
  transferStock,
  updatePurchaseOrderStatus,
  updatePurchaseRequestStatus,
  updatePurchaseReturnStatus,
  updateItem,
  updateSupplier,
  updateVendorBillStatus,
  updateVendorPrice,
} from "../services/inventoryService.js";

const handleError = (res, error) => {
  const knownNotFound = /not found/i.test(error.message);
  const knownInvalid = /invalid|required|cannot|must/i.test(error.message);
  const status = knownNotFound ? 404 : knownInvalid ? 400 : 500;
  return res.status(status).json({
    success: false,
    message: error.message || "Inventory API error",
  });
};

export const getItems = async (_req, res) => {
  try {
    const items = await listItems();
    return res.json({ success: true, items });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postItem = async (req, res) => {
  try {
    const item = await createItem(req.body);
    return res.status(201).json({ success: true, item });
  } catch (error) {
    return handleError(res, error);
  }
};

export const patchItem = async (req, res) => {
  try {
    const item = await updateItem(req.params.id, req.body);
    return res.json({ success: true, item });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getSuppliers = async (_req, res) => {
  try {
    const suppliers = await listSuppliers();
    return res.json({ success: true, suppliers });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postSupplier = async (req, res) => {
  try {
    const supplier = await createSupplier(req.body);
    return res.status(201).json({ success: true, supplier });
  } catch (error) {
    return handleError(res, error);
  }
};

export const patchSupplier = async (req, res) => {
  try {
    const supplier = await updateSupplier(req.params.id, req.body);
    return res.json({ success: true, supplier });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMovements = async (_req, res) => {
  try {
    const movements = await listMovements();
    return res.json({ success: true, movements });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postStockIn = async (req, res) => {
  try {
    const movement = await stockIn(req.body, req.user?._id);
    return res.status(201).json({ success: true, movement });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postIssue = async (req, res) => {
  try {
    const movement = await issueStock(req.body, req.user?._id);
    return res.status(201).json({ success: true, movement });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postWaste = async (req, res) => {
  try {
    const movement = await recordWaste(req.body, req.user?._id);
    return res.status(201).json({ success: true, movement });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postReturn = async (req, res) => {
  try {
    const movement = await returnStock(req.body, req.user?._id);
    return res.status(201).json({ success: true, movement });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postAdjustment = async (req, res) => {
  try {
    const movement = await adjustStock(req.body, req.user?._id);
    return res.status(201).json({ success: true, movement });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postTransfer = async (req, res) => {
  try {
    const movement = await transferStock(req.body, req.user?._id);
    return res.status(201).json({ success: true, movement });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getBatches = async (_req, res) => {
  try {
    const batches = await listBatches();
    return res.json({ success: true, batches });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postBatch = async (req, res) => {
  try {
    const batch = await createBatch(req.body);
    return res.status(201).json({ success: true, batch });
  } catch (error) {
    return handleError(res, error);
  }
};

export const patchBatchReview = async (req, res) => {
  try {
    const batch = await reviewBatch(req.params.id, req.body);
    return res.json({ success: true, batch });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getReorderAlertsController = async (_req, res) => {
  try {
    const items = await getReorderAlerts();
    return res.json({ success: true, items });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getExpiryAlertsController = async (_req, res) => {
  try {
    const batches = await getExpiryAlerts();
    return res.json({ success: true, batches });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getVendorPrices = async (_req, res) => {
  try {
    const vendorPrices = await listVendorPrices();
    return res.json({ success: true, vendorPrices });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postVendorPrice = async (req, res) => {
  try {
    const vendorPrice = await createVendorPrice(req.body);
    return res.status(201).json({ success: true, vendorPrice });
  } catch (error) {
    return handleError(res, error);
  }
};

export const patchVendorPrice = async (req, res) => {
  try {
    const vendorPrice = await updateVendorPrice(req.params.id, req.body);
    return res.json({ success: true, vendorPrice });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getPurchaseRequests = async (_req, res) => {
  try {
    const purchaseRequests = await listPurchaseRequests();
    return res.json({ success: true, purchaseRequests });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postPurchaseRequest = async (req, res) => {
  try {
    const purchaseRequest = await createPurchaseRequest(req.body);
    return res.status(201).json({ success: true, purchaseRequest });
  } catch (error) {
    return handleError(res, error);
  }
};

export const patchPurchaseRequestStatus = async (req, res) => {
  try {
    const purchaseRequest = await updatePurchaseRequestStatus(req.params.id, req.body);
    return res.json({ success: true, purchaseRequest });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getPurchaseOrders = async (_req, res) => {
  try {
    const purchaseOrders = await listPurchaseOrders();
    return res.json({ success: true, purchaseOrders });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await createPurchaseOrder(req.body);
    return res.status(201).json({ success: true, purchaseOrder });
  } catch (error) {
    return handleError(res, error);
  }
};

export const patchPurchaseOrderStatus = async (req, res) => {
  try {
    const purchaseOrder = await updatePurchaseOrderStatus(req.params.id, req.body);
    return res.json({ success: true, purchaseOrder });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getGoodsReceived = async (_req, res) => {
  try {
    const goodsReceived = await listGoodsReceived();
    return res.json({ success: true, goodsReceived });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postGoodsReceived = async (req, res) => {
  try {
    const goodsReceipt = await createGoodsReceived(req.body);
    return res.status(201).json({
      success: true,
      goodsReceipt,
      message: "Use Stock In page to update inventory stock.",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getVendorBills = async (_req, res) => {
  try {
    const vendorBills = await listVendorBills();
    return res.json({ success: true, vendorBills });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postVendorBill = async (req, res) => {
  try {
    const vendorBill = await createVendorBill(req.body);
    return res.status(201).json({ success: true, vendorBill });
  } catch (error) {
    return handleError(res, error);
  }
};

export const patchVendorBillStatus = async (req, res) => {
  try {
    const vendorBill = await updateVendorBillStatus(req.params.id, req.body);
    return res.json({ success: true, vendorBill });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getVendorPayments = async (_req, res) => {
  try {
    const vendorPayments = await listVendorPayments();
    return res.json({ success: true, vendorPayments });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postVendorPayment = async (req, res) => {
  try {
    const vendorPayment = await createVendorPayment(req.body);
    return res.status(201).json({ success: true, vendorPayment });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getPurchaseReturns = async (_req, res) => {
  try {
    const purchaseReturns = await listPurchaseReturns();
    return res.json({ success: true, purchaseReturns });
  } catch (error) {
    return handleError(res, error);
  }
};

export const postPurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await createPurchaseReturn(req.body);
    return res.status(201).json({
      success: true,
      purchaseReturn,
      message: "Use Stock In page to update inventory stock.",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const patchPurchaseReturnStatus = async (req, res) => {
  try {
    const purchaseReturn = await updatePurchaseReturnStatus(req.params.id, req.body);
    return res.json({ success: true, purchaseReturn });
  } catch (error) {
    return handleError(res, error);
  }
};
