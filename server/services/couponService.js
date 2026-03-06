import crypto from "node:crypto";
import mongoose from "mongoose";
import Coupon from "../models/Coupon.js";
import CouponAssignment from "../models/CouponAssignment.js";
import CouponReservation from "../models/CouponReservation.js";
import CouponRedemption from "../models/CouponRedemption.js";
import Order from "../models/Order.js";
import CustomerProfile from "../models/CustomerProfile.js";

const RESERVATION_WINDOW_MINUTES = 15;
let couponBootstrapDone = false;

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof mongoose.Types.ObjectId) return String(value);
  if (value?._id) return String(value._id);
  return String(value);
};

const round2 = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const startOfDay = (date = new Date()) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const normalizeCouponCode = (value = "") => String(value || "").trim().toUpperCase();

export const expireStaleCouponsAndAssignments = async (now = new Date()) => {
  if (!couponBootstrapDone) {
    await Coupon.findOneAndUpdate(
      { code: "WELCOME10" },
      {
        $setOnInsert: {
          code: "WELCOME10",
          name: "Welcome 10%",
          description: "General welcome discount",
          status: "ACTIVE",
          sourceType: "ADMIN",
          audienceType: "GENERAL",
          discountType: "PERCENT",
          discountValue: 10,
          minOrderAmount: 0,
          autoExpire: false,
          timezone: "UTC",
        },
      },
      { upsert: true, new: true }
    );
    couponBootstrapDone = true;
  }

  const couponResult = await Coupon.updateMany(
    {
      status: { $in: ["ACTIVE", "PAUSED"] },
      autoExpire: true,
      validUntil: { $ne: null, $lt: now },
    },
    { $set: { status: "EXPIRED", updatedAt: now } }
  );

  const assignmentResult = await CouponAssignment.updateMany(
    {
      status: { $in: ["AVAILABLE", "RESERVED"] },
      validUntil: { $ne: null, $lt: now },
    },
    { $set: { status: "EXPIRED", updatedAt: now } }
  );

  const expiredReservations = await CouponReservation.find({
    status: "ACTIVE",
    expiresAt: { $lt: now },
  }).select("_id assignment");

  if (expiredReservations.length > 0) {
    const expiredReservationIds = expiredReservations.map((item) => item._id);
    await CouponReservation.updateMany(
      { _id: { $in: expiredReservationIds }, status: "ACTIVE" },
      { $set: { status: "EXPIRED", updatedAt: now } }
    );

    const assignmentIds = expiredReservations
      .map((item) => item.assignment)
      .filter(Boolean);
    if (assignmentIds.length > 0) {
      await CouponAssignment.updateMany(
        { _id: { $in: assignmentIds }, status: "RESERVED" },
        { $set: { status: "AVAILABLE", reservation: null, updatedAt: now } }
      );
    }
  }

  return {
    expiredCoupons: couponResult.modifiedCount || 0,
    expiredAssignments: assignmentResult.modifiedCount || 0,
    expiredReservations: expiredReservations.length,
  };
};

const computeDiscountAmount = ({ discountType, discountValue, maxDiscountAmount, subtotal, deliveryCharge, orderType }) => {
  const safeSubtotal = Number(subtotal || 0);
  const safeDelivery = Number(deliveryCharge || 0);
  let rawDiscount = 0;

  if (discountType === "PERCENT") {
    rawDiscount = safeSubtotal * (Number(discountValue || 0) / 100);
  } else if (discountType === "FLAT") {
    rawDiscount = Number(discountValue || 0);
  } else if (discountType === "FREE_DELIVERY") {
    rawDiscount = orderType === "Delivery" ? safeDelivery : 0;
  }

  const cappedByMax =
    maxDiscountAmount !== null && maxDiscountAmount !== undefined
      ? Math.min(rawDiscount, Number(maxDiscountAmount))
      : rawDiscount;

  const totalReducible = safeSubtotal + safeDelivery;
  return round2(Math.max(0, Math.min(cappedByMax, totalReducible)));
};

