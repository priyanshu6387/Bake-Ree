import express from "express";
import {
  assignCouponToUsers,
  createCoupon,
  getCouponAnalyticsRedemptions,
  getCouponAnalyticsSummary,
  getCouponById,
  getMyCoupons,
  getMyRecommendations,
  listCoupons,
  releaseCoupon,
  reserveCoupon,
  runSystemRecommendations,
  updateCoupon,
  updateCouponStatus,
  validateCoupon,
} from "../controllers/couponController.js";
import { adminOnly, protect, requirePermission } from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer endpoints
router.post("/validate", protect, validateCoupon);
router.post("/reserve", protect, reserveCoupon);
router.post("/release", protect, releaseCoupon);
router.get("/my", protect, getMyCoupons);
router.get("/recommendations", protect, getMyRecommendations);

// Admin / Ops endpoints
router.get(
  "/analytics/summary",
  protect,
  adminOnly,
  requirePermission("ops.action.coupons.analytics.view"),
  getCouponAnalyticsSummary
);
router.get(
  "/analytics/redemptions",
  protect,
  adminOnly,
  requirePermission("ops.action.coupons.analytics.view"),
  getCouponAnalyticsRedemptions
);
router.post(
  "/system/run-recommendations",
  protect,
  adminOnly,
  requirePermission("ops.action.coupons.recommendations.run"),
  runSystemRecommendations
);
router.post("/", protect, adminOnly, requirePermission("ops.action.coupons.create"), createCoupon);
router.get(
  "/",
  protect,
  adminOnly,
  requirePermission("ops.page.ops.crm.engagement.offers.view"),
  listCoupons
);
router.get(
  "/:id",
  protect,
  adminOnly,
  requirePermission("ops.page.ops.crm.engagement.offers.view"),
  getCouponById
);
router.patch("/:id", protect, adminOnly, requirePermission("ops.action.coupons.edit"), updateCoupon);
router.patch(
  "/:id/status",
  protect,
  adminOnly,
  requirePermission("ops.action.coupons.publish"),
  updateCouponStatus
);
router.post(
  "/:id/assign",
  protect,
  adminOnly,
  requirePermission("ops.action.coupons.assign"),
  assignCouponToUsers
);

export default router;
