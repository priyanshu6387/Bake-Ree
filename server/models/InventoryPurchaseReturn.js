import mongoose from "mongoose";

const inventoryPurchaseReturnSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, required: true, trim: true, index: true },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventorySupplier",
      required: true,
      index: true,
    },
    supplierName: { type: String, required: true, trim: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true, index: true },
    itemName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["draft", "sent", "settled"],
      default: "draft",
      index: true,
    },
  },
  { timestamps: true }
);

const InventoryPurchaseReturn =
  mongoose.models.InventoryPurchaseReturn ||
  mongoose.model("InventoryPurchaseReturn", inventoryPurchaseReturnSchema);

export default InventoryPurchaseReturn;
