import mongoose from "mongoose";
import Coupon from "../models/Coupon.js";
import CouponAssignment from "../models/CouponAssignment.js";
import CouponRedemption from "../models/CouponRedemption.js";
import {
  expireStaleCouponsAndAssignments,
  releaseCouponReservation,
  reserveCouponForCheckout,
  runRecommendationAssignments,
  validateCouponForUser,
} from "../services/couponService.js";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseObjectIdList = (value = []) =>
  (Array.isArray(value) ? value : [])
    .map((item) => String(item || "").trim())
    .filter((item) => mongoose.Types.ObjectId.isValid(item))
    .map((item) => new mongoose.Types.ObjectId(item));

const inWindowQuery = (now = new Date()) => ({
  $and: [{ $or: [{ validFrom: null }, { validFrom: { $lte: now } }] }],
  $or: [{ validUntil: null }, { validUntil: { $gte: now } }],
});

const serializeCoupon = (coupon) => ({
  _id: coupon._id,
  code: coupon.code,
  name: coupon.name,
  description: coupon.description,
  status: coupon.status,
  sourceType: coupon.sourceType,
  audienceType: coupon.audienceType,
  discountType: coupon.discountType,
  discountValue: coupon.discountValue,
  maxDiscountAmount: coupon.maxDiscountAmount,
  minOrderAmount: coupon.minOrderAmount,
  applicableOrderTypes: coupon.applicableOrderTypes || [],
  membershipTiers: coupon.membershipTiers || [],
  validFrom: coupon.validFrom,
  validUntil: coupon.validUntil,
  globalUsageLimit: coupon.globalUsageLimit,
  perUserUsageLimit: coupon.perUserUsageLimit,
  perDayUsageLimit: coupon.perDayUsageLimit,
  usageCount: coupon.usageCount || 0,
  metrics: coupon.metrics || {},
  createdAt: coupon.createdAt,
  updatedAt: coupon.updatedAt,
});

export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal = 0, orderType = "Pickup", deliveryCharge = 0 } = req.body || {};
    const result = await validateCouponForUser({
      code,
      userId: req.user?._id,
      subtotal: toNumber(subtotal, 0),
      orderType: String(orderType || "Pickup"),
      deliveryCharge: toNumber(deliveryCharge, 0),
    });

    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.reason });
    }

    return res.status(200).json({
      ok: true,
      coupon: serializeCoupon(result.coupon),
      pricing: result.pricing,
      assignment: result.assignment
        ? {
            _id: result.assignment._id,
            status: result.assignment.status,
            issuedBy: result.assignment.issuedBy,
            issuedReason: result.assignment.issuedReason,
            validFrom: result.assignment.validFrom,
            validUntil: result.assignment.validUntil,
          }
        : null,
    });
  } catch (error) {
    console.error("Coupon validation failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to validate coupon" });
  }
};

export const reserveCoupon = async (req, res) => {
  try {
    const {
      code,
      subtotal = 0,
      orderType = "Pickup",
      deliveryCharge = 0,
      cartItemsCount = 0,
    } = req.body || {};

    const result = await reserveCouponForCheckout({
      code,
      userId: req.user?._id,
      subtotal: toNumber(subtotal, 0),
      orderType: String(orderType || "Pickup"),
      deliveryCharge: toNumber(deliveryCharge, 0),
      cartItemsCount: toNumber(cartItemsCount, 0),
    });

    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.reason });
    }

    return res.status(200).json({
      ok: true,
      reservationToken: result.reservation.reservationToken,
      expiresAt: result.reservation.expiresAt,
      coupon: serializeCoupon(result.coupon),
      pricing: result.pricing,
    });
  } catch (error) {
    console.error("Coupon reservation failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to reserve coupon" });
  }
};

