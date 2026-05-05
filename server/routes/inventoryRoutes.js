import express from "express";
import {
  getBatches,
  getExpiryAlertsController,
  getGoodsReceived,
  getItems,
  getMovements,
  getPurchaseOrders,
  getPurchaseRequests,
  getPurchaseReturns,
  getReorderAlertsController,
  getSuppliers,
  getVendorBills,
  getVendorPayments,
  getVendorPrices,
  patchBatchReview,
  patchItem,
  patchPurchaseOrderStatus,
  patchPurchaseRequestStatus,
  patchPurchaseReturnStatus,
  patchSupplier,
  patchVendorBillStatus,
  patchVendorPrice,
  postAdjustment,
  postBatch,
  postGoodsReceived,
  postIssue,
  postItem,
  postPurchaseOrder,
  postPurchaseRequest,
  postPurchaseReturn,
  postReturn,
  postStockIn,
  postSupplier,
  postTransfer,
  postVendorBill,
  postVendorPayment,
  postVendorPrice,
  postWaste,
} from "../controllers/inventoryController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// TODO: replace adminOnly with granular inventory permission keys once inventory ACL keys are defined.
router.use(protect, adminOnly);

router.get("/items", getItems);
router.post("/items", postItem);
router.patch("/items/:id", patchItem);

router.get("/suppliers", getSuppliers);
router.post("/suppliers", postSupplier);
router.patch("/suppliers/:id", patchSupplier);

router.get("/movements", getMovements);

router.post("/stock-in", postStockIn);
router.post("/issues", postIssue);
router.post("/waste", postWaste);
router.post("/returns", postReturn);
router.post("/adjustments", postAdjustment);
router.post("/transfers", postTransfer);

router.get("/batches", getBatches);
router.post("/batches", postBatch);
router.patch("/batches/:id/review", patchBatchReview);

router.get("/reorder-alerts", getReorderAlertsController);
router.get("/expiry-alerts", getExpiryAlertsController);

// TODO: add granular procurement permission keys once inventory ACL keys are defined.
router.get("/vendor-prices", getVendorPrices);
router.post("/vendor-prices", postVendorPrice);
router.patch("/vendor-prices/:id", patchVendorPrice);

router.get("/purchase-requests", getPurchaseRequests);
router.post("/purchase-requests", postPurchaseRequest);
router.patch("/purchase-requests/:id/status", patchPurchaseRequestStatus);

router.get("/purchase-orders", getPurchaseOrders);
router.post("/purchase-orders", postPurchaseOrder);
router.patch("/purchase-orders/:id/status", patchPurchaseOrderStatus);

router.get("/goods-received", getGoodsReceived);
router.post("/goods-received", postGoodsReceived);

router.get("/vendor-bills", getVendorBills);
router.post("/vendor-bills", postVendorBill);
router.patch("/vendor-bills/:id/status", patchVendorBillStatus);

router.get("/vendor-payments", getVendorPayments);
router.post("/vendor-payments", postVendorPayment);

router.get("/purchase-returns", getPurchaseReturns);
router.post("/purchase-returns", postPurchaseReturn);
router.patch("/purchase-returns/:id/status", patchPurchaseReturnStatus);

export default router;
