import mongoose from "mongoose";
import Order from "../models/Order.js";
import Delivery from "../models/Delivery.js";
import DeliveryZone from "../models/DeliveryZone.js";
import {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
} from "../services/emailService.js";
import {
  emitOrderCreated,
  emitOrderStatusUpdated,
} from "../services/socketService.js";
import { calculateCustomerAnalytics } from "../services/customerAnalyticsService.js";
import { awardPointsForOrder } from "../services/loyaltyPointsService.js";

/**
 * Place a new order
 * - Client se productId ya product dono accept
 * - Normalize: sirf `items.product` save karo
 * - Server-side totals + deliveryCharge compute
 * - Return populated order
 */
export const createOrder = async (req, res) => {
  try {
    const { items = [], orderType = "Pickup" } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one item is required" });
    }

    // Normalize to `product` only
    const normalizedItems = items.map((raw) => {
      const idValue = raw.product || raw.productId; // accept either key
      if (!mongoose.Types.ObjectId.isValid(idValue)) {
        throw new Error(`Invalid product ID: ${idValue}`);
      }
      return {
        product: new mongoose.Types.ObjectId(idValue),
        quantity: Number(raw.quantity) || 0,
        price: Number(raw.price) || 0,
      };
    });

    // Totals
    const itemsTotal = normalizedItems.reduce(
      (sum, it) => sum + it.quantity * it.price,
      0
    );
    const discount = Number(req.body.discount ?? 0);
    const tax = Number(req.body.tax ?? 0);
    const deliveryCharge =
      req.body.deliveryCharge !== undefined
        ? Number(req.body.deliveryCharge)
        : orderType === "Delivery"
        ? 49
        : 0;

    const totalAmount = itemsTotal - discount + tax + deliveryCharge;

    // Handle delivery address
    let deliveryAddress = null;
    let deliveryAddressId = null;
    let estimatedDeliveryTime = null;

    if (orderType === "Delivery") {
      // If deliveryAddressId is provided, fetch it
      if (req.body.deliveryAddressId) {
        const DeliveryAddress = (await import("../models/DeliveryAddress.js")).default;
        const savedAddress = await DeliveryAddress.findOne({
          _id: req.body.deliveryAddressId,
          user: req.user._id,
          isActive: true,
        });
        if (savedAddress) {
          deliveryAddress = {
            street: savedAddress.address.street,
            city: savedAddress.address.city,
            state: savedAddress.address.state,
            zipCode: savedAddress.address.zipCode,
            country: savedAddress.address.country || "India",
            landmark: savedAddress.address.landmark,
            coordinates: savedAddress.address.coordinates,
            recipientName: savedAddress.recipientName,
            phone: savedAddress.phone,
          };
          deliveryAddressId = savedAddress._id;
        }
      } else if (req.body.deliveryAddress) {
        // Use provided delivery address
        deliveryAddress = req.body.deliveryAddress;
      }

      // Find delivery zone and calculate estimated time
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
        if (!estimatedDeliveryTime) {
          estimatedDeliveryTime = new Date();
          estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 45);
        }
      }
    }

    const created = await Order.create({
      user: req.user._id,
      items: normalizedItems,
      simplifiedItems: req.body.simplifiedItems,
      orderType,
      status: req.body.status,
      deliveryCharge,
      totalAmount,
      specialInstructions: req.body.specialInstructions,
      deliveryAddress: deliveryAddress,
      deliveryAddressId: deliveryAddressId,
      estimatedDeliveryTime: estimatedDeliveryTime,
    });

    const order = await Order.findById(created._id)
      .setOptions({ strictPopulate: false })
      .populate("user", "name email phone")
      .populate("items.product", "name image price");

    // Send order confirmation email (non-blocking)
    if (order.user && order.user.email) {
      sendOrderConfirmation(order, order.user).catch((err) => {
        console.error("Failed to send order confirmation email:", err);
        // Don't fail the order creation if email fails
      });
    }

    // Emit Socket.io event for real-time updates (non-blocking)
    try {
      emitOrderCreated(order);
    } catch (err) {
      console.error("Failed to emit order created event:", err);
      // Don't fail the order creation if socket emission fails
    }

    // Update customer analytics (non-blocking)
    try {
      calculateCustomerAnalytics(order.user._id).catch((err) => {
        console.error("Failed to update customer analytics:", err);
      });
    } catch (err) {
      // Ignore errors
    }

    return res.status(201).json(order);
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
      .populate("items.product", "name image price");

    res.status(200).json(orders);
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
      .populate("items.product", "name image price");

    res.status(200).json(orders);
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ error: "Failed to fetch your orders" });
  }
};

// Order by ID (invoice page)
// If user is authenticated, ensure they can only view their own orders (unless admin)
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .setOptions({ strictPopulate: false })
      .populate("user", "name email phone")
      .populate("items.product", "name image price");

    if (!order) return res.status(404).json({ message: "Order not found" });
    
    // If user is authenticated (from protect middleware), check ownership
    if (req.user) {
      const isOwner = order.user && order.user._id.toString() === req.user._id.toString();
      const isAdmin = req.user.isAdmin === true;
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Access denied: You can only view your own orders" });
      }
    }
    
    res.json(order);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update status
