import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import Order from "../models/Order.js";
import LoyaltyPoints from "../models/LoyaltyPoints.js";
import CustomerProfile from "../models/CustomerProfile.js";
import CustomerNote from "../models/CustomerNote.js";
import Complaint from "../models/Complaint.js";
import Campaign from "../models/Campaign.js";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ORDER_STATUS_DELIVERED = new Set(["DELIVERED", "COMPLETED", "Delivered"]);
const CAMPAIGN_SEGMENTS = {
  vip_customers: "VIP Customers",
  active_customers: "Active Customers",
  inactive_customers: "Inactive Customers",
  new_customers: "New Customers",
  high_spenders: "High Spenders",
  frequent_buyers: "Frequent Buyers",
  needs_follow_up: "Needs Follow-up",
  loyalty_champions: "Loyalty Champions",
};
const SEGMENT_ALIASES = {
  vip: "vip_customers",
  active: "active_customers",
  inactive: "inactive_customers",
  new: "new_customers",
  "vip customers": "vip_customers",
  "active customers": "active_customers",
  "inactive customers": "inactive_customers",
  "new customers": "new_customers",
  "high spenders": "high_spenders",
  "frequent buyers": "frequent_buyers",
  "needs follow-up": "needs_follow_up",
  "needs follow up": "needs_follow_up",
  "loyalty champions": "loyalty_champions",
};

export const normalizeDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export const deriveCustomerStatus = ({ totalSpend, loyaltyPoints, lastOrderDate }) => {
  if (totalSpend >= 5000 || loyaltyPoints >= 500) return "vip";
  if (!lastOrderDate) return "inactive";
  const inactiveCutoff = Date.now() - THIRTY_DAYS_MS;
  return new Date(lastOrderDate).getTime() < inactiveCutoff ? "inactive" : "active";
};

export const deriveFavoriteProduct = ({ orders = [] }) => {
  const frequency = new Map();

  orders.forEach((order) => {
    const items = Array.isArray(order.simplifiedItems) ? order.simplifiedItems : [];
    items.forEach((item) => {
      const itemName = String(item?.name || "").trim();
      if (!itemName) return;
      const qty = Number(item?.quantity) || 1;
      frequency.set(itemName, (frequency.get(itemName) || 0) + qty);
    });
  });

  if (frequency.size === 0) return "Not available";

  let favorite = "Not available";
  let count = 0;
  frequency.forEach((qty, name) => {
    if (qty > count) {
      count = qty;
      favorite = name;
    }
  });
  return favorite;
};

export const calculateCustomerMetrics = ({ orders = [], loyaltyPoints = 0 }) => {
  const validOrders = orders.filter((order) => order && ORDER_STATUS_DELIVERED.has(order.status));
  const totalOrders = validOrders.length;
  const totalSpend = validOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
  const lastOrderDateValue = validOrders.reduce((latest, order) => {
    const createdAt = order?.createdAt ? new Date(order.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) return latest;
    if (!latest) return createdAt;
    return createdAt > latest ? createdAt : latest;
  }, null);
  const lastOrderDate = normalizeDate(lastOrderDateValue);
  const status = deriveCustomerStatus({ totalSpend, loyaltyPoints, lastOrderDate });
  const favoriteProduct = deriveFavoriteProduct({ orders: validOrders });
  const needsFollowUp = status === "inactive";

  return {
    totalOrders,
    totalSpend,
    lastOrderDate,
    loyaltyPoints,
    status,
    favoriteProduct,
    needsFollowUp,
  };
};

export const mapNoteToCrmNote = (note) => ({
  id: String(note._id),
  customerId: String(note.customer),
  text: note.text || "",
  type: note.type || "general",
  createdBy: note.createdByName || "Admin",
  createdAt: normalizeDate(note.createdAt),
});

export const mapComplaintToCrmComplaint = (complaint) => ({
  id: String(complaint._id),
  customerId: String(complaint.customer?._id || complaint.customer),
  customerName: complaint.customer?.name || "Unknown",
  orderId: complaint.order?._id ? String(complaint.order._id) : complaint.order ? String(complaint.order) : "",
  orderNumber: complaint.orderNumber || "",
  issueType: complaint.issueType || "",
  description: complaint.description || "",
  status: complaint.status || "open",
  priority: complaint.priority || "medium",
  resolutionNote: complaint.resolutionNote || "",
  createdAt: normalizeDate(complaint.createdAt),
  resolvedAt: complaint.resolvedAt ? normalizeDate(complaint.resolvedAt) : undefined,
});

