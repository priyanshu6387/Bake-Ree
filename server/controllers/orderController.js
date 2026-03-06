import mongoose from "mongoose";
import Order from "../models/Order.js";
import OrderRequest from "../models/OrderRequest.js";
import Delivery from "../models/Delivery.js";
import DeliveryZone from "../models/DeliveryZone.js";
import {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
} from "../services/emailService.js";
import {
  emitOrderCreated,
  emitOrderStatusUpdated,
  emitOrderApprovalUpdated,
  emitOrderRequestCreated,
  emitOrderRequestReviewed,
} from "../services/socketService.js";
import { calculateCustomerAnalytics } from "../services/customerAnalyticsService.js";
import { awardPointsForOrder } from "../services/loyaltyPointsService.js";
import {
  ORDER_STATUSES,
  ACTIVE_ORDER_STATUSES,
  actionToStatus,
  canTransition,
  normalizeOrderStatus,
} from "../services/orderLifecycleService.js";
import { hasPermission } from "../services/accessControlService.js";
import {
  consumeCouponReservation,
  rollbackConsumedCouponReservation,
} from "../services/couponService.js";

const LEGACY_STATUS_INPUT = {
  Pending: ORDER_STATUSES.PENDING,
  Preparing: ORDER_STATUSES.PREPARING,
  Ready: ORDER_STATUSES.READY_FOR_HANDOFF,
  Delivered: ORDER_STATUSES.DELIVERED,
  Cancelled: ORDER_STATUSES.CANCELLED,
  HOLD: ORDER_STATUSES.HOLD,
  Hold: ORDER_STATUSES.HOLD,
};

const isAdminUser = (user) => Boolean(user?.isAdmin === true || user?.role === "admin");

const isOpsAdminActor = (req) =>
  Boolean(
    isAdminUser(req.user) ||
      req.accessContext?.roleKey === "super_admin" ||
      req.accessContext?.roleKey === "ops_admin"
  );

const ensureKitchenOwnedLifecycleActor = (req) => {
  if (!isOpsAdminActor(req)) return null;
  return "Forbidden: Admin can only approve/reject orders. Kitchen roles must update lifecycle status.";
};

const STATUS_TO_PERMISSION = {
  [ORDER_STATUSES.PREPARING]: "ops.action.kitchen.order.start",
  [ORDER_STATUSES.READY_FOR_HANDOFF]: "ops.action.kitchen.order.mark_ready",
  [ORDER_STATUSES.HOLD]: "ops.action.kitchen.order.hold",
  [ORDER_STATUSES.DISPATCH_ASSIGNED]: "ops.action.kitchen.order.assign_dispatch",
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: "ops.action.kitchen.order.assign_dispatch",
  [ORDER_STATUSES.PICKUP_READY]: "ops.action.kitchen.order.handoff",
  [ORDER_STATUSES.PICKED_UP]: "ops.action.kitchen.order.handoff",
  [ORDER_STATUSES.DELIVERED]: "ops.action.kitchen.order.complete",
  [ORDER_STATUSES.COMPLETED]: "ops.action.kitchen.order.complete",
  [ORDER_STATUSES.CANCELLED]: "ops.action.orders.cancel",
};

const ACTION_TO_PERMISSION = {
  START_PREPARING: "ops.action.kitchen.order.start",
  MARK_READY_FOR_HANDOFF: "ops.action.kitchen.order.mark_ready",
  ASSIGN_DISPATCH: "ops.action.kitchen.order.assign_dispatch",
  MARK_OUT_FOR_DELIVERY: "ops.action.kitchen.order.assign_dispatch",
  MARK_PICKUP_READY: "ops.action.kitchen.order.handoff",
  MARK_PICKED_UP: "ops.action.kitchen.order.handoff",
  MARK_DELIVERED: "ops.action.kitchen.order.complete",
  MARK_COMPLETED: "ops.action.kitchen.order.complete",
  HOLD: "ops.action.kitchen.order.hold",
  RESUME_FROM_HOLD: "ops.action.kitchen.order.start",
  CANCEL: "ops.action.orders.cancel",
};

const ensureTransitionPermission = ({ req, targetStatus, action }) => {
  if (process.env.NODE_ENV !== "production") return null;
  if (isAdminUser(req.user) || req.accessContext?.roleKey === "super_admin") return null;

  const permissions = req.accessContext?.permissions || req.user?.permissions || [];
  const statusPermission = targetStatus ? STATUS_TO_PERMISSION[normalizeOrderStatus(targetStatus)] : null;
  const actionPermission = action ? ACTION_TO_PERMISSION[String(action).toUpperCase()] : null;
  const requiredPermission = actionPermission || statusPermission;

  if (!requiredPermission) return null;
  if (hasPermission(permissions, requiredPermission)) return null;

  return requiredPermission;
};

const normalizeIncomingStatus = (status) => {
  if (!status) return null;
  return LEGACY_STATUS_INPUT[status] || normalizeOrderStatus(status);
};

