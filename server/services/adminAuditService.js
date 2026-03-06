import AdminAuditLog from "../models/AdminAuditLog.js";

export const logAdminAudit = async ({
  actorId = null,
  action,
  entityType,
  entityId,
  before = null,
  after = null,
  metadata = {},
}) => {
  if (!action || !entityType || !entityId) return null;

  try {
    return await AdminAuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      before,
      after,
      metadata,
    });
  } catch (error) {
    console.error("Failed to write admin audit log:", error.message);
    return null;
  }
};

export const listAdminAuditLogs = async ({ limit = 100 } = {}) =>
  AdminAuditLog.find().sort({ createdAt: -1 }).limit(limit).lean();
