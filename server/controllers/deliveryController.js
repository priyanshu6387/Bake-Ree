import mongoose from "mongoose";
import Delivery from "../models/Delivery.js";
import DeliveryAddress from "../models/DeliveryAddress.js";
import DeliveryZone from "../models/DeliveryZone.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import {
  emitDeliveryLocationUpdated,
  emitDeliveryStatusUpdated,
  emitOrderStatusUpdated,
} from "../services/socketService.js";
import { ORDER_STATUSES } from "../services/orderLifecycleService.js";
import { sendOrderStatusUpdate } from "../services/emailService.js";

const mapDeliveryStatusToOrderStatus = (deliveryStatus) => {
  switch (deliveryStatus) {
    case "Assigned":
      return ORDER_STATUSES.DISPATCH_ASSIGNED;
    case "Picked Up":
    case "In Transit":
    case "Out for Delivery":
      return ORDER_STATUSES.OUT_FOR_DELIVERY;
    case "Delivered":
      return ORDER_STATUSES.DELIVERED;
    case "Cancelled":
    case "Failed":
      return ORDER_STATUSES.CANCELLED;
    default:
      return null;
  }
};

const CUSTOMER_STATUS_EMAIL_STATUSES = new Set([
  ORDER_STATUSES.DELIVERED,
  ORDER_STATUSES.CANCELLED,
]);

const queueDeliveryOrderStatusEmail = (order, mappedOrderStatus) => {
  if (!CUSTOMER_STATUS_EMAIL_STATUSES.has(mappedOrderStatus)) return;
  if (!order?.user?.email) return;
  sendOrderStatusUpdate(order, order.user, mappedOrderStatus).catch((err) => {
    console.error("Failed to send delivery order status update email:", err);
  });
};

/**
 * Get all deliveries (Admin only)
 */
