import mongoose from "mongoose";

const loyaltyPointsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
      default: 0,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    transactionType: {
      type: String,
      enum: ["earned", "redeemed", "expired", "bonus", "adjustment"],
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    description: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdByName: {
      type: String,
      trim: true,
      default: "",
    },
    expiresAt: {
      type: Date,
      // Points expire after 1 year
      default: function() {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        return date;
      },
    },
  },
  { timestamps: true }
);

// Index for efficient queries
loyaltyPointsSchema.index({ user: 1, createdAt: -1 });
loyaltyPointsSchema.index({ expiresAt: 1 });

const LoyaltyPoints =
  mongoose.models.LoyaltyPoints ||
  mongoose.model("LoyaltyPoints", loyaltyPointsSchema);

export default LoyaltyPoints;