export const mapLoyaltyActivityToCrmActivity = (activity) => {
  const normalizedType = String(activity.transactionType || "").toLowerCase();
  let type = "earned";
  if (normalizedType === "redeemed" || normalizedType === "expired") {
    type = "redeemed";
  } else if (normalizedType === "adjustment") {
    type = "adjusted";
  }

  return {
    id: String(activity._id),
    customerId: String(activity.user),
    type,
    points: Number(activity.points) || 0,
    description: String(activity.description || "").trim() || "Loyalty points activity",
    createdAt: normalizeDate(activity.createdAt),
  };
};

export const buildCrmCustomerFromUser = ({ user, metrics, profile }) => ({
  id: String(user._id),
  name: user.name || "Unknown",
  phone: user.phone || "",
  email: user.email || "",
  totalOrders: metrics.totalOrders,
  totalSpend: metrics.totalSpend,
  lastOrderDate: metrics.lastOrderDate,
  loyaltyPoints: metrics.loyaltyPoints,
  status: profile?.crmStatusOverride || metrics.status,
  favoriteProduct: profile?.crmFavoriteProduct || metrics.favoriteProduct,
  needsFollowUp: typeof profile?.crmNeedsFollowUp === "boolean" ? profile.crmNeedsFollowUp : metrics.needsFollowUp,
  createdAt: normalizeDate(user.createdAt),
  preferredOrderChannel: profile?.preferredOrderType
    ? String(profile.preferredOrderType).toLowerCase()
    : "delivery",
  preferenceNotes:
    String(user?.allergyPreferences?.notes || "").trim() ||
    (Array.isArray(user?.allergyPreferences?.allergies)
      ? user.allergyPreferences.allergies.join(", ")
      : undefined),
  topPurchasedProducts: [],
});

export const normalizeSegmentKey = (segment) => {
  const normalizedInput = String(segment || "")
    .trim()
    .toLowerCase();
  if (!normalizedInput) return null;
  if (CAMPAIGN_SEGMENTS[normalizedInput]) return normalizedInput;
  if (SEGMENT_ALIASES[normalizedInput]) return SEGMENT_ALIASES[normalizedInput];
  return null;
};

export const getSegmentLabel = (segment) => {
  const key = normalizeSegmentKey(segment);
  return key ? CAMPAIGN_SEGMENTS[key] : "";
};

export const mapCampaignToCrmCampaign = (campaign) => ({
  id: String(campaign._id),
  name: campaign.name || "",
  targetSegment: normalizeSegmentKey(campaign.targetSegment) || "",
  targetSegmentLabel: getSegmentLabel(campaign.targetSegment),
  channel: campaign.channel || "",
  message: campaign.message || "",
  couponCode: campaign.couponCode || "",
  discountLabel: campaign.discountLabel || "",
  status: campaign.status || "draft",
  recipientCount: Number(campaign.recipientCount) || 0,
  createdAt: normalizeDate(campaign.createdAt),
  scheduledAt: campaign.scheduledAt ? normalizeDate(campaign.scheduledAt) : undefined,
  sentAt: campaign.sentAt ? normalizeDate(campaign.sentAt) : undefined,
});

export const mapCustomerToCampaignRecipient = (customer) => ({
  id: customer.id,
  name: customer.name || "",
  phone: customer.phone || "",
  email: customer.email || "",
  totalSpend: Number(customer.totalSpend) || 0,
  loyaltyPoints: Number(customer.loyaltyPoints) || 0,
});

const mapCrmOrderStatus = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (["CANCELLED", "CANCELED"].includes(normalized)) return "cancelled";
  if (["DELIVERED", "COMPLETED", "PICKED_UP"].includes(normalized)) return "delivered";
  if (["APPROVAL_PENDING", "PENDING"].includes(normalized)) return "placed";
  return "confirmed";
};

const mapOrderChannel = (orderType) =>
  String(orderType || "").toUpperCase() === "DELIVERY" ? "delivery" : "pickup";

const buildOrderNumber = (order) => {
  if (order.orderNumber) return String(order.orderNumber);
  if (order.createdAt) {
    const date = new Date(order.createdAt);
    if (!Number.isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      return `BR-${y}${m}${d}-${String(order._id).slice(-6).toUpperCase()}`;
    }
  }
  return `BR-${String(order._id).slice(-8).toUpperCase()}`;
};