export const getAllDeliveries = async (req, res) => {
  try {
    const { status, deliveryStaff, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (deliveryStaff) query.deliveryStaff = deliveryStaff;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const deliveries = await Delivery.find(query)
      .populate("order", "totalAmount status orderType createdAt")
      .populate("deliveryStaff", "name email phone")
      .populate("deliveryZone", "name deliveryCharge")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Delivery.countDocuments(query);

    res.json({
      deliveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get delivery by ID
 */
export const getDeliveryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid delivery ID" });
    }

    const delivery = await Delivery.findById(id)
      .populate("order")
      .populate("deliveryStaff", "name email phone")
      .populate("deliveryZone", "name deliveryCharge estimatedDeliveryTime");

    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    res.json(delivery);
  } catch (error) {
    console.error("Error fetching delivery:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get delivery by order ID
 */
export const getDeliveryByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const delivery = await Delivery.findOne({ order: orderId })
      .populate("order")
      .populate("deliveryStaff", "name email phone")
      .populate("deliveryZone", "name deliveryCharge estimatedDeliveryTime");

    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    res.json(delivery);
  } catch (error) {
    console.error("Error fetching delivery:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Create delivery for an order
 */
export const createDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    // Check if order exists and is a delivery order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.orderType !== "Delivery") {
      return res
        .status(400)
        .json({ error: "Order is not a delivery order" });
    }

    // Check if delivery already exists
    const existingDelivery = await Delivery.findOne({ order: orderId });
    if (existingDelivery) {
      return res.status(400).json({ error: "Delivery already exists for this order" });
    }

    // Get delivery address from order
    if (!order.deliveryAddress || !order.deliveryAddress.street) {
      return res
        .status(400)
        .json({ error: "Order does not have a delivery address" });
    }

    // Find delivery zone based on coordinates or zip code
    let deliveryZone = null;
    if (order.deliveryAddress.coordinates?.lat && order.deliveryAddress.coordinates?.lng) {
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

    // Calculate estimated delivery time
    const estimatedDeliveryTime = new Date();
    if (deliveryZone) {
      const zone = await DeliveryZone.findById(deliveryZone);
      estimatedDeliveryTime.setMinutes(
        estimatedDeliveryTime.getMinutes() + (zone?.estimatedDeliveryTime || 45)
      );
    } else {
      estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 45);
    }

    const delivery = await Delivery.create({
      order: orderId,
      deliveryAddress: order.deliveryAddress,
      deliveryZone: deliveryZone,
      deliveryCharge: order.deliveryCharge || 0,
      contactPhone: order.deliveryAddress.phone || order.user?.phone || "",
      estimatedDeliveryTime,
      status: "Pending",
    });

    const populatedDelivery = await Delivery.findById(delivery._id)
      .populate("order")
      .populate("deliveryZone");

    // Emit socket event for new delivery
    if (populatedDelivery.order && populatedDelivery.order.user) {
      emitDeliveryStatusUpdated(populatedDelivery, null);
    }

    res.status(201).json(populatedDelivery);
  } catch (error) {
    console.error("Error creating delivery:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Update delivery status
 */
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deliveryNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid delivery ID" });
    }

    const allowedStatuses = [
      "Pending",
      "Assigned",
      "Picked Up",
      "In Transit",
      "Out for Delivery",
      "Delivered",
      "Failed",
      "Cancelled",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (deliveryNotes !== undefined) updateData.deliveryNotes = deliveryNotes;

    // Get old delivery for status comparison
    const oldDelivery = await Delivery.findById(id);
    const oldStatus = oldDelivery?.status;

    // If status is "Delivered", set actual delivery time
    if (status === "Delivered") {
      updateData.actualDeliveryTime = new Date();
    }

    const delivery = await Delivery.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("order")
      .populate("deliveryStaff", "name email phone")
      .populate("deliveryZone");

    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    // Emit socket event for status update
    if (status && oldStatus !== status) {
      emitDeliveryStatusUpdated(delivery, oldStatus);

      const mappedOrderStatus = mapDeliveryStatusToOrderStatus(status);
      if (mappedOrderStatus && delivery.order?._id) {
        const oldOrderStatus = delivery.order.status;
        const updatedOrder = await Order.findByIdAndUpdate(
          delivery.order._id,
          { status: mappedOrderStatus },
          { new: true }
        )
          .populate("user", "name email phone")
          .populate("items.product", "name image price")
          .populate("assignedKitchenStaff", "name email");
        if (updatedOrder) {
          emitOrderStatusUpdated(updatedOrder, oldOrderStatus, req.user);
          queueDeliveryOrderStatusEmail(updatedOrder, mappedOrderStatus);
        }
      }
    }

    res.json(delivery);
  } catch (error) {
    console.error("Error updating delivery:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Assign delivery staff
 */
export const assignDeliveryStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryStaffId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid delivery ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(deliveryStaffId)) {
      return res.status(400).json({ error: "Invalid staff ID" });
    }

    // Verify staff exists
    const staff = await User.findById(deliveryStaffId);
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    const oldDelivery = await Delivery.findById(id);
    const oldStatus = oldDelivery?.status;

    const delivery = await Delivery.findByIdAndUpdate(
      id,
      {
        deliveryStaff: deliveryStaffId,
        status: "Assigned",
      },
      { new: true, runValidators: true }
    )
      .populate("order")
      .populate("deliveryStaff", "name email phone")
      .populate("deliveryZone");

    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    // Emit socket event for status update
    if (oldStatus !== "Assigned") {
      emitDeliveryStatusUpdated(delivery, oldStatus || "Pending");
      if (delivery.order?._id) {
        const oldOrderStatus = delivery.order.status;
        const updatedOrder = await Order.findByIdAndUpdate(
          delivery.order._id,
          { status: ORDER_STATUSES.DISPATCH_ASSIGNED },
          { new: true }
        )
          .populate("user", "name email phone")
          .populate("items.product", "name image price")
          .populate("assignedKitchenStaff", "name email");
        if (updatedOrder) {
          emitOrderStatusUpdated(updatedOrder, oldOrderStatus, req.user);
        }
      }
    }

    res.json(delivery);
  } catch (error) {
    console.error("Error assigning delivery staff:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get deliveries assigned to a staff member
 */
export const getStaffDeliveries = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { status } = req.query;

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ error: "Invalid staff ID" });
    }

    const query = { deliveryStaff: staffId };
    if (status) query.status = status;

    const deliveries = await Delivery.find(query)
      .populate("order", "totalAmount status orderType createdAt")
      .populate("deliveryZone", "name")
      .sort({ createdAt: -1 });

    res.json(deliveries);
  } catch (error) {
    console.error("Error fetching staff deliveries:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get delivery statistics
 */
export const getDeliveryStats = async (req, res) => {
  try {
    const stats = await Delivery.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalDeliveries = await Delivery.countDocuments();
    const completedDeliveries = await Delivery.countDocuments({
      status: "Delivered",
    });
    const pendingDeliveries = await Delivery.countDocuments({
      status: { $in: ["Pending", "Assigned", "Picked Up", "In Transit", "Out for Delivery"] },
    });

    res.json({
      total: totalDeliveries,
      completed: completedDeliveries,
      pending: pendingDeliveries,
      byStatus: stats,
    });
  } catch (error) {
    console.error("Error fetching delivery stats:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Update delivery location (for delivery staff)
 */
export const updateDeliveryLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng, estimatedTimeRemaining } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid delivery ID" });
    }

    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    const delivery = await Delivery.findById(id)
      .populate("order")
      .populate("deliveryStaff", "name email phone")
      .populate("deliveryZone");

    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    // Update current location
    delivery.currentLocation = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      updatedAt: new Date(),
    };

    // Add to location history (keep last 50 points)
    delivery.locationHistory.push({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      timestamp: new Date(),
    });

    if (delivery.locationHistory.length > 50) {
      delivery.locationHistory.shift();
    }

    // Update estimated time remaining if provided
    if (estimatedTimeRemaining !== undefined) {
      delivery.estimatedTimeRemaining = parseInt(estimatedTimeRemaining);
    }

    await delivery.save();

    // Emit socket event for real-time location update
    emitDeliveryLocationUpdated(delivery._id, delivery.currentLocation, delivery);

    res.json({
      success: true,
      delivery: {
        _id: delivery._id,
        currentLocation: delivery.currentLocation,
        estimatedTimeRemaining: delivery.estimatedTimeRemaining,
      },
    });
  } catch (error) {
    console.error("Error updating delivery location:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Helper function to calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
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
