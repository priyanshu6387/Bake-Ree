import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    sourceType: {
      type: String,
      enum: ["ADMIN", "SYSTEM"],
      default: "ADMIN",
    },
    audienceType: {
      type: String,
      enum: ["GENERAL", "TARGETED", "RECOMMENDED"],
      default: "GENERAL",
      index: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENT", "FLAT", "FREE_DELIVERY"],
      default: "PERCENT",
    },
    // PERCENT: 0-100, FLAT: absolute currency amount, FREE_DELIVERY: ignored
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, default: null, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    applicableOrderTypes: {
      type: [String],
      enum: ["Delivery", "Pickup"],
      default: [],
    },
    applicableCategories: { type: [String], default: [] },
    applicableProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    includeUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    excludeUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    membershipTiers: { type: [String], default: [] },
    newUserOnly: { type: Boolean, default: false },
    firstOrderOnly: { type: Boolean, default: false },
    globalUsageLimit: { type: Number, default: null, min: 1 },
    perUserUsageLimit: { type: Number, default: null, min: 1 },
    perDayUsageLimit: { type: Number, default: null, min: 1 },
    usageCount: { type: Number, default: 0 },
    allowWithLoyalty: { type: Boolean, default: false },
    allowWithOtherCoupons: { type: Boolean, default: false },
    validFrom: { type: Date, default: null, index: true },
    validUntil: { type: Date, default: null, index: true },
    timezone: { type: String, default: "UTC" },
    autoExpire: { type: Boolean, default: true },
    metrics: {
      issuedCount: { type: Number, default: 0 },
      reservedCount: { type: Number, default: 0 },
      redeemedCount: { type: Number, default: 0 },
      revenueLift: { type: Number, default: 0 },
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

couponSchema.index({ status: 1, validUntil: 1 });
couponSchema.index({ audienceType: 1, status: 1 });

const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
export default Coupon;
