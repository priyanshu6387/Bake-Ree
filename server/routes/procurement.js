import express from "express";
import {
  createBill,
  createGRN,
  createPayment,
  createPO,
  createRequest,
  createVendor,
  createVendorItem,
  createReturn,
  listBills,
  listGRNs,
  listPOs,
  listPayments,
  listRequests,
  listVendorItems,
  listVendors,
  listReturns,
} from "../controllers/procurementController.js";
import { protect, requirePermission } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/vendors", protect, requirePermission("ops.module.inventory.view"), listVendors);
router.post("/vendors", protect, requirePermission("ops.action.procurement.vendors.write"), createVendor);

router.get("/items", protect, requirePermission("ops.module.inventory.view"), listVendorItems);
router.post("/items", protect, requirePermission("ops.action.procurement.items.write"), createVendorItem);

router.get("/requests", protect, requirePermission("ops.module.inventory.view"), listRequests);
router.post("/requests", protect, requirePermission("ops.action.procurement.requests.write"), createRequest);

router.get("/pos", protect, requirePermission("ops.module.inventory.view"), listPOs);
router.post("/pos", protect, requirePermission("ops.action.procurement.pos.write"), createPO);

router.get("/grn", protect, requirePermission("ops.module.inventory.view"), listGRNs);
router.post("/grn", protect, requirePermission("ops.action.procurement.grn.write"), createGRN);

router.get("/bills", protect, requirePermission("ops.module.finance.view"), listBills);
router.post("/bills", protect, requirePermission("ops.action.procurement.bills.write"), createBill);

router.get("/payments", protect, requirePermission("ops.module.finance.view"), listPayments);
router.post("/payments", protect, requirePermission("ops.action.procurement.payments.write"), createPayment);

router.get("/returns", protect, requirePermission("ops.module.inventory.view"), listReturns);
router.post("/returns", protect, requirePermission("ops.action.procurement.returns.write"), createReturn);

export default router;
