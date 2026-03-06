import mongoose from "mongoose";

const kitchenAlertSchema = new mongoose.Schema(
  {
    item: { type: String, required: true, trim: true },
    qtyRemaining: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true, default: "units" },
    severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    reason: { type: String, required: true, trim: true },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: ["OPEN", "ACK", "IN_PROGRESS", "RESOLVED"],
      default: "OPEN",
    },
    actionType: {
      type: String,
      enum: ["REFILL", "PURCHASE", null],
      default: null,
    },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    affectedOrderIds: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

kitchenAlertSchema.index({ status: 1, createdAt: -1 });

const KitchenAlert =
  mongoose.models.KitchenAlert || mongoose.model("KitchenAlert", kitchenAlertSchema);

export default KitchenAlert;
