import mongoose from "mongoose";

const inventoryMovementSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true, index: true },
    itemName: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["stock_in", "stock_out", "adjustment", "transfer", "waste", "return"],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "InventorySupplier" },
    supplierName: { type: String, trim: true, default: "" },
    reason: { type: String, trim: true, default: "" },
    cost: { type: Number, min: 0 },
    note: { type: String, trim: true, default: "" },
    fromLocation: { type: String, trim: true, default: "" },
    toLocation: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const InventoryMovement =
  mongoose.models.InventoryMovement || mongoose.model("InventoryMovement", inventoryMovementSchema);

export default InventoryMovement;
