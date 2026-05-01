import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    targetSegment: { type: String, required: true, trim: true },
    channel: { type: String, enum: ["whatsapp", "sms", "email"], required: true },
    message: { type: String, required: true, trim: true },
    couponCode: { type: String, default: "", trim: true },
    discountLabel: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent"],
      default: "draft",
      index: true,
    },
    recipientCount: { type: Number, default: 0 },
    scheduledAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdByName: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);

export default Campaign;