const ensureCouponWindow = (coupon, now = new Date()) => {
  if (coupon.status !== "ACTIVE") {
    return { ok: false, reason: "Coupon is not active" };
  }
  if (coupon.validFrom && now < coupon.validFrom) {
    return { ok: false, reason: "Coupon is not active yet" };
  }
  if (coupon.validUntil && now > coupon.validUntil) {
    return { ok: false, reason: "Coupon has expired" };
  }
  return { ok: true };
};

const hasIdInList = (list = [], userId) => {
  const needle = toIdString(userId);
  if (!needle) return false;
  return list.some((item) => toIdString(item) === needle);
};

const ensureEligibility = async ({ coupon, userId, subtotal, orderType, now }) => {
  if (coupon.applicableOrderTypes?.length > 0 && orderType) {
    if (!coupon.applicableOrderTypes.includes(orderType)) {
      return { ok: false, reason: "Coupon is not valid for this order type" };
    }
  }

  if (Number(subtotal || 0) < Number(coupon.minOrderAmount || 0)) {
    return {
      ok: false,
      reason: `Minimum order amount is ${Number(coupon.minOrderAmount || 0).toFixed(2)}`,
    };
  }

  if (coupon.includeUsers?.length > 0 && !hasIdInList(coupon.includeUsers, userId)) {
    return { ok: false, reason: "Coupon is not available for this user" };
  }

  if (coupon.excludeUsers?.length > 0 && hasIdInList(coupon.excludeUsers, userId)) {
    return { ok: false, reason: "Coupon is not available for this user" };
  }

  if (coupon.globalUsageLimit !== null && coupon.globalUsageLimit !== undefined) {
    if (Number(coupon.usageCount || 0) >= Number(coupon.globalUsageLimit)) {
      return { ok: false, reason: "Coupon usage limit reached" };
    }
  }

  const userRedemptionCount = await CouponRedemption.countDocuments({
    coupon: coupon._id,
    user: userId,
    status: "APPLIED",
  });
  if (
    coupon.perUserUsageLimit !== null &&
    coupon.perUserUsageLimit !== undefined &&
    userRedemptionCount >= Number(coupon.perUserUsageLimit)
  ) {
    return { ok: false, reason: "Per-user coupon limit reached" };
  }

  const dayRedemptionCount = await CouponRedemption.countDocuments({
    coupon: coupon._id,
    status: "APPLIED",
    createdAt: { $gte: startOfDay(now) },
  });
  if (
    coupon.perDayUsageLimit !== null &&
    coupon.perDayUsageLimit !== undefined &&
    dayRedemptionCount >= Number(coupon.perDayUsageLimit)
  ) {
    return { ok: false, reason: "Daily coupon limit reached" };
  }

  if (coupon.newUserOnly || coupon.firstOrderOnly) {
    const totalOrders = await Order.countDocuments({ user: userId });
    if (totalOrders > 0) {
      return { ok: false, reason: "Coupon is only valid for first order users" };
    }
  }

  if (coupon.membershipTiers?.length > 0) {
    const profile = await CustomerProfile.findOne({ user: userId }).select("membershipTier");
    const tier = profile?.membershipTier;
    if (!tier || !coupon.membershipTiers.includes(tier)) {
      return { ok: false, reason: "Coupon is not valid for your membership tier" };
    }
  }

  return { ok: true };
};

const findAssignmentForUser = async ({ couponId, userId, now }) => {
  const assignment = await CouponAssignment.findOne({
    coupon: couponId,
    user: userId,
    status: { $in: ["AVAILABLE", "RESERVED"] },
    $or: [{ validFrom: null }, { validFrom: { $lte: now } }],
    $and: [{ $or: [{ validUntil: null }, { validUntil: { $gte: now } }] }],
  }).sort({ createdAt: -1 });
  return assignment;
};

