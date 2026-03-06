import KitchenAlert from "../models/KitchenAlert.js";
import KitchenMessage from "../models/KitchenMessage.js";
import KitchenDispatchRequest from "../models/KitchenDispatchRequest.js";

export const listKitchenAlerts = async (_req, res) => {
  try {
    const alerts = await KitchenAlert.find().sort({ createdAt: -1 }).limit(200);
    res.status(200).json(alerts);
  } catch (error) {
    console.error("Failed to list kitchen alerts:", error);
    res.status(500).json({ error: "Failed to list kitchen alerts" });
  }
};

export const createKitchenAlert = async (req, res) => {
  try {
    const payload = req.body ?? {};
    const alert = await KitchenAlert.create({
      item: payload.item,
      qtyRemaining: payload.qtyRemaining,
      unit: payload.unit,
      severity: payload.severity,
      reason: payload.reason,
      note: payload.note,
      status: "OPEN",
      actionType: payload.actionType ?? null,
      affectedOrderIds: payload.affectedOrderIds ?? [],
      createdBy: req.user?._id ?? null,
    });
    res.status(201).json(alert);
  } catch (error) {
    console.error("Failed to create kitchen alert:", error);
    res.status(500).json({ error: "Failed to create kitchen alert" });
  }
};

export const acknowledgeKitchenAlert = async (req, res) => {
  try {
    const alert = await KitchenAlert.findByIdAndUpdate(
      req.params.alertId,
      { status: "ACK", acknowledgedBy: req.user?._id ?? null },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.status(200).json(alert);
  } catch (error) {
    console.error("Failed to acknowledge kitchen alert:", error);
    res.status(500).json({ error: "Failed to acknowledge kitchen alert" });
  }
};

export const resolveKitchenAlert = async (req, res) => {
  try {
    const alert = await KitchenAlert.findByIdAndUpdate(
      req.params.alertId,
      { status: "RESOLVED", acknowledgedBy: req.user?._id ?? null },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.status(200).json(alert);
  } catch (error) {
    console.error("Failed to resolve kitchen alert:", error);
    res.status(500).json({ error: "Failed to resolve kitchen alert" });
  }
};

export const setKitchenAlertActionType = async (req, res) => {
  try {
    const { actionType } = req.body ?? {};
    const alert = await KitchenAlert.findByIdAndUpdate(
      req.params.alertId,
      { actionType: actionType ?? null },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.status(200).json(alert);
  } catch (error) {
    console.error("Failed to set alert action type:", error);
    res.status(500).json({ error: "Failed to set alert action type" });
  }
};

export const listKitchenMessages = async (req, res) => {
  try {
    const orderId = req.query.orderId ? String(req.query.orderId) : null;
    const query = orderId ? { orderId } : {};
    const messages = await KitchenMessage.find(query).sort({ createdAt: -1 }).limit(400);
    res.status(200).json(messages);
  } catch (error) {
    console.error("Failed to list kitchen messages:", error);
    res.status(500).json({ error: "Failed to list kitchen messages" });
  }
};

export const createKitchenMessage = async (req, res) => {
  try {
    const payload = req.body ?? {};
    const message = await KitchenMessage.create({
      orderId: payload.orderId ?? null,
      body: payload.body,
      sender: payload.sender || req.user?.name || "Kitchen",
      senderUserId: req.user?._id ?? null,
      targetRole: payload.targetRole,
      template: payload.template ?? "",
    });
    res.status(201).json(message);
  } catch (error) {
    console.error("Failed to create kitchen message:", error);
    res.status(500).json({ error: "Failed to create kitchen message" });
  }
};

export const listKitchenDispatchRequests = async (_req, res) => {
  try {
    const requests = await KitchenDispatchRequest.find().sort({ createdAt: -1 }).limit(200);
    res.status(200).json(requests);
  } catch (error) {
    console.error("Failed to list dispatch requests:", error);
    res.status(500).json({ error: "Failed to list dispatch requests" });
  }
};

export const createKitchenDispatchRequest = async (req, res) => {
  try {
    const payload = req.body ?? {};
    const request = await KitchenDispatchRequest.create({
      orderId: payload.orderId,
      type: payload.type,
      packingRequired: payload.packingRequired,
      expectedPickupTime: payload.expectedPickupTime,
      notifyAdmin: payload.notifyAdmin,
      notifyDelivery: payload.notifyDelivery,
      notes: payload.notes,
      status: "REQUESTED",
      assignee: payload.assignee ?? null,
      createdBy: req.user?._id ?? null,
    });
    res.status(201).json(request);
  } catch (error) {
    console.error("Failed to create dispatch request:", error);
    res.status(500).json({ error: "Failed to create dispatch request" });
  }
};

export const assignKitchenDispatchRequest = async (req, res) => {
  try {
    const { assignee } = req.body ?? {};
    const request = await KitchenDispatchRequest.findByIdAndUpdate(
      req.params.requestId,
      { status: "ASSIGNED", assignee: assignee ?? null },
      { new: true }
    );
    if (!request) return res.status(404).json({ error: "Dispatch request not found" });
    res.status(200).json(request);
  } catch (error) {
    console.error("Failed to assign dispatch request:", error);
    res.status(500).json({ error: "Failed to assign dispatch request" });
  }
};

export const completeKitchenDispatchRequest = async (req, res) => {
  try {
    const request = await KitchenDispatchRequest.findByIdAndUpdate(
      req.params.requestId,
      { status: "COMPLETED" },
      { new: true }
    );
    if (!request) return res.status(404).json({ error: "Dispatch request not found" });
    res.status(200).json(request);
  } catch (error) {
    console.error("Failed to complete dispatch request:", error);
    res.status(500).json({ error: "Failed to complete dispatch request" });
  }
};