export const mapOrderToCrmOrder = (order) => {
  const simplified = Array.isArray(order.simplifiedItems) ? order.simplifiedItems : [];
  const itemsSummary =
    simplified.length > 0
      ? simplified
          .map((item) => String(item?.name || "").trim())
          .filter(Boolean)
          .slice(0, 5)
          .join(", ")
      : "Not available";

  return {
    id: String(order._id),
    customerId: String(order.user),
    orderNumber: buildOrderNumber(order),
    date: normalizeDate(order.createdAt),
    itemsSummary,
    status: mapCrmOrderStatus(order.status),
    amount: Number(order.totalAmount) || 0,
    channel: mapOrderChannel(order.orderType),
  };
};

const parseSortOption = (sort) => {
  switch (sort) {
    case "spend_desc":
      return (a, b) => b.totalSpend - a.totalSpend;
    case "orders_desc":
      return (a, b) => b.totalOrders - a.totalOrders;
    case "name_asc":
      return (a, b) => a.name.localeCompare(b.name);
    case "createdAt_asc":
      return (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
    case "createdAt_desc":
    default:
      return (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
  }
};

const buildLoyaltyPointsAggregation = (userMatch) => [
  { $match: userMatch },
  {
    $group: {
      _id: "$user",
      earned: {
        $sum: {
          $cond: [{ $in: ["$transactionType", ["earned", "bonus", "adjustment"]] }, "$points", 0],
        },
      },
      burned: {
        $sum: {
          $cond: [{ $in: ["$transactionType", ["redeemed", "expired"]] }, "$points", 0],
        },
      },
    },
  },
  { $project: { points: { $max: [0, { $subtract: ["$earned", "$burned"] }] } } },
];

const getCustomerLoyaltyBalance = async (userId) => {
  const pointsAgg = await LoyaltyPoints.aggregate(buildLoyaltyPointsAggregation({ user: userId }));
  return Number(pointsAgg?.[0]?.points) || 0;
};

export const calculateLoyaltySummary = ({ customers = [], activity = [] }) => {
  const totalActivePoints = customers.reduce((sum, customer) => sum + (Number(customer.loyaltyPoints) || 0), 0);
  const pointsEarned = activity.reduce(
    (sum, row) => (row.type === "earned" ? sum + (Number(row.points) || 0) : sum),
    0
  );
  const pointsRedeemed = activity.reduce(
    (sum, row) => (row.type === "redeemed" ? sum + Math.abs(Number(row.points) || 0) : sum),
    0
  );

  return {
    totalLoyaltyCustomers: customers.filter((customer) => (Number(customer.loyaltyPoints) || 0) > 0).length,
    totalActivePoints,
    pointsEarned,
    pointsRedeemed,
    loyaltyChampions: customers.filter((customer) => (Number(customer.loyaltyPoints) || 0) >= 500).length,
    averagePointsPerCustomer: customers.length > 0 ? totalActivePoints / customers.length : 0,
  };
};

export const getCrmCustomers = async ({ search = "", status, sort = "createdAt_desc" }) => {
  const userFilter = { role: "customer" };
  if (search && String(search).trim()) {
    const searchRegex = new RegExp(String(search).trim(), "i");
    userFilter.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
  }

  const users = await User.find(userFilter).select("_id name phone email createdAt allergyPreferences").lean();
  if (users.length === 0) return [];

  const userIds = users.map((user) => user._id);

  const [orders, pointsAgg, profiles, complaintAgg] = await Promise.all([
    Order.find({ user: { $in: userIds } })
      .select("_id user totalAmount status orderType createdAt simplifiedItems")
      .lean(),
    LoyaltyPoints.aggregate(buildLoyaltyPointsAggregation({ user: { $in: userIds } })),
    CustomerProfile.find({ user: { $in: userIds } })
      .select("user preferredOrderType")
      .lean(),
    Complaint.aggregate([
      { $match: { customer: { $in: userIds }, status: { $in: ["open", "in_progress"] } } },
      { $group: { _id: "$customer", openCount: { $sum: 1 } } },
    ]),
  ]);

  const ordersByUser = new Map();
  orders.forEach((order) => {
    const key = String(order.user);
    const bucket = ordersByUser.get(key) || [];
    bucket.push(order);
    ordersByUser.set(key, bucket);
  });

  const pointsByUser = new Map(pointsAgg.map((row) => [String(row._id), Number(row.points) || 0]));
  const profileByUser = new Map(profiles.map((row) => [String(row.user), row]));
  const complaintByUser = new Map(complaintAgg.map((row) => [String(row._id), Number(row.openCount) || 0]));

  let customers = users.map((user) => {
    const userKey = String(user._id);
    const userOrders = ordersByUser.get(userKey) || [];
    const loyaltyPoints = pointsByUser.get(userKey) || 0;
    const metrics = calculateCustomerMetrics({ orders: userOrders, loyaltyPoints });
    const hasOpenComplaint = (complaintByUser.get(userKey) || 0) > 0;
    return buildCrmCustomerFromUser({
      user,
      metrics: { ...metrics, needsFollowUp: metrics.needsFollowUp || hasOpenComplaint },
      profile: profileByUser.get(userKey) || null,
    });
  });

  if (status && ["active", "inactive", "vip"].includes(String(status).toLowerCase())) {
    const targetStatus = String(status).toLowerCase();
    customers = customers.filter((customer) => customer.status === targetStatus);
  }

  customers.sort(parseSortOption(sort));
  return customers;
};

export const getCrmCustomerById = async (customerId) => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) return null;

  const user = await User.findOne({ _id: customerId, role: "customer" })
    .select("_id name phone email createdAt allergyPreferences")
    .lean();
  if (!user) return null;

  const [orders, pointsAgg, profile, openComplaintsCount] = await Promise.all([
    Order.find({ user: user._id })
      .select("_id user totalAmount status orderType createdAt simplifiedItems")
      .sort({ createdAt: -1 })
      .lean(),
    LoyaltyPoints.aggregate(buildLoyaltyPointsAggregation({ user: user._id })),
    CustomerProfile.findOne({ user: user._id }).select("user preferredOrderType").lean(),
    Complaint.countDocuments({ customer: user._id, status: { $in: ["open", "in_progress"] } }),
  ]);

  const loyaltyPoints = pointsAgg?.[0]?.points || 0;
  const metrics = calculateCustomerMetrics({ orders, loyaltyPoints });
  const mergedMetrics = {
    ...metrics,
    needsFollowUp: metrics.needsFollowUp || openComplaintsCount > 0,
  };

  return buildCrmCustomerFromUser({ user, metrics: mergedMetrics, profile });
};

