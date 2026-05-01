import mongoose from "mongoose";

const customerNoteSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["general", "preference", "complaint", "follow_up"],
      default: "general",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdByName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

customerNoteSchema.index({ customer: 1, createdAt: -1 });

const CustomerNote =
  mongoose.models.CustomerNote || mongoose.model("CustomerNote", customerNoteSchema);

export default CustomerNote;