const normalizePaymentMethod = (value) => {
  if (!value) return "COD";
  const normalized = String(value).trim().toUpperCase();
  if (["CARD", "COD", "UPI", "WALLET", "OTHER"].includes(normalized)) {
    return normalized;
  }
  if (normalized === "CASH") return "COD";
  return "OTHER";
};

const normalizeOrderAddress = (rawAddress = {}) => {
  if (!rawAddress) return null;

  const street = rawAddress.street || rawAddress.addressLine1 || rawAddress.line1 || "";
  const city = rawAddress.city || "";
  const state = rawAddress.state || "";
  const zipCode = rawAddress.zipCode || rawAddress.postalCode || "";
  const country = rawAddress.country || "India";

  if (!street || !city || !state || !zipCode) {
    return null;
  }

  return {
    street,
    city,
    state,
    zipCode,
    country,
    landmark: rawAddress.landmark || rawAddress.addressLine2 || "",
    coordinates: rawAddress.coordinates || undefined,
    recipientName:
      rawAddress.recipientName ||
      rawAddress.fullName ||
      rawAddress.name ||
      "",
    phone: rawAddress.phone || "",
  };
};

const mapSavedAddressToOrderAddress = (savedAddress) => {
  if (!savedAddress) return null;

  return {
    street: savedAddress.addressLine1,
    city: savedAddress.city,
    state: savedAddress.state,
    zipCode: savedAddress.postalCode,
    country: savedAddress.country || "India",
    landmark: savedAddress.addressLine2 || "",
    recipientName: savedAddress.fullName || "",
    phone: savedAddress.phone || "",
  };
};

const appendLifecycleEvent = (order, event) => {
  if (!order.lifecycleEvents) order.lifecycleEvents = [];
  order.lifecycleEvents.push({
    action: event.action,
    fromStatus: event.fromStatus || "",
    toStatus: event.toStatus || "",
    actor: event.actor?._id || null,
    actorRole: event.actor?.role || (event.actor?.isAdmin ? "admin" : "customer"),
    notes: event.notes || "",
    meta: event.meta || {},
    createdAt: new Date(),
  });
};

const maybeCreateOrSyncDelivery = async (order, nextStatus) => {
  const canonicalStatus = normalizeOrderStatus(nextStatus);

  if (order.orderType !== "Delivery") return;

  const existingDelivery = await Delivery.findOne({ order: order._id });

  if (canonicalStatus === ORDER_STATUSES.READY_FOR_HANDOFF) {
    if (!existingDelivery) {
      let deliveryZone = null;

      if (order.deliveryAddress?.coordinates?.lat && order.deliveryAddress?.coordinates?.lng) {
        const zones = await DeliveryZone.find({ isActive: true });
        for (const zone of zones) {
          if (zone.center && zone.radius) {
            const distance = calculateDistance(
              order.deliveryAddress.coordinates.lat,
              order.deliveryAddress.coordinates.lng,
              zone.center.lat,
              zone.center.lng
            );
            if (distance <= zone.radius) {
              deliveryZone = zone._id;
              break;
            }
          }
        }
      }

      await Delivery.create({
        order: order._id,
        deliveryAddress: order.deliveryAddress,
        deliveryZone,
        deliveryCharge: order.deliveryCharge || 0,
        contactPhone: order.deliveryAddress?.phone || "",
        estimatedDeliveryTime: order.estimatedDeliveryTime || new Date(Date.now() + 45 * 60 * 1000),
        status: "Pending",
      });
    }
    return;
  }

  if (!existingDelivery) return;

  if (canonicalStatus === ORDER_STATUSES.DISPATCH_ASSIGNED) {
    existingDelivery.status = "Assigned";
    await existingDelivery.save();
    return;
  }

  if (canonicalStatus === ORDER_STATUSES.OUT_FOR_DELIVERY) {
    existingDelivery.status = "Out for Delivery";
    await existingDelivery.save();
    return;
  }

  if (canonicalStatus === ORDER_STATUSES.DELIVERED) {
    existingDelivery.status = "Delivered";
    existingDelivery.actualDeliveryTime = new Date();
    await existingDelivery.save();
  }
};

const mapOrderForClient = (order) => {
  if (!order) return order;
  const obj = order.toObject ? order.toObject() : { ...order };
  obj.status = normalizeOrderStatus(obj.status);
  return obj;
};

const CUSTOMER_STATUS_EMAIL_STATUSES = new Set([
  ORDER_STATUSES.DELIVERED,
  ORDER_STATUSES.CANCELLED,
]);

const shouldNotifyCustomerForStatus = (status) =>
  CUSTOMER_STATUS_EMAIL_STATUSES.has(normalizeOrderStatus(status));

const queueLifecycleStatusEmail = (order, nextStatus, contextLabel = "order status update") => {
  const normalizedStatus = normalizeOrderStatus(nextStatus);
  if (!shouldNotifyCustomerForStatus(normalizedStatus)) return;
  if (!order?.user?.email) return;

  sendOrderStatusUpdate(order, order.user, normalizedStatus).catch((err) => {
    console.error(`Failed to send ${contextLabel} email:`, err);
  });
};

