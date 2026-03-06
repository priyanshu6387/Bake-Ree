import mongoose from "mongoose";

const kitchenDispatchRequestSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, trim: true },
    type: { type: String, enum: ["DELIVERY", "PICKUP"], default: "DELIVERY" },
    packingRequired: { type: Boolean, default: true },
    expectedPickupTime: { type: String, default: "" },
    notifyAdmin: { type: Boolean, default: true },
    notifyDelivery: { type: Boolean, default: true },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["REQUESTED", "ASSIGNED", "COMPLETED"],
      default: "REQUESTED",
    },
    assignee: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

kitchenDispatchRequestSchema.index({ status: 1, createdAt: -1 });

const KitchenDispatchRequest =
  mongoose.models.KitchenDispatchRequest ||
  mongoose.model("KitchenDispatchRequest", kitchenDispatchRequestSchema);

export default KitchenDispatchRequest;
