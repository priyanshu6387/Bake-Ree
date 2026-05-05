import mongoose from "mongoose";

const inventoryPurchaseRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, required: true, trim: true, index: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true, index: true },
    itemName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "ordered"],
      default: "draft",
      index: true,
    },
  },
  { timestamps: true }
);

const InventoryPurchaseRequest =
  mongoose.models.InventoryPurchaseRequest ||
  mongoose.model("InventoryPurchaseRequest", inventoryPurchaseRequestSchema);

export default InventoryPurchaseRequest;