const applyStatusTransition = async ({
  order,
  targetStatus,
  actor,
  notes,
  meta,
  holdPayload,
}) => {
  const fromStatus = normalizeOrderStatus(order.status);
  const toStatus = normalizeOrderStatus(targetStatus);

  if (!canTransition({ fromStatus, toStatus, orderType: order.orderType })) {
    return {
      ok: false,
      error: `Invalid status transition: ${fromStatus} -> ${toStatus}`,
    };
  }

  order.status = toStatus;

  if (toStatus === ORDER_STATUSES.HOLD) {
    order.hold = {
      reason: holdPayload?.reason || "Operational hold",
      severity: holdPayload?.severity || "WARNING",
      notes: holdPayload?.notes || notes || "",
      createdBy: actor?._id || null,
      createdAt: new Date(),
      resolvedBy: null,
      resolvedAt: null,
      resolutionNotes: "",
    };
  } else if (fromStatus === ORDER_STATUSES.HOLD && toStatus === ORDER_STATUSES.PREPARING) {
    order.hold = {
      ...(order.hold || {}),
      resolvedBy: actor?._id || null,
      resolvedAt: new Date(),
      resolutionNotes: notes || "Resumed after hold",
    };
  }

  appendLifecycleEvent(order, {
    action: `STATUS_${toStatus}`,
    fromStatus,
    toStatus,
    actor,
    notes,
    meta,
  });

  if (toStatus === ORDER_STATUSES.COMPLETED && !order.loyaltyAwardedAt && order.user) {
    try {
      await awardPointsForOrder(order.user, order._id, order.totalAmount || 0);
      order.loyaltyAwardedAt = new Date();

      const { updateMembershipTier } = await import("../services/tierManagementService.js");
      await updateMembershipTier(order.user, true);
    } catch (error) {
      console.error("Failed to award loyalty/tier update:", error);
    }
  }

  return { ok: true, fromStatus, toStatus };
};

/**
 * Place a new order
 */