export const getCrmCustomerOrders = async (customerId) => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) return null;

  const user = await User.findOne({ _id: customerId, role: "customer" }).select("_id").lean();
  if (!user) return null;

  const orders = await Order.find({ user: user._id })
    .select("_id user status orderType createdAt totalAmount simplifiedItems")
    .sort({ createdAt: -1 })
    .lean();

  return orders.map(mapOrderToCrmOrder);
};

export const getCrmCustomerLoyaltyActivity = async (customerId) => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
  const user = await User.findOne({ _id: customerId, role: "customer" }).select("_id").lean();
  if (!user) return null;
  const activity = await LoyaltyPoints.find({ user: user._id })
    .select("_id user points transactionType description createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return activity.map(mapLoyaltyActivityToCrmActivity);
};

export const getCrmLoyaltyOverview = async () => {
  const customers = await getCrmCustomers({});
  const customerIds = customers.map((customer) => new mongoose.Types.ObjectId(customer.id));
  const activityDocs = await LoyaltyPoints.find({ user: { $in: customerIds } })
    .select("_id user points transactionType description createdAt")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  const activity = activityDocs.map(mapLoyaltyActivityToCrmActivity);
  const summary = calculateLoyaltySummary({ customers, activity });
  return { customers, activity, summary };
};

