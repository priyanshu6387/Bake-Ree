import mongoose from "mongoose";

const inventoryVendorPriceSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventorySupplier",
      required: true,
      index: true,
    },
    supplierName: { type: String, required: true, trim: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true, index: true },
    itemName: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    pricePerUnit: { type: Number, required: true, min: 0 },
    leadTimeDays: { type: Number, default: 0, min: 0 },
    updatedAt: { type: Date },
  },
  { timestamps: true }
);

const InventoryVendorPrice =
  mongoose.models.InventoryVendorPrice ||
  mongoose.model("InventoryVendorPrice", inventoryVendorPriceSchema);

export default InventoryVendorPrice;
