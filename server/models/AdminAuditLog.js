import mongoose from "mongoose";

const adminAuditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true, trim: true },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: String, required: true, trim: true },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const AdminAuditLog =
  mongoose.models.AdminAuditLog || mongoose.model("AdminAuditLog", adminAuditLogSchema);

export default AdminAuditLog;
