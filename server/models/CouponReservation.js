import mongoose from "mongoose";

const couponReservationSchema = new mongoose.Schema(
  {
    reservationToken: { type: String, required: true, unique: true, index: true },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CouponAssignment",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "CONSUMED", "EXPIRED", "RELEASED"],
      default: "ACTIVE",
      index: true,
    },
    code: { type: String, required: true, uppercase: true, trim: true },
    orderSnapshot: {
      subtotal: { type: Number, default: 0 },
      orderType: { type: String, default: "" },
      deliveryCharge: { type: Number, default: 0 },
      cartItemsCount: { type: Number, default: 0 },
    },
    discountType: { type: String, required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, default: null },
    discountAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    expiresAt: { type: Date, required: true, index: true },
    consumedAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

couponReservationSchema.index({ user: 1, status: 1, expiresAt: 1 });

const CouponReservation =
  mongoose.models.CouponReservation || mongoose.model("CouponReservation", couponReservationSchema);

export default CouponReservation;