export const createCrmLoyaltyAdjustment = async ({ customerId, type, points, description, adminUser }) => {
  if (!customerId) return { error: "customerId is required", code: 400 };
  if (!mongoose.Types.ObjectId.isValid(customerId)) return { error: "Customer not found", code: 404 };

  const customer = await User.findOne({ _id: customerId, role: "customer" }).select("_id").lean();
  if (!customer) return { error: "Customer not found", code: 404 };

  const allowedTypes = new Set(["earned", "redeemed", "adjusted"]);
  const normalizedType = String(type || "").trim().toLowerCase();
  if (!allowedTypes.has(normalizedType)) {
    return { error: "type must be one of earned, redeemed, adjusted", code: 400 };
  }

  const numericPoints = Number(points);
  if (!Number.isFinite(numericPoints) || numericPoints <= 0) {
    return { error: "points must be a positive number", code: 400 };
  }

  const trimmedDescription = String(description || "").trim();
  if (!trimmedDescription) return { error: "description is required", code: 400 };

  const currentBalance = await getCustomerLoyaltyBalance(customer._id);
  if (normalizedType === "redeemed" && currentBalance - numericPoints < 0) {
    return { error: "Insufficient loyalty points for redemption", code: 400 };
  }

  const transactionType = normalizedType === "adjusted" ? "adjustment" : normalizedType;
  const nextBalance = normalizedType === "redeemed" ? currentBalance - numericPoints : currentBalance + numericPoints;

  const created = await LoyaltyPoints.create({
    user: customer._id,
    points: numericPoints,
    balance: Math.max(0, nextBalance),
    transactionType,
    description: trimmedDescription,
    createdBy: adminUser?._id || null,
    createdByName: String(adminUser?.name || "").trim() || "Admin",
  });

  const profileBalanceDelta = normalizedType === "redeemed" ? -numericPoints : numericPoints;
  await CustomerProfile.findOneAndUpdate(
    { user: customer._id },
    { $inc: { loyaltyPointsBalance: profileBalanceDelta } },
    { upsert: true }
  );

  return {
    activity: mapLoyaltyActivityToCrmActivity(created.toObject()),
    customer: {
      id: String(customer._id),
      loyaltyPoints: Math.max(0, nextBalance),
    },
  };
};

export const createCrmCustomer = async (payload, adminUser) => {
  const name = String(payload?.name || "").trim();
  const phone = String(payload?.phone || "").trim();
  const emailRaw = String(payload?.email || "").trim();
  const email = emailRaw ? emailRaw.toLowerCase() : "";
  const favoriteProduct = String(payload?.favoriteProduct || "").trim();
  const preferenceNotes = String(payload?.preferenceNotes || "").trim();
  const status = payload?.status ? String(payload.status).trim().toLowerCase() : "active";
  const needsFollowUp = payload?.needsFollowUp === true;
  const loyaltyPoints = payload?.loyaltyPoints === undefined ? 0 : Number(payload.loyaltyPoints);

  if (!name) return { error: "name is required", code: 400 };
  if (!phone) return { error: "phone is required", code: 400 };
  if (!Number.isFinite(loyaltyPoints) || loyaltyPoints < 0) {
    return { error: "loyaltyPoints must be a number greater than or equal to 0", code: 400 };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "email must be a valid email address", code: 400 };
  }
  if (!["active", "inactive", "vip"].includes(status)) {
    return { error: "status must be one of active, inactive, vip", code: 400 };
  }

  if (email) {
    const emailExists = await User.findOne({ email }).select("_id").lean();
    if (emailExists) return { error: "Email already exists", code: 409 };
  }

  const phoneExists = await User.findOne({ phone }).select("_id").lean();
  if (phoneExists) return { error: "Phone already exists", code: 409 };

  const generatedPassword = crypto.randomBytes(24).toString("hex");
  const hashedPassword = await bcrypt.hash(generatedPassword, 10);

  const createdUser = await User.create({
    name,
    email: email || undefined,
    phone,
    password: hashedPassword,
    role: "customer",
    isAdmin: false,
    allergyPreferences: {
      allergies: [],
      notes: preferenceNotes,
    },
  });

  await CustomerProfile.findOneAndUpdate(
    { user: createdUser._id },
    {
      $set: {
        crmFavoriteProduct: favoriteProduct,
        crmStatusOverride: status,
        crmNeedsFollowUp: needsFollowUp,
        loyaltyPointsBalance: loyaltyPoints,
      },
    },
    { upsert: true }
  );

  if (loyaltyPoints > 0) {
    await LoyaltyPoints.create({
      user: createdUser._id,
      points: loyaltyPoints,
      balance: loyaltyPoints,
      transactionType: "adjustment",
      description: "Initial CRM customer loyalty points seed",
      createdBy: adminUser?._id || null,
      createdByName: String(adminUser?.name || "").trim() || "Admin",
    });
  }

  const customer = await getCrmCustomerById(String(createdUser._id));
  if (!customer) return { error: "Customer created but could not be loaded", code: 500 };
  return { customer };
};

export const getCrmCustomerNotes = async (customerId) => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
  const user = await User.findOne({ _id: customerId, role: "customer" }).select("_id").lean();
  if (!user) return null;
  const notes = await CustomerNote.find({ customer: user._id })
    .select("_id customer text type createdByName createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return notes.map(mapNoteToCrmNote);
};

