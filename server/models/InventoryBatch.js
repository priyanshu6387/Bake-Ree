import mongoose from "mongoose";

const inventoryBatchSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true, index: true },
    itemName: { type: String, required: true, trim: true },
    batchNumber: { type: String, required: true, trim: true, index: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    expiryDate: { type: Date, required: true },
    receivedAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["valid", "expiring_soon", "expired"],
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const InventoryBatch =
  mongoose.models.InventoryBatch || mongoose.model("InventoryBatch", inventoryBatchSchema);

export default InventoryBatch;