export const updateOrderStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const updateData = {};
    
    if (req.body.status) {
      const allowed = ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"];
      if (!allowed.includes(req.body.status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      updateData.status = req.body.status;
    }

    // Support staff assignment
    if (req.body.assignedKitchenStaff !== undefined) {
      if (req.body.assignedKitchenStaff === null || req.body.assignedKitchenStaff === "") {
        updateData.assignedKitchenStaff = null;
      } else if (mongoose.Types.ObjectId.isValid(req.body.assignedKitchenStaff)) {
        updateData.assignedKitchenStaff = req.body.assignedKitchenStaff;
      } else {
        return res.status(400).json({ error: "Invalid kitchen staff ID" });
      }
    }

    // Get old status before update
    const oldOrder = await Order.findById(req.params.id);
    const oldStatus = oldOrder?.status;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .setOptions({ strictPopulate: false })
      .populate("user", "name email phone")
      .populate("items.product", "name image price")
      .populate("assignedKitchenStaff", "name email");

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Send order status update email (non-blocking)
    if (order.user && order.user.email) {
      sendOrderStatusUpdate(order, order.user, req.body.status).catch((err) => {
        console.error("Failed to send order status update email:", err);
        // Don't fail the status update if email fails
      });
    }

    // Emit Socket.io event for real-time updates (non-blocking)
    try {
      emitOrderStatusUpdated(order, oldStatus, req.user);
    } catch (err) {
      console.error("Failed to emit order status updated event:", err);
      // Don't fail the status update if socket emission fails
    }

    // If order status is "Ready" and it's a delivery order, create delivery record
    if (req.body.status === "Ready" && order.orderType === "Delivery") {
      try {
        const existingDelivery = await Delivery.findOne({ order: order._id });
        if (!existingDelivery && order.deliveryAddress) {
          // Find delivery zone
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

          await Delivery.create({
            order: order._id,
            deliveryAddress: order.deliveryAddress,
            deliveryZone: deliveryZone,
            deliveryCharge: order.deliveryCharge || 0,
            contactPhone: order.deliveryAddress.phone || order.user?.phone || "",
            estimatedDeliveryTime: order.estimatedDeliveryTime || new Date(Date.now() + 45 * 60000),
            status: "Pending",
          });
        }
      } catch (err) {
        console.error("Failed to create delivery record:", err);
        // Don't fail the status update if delivery creation fails
      }
    }

    const statusChanged = updateData.status && updateData.status !== oldStatus;

    // Update customer analytics on status changes (non-blocking)
    if (statusChanged && order.user?._id) {
      try {
        calculateCustomerAnalytics(order.user._id).catch((err) => {
          console.error("Failed to update customer analytics:", err);
        });
      } catch (err) {
        // Ignore errors
      }
    }

    // Update loyalty points and tier when order is completed (non-blocking)
    if (req.body.status === "Delivered" && order.user?._id) {
      try {
        // Award loyalty points
        awardPointsForOrder(
          order.user._id,
          order._id,
          order.totalAmount
        ).catch((err) => {
          console.error("Failed to award loyalty points:", err);
        });

        // Automatically update membership tier
        const { updateMembershipTier } = await import("../services/tierManagementService.js");
        updateMembershipTier(order.user._id, true).catch((err) => {
          console.error("Failed to update membership tier:", err);
          // Error notification is handled inside updateMembershipTier
        });
      } catch (err) {
        // Ignore errors
      }
    }

    res.status(200).json(order);
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Kitchen (Pending/Preparing/Ready)
export const getKitchenOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ["Pending", "Preparing", "Ready"] },
    })
      .setOptions({ strictPopulate: false })
      .populate({ path: "items.product", select: "name image" })
      .populate({ path: "assignedKitchenStaff", select: "name email" })
      .populate({ path: "user", select: "name email" })
      .sort({ createdAt: -1 });

    const cleaned = orders
      .map((o) => {
        const validItems = o.items.filter((it) => it.product !== null);
        return { ...o.toObject(), items: validItems };
      })
      .filter((o) => o.items.length > 0);

    res.status(200).json(cleaned);
  } catch (err) {
    console.error("Get kitchen orders error:", err);
    res.status(500).json({ error: "Failed to fetch kitchen orders" });
  }
};

// Admin: all orders (optional ?status)
export const getAllOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const orders = await Order.find(filter)
      .setOptions({ strictPopulate: false })
      .populate("user", "name email phone")
      .populate("items.product", "name image price")
      .populate("assignedKitchenStaff", "name email");

    res.status(200).json(orders);
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({ error: "Failed to fetch all orders" });
  }
};

// Analytics
export const getStatusDistribution = async (req, res) => {
  try {
    const orders = await Order.find();
    const statusCounts = {};
    orders.forEach((o) => {
      const s = o.status || "Unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    res.json(statusCounts);
  } catch (err) {
    console.error("Status Distribution Error:", err);
    res.status(500).json({ error: "Failed to fetch status distribution" });
  }
};

export const getTypeRevenue = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ["Ready", "Delivered"] },
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

export const getRecentOrders = async (req, res) => {
  try {
    const recent = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .setOptions({ strictPopulate: false })
      .populate("user", "name")
      .populate("items.product", "name image");

    res.status(200).json(recent);
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    res.status(500).json({ message: "Failed to load recent orders" });
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
