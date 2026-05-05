import mongoose from "mongoose";

const inventorySupplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    itemsSupplied: [{ type: String, trim: true }],
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
  },
  { timestamps: true }
);

const InventorySupplier =
  mongoose.models.InventorySupplier || mongoose.model("InventorySupplier", inventorySupplierSchema);

export default InventorySupplier;
