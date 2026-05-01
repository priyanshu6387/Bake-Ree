import {
  getCrmCustomers,
  getCrmCustomerById,
  getCrmCustomerOrders,
  getCrmCustomerLoyaltyActivity,
  getCrmLoyaltyOverview,
  createCrmLoyaltyAdjustment,
  createCrmCustomer,
  getCrmCustomerNotes,
  createCrmCustomerNote,
  getCrmComplaints,
  createCrmComplaint,
  updateCrmComplaintStatus,
  getCrmCustomerComplaints,
  getCrmCampaigns,
  createCrmCampaign,
  updateCrmCampaignStatus,
  duplicateCrmCampaign,
  getCrmCampaignRecipients,
} from "../services/crmService.js";

export const getCustomers = async (req, res) => {
  try {
    const { search = "", status, sort = "createdAt_desc" } = req.query;
    const customers = await getCrmCustomers({ search, status, sort });
    return res.status(200).json({ success: true, customers });
  } catch (error) {
    console.error("CRM getCustomers error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch CRM customers" });
  }
};

export const postCustomer = async (req, res) => {
  try {
    const result = await createCrmCustomer(req.body || {}, req.user);
    if (result?.error) {
      return res.status(result.code || 400).json({ success: false, message: result.error });
    }
    return res.status(201).json({ success: true, customer: result.customer });
  } catch (error) {
    console.error("CRM postCustomer error:", error);
    return res.status(500).json({ success: false, message: "Failed to create customer" });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await getCrmCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    return res.status(200).json({ success: true, customer });
  } catch (error) {
    console.error("CRM getCustomerById error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch customer" });
  }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const orders = await getCrmCustomerOrders(req.params.id);
    if (orders === null) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("CRM getCustomerOrders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch customer orders" });
  }
};

export const getCustomerLoyaltyActivity = async (req, res) => {
  try {
    const activity = await getCrmCustomerLoyaltyActivity(req.params.id);
    if (activity === null) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    return res.status(200).json({ success: true, activity });
  } catch (error) {
    console.error("CRM getCustomerLoyaltyActivity error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch loyalty activity" });
  }
};

export const getLoyaltyOverview = async (req, res) => {
  try {
    const data = await getCrmLoyaltyOverview();
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    console.error("CRM getLoyaltyOverview error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch loyalty overview" });
  }
};

export const createLoyaltyAdjustment = async (req, res) => {
  try {
    const { customerId, type, points, description } = req.body || {};
    const result = await createCrmLoyaltyAdjustment({
      customerId,
      type,
      points,
      description,
      adminUser: req.user,
    });

    if (result?.error) {
      return res.status(result.code || 400).json({ success: false, message: result.error });
    }

    return res.status(201).json({
      success: true,
      activity: result.activity,
      customer: result.customer,
    });
  } catch (error) {
    console.error("CRM createLoyaltyAdjustment error:", error);
    return res.status(500).json({ success: false, message: "Failed to create loyalty adjustment" });
  }
};

export const getCustomerNotes = async (req, res) => {
  try {
    const notes = await getCrmCustomerNotes(req.params.id);
    if (notes === null) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    return res.status(200).json({ success: true, notes });
  } catch (error) {
    console.error("CRM getCustomerNotes error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch customer notes" });
  }
};

export const createCustomerNote = async (req, res) => {
  try {
    const { text, type } = req.body || {};
    const result = await createCrmCustomerNote({
      customerId: req.params.id,
      text,
      type,
      adminUser: req.user,
    });

    if (result?.error) {
      return res.status(result.code || 400).json({ success: false, message: result.error });
    }
    return res.status(201).json({ success: true, note: result.note });
  } catch (error) {
    console.error("CRM createCustomerNote error:", error);
    return res.status(500).json({ success: false, message: "Failed to create customer note" });
  }
};

export const getComplaints = async (req, res) => {
  try {
    const { search = "", status, issueType, sort = "newest" } = req.query;
    const complaints = await getCrmComplaints({ search, status, issueType, sort });
    return res.status(200).json({ success: true, complaints });
  } catch (error) {
    console.error("CRM getComplaints error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch complaints" });
  }
};