export const createOrder = async (req, res) => {
  try {
    const { items = [], orderType = "Pickup" } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one item is required" });
    }

    const normalizedItems = items.map((raw) => {
      const idValue = raw.product || raw.productId;
      if (!mongoose.Types.ObjectId.isValid(idValue)) {
        throw new Error(`Invalid product ID: ${idValue}`);
      }
      const quantity = Number(raw.quantity);
      const price = Number(raw.price);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("Item quantity must be greater than 0");
      }
      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Item price is invalid");
      }
      return {
        product: new mongoose.Types.ObjectId(idValue),
        quantity,
        price,
      };
    });

    const itemsTotal = normalizedItems.reduce(
      (sum, it) => sum + it.quantity * it.price,
      0
    );

    let discount = 0;
    const tax = Number(req.body.tax ?? 0);
    const deliveryCharge =
      req.body.deliveryCharge !== undefined
        ? Number(req.body.deliveryCharge)
        : orderType === "Delivery"
        ? 49
        : 0;
    const couponReservationToken = String(req.body.couponReservationToken || "").trim();
    const nextOrderId = new mongoose.Types.ObjectId();
    let couponConsumption = null;

    if (!couponReservationToken && req.body.couponCode) {
      return res.status(400).json({
        error: "Coupon code must be applied through coupon reservation flow",
      });
    }

    const paymentMethod = normalizePaymentMethod(req.body.paymentMethod);
    const paymentStatus = paymentMethod === "COD" ? "PENDING" : "PAID";

    let deliveryAddress = null;
    let deliveryAddressId = null;
    let estimatedDeliveryTime = null;

    if (orderType === "Delivery") {
      if (req.body.deliveryAddressId) {
        const DeliveryAddress = (await import("../models/DeliveryAddress.js")).default;
        const savedAddress = await DeliveryAddress.findOne({
          _id: req.body.deliveryAddressId,
          user: req.user._id,
        });

        if (savedAddress) {
          deliveryAddress = mapSavedAddressToOrderAddress(savedAddress);
          deliveryAddressId = savedAddress._id;
        }
      }

      if (!deliveryAddress && req.body.deliveryAddress) {
        deliveryAddress = normalizeOrderAddress(req.body.deliveryAddress);
      }

      if (!deliveryAddress) {
        return res.status(400).json({ error: "Delivery address is required" });
      }

      if (deliveryAddress?.coordinates?.lat && deliveryAddress?.coordinates?.lng) {
        const zones = await DeliveryZone.find({ isActive: true });
        for (const zone of zones) {
          if (zone.center && zone.radius) {
            const distance = calculateDistance(
              deliveryAddress.coordinates.lat,
              deliveryAddress.coordinates.lng,
              zone.center.lat,
              zone.center.lng
            );
            if (distance <= zone.radius) {
              estimatedDeliveryTime = new Date();
              estimatedDeliveryTime.setMinutes(
                estimatedDeliveryTime.getMinutes() + (zone.estimatedDeliveryTime || 45)
              );
              break;
            }
          }
        }
      }

      if (!estimatedDeliveryTime) {
        estimatedDeliveryTime = new Date();
        estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 45);
      }
    }

    if (couponReservationToken) {
      const consumeResult = await consumeCouponReservation({
        reservationToken: couponReservationToken,
        userId: req.user._id,
        orderId: nextOrderId,
        orderSubtotal: itemsTotal,
        orderTotalBeforeDiscount: itemsTotal + tax + deliveryCharge,
      });
      if (!consumeResult.ok) {
        return res.status(400).json({ error: consumeResult.reason || "Invalid coupon reservation" });
      }
      couponConsumption = consumeResult;
      discount = Number(consumeResult.discountAmount || 0);
    }

    const totalAmount = itemsTotal - discount + tax + deliveryCharge;

    const allergySource =
      req.body.allergies ??
      req.body.allergyPreferences?.allergies ??
      req.user?.allergyPreferences?.allergies ??
      [];
    const rawAllergies = Array.isArray(allergySource)
      ? allergySource
          .map((value) => String(value || "").trim())
          .filter(Boolean)
      : String(allergySource || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
    const allergyNotes =
      req.body.allergyNotes ??
      req.body.allergyPreferences?.notes ??
      req.user?.allergyPreferences?.notes ??
      "";

    const requiresApproval = req.body.requiresApproval !== false;
    const initialStatus = requiresApproval
      ? ORDER_STATUSES.APPROVAL_PENDING
      : ORDER_STATUSES.PENDING;

    let created;
    try {
      created = await Order.create({
        _id: nextOrderId,
        user: req.user._id,
        items: normalizedItems,
        simplifiedItems: req.body.simplifiedItems,
        orderType,
        status: initialStatus,
        priority: req.body.priority || "NORMAL",
        station: req.body.station || "UNASSIGNED",
        subtotal: itemsTotal,
        tax,
        discount,
        deliveryCharge,
        totalAmount,
        couponCode: couponConsumption?.couponCode || "",
        couponId: couponConsumption?.couponId || null,
        pricingSnapshot: {
          subtotal: itemsTotal,
          tax,
          deliveryCharge,
          discount,
          total: totalAmount,
        },
        appliedCoupon: couponConsumption
          ? {
              code: couponConsumption.couponCode,
              couponId: couponConsumption.couponId,
              discountType: couponConsumption.discountType,
              discountValue: couponConsumption.discountValue,
              discountAmount: couponConsumption.discountAmount,
              reservationToken: couponConsumption.reservationToken,
              appliedAt: new Date(),
            }
          : undefined,
        specialInstructions: req.body.specialInstructions || "",
        allergies: rawAllergies,
        allergyNotes,
        requiresAllergyCheck: rawAllergies.length > 0,
        paymentMethod,
        paymentStatus,
        approval: {
          required: requiresApproval,
          status: requiresApproval ? "PENDING" : "NOT_REQUIRED",
        },
        deliveryAddress,
        deliveryAddressId,
        estimatedDeliveryTime,
        lifecycleEvents: [
          {
            action: "ORDER_CREATED",
            fromStatus: null,
            toStatus: initialStatus,
            actor: req.user?._id || null,
            actorRole: req.user?.role || "customer",
            notes: "Order created",
            meta: {
              orderType,
              paymentMethod,
              couponCode: couponConsumption?.couponCode || "",
            },
            createdAt: new Date(),
          },
        ],
      });
    } catch (createError) {
      if (couponConsumption?.reservationToken) {
        await rollbackConsumedCouponReservation({
          reservationToken: couponConsumption.reservationToken,
          userId: req.user._id,
          orderId: nextOrderId,
        });
      }
      throw createError;
    }

    const order = await Order.findById(created._id)
      .setOptions({ strictPopulate: false })
      .populate("user", "name email phone")
      .populate("items.product", "name image price")
      .populate("assignedKitchenStaff", "name email");

    if (order?.user?.email) {
      sendOrderConfirmation(order, order.user).catch((err) => {
        console.error("Failed to send order confirmation email:", err);
      });
    }

    try {
      emitOrderCreated(order);
    } catch (err) {
      console.error("Failed to emit order created event:", err);
    }

    try {
      calculateCustomerAnalytics(order.user._id).catch((err) => {
        console.error("Failed to update customer analytics:", err);
      });
    } catch (_error) {
      // ignore analytics errors
    }

    return res.status(201).json(mapOrderForClient(order));
  } catch (err) {
    console.error("Order creation error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Logged-in user's orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .setOptions({ strictPopulate: false })
      .populate("user", "name email phone")
      .populate("items.product", "name image price")
      .sort({ createdAt: -1 });

    res.status(200).json(orders.map(mapOrderForClient));
  } catch (err) {
    console.error("Get user orders error:", err);
    res.status(500).json({ error: err.message });
  }
};