export const releaseCoupon = async (req, res) => {
  try {
    const { reservationToken } = req.body || {};
    if (!reservationToken) {
      return res.status(400).json({ ok: false, error: "reservationToken is required" });
    }

    const result = await releaseCouponReservation({
      reservationToken,
      userId: req.user?._id,
    });

    if (!result.ok) {
      return res.status(404).json({ ok: false, error: result.reason });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Coupon release failed:", error);
    return res.status(500).json({ ok: false, error: "Failed to release coupon" });
  }
};

export const getMyCoupons = async (req, res) => {
  try {
    const now = new Date();
    await expireStaleCouponsAndAssignments(now);

    const [generalCoupons, assignments] = await Promise.all([
      Coupon.find({
        status: "ACTIVE",
        audienceType: "GENERAL",
        ...inWindowQuery(now),
      }).sort({ updatedAt: -1 }),
      CouponAssignment.find({
        user: req.user?._id,
        status: { $in: ["AVAILABLE", "RESERVED"] },
        ...inWindowQuery(now),
      })
        .populate("coupon")
        .sort({ updatedAt: -1 }),
    ]);

    const general = generalCoupons.map((coupon) => ({
      type: "GENERAL",
      coupon: serializeCoupon(coupon),
      assignment: null,
    }));

    const targeted = assignments
      .filter((assignment) => assignment.coupon)
      .map((assignment) => ({
        type: assignment.issuedBy === "SYSTEM_RULE" ? "RECOMMENDED" : "TARGETED",
        coupon: serializeCoupon(assignment.coupon),
        assignment: {
          _id: assignment._id,
          status: assignment.status,
          issuedBy: assignment.issuedBy,
          issuedReason: assignment.issuedReason,
          validFrom: assignment.validFrom,
          validUntil: assignment.validUntil,
        },
      }));

    return res.status(200).json({
      general,
      targeted,
    });
  } catch (error) {
    console.error("Failed to fetch user coupons:", error);
    return res.status(500).json({ error: "Failed to fetch coupons" });
  }
};

export const getMyRecommendations = async (req, res) => {
  try {
    const now = new Date();
    await expireStaleCouponsAndAssignments(now);
    const assignments = await CouponAssignment.find({
      user: req.user?._id,
      issuedBy: "SYSTEM_RULE",
      status: { $in: ["AVAILABLE", "RESERVED"] },
      ...inWindowQuery(now),
    })
      .populate("coupon")
      .sort({ updatedAt: -1 });

    return res.status(200).json(
      assignments
        .filter((assignment) => assignment.coupon)
        .map((assignment) => ({
          assignmentId: assignment._id,
          issuedReason: assignment.issuedReason,
          validFrom: assignment.validFrom,
          validUntil: assignment.validUntil,
          coupon: serializeCoupon(assignment.coupon),
        }))
    );
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return res.status(500).json({ error: "Failed to fetch recommendations" });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const payload = req.body || {};
    const code = String(payload.code || "").trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ error: "Coupon code is required" });
    }
    if (!payload.name) {
      return res.status(400).json({ error: "Coupon name is required" });
    }

    const existing = await Coupon.findOne({ code });
    if (existing) {
      return res.status(409).json({ error: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code,
      name: String(payload.name || "").trim(),
      description: String(payload.description || "").trim(),
      status: payload.status || "DRAFT",
      sourceType: payload.sourceType || "ADMIN",
      audienceType: payload.audienceType || "GENERAL",
      discountType: payload.discountType || "PERCENT",
      discountValue: toNumber(payload.discountValue, 0),
      maxDiscountAmount:
        payload.maxDiscountAmount === null || payload.maxDiscountAmount === undefined
          ? null
          : toNumber(payload.maxDiscountAmount, 0),
      minOrderAmount: toNumber(payload.minOrderAmount, 0),
      applicableOrderTypes: Array.isArray(payload.applicableOrderTypes)
        ? payload.applicableOrderTypes
        : [],
      applicableCategories: Array.isArray(payload.applicableCategories)
        ? payload.applicableCategories
        : [],
      applicableProductIds: parseObjectIdList(payload.applicableProductIds),
      includeUsers: parseObjectIdList(payload.includeUsers),
      excludeUsers: parseObjectIdList(payload.excludeUsers),
      membershipTiers: Array.isArray(payload.membershipTiers) ? payload.membershipTiers : [],
      newUserOnly: payload.newUserOnly === true,
      firstOrderOnly: payload.firstOrderOnly === true,
      globalUsageLimit:
        payload.globalUsageLimit === null || payload.globalUsageLimit === undefined
          ? null
          : toNumber(payload.globalUsageLimit, 0),
      perUserUsageLimit:
        payload.perUserUsageLimit === null || payload.perUserUsageLimit === undefined
          ? null
          : toNumber(payload.perUserUsageLimit, 0),
      perDayUsageLimit:
        payload.perDayUsageLimit === null || payload.perDayUsageLimit === undefined
          ? null
          : toNumber(payload.perDayUsageLimit, 0),
      allowWithLoyalty: payload.allowWithLoyalty === true,
      allowWithOtherCoupons: payload.allowWithOtherCoupons === true,
      validFrom: payload.validFrom ? new Date(payload.validFrom) : null,
      validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
      timezone: payload.timezone || "UTC",
      autoExpire: payload.autoExpire !== false,
      metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {},
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null,
    });

    return res.status(201).json(serializeCoupon(coupon));
  } catch (error) {
    console.error("Failed to create coupon:", error);
    return res.status(500).json({ error: "Failed to create coupon" });
  }
};