export const createComplaint = async (req, res) => {
  try {
    const { customerId, orderId, issueType, description, priority } = req.body || {};
    if (!customerId) {
      return res.status(400).json({ success: false, message: "customerId is required" });
    }

    const result = await createCrmComplaint({
      customerId,
      orderId,
      issueType,
      description,
      priority,
      adminUser: req.user,
    });

    if (result?.error) {
      return res.status(result.code || 400).json({ success: false, message: result.error });
    }
    return res.status(201).json({ success: true, complaint: result.complaint });
  } catch (error) {
    console.error("CRM createComplaint error:", error);
    return res.status(500).json({ success: false, message: "Failed to create complaint" });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { status, resolutionNote } = req.body || {};
    if (!status) {
      return res.status(400).json({ success: false, message: "status is required" });
    }

    const result = await updateCrmComplaintStatus({
      complaintId: req.params.id,
      status,
      resolutionNote,
    });

    if (result?.error) {
      return res.status(result.code || 400).json({ success: false, message: result.error });
    }
    return res.status(200).json({ success: true, complaint: result.complaint });
  } catch (error) {
    console.error("CRM updateComplaintStatus error:", error);
    return res.status(500).json({ success: false, message: "Failed to update complaint status" });
  }
};

export const getCustomerComplaints = async (req, res) => {
  try {
    const complaints = await getCrmCustomerComplaints(req.params.id);
    if (complaints === null) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    return res.status(200).json({ success: true, complaints });
  } catch (error) {
    console.error("CRM getCustomerComplaints error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch customer complaints" });
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const { search = "", status, channel, sort = "newest" } = req.query;
    const campaigns = await getCrmCampaigns({ search, status, channel, sort });
    return res.status(200).json({ success: true, campaigns });
  } catch (error) {
    console.error("CRM getCampaigns error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch campaigns" });
  }
};

export const createCampaign = async (req, res) => {
  try {
    const { name, targetSegment, channel, message, couponCode, discountLabel, status, scheduledAt } = req.body || {};
    const result = await createCrmCampaign({
      name,
      targetSegment,
      channel,
      message,
      couponCode,
      discountLabel,
      status,
      scheduledAt,
      adminUser: req.user,
    });

    if (result?.error) {
      return res.status(result.code || 400).json({ success: false, message: result.error });
    }
    return res.status(201).json({ success: true, campaign: result.campaign });
  } catch (error) {
    console.error("CRM createCampaign error:", error);
    return res.status(500).json({ success: false, message: "Failed to create campaign" });
  }
};

export const patchCampaignStatus = async (req, res) => {
  try {
    const { status, scheduledAt } = req.body || {};
    if (!status) {
      return res.status(400).json({ success: false, message: "status is required" });
    }

    const result = await updateCrmCampaignStatus({
      campaignId: req.params.id,
      status,
      scheduledAt,
    });
    if (result?.error) {
      return res.status(result.code || 400).json({ success: false, message: result.error });
    }
    return res.status(200).json({ success: true, campaign: result.campaign });
  } catch (error) {
    console.error("CRM patchCampaignStatus error:", error);
    return res.status(500).json({ success: false, message: "Failed to update campaign status" });
  }
};

export const duplicateCampaign = async (req, res) => {
  try {
    const result = await duplicateCrmCampaign({ campaignId: req.params.id, adminUser: req.user });
    if (result?.error) {
      return res.status(result.code || 400).json({ success: false, message: result.error });
    }
    return res.status(201).json({ success: true, campaign: result.campaign });
  } catch (error) {
    console.error("CRM duplicateCampaign error:", error);
    return res.status(500).json({ success: false, message: "Failed to duplicate campaign" });
  }
};

export const getCampaignRecipients = async (req, res) => {
  try {
    const result = await getCrmCampaignRecipients(req.params.id);
    if (result?.error) {
      return res.status(result.code || 400).json({ success: false, message: result.error });
    }
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("CRM getCampaignRecipients error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch campaign recipients" });
  }
};
