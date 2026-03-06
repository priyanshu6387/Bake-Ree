import express from "express";
import {
  createAdjustment,
  createItem,
  createReservation,
  createReturn,
  createTransfer,
  createWarehouse,
  createBin,
  createProductionConsumption,
  listBins,
  listBatches,
  listItems,
  listLedger,
  listWarehouses,
  logWaste,
  consumeReservation,
  receiveTransfer,
  releaseReservation,
} from "../controllers/inventoryController.js";
import { protect, requirePermission } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/items", protect, requirePermission("ops.module.inventory.view"), listItems);
router.post("/items", protect, requirePermission("ops.action.inventory.items.write"), createItem);

router.get("/warehouses", protect, requirePermission("ops.module.inventory.view"), listWarehouses);
router.post(
  "/warehouses",
  protect,
  requirePermission("ops.action.inventory.warehouses.write"),
  createWarehouse
);
router.get("/bins", protect, requirePermission("ops.module.inventory.view"), listBins);
router.post("/bins", protect, requirePermission("ops.action.inventory.bins.write"), createBin);

router.get("/batches", protect, requirePermission("ops.module.inventory.view"), listBatches);
router.get("/ledger", protect, requirePermission("ops.module.inventory.view"), listLedger);

router.post(
  "/reservations",
  protect,
  requirePermission("ops.action.inventory.reservations.write"),
  createReservation
);
router.post(
  "/reservations/:reservationId/consume",
  protect,
  requirePermission("ops.action.inventory.reservations.consume"),
  consumeReservation
);
router.post(
  "/reservations/:reservationId/release",
  protect,
  requirePermission("ops.action.inventory.reservations.release"),
  releaseReservation
);

router.post("/adjustments", protect, requirePermission("ops.action.inventory.adjustments.write"), createAdjustment);
router.post("/transfers", protect, requirePermission("ops.action.inventory.transfers.write"), createTransfer);
router.post(
  "/transfers/:transferId/receive",
  protect,
  requirePermission("ops.action.inventory.transfers.receive"),
  receiveTransfer
);

router.post("/waste", protect, requirePermission("ops.action.inventory.waste.write"), logWaste);
router.post("/returns", protect, requirePermission("ops.action.inventory.returns.write"), createReturn);
router.post(
  "/production",
  protect,
  requirePermission("ops.action.inventory.production.post"),
  createProductionConsumption
);

export default router;