export const validateCouponForUser = async ({
  code,
  userId,
  subtotal = 0,
  orderType = "Pickup",
  deliveryCharge = 0,
  now = new Date(),
}) => {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) {
    return { ok: false, reason: "Coupon code is required" };
  }

  await expireStaleCouponsAndAssignments(now);

  const coupon = await Coupon.findOne({ code: normalizedCode });
  if (!coupon) {
    return { ok: false, reason: "Invalid coupon code" };
  }

  const windowCheck = ensureCouponWindow(coupon, now);
  if (!windowCheck.ok) {
    return { ok: false, reason: windowCheck.reason };
  }

  const eligibilityCheck = await ensureEligibility({
    coupon,
    userId,
    subtotal,
    orderType,
    now,
  });
  if (!eligibilityCheck.ok) {
    return { ok: false, reason: eligibilityCheck.reason };
  }

  let assignment = null;
  if (["TARGETED", "RECOMMENDED"].includes(coupon.audienceType)) {
    assignment = await findAssignmentForUser({ couponId: coupon._id, userId, now });
    if (!assignment) {
      return { ok: false, reason: "This coupon is not assigned to your account" };
    }
  }

  const discountAmount = computeDiscountAmount({
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscountAmount: coupon.maxDiscountAmount,
    subtotal,
    deliveryCharge,
    orderType,
  });

  return {
    ok: true,
    coupon,
    assignment,
    pricing: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount,
      discountAmount,
      subtotal: round2(subtotal),
      orderType,
      deliveryCharge: round2(deliveryCharge),
    },
  };
};

export const reserveCouponForCheckout = async ({
  code,
  userId,
  subtotal = 0,
  orderType = "Pickup",
  deliveryCharge = 0,
  cartItemsCount = 0,
  now = new Date(),
}) => {
  const validation = await validateCouponForUser({
    code,
    userId,
    subtotal,
    orderType,
    deliveryCharge,
    now,
  });

  if (!validation.ok) {
    return validation;
  }

  await CouponReservation.updateMany(
    { user: userId, status: "ACTIVE" },
    { $set: { status: "RELEASED", releasedAt: now, updatedAt: now } }
  );

  if (validation.assignment && validation.assignment.status === "RESERVED") {
    await CouponAssignment.findByIdAndUpdate(validation.assignment._id, {
      $set: { status: "AVAILABLE", reservation: null, updatedAt: now },
    });
  }

  const reservationToken = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + RESERVATION_WINDOW_MINUTES * 60 * 1000);
  const reservation = await CouponReservation.create({
    reservationToken,
    coupon: validation.coupon._id,
    assignment: validation.assignment?._id || null,
    user: userId,
    status: "ACTIVE",
    code: validation.coupon.code,
    orderSnapshot: {
      subtotal: round2(subtotal),
      orderType,
      deliveryCharge: round2(deliveryCharge),
      cartItemsCount,
    },
    discountType: validation.pricing.discountType,
    discountValue: validation.pricing.discountValue,
    maxDiscountAmount: validation.pricing.maxDiscountAmount,
    discountAmount: validation.pricing.discountAmount,
    expiresAt,
  });

  if (validation.assignment) {
    await CouponAssignment.findByIdAndUpdate(validation.assignment._id, {
      $set: {
        status: "RESERVED",
        reservation: reservation._id,
        reservedAt: now,
        updatedAt: now,
      },
    });
  }

  await Coupon.findByIdAndUpdate(validation.coupon._id, {
    $inc: { "metrics.reservedCount": 1 },
    $set: { updatedAt: now },
  });

  return {
    ok: true,
    reservation,
    coupon: validation.coupon,
    pricing: validation.pricing,
  };
};

export const releaseCouponReservation = async ({ reservationToken, userId, now = new Date() }) => {
  const reservation = await CouponReservation.findOne({
    reservationToken,
    user: userId,
    status: "ACTIVE",
  });

  if (!reservation) {
    return { ok: false, reason: "Reservation not found" };
  }

  reservation.status = "RELEASED";
  reservation.releasedAt = now;
  await reservation.save();

  if (reservation.assignment) {
    await CouponAssignment.findByIdAndUpdate(reservation.assignment, {
      $set: { status: "AVAILABLE", reservation: null, updatedAt: now },
    });
  }

  return { ok: true };
};