export const listCoupons = async (req, res) => {
  try {
    const {
      status,
      audienceType,
      sourceType,
      search = "",
      page = 1,
      limit = 50,
    } = req.query || {};

    await expireStaleCouponsAndAssignments();

    const query = {};
    if (status) query.status = status;
    if (audienceType) query.audienceType = audienceType;
    if (sourceType) query.sourceType = sourceType;
    if (search) {
      query.$or = [
        { code: { $regex: String(search), $options: "i" } },
        { name: { $regex: String(search), $options: "i" } },
      ];
    }

    const pageValue = Math.max(1, toNumber(page, 1));
    const limitValue = Math.max(1, Math.min(200, toNumber(limit, 50)));
    const skip = (pageValue - 1) * limitValue;

    const [items, total] = await Promise.all([
      Coupon.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limitValue),
      Coupon.countDocuments(query),
    ]);

    return res.status(200).json({
      items: items.map(serializeCoupon),
      page: pageValue,
      limit: limitValue,
      total,
    });
  } catch (error) {
    console.error("Failed to list coupons:", error);
    return res.status(500).json({ error: "Failed to list coupons" });
  }
};

export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }
    return res.status(200).json(serializeCoupon(coupon));
  } catch (error) {
    console.error("Failed to fetch coupon:", error);
    return res.status(500).json({ error: "Failed to fetch coupon" });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    const payload = req.body || {};

    if (payload.name !== undefined) coupon.name = String(payload.name || "").trim();
    if (payload.description !== undefined) coupon.description = String(payload.description || "").trim();
    if (payload.audienceType !== undefined) coupon.audienceType = payload.audienceType;
    if (payload.discountType !== undefined) coupon.discountType = payload.discountType;
    if (payload.discountValue !== undefined) coupon.discountValue = toNumber(payload.discountValue, 0);
    if (payload.maxDiscountAmount !== undefined) {
      coupon.maxDiscountAmount =
        payload.maxDiscountAmount === null ? null : toNumber(payload.maxDiscountAmount, 0);
    }
    if (payload.minOrderAmount !== undefined) coupon.minOrderAmount = toNumber(payload.minOrderAmount, 0);
    if (payload.applicableOrderTypes !== undefined) {
      coupon.applicableOrderTypes = Array.isArray(payload.applicableOrderTypes)
        ? payload.applicableOrderTypes
        : [];
    }
    if (payload.validFrom !== undefined) {
      coupon.validFrom = payload.validFrom ? new Date(payload.validFrom) : null;
    }
    if (payload.validUntil !== undefined) {
      coupon.validUntil = payload.validUntil ? new Date(payload.validUntil) : null;
    }
    if (payload.globalUsageLimit !== undefined) {
      coupon.globalUsageLimit =
        payload.globalUsageLimit === null ? null : toNumber(payload.globalUsageLimit, 0);
    }
    if (payload.perUserUsageLimit !== undefined) {
      coupon.perUserUsageLimit =
        payload.perUserUsageLimit === null ? null : toNumber(payload.perUserUsageLimit, 0);
    }
    if (payload.perDayUsageLimit !== undefined) {
      coupon.perDayUsageLimit =
        payload.perDayUsageLimit === null ? null : toNumber(payload.perDayUsageLimit, 0);
    }
    if (payload.membershipTiers !== undefined) {
      coupon.membershipTiers = Array.isArray(payload.membershipTiers) ? payload.membershipTiers : [];
    }
    if (payload.includeUsers !== undefined) coupon.includeUsers = parseObjectIdList(payload.includeUsers);
    if (payload.excludeUsers !== undefined) coupon.excludeUsers = parseObjectIdList(payload.excludeUsers);
    if (payload.newUserOnly !== undefined) coupon.newUserOnly = payload.newUserOnly === true;
    if (payload.firstOrderOnly !== undefined) coupon.firstOrderOnly = payload.firstOrderOnly === true;
    if (payload.autoExpire !== undefined) coupon.autoExpire = payload.autoExpire !== false;
    if (payload.allowWithLoyalty !== undefined) coupon.allowWithLoyalty = payload.allowWithLoyalty === true;
    if (payload.allowWithOtherCoupons !== undefined)
      coupon.allowWithOtherCoupons = payload.allowWithOtherCoupons === true;
    if (payload.status !== undefined) coupon.status = payload.status;
    if (payload.timezone !== undefined) coupon.timezone = payload.timezone || "UTC";
    if (payload.metadata !== undefined && typeof payload.metadata === "object") coupon.metadata = payload.metadata;

    coupon.updatedBy = req.user?._id || null;
    await coupon.save();
    return res.status(200).json(serializeCoupon(coupon));
  } catch (error) {
    console.error("Failed to update coupon:", error);
    return res.status(500).json({ error: "Failed to update coupon" });
  }
};

