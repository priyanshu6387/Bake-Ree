import mongoose from "mongoose";

const inventoryPurchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, trim: true, index: true },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventorySupplier",
      required: true,
      index: true,
    },
    supplierName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "sent", "partially_received", "received", "closed"],
      default: "draft",
      index: true,
    },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

const InventoryPurchaseOrder =
  mongoose.models.InventoryPurchaseOrder ||
  mongoose.model("InventoryPurchaseOrder", inventoryPurchaseOrderSchema);

export default InventoryPurchaseOrder;