export const createCrmCustomerNote = async ({ customerId, text, type, adminUser }) => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) return { error: "Customer not found", code: 404 };
  const user = await User.findOne({ _id: customerId, role: "customer" }).select("_id").lean();
  if (!user) return { error: "Customer not found", code: 404 };

  const cleanedText = String(text || "").trim();
  if (!cleanedText) return { error: "text is required", code: 400 };

  const allowedTypes = ["general", "preference", "complaint", "follow_up"];
  const normalizedType = type ? String(type).trim() : "general";
  if (!allowedTypes.includes(normalizedType)) {
    return { error: "Invalid note type", code: 400 };
  }

  const created = await CustomerNote.create({
    customer: user._id,
    text: cleanedText,
    type: normalizedType,
    createdBy: adminUser?._id || null,
    createdByName: String(adminUser?.name || "").trim() || "Admin",
  });

  return { note: mapNoteToCrmNote(created.toObject()) };
};

const parseComplaintSort = (sort) => {
  switch (sort) {
    case "oldest":
      return { createdAt: 1 };
    case "status":
      return { status: 1, createdAt: -1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
};

export const getCrmComplaints = async ({ search = "", status, issueType, sort = "newest" }) => {
  const filter = {};
  if (status && ["open", "in_progress", "resolved"].includes(String(status))) {
    filter.status = String(status);
  }
  if (issueType && String(issueType).trim()) {
    filter.issueType = { $regex: String(issueType).trim(), $options: "i" };
  }

  const complaints = await Complaint.find(filter)
    .populate("customer", "name email phone")
    .populate("order", "_id")
    .sort(parseComplaintSort(sort))
    .lean();

  let filteredComplaints = complaints;
  if (search && String(search).trim()) {
    const q = String(search).trim().toLowerCase();
    filteredComplaints = complaints.filter((row) =>
      [
        String(row._id),
        row.customer?.name,
        row.customer?.email,
        row.customer?.phone,
        row.orderNumber,
        row.issueType,
        row.description,
        row.status,
        row.priority,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }
  if (sort === "customer") {
    filteredComplaints.sort((a, b) => {
      const aName = String(a.customer?.name || "");
      const bName = String(b.customer?.name || "");
      return aName.localeCompare(bName) || new Date(b.createdAt) - new Date(a.createdAt);
    });
  }
  const mapped = filteredComplaints.map(mapComplaintToCrmComplaint);
  return mapped;
};

export const createCrmComplaint = async ({
  customerId,
  orderId,
  issueType,
  description,
  priority,
  adminUser,
}) => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) return { error: "Customer not found", code: 404 };
  const customer = await User.findOne({ _id: customerId, role: "customer" })
    .select("_id name email phone")
    .lean();
  if (!customer) return { error: "Customer not found", code: 404 };

  const trimmedIssueType = String(issueType || "").trim();
  const trimmedDescription = String(description || "").trim();
  if (!trimmedIssueType) return { error: "issueType is required", code: 400 };
  if (!trimmedDescription) return { error: "description is required", code: 400 };

  const allowedPriority = ["low", "medium", "high"];
  const normalizedPriority = priority ? String(priority).trim() : "medium";
  if (!allowedPriority.includes(normalizedPriority)) return { error: "Invalid priority", code: 400 };

  let order = null;
  if (orderId !== undefined && orderId !== null && String(orderId).trim()) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) return { error: "Order not found", code: 404 };
    order = await Order.findById(orderId).select("_id createdAt").lean();
    if (!order) return { error: "Order not found", code: 404 };
  }

  const orderNumber = order
    ? `BR-${String(order._id).slice(-8).toUpperCase()}`
    : "";

  const created = await Complaint.create({
    customer: customer._id,
    order: order?._id || null,
    orderNumber,
    issueType: trimmedIssueType,
    description: trimmedDescription,
    priority: normalizedPriority,
    status: "open",
    createdBy: adminUser?._id || null,
  });

  const populated = await Complaint.findById(created._id)
    .populate("customer", "name email phone")
    .populate("order", "_id")
    .lean();

  return { complaint: mapComplaintToCrmComplaint(populated) };
};

