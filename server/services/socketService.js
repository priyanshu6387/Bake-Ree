import { getIO } from "../config/socket.js";
import { normalizeOrderStatus } from "./orderLifecycleService.js";

const serializeOrder = (order) => {
  if (!order) return null;

  return {
    _id: order._id,
    user: order.user,
    items: order.items,
    status: normalizeOrderStatus(order.status),
    orderType: order.orderType,
    totalAmount: order.totalAmount,
    deliveryCharge: order.deliveryCharge,
    specialInstructions: order.specialInstructions,
    allergies: order.allergies || [],
    allergyNotes: order.allergyNotes || "",
    requiresAllergyCheck: Boolean(order.requiresAllergyCheck),
    priority: order.priority,
    station: order.station,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    approval: order.approval,
    hold: order.hold,
    deliveryAddress: order.deliveryAddress,
    assignedKitchenStaff: order.assignedKitchenStaff,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

const emitToOrderRooms = ({ event, payload, userId }) => {
  const io = getIO();
  io.to("kitchen").emit(event, payload);
  io.to("admin").emit(event, payload);
  if (userId) {
    io.to(`user:${userId}`).emit(event, payload);
  }
};

/**
 * Emit order created event to all connected clients
 */
export const emitOrderCreated = (order) => {
  try {
    const orderData = serializeOrder(order);
    emitToOrderRooms({
      event: "order:created",
      payload: { order: orderData },
      userId: order?.user?._id || order?.user,
    });

    console.log(`📢 Emitted order:created event for order ${order?._id}`);
  } catch (error) {
    console.error("Error emitting order:created event:", error);
  }
};

/**
 * Emit order status updated event to all connected clients
 */
export const emitOrderStatusUpdated = (order, oldStatus, actor = null) => {
  try {
    const orderData = serializeOrder(order);

    const updatedBy = actor
      ? {
          _id: actor._id,
          role: actor.role,
          isAdmin: actor.isAdmin === true,
        }
      : null;

    const payload = {
      order: orderData,
      oldStatus: normalizeOrderStatus(oldStatus),
      newStatus: normalizeOrderStatus(order?.status),
      updatedBy,
    };

    emitToOrderRooms({
      event: "order:statusUpdated",
      payload,
      userId: order?.user?._id || order?.user,
    });

    console.log(
      `📢 Emitted order:statusUpdated event for order ${order?._id}: ${oldStatus} → ${order?.status}`
    );
  } catch (error) {
    console.error("Error emitting order:statusUpdated event:", error);
  }
};

export const emitOrderApprovalUpdated = (order, approvalDecision, actor = null, reason = "") => {
  try {
    const payload = {
      order: serializeOrder(order),
      decision: approvalDecision,
      reason,
      updatedBy: actor
        ? {
            _id: actor._id,
            role: actor.role,
            isAdmin: actor.isAdmin === true,
          }
        : null,
      approvedAt: order?.approval?.approvedAt || null,
      rejectedAt: order?.approval?.rejectedAt || null,
    };

    emitToOrderRooms({
      event: "order:approvalUpdated",
      payload,
      userId: order?.user?._id || order?.user,
    });

    if (approvalDecision === "APPROVED") {
      emitToOrderRooms({
        event: "order:approved",
        payload: {
          order: serializeOrder(order),
          approvedBy: payload.updatedBy,
          reason,
        },
        userId: order?.user?._id || order?.user,
      });
    }

    console.log(
      `📢 Emitted order:approvalUpdated for order ${order?._id}: ${approvalDecision}`
    );
  } catch (error) {
    console.error("Error emitting order:approvalUpdated event:", error);
  }
};

export const emitOrderRequestCreated = (request, order) => {
  try {
    emitToOrderRooms({
      event: "order:requestCreated",
      payload: {
        request,
        order: serializeOrder(order),
      },
      userId: order?.user?._id || order?.user,
    });
  } catch (error) {
    console.error("Error emitting order:requestCreated event:", error);
  }
};

export const emitOrderRequestReviewed = (request, order) => {
  try {
    emitToOrderRooms({
      event: "order:requestReviewed",
      payload: {
        request,
        order: serializeOrder(order),
      },
      userId: order?.user?._id || order?.user,
    });
  } catch (error) {
    console.error("Error emitting order:requestReviewed event:", error);
  }
};

/**
 * Emit order deleted event (if needed in future)
 */
export const emitOrderDeleted = (orderId) => {
  try {
    const io = getIO();
    io.to("kitchen").emit("order:deleted", { orderId });
    io.to("admin").emit("order:deleted", { orderId });
    console.log(`📢 Emitted order:deleted event for order ${orderId}`);
  } catch (error) {
    console.error("Error emitting order:deleted event:", error);
  }
};

/**
 * Emit delivery location updated event
 */
export const emitDeliveryLocationUpdated = (deliveryId, location, delivery) => {
  try {
    const io = getIO();

    const locationData = {
      deliveryId,
      location,
      delivery: {
        _id: delivery._id,
        order: delivery.order,
        status: delivery.status,
        trackingNumber: delivery.trackingNumber,
        estimatedTimeRemaining: delivery.estimatedTimeRemaining,
      },
      timestamp: new Date(),
    };

    io.to("admin").emit("delivery:locationUpdated", locationData);

    if (delivery.deliveryStaff) {
      io.to(`staff:${delivery.deliveryStaff}`).emit("delivery:locationUpdated", locationData);
    }

    if (delivery.order && delivery.order.user) {
      io.to(`user:${delivery.order.user._id || delivery.order.user}`).emit(
        "delivery:locationUpdated",
        locationData
      );
    }

    console.log(`📍 Emitted delivery:locationUpdated for delivery ${deliveryId}`);
  } catch (error) {
    console.error("Error emitting delivery:locationUpdated:", error);
  }
};

/**
 * Emit delivery status updated event
 */
export const emitDeliveryStatusUpdated = (delivery, oldStatus) => {
  try {
    const io = getIO();

    const deliveryData = {
      _id: delivery._id,
      order: delivery.order,
      status: delivery.status,
      trackingNumber: delivery.trackingNumber,
      deliveryStaff: delivery.deliveryStaff,
      estimatedTimeRemaining: delivery.estimatedTimeRemaining,
    };

    io.to("admin").emit("delivery:statusUpdated", {
      delivery: deliveryData,
      oldStatus,
      newStatus: delivery.status,
    });

    if (delivery.order && delivery.order.user) {
      io.to(`user:${delivery.order.user._id || delivery.order.user}`).emit("delivery:statusUpdated", {
        delivery: deliveryData,
        oldStatus,
        newStatus: delivery.status,
      });
    }

    if (delivery.status === "Delivered") {
      if (delivery.order && delivery.order.user) {
        io.to(`user:${delivery.order.user._id || delivery.order.user}`).emit("delivery:completed", {
          delivery: deliveryData,
          completedAt: new Date(),
        });
      }
    }

    console.log(
      `📢 Emitted delivery:statusUpdated for delivery ${delivery._id}: ${oldStatus} → ${delivery.status}`
    );
  } catch (error) {
    console.error("Error emitting delivery:statusUpdated:", error);
  }
};

/**
 * Emit event to admin room
 */
export const emitToAdmin = (event, data) => {
  try {
    const io = getIO();
    io.to("admin").emit(event, data);
    console.log(`📢 Emitted ${event} to admin room`);
  } catch (error) {
    console.error(`Error emitting ${event} to admin:`, error);
  }
};

export default {
  emitOrderCreated,
  emitOrderStatusUpdated,
  emitOrderApprovalUpdated,
  emitOrderRequestCreated,
  emitOrderRequestReviewed,
  emitOrderDeleted,
  emitDeliveryLocationUpdated,
  emitDeliveryStatusUpdated,
  emitToAdmin,
};
