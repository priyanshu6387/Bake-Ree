import mongoose from "mongoose";

const orderLifecycleEventSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    fromStatus: { type: String, trim: true },
    toStatus: { type: String, trim: true },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorRole: { type: String, default: null },
    notes: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    simplifiedItems: [
      {
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "APPROVAL_PENDING",
        "PENDING",
        "PREPARING",
        "READY_FOR_HANDOFF",
        "DISPATCH_ASSIGNED",
        "OUT_FOR_DELIVERY",
        "PICKUP_READY",
        "PICKED_UP",
        "DELIVERED",
        "COMPLETED",
        "HOLD",
        "CANCELLED",
        // Backward compatibility for legacy records
        "Pending",
        "Preparing",
        "Ready",
        "Delivered",
        "Cancelled",
      ],
      default: "APPROVAL_PENDING",
      required: true,
    },
    orderType: {
      type: String,
      enum: ["Delivery", "Pickup"],
      default: "Pickup",
      required: true,
    },
    priority: {
      type: String,
      enum: ["NORMAL", "RUSH", "VIP"],
      default: "NORMAL",
    },
    station: {
      type: String,
      enum: ["OVEN", "FRYER", "BEVERAGE", "PACKING", "UNASSIGNED"],
      default: "UNASSIGNED",
    },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    specialInstructions: { type: String, default: "" },
    couponCode: { type: String, default: "", trim: true, uppercase: true },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    pricingSnapshot: {
      subtotal: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      deliveryCharge: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    appliedCoupon: {
      code: { type: String, default: "", trim: true, uppercase: true },
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null,
      },
      discountType: { type: String, default: "" },
      discountValue: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      reservationToken: { type: String, default: "" },
      appliedAt: { type: Date, default: null },
    },

    // Allergy capture
    allergies: [{ type: String, trim: true }],
    allergyNotes: { type: String, default: "" },
    requiresAllergyCheck: { type: Boolean, default: false },

    // Payment state (simulated/COD for now)
    paymentMethod: {
      type: String,
      enum: ["CARD", "COD", "UPI", "WALLET", "OTHER"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "AUTHORIZED",
        "PAID",
        "FAILED",
        "REFUNDED",
        "PARTIAL_REFUND",
        "NOT_REQUIRED",
      ],
      default: "PENDING",
    },

    // Approval gate
    approval: {
      required: { type: Boolean, default: true },
      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED", "NOT_REQUIRED"],
        default: "PENDING",
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      approvedAt: { type: Date, default: null },
      rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      rejectedAt: { type: Date, default: null },
      reason: { type: String, default: "" },
    },

    // Hold metadata
    hold: {
      reason: { type: String, default: "" },
      severity: {
        type: String,
        enum: ["INFO", "WARNING", "CRITICAL"],
        default: "WARNING",
      },
      notes: { type: String, default: "" },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      createdAt: { type: Date, default: null },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      resolvedAt: { type: Date, default: null },
      resolutionNotes: { type: String, default: "" },
    },

    lifecycleEvents: [orderLifecycleEventSchema],

    // Delivery address fields
    deliveryAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: "India" },
      landmark: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
      recipientName: { type: String },
      phone: { type: String },
    },
    deliveryAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAddress",
      default: null,
    },
    estimatedDeliveryTime: {
      type: Date,
      default: null,
    },
    assignedKitchenStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Prevent double-awarding loyalty on repeated updates
    loyaltyAwardedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