export const updateCrmComplaintStatus = async ({ complaintId, status, resolutionNote }) => {
  if (!mongoose.Types.ObjectId.isValid(complaintId)) return { error: "Complaint not found", code: 404 };
  const allowed = ["open", "in_progress", "resolved"];
  const normalizedStatus = String(status || "").trim();
  if (!allowed.includes(normalizedStatus)) {
    return { error: "Invalid status", code: 400 };
  }

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) return { error: "Complaint not found", code: 404 };

  complaint.status = normalizedStatus;
  if (resolutionNote !== undefined) {
    complaint.resolutionNote = String(resolutionNote || "").trim();
  }
  if (normalizedStatus === "resolved") {
    complaint.resolvedAt = complaint.resolvedAt || new Date();
  } else {
    complaint.resolvedAt = null;
  }

  await complaint.save();
  const populated = await Complaint.findById(complaint._id)
    .populate("customer", "name email phone")
    .populate("order", "_id")
    .lean();
  return { complaint: mapComplaintToCrmComplaint(populated) };
};

export const getCrmCustomerComplaints = async (customerId) => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
  const user = await User.findOne({ _id: customerId, role: "customer" })
    .select("_id name email phone")
    .lean();
  if (!user) return null;

  const complaints = await Complaint.find({ customer: user._id })
    .populate("customer", "name email phone")
    .populate("order", "_id")
    .sort({ createdAt: -1 })
    .lean();

  return complaints.map(mapComplaintToCrmComplaint);
};

export const getCustomersForSegment = async (targetSegment) => {
  const segmentKey = normalizeSegmentKey(targetSegment);
  if (!segmentKey) return [];

  const customers = await getCrmCustomers({});
  const inactiveCutoff = Date.now() - THIRTY_DAYS_MS;

  return customers.filter((customer) => {
    const totalSpend = Number(customer.totalSpend) || 0;
    const totalOrders = Number(customer.totalOrders) || 0;
    const loyaltyPoints = Number(customer.loyaltyPoints) || 0;
    const status = String(customer.status || "").toLowerCase();
    const needsFollowUp = Boolean(customer.needsFollowUp);
    const lastOrderTime = customer.lastOrderDate ? new Date(customer.lastOrderDate).getTime() : null;
    const isOlderThan30Days = Number.isFinite(lastOrderTime) && lastOrderTime < inactiveCutoff;

    switch (segmentKey) {
      case "vip_customers":
        return status === "vip" || totalSpend >= 5000;
      case "active_customers":
        return status === "active";
      case "inactive_customers":
        return status === "inactive" || isOlderThan30Days;
      case "new_customers":
        return totalOrders <= 1;
      case "high_spenders":
        return totalSpend >= 3000;
      case "frequent_buyers":
        return totalOrders >= 5;
      case "needs_follow_up":
        return needsFollowUp;
      case "loyalty_champions":
        return loyaltyPoints >= 500;
      default:
        return false;
    }
  });
};

export const calculateCampaignRecipientCount = async (targetSegment) => {
  const recipients = await getCustomersForSegment(targetSegment);
  return recipients.length;
};

