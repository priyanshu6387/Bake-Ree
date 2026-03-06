import express from "express";
import {
  acknowledgeKitchenAlert,
  assignKitchenDispatchRequest,
  completeKitchenDispatchRequest,
  createKitchenAlert,
  createKitchenDispatchRequest,
  createKitchenMessage,
  listKitchenAlerts,
  listKitchenDispatchRequests,
  listKitchenMessages,
  resolveKitchenAlert,
  setKitchenAlertActionType,
} from "../controllers/kitchenController.js";
import {
  kitchenStaffOrAdmin,
  kitchenStaffOnly,
  protect,
  requirePermission,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, kitchenStaffOrAdmin);

router.get("/alerts", requirePermission("ops.page.kitchen.alerts.view"), listKitchenAlerts);
router.post(
  "/alerts",
  kitchenStaffOnly,
  requirePermission("ops.action.kitchen.alert.create"),
  createKitchenAlert
);
router.patch(
  "/alerts/:alertId/ack",
  kitchenStaffOnly,
  requirePermission("ops.action.kitchen.alert.acknowledge"),
  acknowledgeKitchenAlert
);
router.patch(
  "/alerts/:alertId/resolve",
  kitchenStaffOnly,
  requirePermission("ops.action.kitchen.alert.resolve"),
  resolveKitchenAlert
);
router.patch(
  "/alerts/:alertId/action-type",
  kitchenStaffOnly,
  requirePermission("ops.action.kitchen.alert.create"),
  setKitchenAlertActionType
);

router.get("/messages", requirePermission("ops.page.kitchen.messages.view"), listKitchenMessages);
router.post(
  "/messages",
  kitchenStaffOnly,
  requirePermission("ops.action.kitchen.message.send"),
  createKitchenMessage
);

router.get(
  "/dispatch-requests",
  requirePermission("ops.page.kitchen.queue.view"),
  listKitchenDispatchRequests
);
router.post(
  "/dispatch-requests",
  kitchenStaffOnly,
  requirePermission("ops.action.kitchen.order.handoff"),
  createKitchenDispatchRequest
);
router.patch(
  "/dispatch-requests/:requestId/assign",
  kitchenStaffOnly,
  requirePermission("ops.action.kitchen.order.assign_dispatch"),
  assignKitchenDispatchRequest
);
router.patch(
  "/dispatch-requests/:requestId/complete",
  kitchenStaffOnly,
  requirePermission("ops.action.kitchen.order.complete"),
  completeKitchenDispatchRequest
);

export default router;
