import mongoose from "mongoose";

const inventoryVendorPaymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, required: true, trim: true, index: true },
    bill: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryVendorBill", required: true, index: true },
    billNumber: { type: String, required: true, trim: true },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventorySupplier",
      required: true,
      index: true,
    },
    supplierName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["cash", "bank", "upi"], required: true },
    paidAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["recorded", "reconciled"],
      default: "recorded",
      index: true,
    },
  },
  { timestamps: true }
);

const InventoryVendorPayment =
  mongoose.models.InventoryVendorPayment ||
  mongoose.model("InventoryVendorPayment", inventoryVendorPaymentSchema);

export default InventoryVendorPayment;
