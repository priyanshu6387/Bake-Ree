import http from "@/services/http";

export type OrderLifecycleStatus =
  | "APPROVAL_PENDING"
  | "PENDING"
  | "PREPARING"
  | "READY_FOR_HANDOFF"
  | "DISPATCH_ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "PICKUP_READY"
  | "PICKED_UP"
  | "DELIVERED"
  | "COMPLETED"
  | "HOLD"
  | "CANCELLED";

export type ApiOrder = {
  _id: string;
  status: string;
  orderType: "Delivery" | "Pickup";
  priority?: "NORMAL" | "RUSH" | "VIP";
  station?: "OVEN" | "FRYER" | "BEVERAGE" | "PACKING" | "UNASSIGNED";
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryTime?: string | null;
  specialInstructions?: string;
  allergies?: string[];
  allergyNotes?: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    _id?: string;
    quantity: number;
    price: number;
    product?: {
      _id?: string;
      name?: string;
      image?: string;
      price?: number;
    };
  }>;
  approval?: {
    required?: boolean;
    status?: "PENDING" | "APPROVED" | "REJECTED" | "NOT_REQUIRED";
    reason?: string;
    approvedAt?: string | null;
    rejectedAt?: string | null;
  };
  assignedKitchenStaff?: {
    _id?: string;
    name?: string;
    email?: string;
  } | null;
  deliveryAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    landmark?: string;
    recipientName?: string;
    phone?: string;
  } | null;
  hold?: {
    reason?: string;
    severity?: "INFO" | "WARNING" | "CRITICAL";
    notes?: string;
    resolvedAt?: string | null;
  };
};

export type OpsLiveOrder = ApiOrder & {
  ageMinutes: number;
  slaTargetMinutes: number;
  slaBreached: boolean;
};

export type OpsSummary = {
  totalActive: number;
  approvalPending: number;
  requestsOpen: number;
  byStatus: Record<string, number>;
};

export type OpsSlaRow = {
  orderId: string;
  orderCode: string;
  customer: string;
  status: string;
  orderType: "Delivery" | "Pickup";
  createdAt: string;
  ageMinutes: number;
  slaTargetMinutes: number;
  slackMinutes: number;
  breached: boolean;
};

export type OrderRequest = {
  _id: string;
  order: ApiOrder | string;
  type: "ISSUE" | "RETURN" | "REFUND";
  status: "OPEN" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "RESOLVED" | "REFUNDED";
  reason: string;
  description?: string;
  reviewNotes?: string;
  resolutionNotes?: string;
  refundAmount?: number;
  requestedBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
  reviewedBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
  resolvedBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export const OrdersAPI = {
  getMyOrders: async () => {
    const { data } = await http.get<ApiOrder[]>("/orders/my-orders");
    return data;
  },

  getOrderById: async (orderId: string) => {
    const { data } = await http.get<ApiOrder>(`/orders/${orderId}`);
    return data;
  },

  getKitchenOrders: async () => {
    const { data } = await http.get<ApiOrder[]>("/orders/kitchen");
    return data;
  },

  approveOrder: async (orderId: string, decision: "APPROVE" | "REJECT", reason = "") => {
    const { data } = await http.patch<ApiOrder>(`/orders/${orderId}/approve`, {
      decision,
      reason,
    });
    return data;
  },

  transitionOrder: async (
    orderId: string,
    payload: {
      status?: OrderLifecycleStatus;
      action?: string;
      notes?: string;
      hold?: {
        reason: string;
        severity?: "INFO" | "WARNING" | "CRITICAL";
        notes?: string;
      };
    }
  ) => {
    const { data } = await http.patch<ApiOrder>(`/orders/${orderId}/lifecycle`, payload);
    return data;
  },

  getOpsLive: async () => {
    const { data } = await http.get<OpsLiveOrder[]>("/orders/ops/live");
    return data;
  },

  getOpsSummary: async () => {
    const { data } = await http.get<OpsSummary>("/orders/ops/summary");
    return data;
  },

  getOpsSla: async () => {
    const { data } = await http.get<OpsSlaRow[]>("/orders/ops/sla");
    return data;
  },

  getOpsRefunds: async (params?: { status?: string; type?: string }) => {
    const { data } = await http.get<OrderRequest[]>("/orders/ops/refunds", { params });
    return data;
  },

  getOrderRequests: async (orderId: string) => {
    const { data } = await http.get<OrderRequest[]>(`/orders/${orderId}/requests`);
    return data;
  },

  createOrderRequest: async (
    orderId: string,
    payload: {
      type: "ISSUE" | "RETURN" | "REFUND";
      reason: string;
      description?: string;
      refundAmount?: number;
    }
  ) => {
    const { data } = await http.post<OrderRequest>(`/orders/${orderId}/requests`, payload);
    return data;
  },

  getAllOrderRequests: async (params?: { status?: string; type?: string }) => {
    const { data } = await http.get<OrderRequest[]>("/orders/requests", { params });
    return data;
  },

  reviewOrderRequest: async (
    requestId: string,
    payload: {
      decision: "APPROVE" | "REJECT" | "REVIEW";
      reviewNotes?: string;
      refundAmount?: number;
    }
  ) => {
    const { data } = await http.patch<OrderRequest>(`/orders/requests/${requestId}/review`, payload);
    return data;
  },

  resolveOrderRequest: async (
    requestId: string,
    payload: {
      status: "RESOLVED" | "REFUNDED";
      resolutionNotes?: string;
    }
  ) => {
    const { data } = await http.patch<OrderRequest>(`/orders/requests/${requestId}/resolve`, payload);
    return data;
  },
};

export default OrdersAPI;
