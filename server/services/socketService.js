import { getIO } from "../config/socket.js";

/**
 * Emit order created event to all connected clients
 * @param {Object} order - Order object (should be populated)
 */
export const emitOrderCreated = (order) => {
  try {
    const io = getIO();
    
    const orderData = {
      _id: order._id,
      user: order.user,
      items: order.items,
      status: order.status,
      orderType: order.orderType,
      totalAmount: order.totalAmount,
      deliveryCharge: order.deliveryCharge,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
    
    // Emit to kitchen room
    io.to("kitchen").emit("order:created", {
      order: orderData,
    });

    // Emit to admin room
    io.to("admin").emit("order:created", {
      order: orderData,
    });

    // Emit to specific user room (for customer notifications)
    if (order.user && order.user._id) {
      io.to(`user:${order.user._id}`).emit("order:created", {
        order: orderData,
      });
    }

    console.log(`📢 Emitted order:created event for order ${order._id}`);
  } catch (error) {
    console.error("Error emitting order:created event:", error);
  }
};

/**
 * Emit order status updated event to all connected clients
 * @param {Object} order - Order object (should be populated)
 * @param {String} oldStatus - Previous status
 */
export const emitOrderStatusUpdated = (order, oldStatus, actor = null) => {
  try {
    const io = getIO();
    
    const orderData = {
      _id: order._id,
      user: order.user,
      items: order.items,
      status: order.status,
      orderType: order.orderType,
      totalAmount: order.totalAmount,
      deliveryCharge: order.deliveryCharge,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    const updatedBy = actor
      ? {
          _id: actor._id,
          role: actor.role,
          isAdmin: actor.isAdmin === true,
        }
      : null;

    const approvedByAdmin =
      Boolean(updatedBy?.isAdmin || updatedBy?.role === "admin") &&
      ["Pending", "HOLD", "Hold", "Cancelled"].includes(oldStatus) &&
      ["Preparing", "Ready"].includes(order.status);

    // Emit to kitchen room
    io.to("kitchen").emit("order:statusUpdated", {
      order: orderData,
      oldStatus,
      newStatus: order.status,
      updatedBy,
      approvedByAdmin,
    });

    // Emit to admin room
    io.to("admin").emit("order:statusUpdated", {
      order: orderData,
      oldStatus,
      newStatus: order.status,
      updatedBy,
      approvedByAdmin,
    });

    // Emit to specific user room (for customer notifications)
    if (order.user && order.user._id) {
      io.to(`user:${order.user._id}`).emit("order:statusUpdated", {
        order: orderData,
        oldStatus,
        newStatus: order.status,
        updatedBy,
        approvedByAdmin,
      });
    }

    if (approvedByAdmin) {
      const payload = {
        order: orderData,
        approvedBy: updatedBy,
      };
      io.to("kitchen").emit("order:approved", payload);
      io.to("admin").emit("order:approved", payload);
    }

    console.log(
      `📢 Emitted order:statusUpdated event for order ${order._id}: ${oldStatus} → ${order.status}`
    );
  } catch (error) {
    console.error("Error emitting order:statusUpdated event:", error);
  }
};

/**
 * Emit order deleted event (if needed in future)
 * @param {String} orderId - Order ID
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
 * @param {String} deliveryId - Delivery ID
 * @param {Object} location - Current location {lat, lng}
 * @param {Object} delivery - Delivery object
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

    // Emit to admin room
    io.to("admin").emit("delivery:locationUpdated", locationData);

    // Emit to delivery staff room (if assigned)
    if (delivery.deliveryStaff) {
      io.to(`staff:${delivery.deliveryStaff}`).emit("delivery:locationUpdated", locationData);
    }

    // Emit to order owner
    if (delivery.order && delivery.order.user) {
      io.to(`user:${delivery.order.user._id || delivery.order.user}`).emit("delivery:locationUpdated", locationData);
    }

    console.log(`📍 Emitted delivery:locationUpdated for delivery ${deliveryId}`);
  } catch (error) {
    console.error("Error emitting delivery:locationUpdated event:", error);
  }
};

/**
 * Emit delivery status updated event
 * @param {Object} delivery - Delivery object
 * @param {String} oldStatus - Previous status
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

    // Emit to admin room
    io.to("admin").emit("delivery:statusUpdated", {
      delivery: deliveryData,
      oldStatus,
      newStatus: delivery.status,
    });

    // Emit to order owner
    if (delivery.order && delivery.order.user) {
      io.to(`user:${delivery.order.user._id || delivery.order.user}`).emit("delivery:statusUpdated", {
        delivery: deliveryData,
        oldStatus,
        newStatus: delivery.status,
      });
    }

    // If delivered, emit completion event
    if (delivery.status === "Delivered") {
      if (delivery.order && delivery.order.user) {
        io.to(`user:${delivery.order.user._id || delivery.order.user}`).emit("delivery:completed", {
          delivery: deliveryData,
          completedAt: new Date(),
        });
      }
    }

    console.log(`📢 Emitted delivery:statusUpdated for delivery ${delivery._id}: ${oldStatus} → ${delivery.status}`);
  } catch (error) {
    console.error("Error emitting delivery:statusUpdated event:", error);
  }
};

/**
 * Emit event to admin room
 * @param {String} event - Event name
 * @param {Object} data - Event data
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
  emitOrderDeleted,
  emitDeliveryLocationUpdated,
  emitDeliveryStatusUpdated,
  emitToAdmin,
};