const parseCampaignSort = (sort) => {
  switch (sort) {
    case "oldest":
      return { createdAt: 1 };
    case "most_recipients":
      return { recipientCount: -1, createdAt: -1 };
    case "status":
      return { status: 1, createdAt: -1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
};

export const getCrmCampaigns = async ({ search = "", status, channel, sort = "newest" }) => {
  const filter = {};
  if (status && ["draft", "scheduled", "sent"].includes(String(status).trim().toLowerCase())) {
    filter.status = String(status).trim().toLowerCase();
  }
  if (channel && ["whatsapp", "sms", "email"].includes(String(channel).trim().toLowerCase())) {
    filter.channel = String(channel).trim().toLowerCase();
  }
  if (search && String(search).trim()) {
    const searchRegex = new RegExp(String(search).trim(), "i");
    filter.$or = [
      { name: searchRegex },
      { targetSegment: searchRegex },
      { couponCode: searchRegex },
      { message: searchRegex },
    ];
  }

  const campaigns = await Campaign.find(filter).sort(parseCampaignSort(sort)).lean();
  return campaigns.map(mapCampaignToCrmCampaign);
};

export const createCrmCampaign = async ({
  name,
  targetSegment,
  channel,
  message,
  couponCode,
  discountLabel,
  status,
  scheduledAt,
  adminUser,
}) => {
  const cleanedName = String(name || "").trim();
  if (!cleanedName) return { error: "name is required", code: 400 };

  const normalizedSegment = normalizeSegmentKey(targetSegment);
  if (!normalizedSegment) return { error: "targetSegment is invalid", code: 400 };

  const normalizedChannel = String(channel || "").trim().toLowerCase();
  if (!["whatsapp", "sms", "email"].includes(normalizedChannel)) {
    return { error: "channel must be one of whatsapp, sms, email", code: 400 };
  }

  const cleanedMessage = String(message || "").trim();
  if (!cleanedMessage) return { error: "message is required", code: 400 };

  const normalizedStatus = status ? String(status).trim().toLowerCase() : "draft";
  if (!["draft", "scheduled", "sent"].includes(normalizedStatus)) {
    return { error: "status must be one of draft, scheduled, sent", code: 400 };
  }

  let normalizedScheduledAt = null;
  if (scheduledAt !== undefined && scheduledAt !== null && String(scheduledAt).trim()) {
    const parsed = new Date(scheduledAt);
    if (Number.isNaN(parsed.getTime())) return { error: "scheduledAt must be a valid date", code: 400 };
    normalizedScheduledAt = parsed;
  }

  const recipientCount = await calculateCampaignRecipientCount(normalizedSegment);
  const payload = {
    name: cleanedName,
    targetSegment: normalizedSegment,
    channel: normalizedChannel,
    message: cleanedMessage,
    couponCode: String(couponCode || "").trim(),
    discountLabel: String(discountLabel || "").trim(),
    status: normalizedStatus,
    scheduledAt: normalizedScheduledAt,
    sentAt: normalizedStatus === "sent" ? new Date() : null,
    recipientCount,
    createdBy: adminUser?._id || null,
    createdByName: String(adminUser?.name || "").trim() || "Admin",
  };

  const created = await Campaign.create(payload);
  return { campaign: mapCampaignToCrmCampaign(created.toObject()) };
};

export const updateCrmCampaignStatus = async ({ campaignId, status, scheduledAt }) => {
  if (!mongoose.Types.ObjectId.isValid(campaignId)) return { error: "Campaign not found", code: 404 };

  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (!["draft", "scheduled", "sent"].includes(normalizedStatus)) {
    return { error: "status must be one of draft, scheduled, sent", code: 400 };
  }

  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return { error: "Campaign not found", code: 404 };

  campaign.status = normalizedStatus;
  if (normalizedStatus === "scheduled") {
    if (scheduledAt !== undefined) {
      if (scheduledAt === null || String(scheduledAt).trim() === "") {
        campaign.scheduledAt = null;
      } else {
        const parsed = new Date(scheduledAt);
        if (Number.isNaN(parsed.getTime())) return { error: "scheduledAt must be a valid date", code: 400 };
        campaign.scheduledAt = parsed;
      }
    }
  } else if (normalizedStatus === "draft") {
    campaign.sentAt = null;
  } else if (normalizedStatus === "sent") {
    campaign.sentAt = campaign.sentAt || new Date();
  }

  if (normalizedStatus !== "sent") {
    campaign.sentAt = null;
  }

  await campaign.save();
  return { campaign: mapCampaignToCrmCampaign(campaign.toObject()) };
};

export const duplicateCrmCampaign = async ({ campaignId, adminUser }) => {
  if (!mongoose.Types.ObjectId.isValid(campaignId)) return { error: "Campaign not found", code: 404 };
  const original = await Campaign.findById(campaignId).lean();
  if (!original) return { error: "Campaign not found", code: 404 };

  const recipientCount = await calculateCampaignRecipientCount(original.targetSegment);
  const created = await Campaign.create({
    name: `${String(original.name || "").trim()} Copy`.trim(),
    targetSegment: original.targetSegment,
    channel: original.channel,
    message: original.message,
    couponCode: original.couponCode || "",
    discountLabel: original.discountLabel || "",
    status: "draft",
    scheduledAt: null,
    sentAt: null,
    recipientCount,
    createdBy: adminUser?._id || null,
    createdByName: String(adminUser?.name || "").trim() || "Admin",
  });

  return { campaign: mapCampaignToCrmCampaign(created.toObject()) };
};

export const getCrmCampaignRecipients = async (campaignId) => {
  if (!mongoose.Types.ObjectId.isValid(campaignId)) return { error: "Campaign not found", code: 404 };
  const campaign = await Campaign.findById(campaignId).lean();
  if (!campaign) return { error: "Campaign not found", code: 404 };

  const recipients = await getCustomersForSegment(campaign.targetSegment);
  return {
    segment: {
      key: normalizeSegmentKey(campaign.targetSegment) || campaign.targetSegment,
      label: getSegmentLabel(campaign.targetSegment),
    },
    recipientCount: recipients.length,
    recipients: recipients.map(mapCustomerToCampaignRecipient),
  };
};
