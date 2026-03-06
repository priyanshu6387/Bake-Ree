import express from "express";
import {
  createAccessRole,
  getComplianceSettings,
  getIntegrationSettings,
  getKitchenRbac,
  getNavigationPolicy,
  getNotificationSettings,
  getSettingsBootstrap,
  getWorkflowSettings,
  listAccessRoles,
  listSettingsAuditLog,
  updateAccessRole,
  updateComplianceSettings,
  updateIntegrationSettings,
  updateKitchenRbac,
  updateNavigationPolicy,
  updateNotificationSettings,
  updateWorkflowSettings,
} from "../controllers/opsSettingsController.js";
import { adminOnly, protect, requirePermission } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/bootstrap", requirePermission("ops.settings.navigation.read"), getSettingsBootstrap);

router.get("/roles", requirePermission("ops.settings.roles.read"), listAccessRoles);
router.post("/roles", requirePermission("ops.settings.roles.write"), createAccessRole);
router.patch("/roles/:roleKey", requirePermission("ops.settings.roles.write"), updateAccessRole);

router.get("/navigation", requirePermission("ops.settings.navigation.read"), getNavigationPolicy);
router.put("/navigation", requirePermission("ops.settings.navigation.write"), updateNavigationPolicy);

router.get("/kitchen-rbac", requirePermission("ops.settings.kitchen_rbac.read"), getKitchenRbac);
router.put("/kitchen-rbac", requirePermission("ops.settings.kitchen_rbac.write"), updateKitchenRbac);

router.get("/workflow", requirePermission("ops.settings.workflow.read"), getWorkflowSettings);
router.put("/workflow", requirePermission("ops.settings.workflow.write"), updateWorkflowSettings);

router.get("/notifications", requirePermission("ops.settings.notifications.read"), getNotificationSettings);
router.put("/notifications", requirePermission("ops.settings.notifications.write"), updateNotificationSettings);

router.get("/integrations", requirePermission("ops.settings.integrations.read"), getIntegrationSettings);
router.put("/integrations", requirePermission("ops.settings.integrations.write"), updateIntegrationSettings);

router.get("/compliance", requirePermission("ops.settings.compliance.read"), getComplianceSettings);
router.put("/compliance", requirePermission("ops.settings.compliance.write"), updateComplianceSettings);

router.get("/audit", requirePermission("ops.settings.audit.read"), listSettingsAuditLog);

export default router;
