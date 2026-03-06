import express from "express";
import {
  createOrder,
  getUserOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  approveOrder,
  transitionOrderLifecycle,
  getKitchenOrders,
  getAllOrders,
  getOpsLiveOrders,
  getOpsSummary,
  getOpsSlaOrders,
  getOpsRefundsQueue,
  createOrderRequest,
  getOrderRequestsByOrder,
  getAllOrderRequests,
  reviewOrderRequest,
  resolveOrderRequest,
  getStatusDistribution,
  getTypeRevenue,
  getRecentOrders,
} from "../controllers/orderController.js";
import {
  protect,
  adminOnly,
  kitchenStaffOrAdmin,
  kitchenStaffOnly,
  requireAnyPermission,
  requirePermission,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================
// 🛒 ORDER ROUTES
// ======================

// ➕ Place a new order (User only)
router.post("/", protect, createOrder);

// 👤 Get all orders of logged-in user (legacy)
router.get("/user", protect, getUserOrders);

// ✅ Recommended alias for logged-in user orders
router.get("/my-orders", protect, getMyOrders);

// 🛡️ Admin: Get all orders
router.get("/all", protect, adminOnly, requirePermission("ops.module.orders.view"), getAllOrders);

// 👨‍🍳 Kitchen: Get Pending/Preparing/Ready orders (kitchen staff or admin)
router.get(
  "/kitchen",
  protect,
  kitchenStaffOrAdmin,
  requirePermission("ops.page.kitchen.queue.view"),
  getKitchenOrders
);

// ======================
// 🧭 OPS ORDER LIFECYCLE ROUTES
// ======================

router.get(
  "/ops/live",
  protect,
  adminOnly,
  requirePermission("ops.module.orders.view"),
  getOpsLiveOrders
);

router.get(
  "/ops/summary",
  protect,
  adminOnly,
  requirePermission("ops.module.orders.view"),
  getOpsSummary
);

router.get(
  "/ops/sla",
  protect,
  adminOnly,
  requirePermission("ops.module.orders.view"),
  getOpsSlaOrders
);

router.get(
  "/ops/refunds",
  protect,
  adminOnly,
  requirePermission("ops.module.orders.view"),
  getOpsRefundsQueue
);

router.patch(
  "/:id/approve",
  protect,
  adminOnly,
  requirePermission("ops.action.orders.approve"),
  approveOrder
);

router.patch(
  "/:id/lifecycle",
  protect,
  kitchenStaffOnly,
  requireAnyPermission([
    "ops.action.kitchen.order.start",
    "ops.action.kitchen.order.mark_ready",
    "ops.action.kitchen.order.hold",
    "ops.action.kitchen.order.handoff",
    "ops.action.kitchen.order.assign_dispatch",
    "ops.action.kitchen.order.complete",
  ]),
  transitionOrderLifecycle
);

router.post("/:id/requests", protect, createOrderRequest);
router.get("/:id/requests", protect, getOrderRequestsByOrder);
router.get(
  "/requests",
  protect,
  adminOnly,
  requirePermission("ops.module.orders.view"),
  getAllOrderRequests
);
router.patch(
  "/requests/:requestId/review",
  protect,
  adminOnly,
  requirePermission("ops.module.orders.view"),
  reviewOrderRequest
);
router.patch(
  "/requests/:requestId/resolve",
  protect,
  adminOnly,
  requirePermission("ops.module.orders.view"),
  resolveOrderRequest
);

// ======================
// 📊 ANALYTICS ROUTES (Order-sensitive placement)
// ======================

// 🕑 Get recent orders for analytics overview panel
router.get("/recent", protect, adminOnly, requirePermission("ops.module.analytics.view"), getRecentOrders);

// 📈 Get status distribution of all orders 
router.get(
  "/status-distribution",
  protect,
  adminOnly,
  requirePermission("ops.module.analytics.view"),
  getStatusDistribution
);

// 💰 Get revenue by order type
router.get("/type-revenue", protect, adminOnly, requirePermission("ops.module.analytics.view"), getTypeRevenue);

// ======================
// 🧾 Catch-all dynamic route should be LAST
// ======================

router.post(
  "/:id/approve",
  protect,
  adminOnly,
  requirePermission("ops.action.orders.approve"),
  approveOrder
);

router.post(
  "/:id/transition",
  protect,
  kitchenStaffOnly,
  requireAnyPermission([
    "ops.action.kitchen.order.start",
    "ops.action.kitchen.order.mark_ready",
    "ops.action.kitchen.order.hold",
    "ops.action.kitchen.order.handoff",
    "ops.action.kitchen.order.assign_dispatch",
    "ops.action.kitchen.order.complete",
    "ops.action.orders.cancel",
  ]),
  transitionOrderLifecycle
);

// 🔍 Get order by ID (user or admin) - protected route
router.get("/:id", protect, getOrderById);

// ✅ Update order status (admin or kitchen) - PUT route for client compatibility
router.put(
  "/:id",
  protect,
  kitchenStaffOnly,
  requireAnyPermission([
    "ops.action.kitchen.order.start",
    "ops.action.kitchen.order.mark_ready",
    "ops.action.kitchen.order.hold",
    "ops.action.kitchen.order.handoff",
    "ops.action.kitchen.order.assign_dispatch",
    "ops.action.kitchen.order.complete",
    "ops.action.orders.cancel",
  ]),
  updateOrderStatus
);

// ✅ Update order status (admin or kitchen) - PATCH route
router.patch(
  "/:id/status",
  protect,
  kitchenStaffOnly,
  requireAnyPermission([
    "ops.action.kitchen.order.start",
    "ops.action.kitchen.order.mark_ready",
    "ops.action.kitchen.order.hold",
    "ops.action.kitchen.order.handoff",
    "ops.action.kitchen.order.assign_dispatch",
    "ops.action.kitchen.order.complete",
    "ops.action.orders.cancel",
  ]),
  updateOrderStatus
);

// ✅ Final export
export default router;
