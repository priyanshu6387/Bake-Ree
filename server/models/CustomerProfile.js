import mongoose from "mongoose";

const customerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Spending Analytics
    lifetimeSpending: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    averageOrderValue: {
      type: Number,
      default: 0,
    },
    // Purchase Streaks
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastOrderDate: {
      type: Date,
    },
    // Preferences
    favoriteProducts: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        orderCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    preferredOrderType: {
      type: String,
      enum: ["Delivery", "Pickup", null],
      default: null,
    },
    crmFavoriteProduct: {
      type: String,
      default: "",
      trim: true,
    },
    crmStatusOverride: {
      type: String,
      enum: ["active", "inactive", "vip", null],
      default: null,
    },
    crmNeedsFollowUp: {
      type: Boolean,
      default: null,
    },
    // Membership Tier (for future loyalty system)
    membershipTier: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Platinum"],
      default: "Bronze",
    },
    // Visit Frequency
    visitFrequency: {
      type: String,
      enum: ["New", "Occasional", "Regular", "VIP"],
      default: "New",
    },
    // Loyalty Points
    loyaltyPointsBalance: {
      type: Number,
      default: 0,
    },
    // Last calculated date
    lastCalculated: {
      type: Date,
      default: Date.now,
    },
    // Notification Preferences
    notificationPreferences: {
      email: {
        orderUpdates: { type: Boolean, default: true },
        promotions: { type: Boolean, default: true },
        pointsEarned: { type: Boolean, default: true },
        tierUpgrades: { type: Boolean, default: true },
      },
      inApp: {
        orderUpdates: { type: Boolean, default: true },
        promotions: { type: Boolean, default: true },
        pointsEarned: { type: Boolean, default: true },
        tierUpgrades: { type: Boolean, default: true },
      },
      push: {
        orderUpdates: { type: Boolean, default: false },
        promotions: { type: Boolean, default: false },
        pointsEarned: { type: Boolean, default: false },
        tierUpgrades: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

// Index for faster lookups
customerProfileSchema.index({ user: 1 });
customerProfileSchema.index({ membershipTier: 1 });
customerProfileSchema.index({ visitFrequency: 1 });

const CustomerProfile =
  mongoose.models.CustomerProfile ||
  mongoose.model("CustomerProfile", customerProfileSchema);

export default CustomerProfile;

