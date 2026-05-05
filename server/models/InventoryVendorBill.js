import mongoose from "mongoose";

const inventoryVendorBillSchema = new mongoose.Schema(
  {
    billNumber: { type: String, required: true, trim: true, index: true },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventorySupplier",
      required: true,
      index: true,
    },
    supplierName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["unpaid", "partially_paid", "paid"],
      default: "unpaid",
      index: true,
    },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

const InventoryVendorBill =
  mongoose.models.InventoryVendorBill ||
  mongoose.model("InventoryVendorBill", inventoryVendorBillSchema);

export default InventoryVendorBill;