export const consumeCouponReservation = async ({
  reservationToken,
  userId,
  orderId,
  orderSubtotal,
  orderTotalBeforeDiscount,
  orderTotalAfterDiscount = null,
  now = new Date(),
}) => {
  const reservation = await CouponReservation.findOne({
    reservationToken,
    user: userId,
    status: "ACTIVE",
    expiresAt: { $gte: now },
  })
    .populate("coupon")
    .populate("assignment");

  if (!reservation) {
    return { ok: false, reason: "Coupon reservation expired or invalid" };
  }

  const validation = await validateCouponForUser({
    code: reservation.code,
    userId,
    subtotal: orderSubtotal,
    orderType: reservation.orderSnapshot?.orderType || "Pickup",
    deliveryCharge: reservation.orderSnapshot?.deliveryCharge || 0,
    now,
  });
  if (!validation.ok) {
    return { ok: false, reason: validation.reason };
  }

  const finalOrderTotalAfterDiscount =
    orderTotalAfterDiscount === null || orderTotalAfterDiscount === undefined
      ? round2(Number(orderTotalBeforeDiscount || 0) - Number(reservation.discountAmount || 0))
      : round2(orderTotalAfterDiscount);

  const consumed = await CouponReservation.findOneAndUpdate(
    {
      _id: reservation._id,
      status: "ACTIVE",
      expiresAt: { $gte: now },
    },
    {
      $set: {
        status: "CONSUMED",
        consumedAt: now,
        order: orderId,
        updatedAt: now,
      },
    },
    { new: true }
  );

  if (!consumed) {
    return { ok: false, reason: "Coupon reservation already consumed" };
  }

  if (reservation.assignment?._id) {
    await CouponAssignment.findByIdAndUpdate(reservation.assignment._id, {
      $set: {
        status: "REDEEMED",
        redeemedAt: now,
        order: orderId,
        reservation: reservation._id,
        updatedAt: now,
      },
    });
  }

  await Coupon.findByIdAndUpdate(reservation.coupon._id, {
    $inc: {
      usageCount: 1,
      "metrics.redeemedCount": 1,
    },
    $set: { updatedAt: now },
  });

  const redemption = await CouponRedemption.create({
    coupon: reservation.coupon._id,
    assignment: reservation.assignment?._id || null,
    reservation: reservation._id,
    user: userId,
    order: orderId,
    codeUsed: reservation.code,
    discountType: reservation.discountType,
    discountValue: reservation.discountValue,
    discountAmount: reservation.discountAmount,
    orderSubtotal: round2(orderSubtotal),
    orderTotalBeforeDiscount: round2(orderTotalBeforeDiscount),
    orderTotalAfterDiscount: finalOrderTotalAfterDiscount,
    status: "APPLIED",
  });

  return {
    ok: true,
    reservation: consumed,
    redemption,
    discountAmount: reservation.discountAmount,
    couponCode: reservation.code,
    couponId: reservation.coupon._id,
    discountType: reservation.discountType,
    discountValue: reservation.discountValue,
    reservationToken: reservation.reservationToken,
  };
};

export const rollbackConsumedCouponReservation = async ({
  reservationToken,
  userId,
  orderId,
  now = new Date(),
}) => {
  const reservation = await CouponReservation.findOne({
    reservationToken,
    user: userId,
    order: orderId,
    status: "CONSUMED",
  });

  if (!reservation) {
    return { ok: false, reason: "Consumed reservation not found for rollback" };
  }

  reservation.status = "ACTIVE";
  reservation.consumedAt = null;
  reservation.order = null;
  reservation.updatedAt = now;
  await reservation.save();

  if (reservation.assignment) {
    await CouponAssignment.findByIdAndUpdate(reservation.assignment, {
      $set: {
        status: "AVAILABLE",
        redeemedAt: null,
        order: null,
        updatedAt: now,
      },
    });
  }

  await CouponRedemption.deleteMany({
    reservation: reservation._id,
    user: userId,
    order: orderId,
  });

  const coupon = await Coupon.findById(reservation.coupon);
  if (coupon) {
    coupon.usageCount = Math.max(0, Number(coupon.usageCount || 0) - 1);
    const redeemed = Number(coupon.metrics?.redeemedCount || 0) - 1;
    coupon.metrics = {
      ...(coupon.metrics || {}),
      redeemedCount: Math.max(0, redeemed),
    };
    coupon.updatedAt = now;
    await coupon.save();
  }

  return { ok: true };
};