// My orders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .setOptions({ strictPopulate: false })
      .populate("user", "name email phone")
      .populate("items.product", "name image price")
      .sort({ createdAt: -1 });

    res.status(200).json(orders.map(mapOrderForClient));
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ error: "Failed to fetch your orders" });
  }
};

// Order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .setOptions({ strictPopulate: false })
      .populate("user", "name email phone")
      .populate("items.product", "name image price")
      .populate("assignedKitchenStaff", "name email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (req.user) {
      const isOwner = order.user && order.user._id.toString() === req.user._id.toString();
      const isAdmin = isAdminUser(req.user);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Access denied: You can only view your own orders" });
      }
    }

    res.json(mapOrderForClient(order));
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Legacy update status endpoint (kept for backward compatibility)
export const updateOrderStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    let transitionResult = null;

    if (req.body.assignedKitchenStaff !== undefined) {
      if (req.body.assignedKitchenStaff === null || req.body.assignedKitchenStaff === "") {
        order.assignedKitchenStaff = null;
      } else if (mongoose.Types.ObjectId.isValid(req.body.assignedKitchenStaff)) {
        order.assignedKitchenStaff = req.body.assignedKitchenStaff;
      } else {
        return res.status(400).json({ error: "Invalid kitchen staff ID" });
      }
    }

    if (req.body.status) {
      const actorRestrictionError = ensureKitchenOwnedLifecycleActor(req);
      if (actorRestrictionError) {
        return res.status(403).json({ error: actorRestrictionError });
      }

      const targetStatus = normalizeIncomingStatus(req.body.status);
      const deniedPermission = ensureTransitionPermission({
        req,
        targetStatus,
        action: null,
      });
      if (deniedPermission) {
        return res.status(403).json({
          error: `Forbidden: Missing permission ${deniedPermission}`,
        });
      }

      transitionResult = await applyStatusTransition({
        order,
        targetStatus,
        actor: req.user,
        notes: req.body.notes || "Legacy status update endpoint",
      });

      if (!transitionResult.ok) {
        return res.status(400).json({ error: transitionResult.error });
      }

      await maybeCreateOrSyncDelivery(order, targetStatus);
    }

    await order.save();

    const populated = await Order.findById(order._id)
      .setOptions({ strictPopulate: false })
      .populate("user", "name email phone")
      .populate("items.product", "name image price")
      .populate("assignedKitchenStaff", "name email");

    if (
      transitionResult &&
      transitionResult.fromStatus !== transitionResult.toStatus
    ) {
      queueLifecycleStatusEmail(populated, transitionResult.toStatus);
    }

    emitOrderStatusUpdated(populated, req.body.oldStatus || null, req.user);

    try {
      calculateCustomerAnalytics(order.user).catch((err) => {
        console.error("Failed to update customer analytics:", err);
      });
    } catch (_error) {
      // ignore analytics errors
    }

    res.status(200).json(mapOrderForClient(populated));
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Approve / reject orders from approval queue
export const approveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision = "APPROVE", reason = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const current = normalizeOrderStatus(order.status);
    if (current !== ORDER_STATUSES.APPROVAL_PENDING) {
      return res.status(400).json({
        error: `Order is not awaiting approval. Current status: ${current}`,
      });
    }

    const normalizedDecision = String(decision).toUpperCase();
    if (!["APPROVE", "REJECT"].includes(normalizedDecision)) {
      return res.status(400).json({ error: "decision must be APPROVE or REJECT" });
    }

    const oldStatus = current;

    if (normalizedDecision === "APPROVE") {
      order.approval = {
        ...(order.approval || {}),
        required: true,
        status: "APPROVED",
        approvedBy: req.user?._id || null,
        approvedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
        reason,
      };

      order.status = ORDER_STATUSES.PENDING;

      appendLifecycleEvent(order, {
        action: "ORDER_APPROVED",
        fromStatus: oldStatus,
        toStatus: ORDER_STATUSES.PENDING,
        actor: req.user,
        notes: reason || "Approved by operations",
      });
    } else {
      order.approval = {
        ...(order.approval || {}),
        required: true,
        status: "REJECTED",
        approvedBy: null,
        approvedAt: null,
        rejectedBy: req.user?._id || null,
        rejectedAt: new Date(),
        reason,
      };

      order.status = ORDER_STATUSES.CANCELLED;

      appendLifecycleEvent(order, {
        action: "ORDER_REJECTED",
        fromStatus: oldStatus,
        toStatus: ORDER_STATUSES.CANCELLED,
        actor: req.user,
        notes: reason || "Rejected by operations",
      });
    }

    await order.save();

    const populated = await Order.findById(order._id)
      .setOptions({ strictPopulate: false })
      .populate("user", "name email phone")
      .populate("items.product", "name image price")
      .populate("assignedKitchenStaff", "name email");

    emitOrderApprovalUpdated(populated, normalizedDecision, req.user, reason);
    emitOrderStatusUpdated(populated, oldStatus, req.user);

    if (normalizedDecision === "REJECT") {
      queueLifecycleStatusEmail(populated, ORDER_STATUSES.CANCELLED, "order cancellation");
    }

    res.status(200).json(mapOrderForClient(populated));
  } catch (error) {
    console.error("Approve order error:", error);
    res.status(500).json({ error: "Failed to update approval" });
  }
};

