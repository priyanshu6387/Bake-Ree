import mongoose from "mongoose";

const kitchenMessageSchema = new mongoose.Schema(
  {
    orderId: { type: String, default: null },
    body: { type: String, required: true, trim: true },
    sender: { type: String, default: "Kitchen" },
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    targetRole: {
      type: String,
      enum: ["ADMIN", "DELIVERY", "KITCHEN"],
      required: true,
    },
    template: { type: String, default: "" },
  },
  { timestamps: true }
);

kitchenMessageSchema.index({ orderId: 1, createdAt: -1 });
kitchenMessageSchema.index({ targetRole: 1, createdAt: -1 });

const KitchenMessage =
  mongoose.models.KitchenMessage || mongoose.model("KitchenMessage", kitchenMessageSchema);

export default KitchenMessage;
