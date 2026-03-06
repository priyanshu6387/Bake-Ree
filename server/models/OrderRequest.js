import mongoose from "mongoose";

const orderRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["ISSUE", "RETURN", "REFUND"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "UNDER_REVIEW", "APPROVED", "REJECTED", "RESOLVED", "REFUNDED"],
      default: "OPEN",
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    requestedByRole: {
      type: String,
      default: "customer",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewNotes: {
      type: String,
      default: "",
    },
    reviewDecisionAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

orderRequestSchema.index({ order: 1, createdAt: -1 });
orderRequestSchema.index({ type: 1, status: 1, createdAt: -1 });

const OrderRequest =
  mongoose.models.OrderRequest || mongoose.model("OrderRequest", orderRequestSchema);

export default OrderRequest;