// Strict lifecycle transition endpoint
export const transitionOrderLifecycle = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action, notes = "", hold } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const actorRestrictionError = ensureKitchenOwnedLifecycleActor(req);
    if (actorRestrictionError) {
      return res.status(403).json({ error: actorRestrictionError });
    }

    const targetStatus = status
      ? normalizeIncomingStatus(status)
      : actionToStatus({ action, orderType: order.orderType });

    if (!targetStatus) {
      return res.status(400).json({
        error: "Either a valid status or action is required",
      });
    }

    const deniedPermission = ensureTransitionPermission({
      req,
      targetStatus,
      action,
    });
    if (deniedPermission) {
      return res.status(403).json({
        error: `Forbidden: Missing permission ${deniedPermission}`,
      });
    }

    const oldStatus = normalizeOrderStatus(order.status);

    const result = await applyStatusTransition({
      order,
      targetStatus,
      actor: req.user,
      notes,
      meta: { action: action || null },
      holdPayload: hold,
    });

    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    await maybeCreateOrSyncDelivery(order, result.toStatus);

    await order.save();

    const populated = await Order.findById(order._id)
      .setOptions({ strictPopulate: false })
      .populate("user", "name email phone")
      .populate("items.product", "name image price")
      .populate("assignedKitchenStaff", "name email");

    if (result.fromStatus !== result.toStatus) {
      queueLifecycleStatusEmail(populated, result.toStatus);
    }

    emitOrderStatusUpdated(populated, oldStatus, req.user);

    try {
      calculateCustomerAnalytics(populated.user?._id).catch((err) => {
        console.error("Failed to update customer analytics:", err);
      });
    } catch (_error) {
      // ignore
    }

    return res.status(200).json(mapOrderForClient(populated));
  } catch (error) {
    console.error("Transition order lifecycle error:", error);
    return res.status(500).json({ error: "Failed to transition lifecycle" });
  }
};

// Kitchen queue
export const getKitchenOrders = async (req, res) => {
  try {
    const kitchenStatuses = [
      ORDER_STATUSES.PENDING,
      ORDER_STATUSES.PREPARING,
      ORDER_STATUSES.READY_FOR_HANDOFF,
      ORDER_STATUSES.HOLD,
      // Backward compatibility
      "Pending",
      "Preparing",
      "Ready",
      "HOLD",
    ];

    const orders = await Order.find({
      status: { $in: kitchenStatuses },
    })
      .setOptions({ strictPopulate: false })
      .populate({ path: "items.product", select: "name image price" })
      .populate({ path: "assignedKitchenStaff", select: "name email" })
      .populate({ path: "user", select: "name email" })
      .sort({ createdAt: -1 });

    const cleaned = orders
      .map((o) => {
        const validItems = (o.items || []).filter((it) => it.product !== null);
        const obj = o.toObject();
        obj.items = validItems;
        obj.status = normalizeOrderStatus(obj.status);
        return obj;
      })
      .filter((o) => o.items.length > 0);

    res.status(200).json(cleaned);
  } catch (err) {
    console.error("Get kitchen orders error:", err);
    res.status(500).json({ error: "Failed to fetch kitchen orders" });
  }
};

// Admin: all orders (optional filters)
export const getAllOrders = async (req, res) => {
  try {
    const {
      status,
      orderType,
      approvalStatus,
      page = 1,
      limit = 50,
      query,
    } = req.query;

    const filter = {};
    if (status) filter.status = normalizeIncomingStatus(status);
    if (orderType) filter.orderType = orderType;
    if (approvalStatus) filter["approval.status"] = approvalStatus;

    if (query) {
      const search = String(query).trim();
      filter.$or = [
        { _id: mongoose.Types.ObjectId.isValid(search) ? new mongoose.Types.ObjectId(search) : undefined },
        { "deliveryAddress.recipientName": { $regex: search, $options: "i" } },
      ].filter(Boolean);
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .setOptions({ strictPopulate: false })
        .populate("user", "name email phone")
        .populate("items.product", "name image price")
        .populate("assignedKitchenStaff", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      orders: orders.map(mapOrderForClient),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({ error: "Failed to fetch all orders" });
  }
};

// Ops: live queue
export const getOpsLiveOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ACTIVE_ORDER_STATUSES } })
      .setOptions({ strictPopulate: false })
      .populate("user", "name email phone")
      .populate("items.product", "name image price")
      .populate("assignedKitchenStaff", "name email")
      .sort({ createdAt: -1 })
      .limit(250);

    const now = Date.now();

    const rows = orders.map((order) => {
      const obj = mapOrderForClient(order);
      const ageMinutes = Math.max(0, Math.round((now - new Date(obj.createdAt).getTime()) / 60000));
      return {
        ...obj,
        ageMinutes,
        slaTargetMinutes: obj.orderType === "Delivery" ? 45 : 20,
        slaBreached: ageMinutes > (obj.orderType === "Delivery" ? 45 : 20),
      };
    });

    res.status(200).json(rows);
  } catch (error) {
    console.error("Get ops live orders error:", error);
    res.status(500).json({ error: "Failed to fetch live ops orders" });
  }
};

