import express from "express";
import {
  getCustomers,
  postCustomer,
  getCustomerById,
  getCustomerOrders,
  getCustomerLoyaltyActivity,
  getLoyaltyOverview,
  createLoyaltyAdjustment,
  getCustomerNotes,
  createCustomerNote,
  getComplaints,
  createComplaint,
  updateComplaintStatus,
  getCustomerComplaints,
  getCampaigns,
  createCampaign,
  patchCampaignStatus,
  duplicateCampaign,
  getCampaignRecipients,
} from "../controllers/crmController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// TODO: add explicit CRM permission checks when CRM permission keys are finalized.
router.get("/customers", protect, adminOnly, getCustomers);
router.post("/customers", protect, adminOnly, postCustomer);
router.get("/customers/:id", protect, adminOnly, getCustomerById);
router.get("/customers/:id/orders", protect, adminOnly, getCustomerOrders);
router.get("/customers/:id/loyalty-activity", protect, adminOnly, getCustomerLoyaltyActivity);
router.get("/loyalty", protect, adminOnly, getLoyaltyOverview);
router.post("/loyalty/adjustments", protect, adminOnly, createLoyaltyAdjustment);
router.get("/customers/:id/notes", protect, adminOnly, getCustomerNotes);
router.post("/customers/:id/notes", protect, adminOnly, createCustomerNote);
router.get("/customers/:id/complaints", protect, adminOnly, getCustomerComplaints);
router.get("/complaints", protect, adminOnly, getComplaints);
router.post("/complaints", protect, adminOnly, createComplaint);
router.patch("/complaints/:id/status", protect, adminOnly, updateComplaintStatus);
router.get("/campaigns", protect, adminOnly, getCampaigns);
router.post("/campaigns", protect, adminOnly, createCampaign);
router.patch("/campaigns/:id/status", protect, adminOnly, patchCampaignStatus);
router.post("/campaigns/:id/duplicate", protect, adminOnly, duplicateCampaign);
router.get("/campaigns/:id/recipients", protect, adminOnly, getCampaignRecipients);

export default router;