export const updateCouponStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!["DRAFT", "ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"].includes(status)) {
      return res.status(400).json({ error: "Invalid coupon status" });
    }
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    coupon.status = status;
    if (status === "EXPIRED" && !coupon.validUntil) {
      coupon.validUntil = new Date();
    }
    coupon.updatedBy = req.user?._id || null;
    await coupon.save();
    return res.status(200).json(serializeCoupon(coupon));
  } catch (error) {
    console.error("Failed to update coupon status:", error);
    return res.status(500).json({ error: "Failed to update coupon status" });
  }
};

export const assignCouponToUsers = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    const { userIds = [], validFrom = null, validUntil = null, issuedReason = "" } = req.body || {};
    const parsedUserIds = parseObjectIdList(userIds);
    if (parsedUserIds.length === 0) {
      return res.status(400).json({ error: "At least one valid userId is required" });
    }

    let createdCount = 0;
    for (const userId of parsedUserIds) {
      const exists = await CouponAssignment.findOne({
        coupon: coupon._id,
        user: userId,
        status: { $in: ["AVAILABLE", "RESERVED"] },
      });
      if (exists) continue;

      await CouponAssignment.create({
        coupon: coupon._id,
        user: userId,
        status: "AVAILABLE",
        issuedBy: "ADMIN",
        issuedReason: String(issuedReason || "").trim(),
        validFrom: validFrom ? new Date(validFrom) : coupon.validFrom,
        validUntil: validUntil ? new Date(validUntil) : coupon.validUntil,
      });
      createdCount += 1;
    }

    if (createdCount > 0) {
      await Coupon.findByIdAndUpdate(coupon._id, {
        $inc: { "metrics.issuedCount": createdCount },
        $set: { updatedBy: req.user?._id || null },
      });
    }

    return res.status(200).json({
      couponId: coupon._id,
      assignedCount: createdCount,
      attemptedCount: parsedUserIds.length,
    });
  } catch (error) {
    console.error("Failed to assign coupon:", error);
    return res.status(500).json({ error: "Failed to assign coupon" });
  }
};

export const runSystemRecommendations = async (req, res) => {
  try {
    const result = await runRecommendationAssignments({ actorId: req.user?._id || null });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Failed to run coupon recommendations:", error);
    return res.status(500).json({ error: "Failed to run recommendations" });
  }
};

export const getCouponAnalyticsSummary = async (_req, res) => {
  try {
    const now = new Date();
    await expireStaleCouponsAndAssignments(now);

    const expiringBefore = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const [statusBuckets, discountAgg, redemptionsToday, expiringSoon] = await Promise.all([
      Coupon.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      CouponRedemption.aggregate([
        { $match: { status: "APPLIED" } },
        {
          $group: {
            _id: null,
            totalDiscountGiven: { $sum: "$discountAmount" },
            totalRedemptions: { $sum: 1 },
          },
        },
      ]),
      CouponRedemption.countDocuments({
        status: "APPLIED",
        createdAt: { $gte: startOfDay(new Date()) },
      }),
      Coupon.countDocuments({
        status: "ACTIVE",
        validUntil: { $ne: null, $gte: now, $lte: expiringBefore },
      }),
    ]);

    const byStatus = Object.fromEntries(statusBuckets.map((row) => [row._id, row.count]));
    const summary = discountAgg[0] || { totalDiscountGiven: 0, totalRedemptions: 0 };

    return res.status(200).json({
      byStatus,
      totalDiscountGiven: round2(summary.totalDiscountGiven || 0),
      totalRedemptions: summary.totalRedemptions || 0,
      redemptionsToday,
      expiringSoon,
    });
  } catch (error) {
    console.error("Failed to fetch coupon analytics summary:", error);
    return res.status(500).json({ error: "Failed to fetch analytics summary" });
  }
};

const startOfDay = (value = new Date()) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

const round2 = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const getCouponAnalyticsRedemptions = async (req, res) => {
  try {
    const { couponId, status, dateFrom, dateTo, limit = 100 } = req.query || {};
    const query = {};
    if (couponId && mongoose.Types.ObjectId.isValid(String(couponId))) {
      query.coupon = new mongoose.Types.ObjectId(String(couponId));
    }
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(String(dateFrom));
      if (dateTo) query.createdAt.$lte = new Date(String(dateTo));
    }

    const redemptions = await CouponRedemption.find(query)
      .populate("coupon", "code name")
      .populate("user", "name email")
      .populate("order", "status totalAmount createdAt")
      .sort({ createdAt: -1 })
      .limit(Math.max(1, Math.min(500, toNumber(limit, 100))));

    return res.status(200).json(redemptions);
  } catch (error) {
    console.error("Failed to fetch coupon redemptions:", error);
    return res.status(500).json({ error: "Failed to fetch coupon redemptions" });
  }
};
