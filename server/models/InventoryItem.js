import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    currentStock: { type: Number, required: true, default: 0, min: 0 },
    minimumStock: { type: Number, required: true, default: 0, min: 0 },
    costPerUnit: { type: Number, required: true, default: 0, min: 0 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "InventorySupplier" },
    supplierName: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      default: "in_stock",
      index: true,
    },
    batchTracking: { type: Boolean, default: false },
    expiryTracking: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const InventoryItem =
  mongoose.models.InventoryItem || mongoose.model("InventoryItem", inventoryItemSchema);

export default InventoryItem;
