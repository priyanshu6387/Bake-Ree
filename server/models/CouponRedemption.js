import mongoose from "mongoose";

const couponRedemptionSchema = new mongoose.Schema(
  {
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
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CouponReservation",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    codeUsed: { type: String, required: true, uppercase: true, trim: true },
    discountType: { type: String, required: true },
    discountValue: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, required: true, min: 0 },
    orderSubtotal: { type: Number, default: 0 },
    orderTotalBeforeDiscount: { type: Number, default: 0 },
    orderTotalAfterDiscount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["APPLIED", "REVERSED"],
      default: "APPLIED",
      index: true,
    },
    reversalReason: { type: String, default: "" },
    reversedAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

couponRedemptionSchema.index({ coupon: 1, user: 1, createdAt: -1 });
couponRedemptionSchema.index({ codeUsed: 1, createdAt: -1 });

const CouponRedemption =
  mongoose.models.CouponRedemption || mongoose.model("CouponRedemption", couponRedemptionSchema);

export default CouponRedemption;