export const createOrUpdateSystemCoupons = async (actorId = null) => {
  const now = new Date();
  const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const templates = [
    {
      code: "NEW10",
      name: "New Customer Welcome 10%",
      description: "Auto-issued to new customers",
      discountType: "PERCENT",
      discountValue: 10,
      maxDiscountAmount: 150,
      minOrderAmount: 199,
      audienceType: "RECOMMENDED",
    },
    {
      code: "WINBACK15",
      name: "Winback 15%",
      description: "Auto-issued for inactive customers",
      discountType: "PERCENT",
      discountValue: 15,
      maxDiscountAmount: 250,
      minOrderAmount: 249,
      audienceType: "RECOMMENDED",
    },
    {
      code: "VIP20",
      name: "VIP Reward 20%",
      description: "Auto-issued for VIP activity",
      discountType: "PERCENT",
      discountValue: 20,
      maxDiscountAmount: 300,
      minOrderAmount: 399,
      audienceType: "RECOMMENDED",
    },
  ];

  const couponMap = {};
  for (const template of templates) {
    const coupon = await Coupon.findOneAndUpdate(
      { code: template.code },
      {
        $set: {
          ...template,
          sourceType: "SYSTEM",
          status: "ACTIVE",
          validFrom: now,
          validUntil,
          autoExpire: true,
          updatedBy: actorId,
        },
        $setOnInsert: { createdBy: actorId },
      },
      { upsert: true, new: true }
    );
    couponMap[template.code] = coupon;
  }

  return couponMap;
};

export const runRecommendationAssignments = async ({ actorId = null, now = new Date() } = {}) => {
  await expireStaleCouponsAndAssignments(now);
  const couponMap = await createOrUpdateSystemCoupons(actorId);
  const profiles = await CustomerProfile.find().select(
    "user totalOrders membershipTier visitFrequency lastOrderDate"
  );

  let assignedCount = 0;
  const ruleCounters = {
    NEW10: 0,
    WINBACK15: 0,
    VIP20: 0,
  };

  for (const profile of profiles) {
    const userId = profile.user;
    if (!userId) continue;

    let ruleCode = null;
    const lastOrderDate = profile.lastOrderDate ? new Date(profile.lastOrderDate) : null;
    const daysSinceLastOrder = lastOrderDate
      ? (now.getTime() - lastOrderDate.getTime()) / (24 * 60 * 60 * 1000)
      : null;

    if (profile.totalOrders <= 1) {
      ruleCode = "NEW10";
    } else if (daysSinceLastOrder !== null && daysSinceLastOrder >= 21) {
      ruleCode = "WINBACK15";
    } else if (
      profile.visitFrequency === "VIP" ||
      profile.membershipTier === "Gold" ||
      profile.membershipTier === "Platinum"
    ) {
      ruleCode = "VIP20";
    }

    if (!ruleCode) continue;
    const coupon = couponMap[ruleCode];
    if (!coupon) continue;

    const existing = await CouponAssignment.findOne({
      coupon: coupon._id,
      user: userId,
      status: { $in: ["AVAILABLE", "RESERVED"] },
    });
    if (existing) continue;

    const validUntil = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    await CouponAssignment.create({
      coupon: coupon._id,
      user: userId,
      status: "AVAILABLE",
      issuedBy: "SYSTEM_RULE",
      issuedReason: `Auto recommendation: ${ruleCode}`,
      recommendationContext: {
        totalOrders: profile.totalOrders || 0,
        membershipTier: profile.membershipTier || null,
        visitFrequency: profile.visitFrequency || null,
        lastOrderDate: profile.lastOrderDate || null,
      },
      validFrom: now,
      validUntil,
    });

    assignedCount += 1;
    ruleCounters[ruleCode] += 1;
  }

  return {
    assignedCount,
    ruleCounters,
  };
};

export default {
  normalizeCouponCode,
  expireStaleCouponsAndAssignments,
  validateCouponForUser,
  reserveCouponForCheckout,
  releaseCouponReservation,
  consumeCouponReservation,
  rollbackConsumedCouponReservation,
  runRecommendationAssignments,
};
