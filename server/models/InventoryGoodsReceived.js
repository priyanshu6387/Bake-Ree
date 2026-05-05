import mongoose from "mongoose";

const receivedItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    itemName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    cost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const inventoryGoodsReceivedSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, required: true, trim: true, index: true },
    po: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryPurchaseOrder", default: null },
    poNumber: { type: String, trim: true, default: "" },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventorySupplier",
      required: true,
      index: true,
    },
    supplierName: { type: String, required: true, trim: true },
    receivedItems: { type: [receivedItemSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "received"],
      default: "draft",
      index: true,
    },
    receivedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const InventoryGoodsReceived =
  mongoose.models.InventoryGoodsReceived ||
  mongoose.model("InventoryGoodsReceived", inventoryGoodsReceivedSchema);

export default InventoryGoodsReceived;