// Ops: summary cards
export const getOpsSummary = async (_req, res) => {
  try {
    const [statusAgg, approvalPending, requestsOpen, totalActive] = await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Order.countDocuments({ status: ORDER_STATUSES.APPROVAL_PENDING }),
      OrderRequest.countDocuments({ status: { $in: ["OPEN", "UNDER_REVIEW"] } }),
      Order.countDocuments({ status: { $in: ACTIVE_ORDER_STATUSES } }),
    ]);

    const byStatus = statusAgg.reduce((acc, row) => {
      acc[normalizeOrderStatus(row._id)] = row.count;
      return acc;
    }, {});

    res.status(200).json({
      totalActive,
      approvalPending,
      requestsOpen,
      byStatus,
    });
  } catch (error) {
    console.error("Get ops summary error:", error);
    res.status(500).json({ error: "Failed to fetch ops summary" });
  }
};

// Ops: SLA list
export const getOpsSlaOrders = async (_req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ACTIVE_ORDER_STATUSES } })
      .setOptions({ strictPopulate: false })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .limit(300);

    const now = Date.now();

    const rows = orders.map((order) => {
      const normalized = normalizeOrderStatus(order.status);
      const ageMinutes = Math.max(0, Math.round((now - new Date(order.createdAt).getTime()) / 60000));
      const slaTargetMinutes = order.orderType === "Delivery" ? 45 : 20;
      const slackMinutes = slaTargetMinutes - ageMinutes;

      return {
        orderId: order._id,
        orderCode: `#${String(order._id).slice(-8).toUpperCase()}`,
        customer: order.user?.name || "Guest",
        status: normalized,
        orderType: order.orderType,
        createdAt: order.createdAt,
        ageMinutes,
        slaTargetMinutes,
        slackMinutes,
        breached: slackMinutes < 0,
      };
    });

    res.status(200).json(rows);
  } catch (error) {
    console.error("Get ops SLA error:", error);
    res.status(500).json({ error: "Failed to fetch SLA dataset" });
  }
};

// Ops: refund/return/issue queue
export const getOpsRefundsQueue = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const requests = await OrderRequest.find(filter)
      .populate({ path: "order", select: "status orderType totalAmount createdAt user" })
      .populate({ path: "requestedBy", select: "name email" })
      .populate({ path: "reviewedBy", select: "name email" })
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Get ops refunds queue error:", error);
    res.status(500).json({ error: "Failed to fetch refund/request queue" });
  }
};

// Create order issue/return/refund request
export const createOrderRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, reason, description = "", refundAmount = 0 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    if (!["ISSUE", "RETURN", "REFUND"].includes(type)) {
      return res.status(400).json({ error: "type must be ISSUE, RETURN, or REFUND" });
    }

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ error: "reason is required" });
    }

    const order = await Order.findById(id).populate("user", "name email");
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const isOwner = String(order.user?._id || order.user) === String(req.user._id);
    const isAdmin = isAdminUser(req.user);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const requestDoc = await OrderRequest.create({
      order: order._id,
      type,
      status: "OPEN",
      reason: String(reason).trim(),
      description: String(description || "").trim(),
      requestedBy: req.user._id,
      requestedByRole: req.user.role || (isAdmin ? "admin" : "customer"),
      refundAmount: Number(refundAmount) || 0,
    });

    appendLifecycleEvent(order, {
      action: `REQUEST_${type}_CREATED`,
      fromStatus: normalizeOrderStatus(order.status),
      toStatus: normalizeOrderStatus(order.status),
      actor: req.user,
      notes: reason,
      meta: { requestId: requestDoc._id, type },
    });
    await order.save();

    const populatedRequest = await OrderRequest.findById(requestDoc._id)
      .populate("requestedBy", "name email")
      .populate("order");

    emitOrderRequestCreated(populatedRequest, order);

    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error("Create order request error:", error);
    res.status(500).json({ error: "Failed to create order request" });
  }
};

// Get requests for a single order
export const getOrderRequestsByOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const isOwner = String(order.user) === String(req.user._id);
    const isAdmin = isAdminUser(req.user);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const requests = await OrderRequest.find({ order: id })
      .populate("requestedBy", "name email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Get order requests by order error:", error);
    res.status(500).json({ error: "Failed to fetch order requests" });
  }
};

// Get all requests (ops/admin)
export const getAllOrderRequests = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const requests = await OrderRequest.find(filter)
      .populate({ path: "order", select: "status orderType totalAmount user createdAt" })
      .populate("requestedBy", "name email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Get all order requests error:", error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
};

