export type CustomerStatus = "active" | "inactive" | "vip";

export type ComplaintStatus = "open" | "in_progress" | "resolved";

export type CrmOrderStatus = "placed" | "confirmed" | "delivered" | "cancelled";

export type CrmOrderChannel = "delivery" | "pickup";

export type CrmNoteType = "general" | "preference" | "complaint" | "follow_up";

export type LoyaltyActivityType = "earned" | "redeemed" | "adjusted";
export type CrmLoyaltyActivityType = LoyaltyActivityType;
export type CampaignChannel = "whatsapp" | "sms" | "email";
export type CampaignStatus = "draft" | "scheduled" | "sent";
export type CrmSegmentKey =
  | "vip_customers"
  | "active_customers"
  | "inactive_customers"
  | "new_customers"
  | "high_spenders"
  | "frequent_buyers"
  | "needs_follow_up"
  | "loyalty_champions"
  | "manual_customer";

export type CrmCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate: string;
  loyaltyPoints: number;
  status: CustomerStatus;
  favoriteProduct: string;
  needsFollowUp: boolean;
  createdAt: string;
  preferredOrderChannel?: CrmOrderChannel;
  preferenceNotes?: string;
  topPurchasedProducts?: string[];
};

export type CrmCustomerCreatePayload = {
  name: string;
  phone: string;
  email?: string;
  favoriteProduct?: string;
  loyaltyPoints?: number;
  status?: CustomerStatus;
  needsFollowUp?: boolean;
  preferenceNotes?: string;
};

export type CrmComplaint = {
  id: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  orderNumber?: string;
  issueType: string;
  description: string;
  status: ComplaintStatus;
  priority?: "low" | "medium" | "high";
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
};

export type CrmCustomerOrder = {
  id: string;
  customerId: string;
  orderNumber: string;
  date: string;
  itemsSummary: string;
  status: CrmOrderStatus;
  amount: number;
  channel: CrmOrderChannel;
};

export type CrmCustomerNote = {
  id: string;
  customerId: string;
  text: string;
  type: CrmNoteType;
  createdBy: string;
  createdAt: string;
};

export type CrmLoyaltyActivity = {
  id: string;
  customerId: string;
  type: CrmLoyaltyActivityType;
  points: number;
  description: string;
  createdAt: string;
};

export type CrmLoyaltySummary = {
  totalLoyaltyCustomers: number;
  totalActivePoints: number;
  pointsEarned: number;
  pointsRedeemed: number;
  loyaltyChampions: number;
  averagePointsPerCustomer: number;
};

export type CrmLoyaltyAdjustmentPayload = {
  customerId: string;
  type: LoyaltyActivityType;
  points: number;
  description: string;
};

export type CrmLoyaltyAdjustmentResult = {
  activity: CrmLoyaltyActivity;
  customer: {
    id: string;
    loyaltyPoints: number;
  };
};

export type CrmCampaign = {
  id: string;
  name: string;
  targetSegment: CrmSegmentKey;
  targetSegmentLabel?: string;
  channel: CampaignChannel;
  message: string;
  couponCode?: string;
  discountLabel?: string;
  status: CampaignStatus;
  recipientCount: number;
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  recipientCustomerId?: string;
  recipientCustomerName?: string;
};

export type CrmCampaignRecipient = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  totalSpend: number;
  loyaltyPoints: number;
};

export type CrmKpi = {
  label:
    | "Total Customers"
    | "Active Customers"
    | "Inactive Customers"
    | "VIP Customers"
    | "Repeat Order Rate"
    | "Average Order Value"
    | "CRM Revenue"
    | "Open Complaints";
  value: number;
};
