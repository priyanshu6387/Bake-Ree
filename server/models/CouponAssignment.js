import mongoose from "mongoose";

const couponAssignmentSchema = new mongoose.Schema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "RESERVED", "REDEEMED", "EXPIRED", "REVOKED"],
      default: "AVAILABLE",
      index: true,
    },
    issuedBy: {
      type: String,
      enum: ["ADMIN", "SYSTEM_RULE"],
      default: "ADMIN",
    },
    issuedReason: { type: String, default: "", trim: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", default: null },
    recommendationContext: { type: mongoose.Schema.Types.Mixed, default: {} },
    validFrom: { type: Date, default: null, index: true },
    validUntil: { type: Date, default: null, index: true },
    reservedAt: { type: Date, default: null },
    redeemedAt: { type: Date, default: null },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: "CouponReservation", default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

couponAssignmentSchema.index({ coupon: 1, user: 1, status: 1 });

const CouponAssignment =
  mongoose.models.CouponAssignment || mongoose.model("CouponAssignment", couponAssignmentSchema);

export default CouponAssignment;