// Review request (approve/reject/under review)
export const reviewOrderRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { decision, reviewNotes = "", refundAmount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    const requestDoc = await OrderRequest.findById(requestId);
    if (!requestDoc) {
      return res.status(404).json({ error: "Request not found" });
    }

    const normalizedDecision = String(decision || "").toUpperCase();
    const decisionToStatus = {
      APPROVE: "APPROVED",
      REJECT: "REJECTED",
      REVIEW: "UNDER_REVIEW",
    };

    if (!decisionToStatus[normalizedDecision]) {
      return res.status(400).json({ error: "decision must be APPROVE, REJECT, or REVIEW" });
    }

    requestDoc.status = decisionToStatus[normalizedDecision];
    requestDoc.reviewNotes = String(reviewNotes || "").trim();
    requestDoc.reviewedBy = req.user?._id || null;
    requestDoc.reviewDecisionAt = new Date();

    if (refundAmount !== undefined) {
      requestDoc.refundAmount = Number(refundAmount) || 0;
    }

    await requestDoc.save();

    const order = await Order.findById(requestDoc.order)
      .populate("user", "name email")
      .populate("items.product", "name image price");

    if (order) {
      appendLifecycleEvent(order, {
        action: `REQUEST_${requestDoc.type}_${requestDoc.status}`,
        fromStatus: normalizeOrderStatus(order.status),
        toStatus: normalizeOrderStatus(order.status),
        actor: req.user,
        notes: requestDoc.reviewNotes,
        meta: { requestId: requestDoc._id, type: requestDoc.type },
      });
      await order.save();
    }

    const populated = await OrderRequest.findById(requestDoc._id)
      .populate({ path: "order", select: "status orderType totalAmount user createdAt" })
      .populate("requestedBy", "name email")
      .populate("reviewedBy", "name email");

    emitOrderRequestReviewed(populated, order);

    res.status(200).json(populated);
  } catch (error) {
    console.error("Review order request error:", error);
    res.status(500).json({ error: "Failed to review request" });
  }
};

// Resolve request (resolved/refunded)
export const resolveOrderRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status = "RESOLVED", resolutionNotes = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    if (!["RESOLVED", "REFUNDED"].includes(String(status).toUpperCase())) {
      return res.status(400).json({ error: "status must be RESOLVED or REFUNDED" });
    }

    const requestDoc = await OrderRequest.findById(requestId);
    if (!requestDoc) {
      return res.status(404).json({ error: "Request not found" });
    }

    requestDoc.status = String(status).toUpperCase();
    requestDoc.resolutionNotes = String(resolutionNotes || "").trim();
    requestDoc.resolvedBy = req.user?._id || null;
    requestDoc.resolvedAt = new Date();

    await requestDoc.save();

    const order = await Order.findById(requestDoc.order)
      .populate("user", "name email")
      .populate("items.product", "name image price");

    if (order) {
      appendLifecycleEvent(order, {
        action: `REQUEST_${requestDoc.type}_${requestDoc.status}`,
        fromStatus: normalizeOrderStatus(order.status),
        toStatus: normalizeOrderStatus(order.status),
        actor: req.user,
        notes: requestDoc.resolutionNotes,
        meta: { requestId: requestDoc._id, type: requestDoc.type },
      });
      await order.save();
    }

    const populated = await OrderRequest.findById(requestDoc._id)
      .populate({ path: "order", select: "status orderType totalAmount user createdAt" })
      .populate("requestedBy", "name email")
      .populate("reviewedBy", "name email")
      .populate("resolvedBy", "name email");

    emitOrderRequestReviewed(populated, order);

    res.status(200).json(populated);
  } catch (error) {
    console.error("Resolve order request error:", error);
    res.status(500).json({ error: "Failed to resolve request" });
  }
};

// Analytics
export const getStatusDistribution = async (_req, res) => {
  try {
    const orders = await Order.find();
    const statusCounts = {};
    orders.forEach((o) => {
      const s = normalizeOrderStatus(o.status) || "Unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    res.json(statusCounts);
  } catch (err) {
    console.error("Status Distribution Error:", err);
    res.status(500).json({ error: "Failed to fetch status distribution" });
  }
};

export const getTypeRevenue = async (_req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.COMPLETED, "Delivered"] },
    });
    const typeRevenue = {};
    orders.forEach((o) => {
      const type = o.orderType || "Unknown";
      const total = o.totalAmount || 0;
      typeRevenue[type] = (typeRevenue[type] || 0) + total;
    });
    res.json(typeRevenue);
  } catch (err) {
    console.error("Type Revenue Error:", err);
    res.status(500).json({ error: "Failed to calculate revenue by type" });
  }
};

export const getRecentOrders = async (_req, res) => {
  try {
    const recent = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .setOptions({ strictPopulate: false })
      .populate("user", "name")
      .populate("items.product", "name image");

    res.status(200).json(recent.map(mapOrderForClient));
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    res.status(500).json({ message: "Failed to load recent orders" });
  }
};

/**
 * Helper function to calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}
