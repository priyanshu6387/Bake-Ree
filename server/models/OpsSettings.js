import mongoose from "mongoose";

const opsSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    settingsVersion: { type: Number, default: 1 },
    workflow: { type: mongoose.Schema.Types.Mixed, default: {} },
    notifications: { type: mongoose.Schema.Types.Mixed, default: {} },
    integrations: { type: mongoose.Schema.Types.Mixed, default: {} },
    compliance: { type: mongoose.Schema.Types.Mixed, default: {} },
    kitchen: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

const OpsSettings =
  mongoose.models.OpsSettings || mongoose.model("OpsSettings", opsSettingsSchema);

export default OpsSettings;
