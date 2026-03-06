import { create } from "zustand";

export type KitchenOrderStatus =
  | "PENDING"
  | "PREPARING"
  | "READY"
  | "HANDOFF_REQUESTED"
  | "DISPATCH_ASSIGNED"
  | "HOLD"
  | "COMPLETED";

export type KitchenOrderPriority = "NORMAL" | "RUSH" | "VIP";
export type KitchenStation = "OVEN" | "FRYER" | "BEVERAGE" | "PACKING" | "UNASSIGNED";
export type KitchenOrderType = "DELIVERY" | "PICKUP";

export type KitchenOrderItem = {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  allergens?: string[];
};

export type KitchenOrder = {
  id: string;
  backendStatus?: string;
  status: KitchenOrderStatus;
  createdAt: string;
  updatedAt: string;
  orderType: KitchenOrderType;
  priority: KitchenOrderPriority;
  station: KitchenStation;
  assignedTo?: string | null;
  customerName?: string;
  items: KitchenOrderItem[];
  specialInstructions?: string;
  allergens?: string[];
  allergyNotes?: string;
  delivery: {
    address: string;
    zone: string;
    eta?: string;
  };
  flags?: {
    needsAdmin?: boolean;
    lowStockImpact?: boolean;
    delayRisk?: boolean;
  };
  hold?: {
    reason: string;
    severity: "INFO" | "WARNING" | "CRITICAL";
    notes?: string;
  } | null;
};

export type StockAlertStatus = "OPEN" | "ACK" | "IN_PROGRESS" | "RESOLVED";
export type StockActionType = "REFILL" | "PURCHASE";

export type StockAlert = {
  id: string;
  item: string;
  qtyRemaining: number;
  unit: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
  note?: string;
  status: StockAlertStatus;
  actionType?: StockActionType | null;
  acknowledgedBy?: string | null;
  affectedOrderIds?: string[];
  createdAt: string;
};

export type OrderIssueAlert = {
  id: string;
  orderId: string;
  reason: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  notes?: string;
  createdAt: string;
  targetRole: "ADMIN";
};

export type DispatchRequest = {
  id: string;
  orderId: string;
  type: KitchenOrderType;
  packingRequired: boolean;
  expectedPickupTime?: string;
  notifyAdmin: boolean;
  notifyDelivery: boolean;
  notes?: string;
  status: "REQUESTED" | "ASSIGNED" | "COMPLETED";
  assignee?: string | null;
  createdAt: string;
};

export type KitchenMessage = {
  id: string;
  orderId?: string;
  body: string;
  sender: string;
  targetRole: "ADMIN" | "DELIVERY" | "KITCHEN";
  createdAt: string;
  template?: string;
};

export type OrderThreadMessage = {
  id: string;
  sender: string;
  body: string;
  createdAt: string;
};

export type OrderThread = {
  orderId: string;
  messages: OrderThreadMessage[];
};

type KitchenStore = {
  orders: KitchenOrder[];
  stockAlerts: StockAlert[];
  orderIssueAlerts: OrderIssueAlert[];
  dispatchRequests: DispatchRequest[];
  messages: KitchenMessage[];
  orderThreads: OrderThread[];
  setOrderStatus: (
    orderId: string,
    status: KitchenOrderStatus,
    hold?: KitchenOrder["hold"]
  ) => void;
  createStockAlert: (payload: Omit<StockAlert, "id" | "status" | "createdAt">) => void;
  createOrderIssueAlert: (payload: Omit<OrderIssueAlert, "id" | "createdAt" | "targetRole">) => void;
  createDispatchRequest: (payload: Omit<DispatchRequest, "id" | "status" | "createdAt">) => void;
  assignDispatch: (orderId: string, assignee: string) => void;
  resolveAlert: (alertId: string) => void;
  acknowledgeAlert: (alertId: string, acknowledgedBy?: string) => void;
  setAlertActionType: (alertId: string, actionType: StockActionType) => void;
  sendPing: (payload: Omit<KitchenMessage, "id" | "createdAt" | "sender"> & { sender?: string }) => void;
  addOrderMessage: (orderId: string, message: Omit<OrderThreadMessage, "id" | "createdAt">) => void;
};

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const nowIso = () => new Date().toISOString();

const initialOrders: KitchenOrder[] = [
  {
    id: "BR-1042",
    status: "PENDING",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    orderType: "DELIVERY",
    priority: "RUSH",
    station: "OVEN",
    assignedTo: null,
    customerName: "Leah Patel",
    items: [
      { id: "it-1", name: "Sourdough Loaf", quantity: 2, notes: "Extra crust" },
      { id: "it-2", name: "Almond Croissant", quantity: 4, allergens: ["nuts", "dairy"] },
    ],
    specialInstructions: "Use paper wrap, no plastic.",
    allergens: ["nuts"],
    delivery: { address: "12 Orchard Lane", zone: "North", eta: "45-55 min" },
    flags: { needsAdmin: false, lowStockImpact: true, delayRisk: true },
    hold: null,
  },
  {
    id: "BR-1043",
    status: "PREPARING",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    orderType: "PICKUP",
    priority: "NORMAL",
    station: "BEVERAGE",
    assignedTo: "Me",
    customerName: "Omari Jones",
    items: [
      { id: "it-3", name: "Matcha Latte", quantity: 2 },
      { id: "it-4", name: "Berry Tart", quantity: 1, allergens: ["dairy"] },
    ],
    specialInstructions: "Pickup counter - call on arrival.",
    delivery: { address: "Pickup Counter", zone: "Store", eta: "15 min" },
    flags: { needsAdmin: false, lowStockImpact: false, delayRisk: false },
    hold: null,
  },
  {
    id: "BR-1044",
    status: "READY",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    orderType: "DELIVERY",
    priority: "VIP",
    station: "PACKING",
    assignedTo: "Me",
    customerName: "Harper Chen",
    items: [
      { id: "it-5", name: "Celebration Cake", quantity: 1, notes: "Gold ribbon" },
    ],
    specialInstructions: "Handle with care. Fragile topper.",
    delivery: { address: "88 Market Street", zone: "Central", eta: "30 min" },
    flags: { needsAdmin: true, lowStockImpact: false, delayRisk: false },
    hold: null,
  },
  {
    id: "BR-1045",
    status: "HANDOFF_REQUESTED",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    orderType: "DELIVERY",
    priority: "NORMAL",
    station: "PACKING",
    assignedTo: "Me",
    customerName: "Ava Singh",
    items: [
      { id: "it-6", name: "Brioche Buns", quantity: 12 },
      { id: "it-7", name: "Vanilla Eclairs", quantity: 6, allergens: ["dairy", "eggs"] },
    ],
    specialInstructions: "Include napkins.",
    delivery: { address: "201 Pine Avenue", zone: "East", eta: "50-60 min" },
    flags: { needsAdmin: false, lowStockImpact: false, delayRisk: true },
    hold: null,
  },
  {
    id: "BR-1046",
    status: "HOLD",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    orderType: "PICKUP",
    priority: "NORMAL",
    station: "FRYER",
    assignedTo: null,
    customerName: "Nia Clark",
    items: [{ id: "it-8", name: "Cinnamon Donuts", quantity: 8 }],
    specialInstructions: "Less sugar coating.",
    delivery: { address: "Pickup Counter", zone: "Store", eta: "25 min" },
    flags: { needsAdmin: true, lowStockImpact: false, delayRisk: true },
    hold: { reason: "Equipment issue", severity: "WARNING", notes: "Fryer temp unstable" },
  },
];

export const useKitchenStore = create<KitchenStore>((set) => ({
  orders: initialOrders,
  stockAlerts: [
    {
      id: "alert-1",
      item: "Whole milk",
      qtyRemaining: 3,
      unit: "liters",
      severity: "HIGH",
      reason: "Morning rush depletion",
      note: "Need refill before noon",
      status: "OPEN",
      actionType: "REFILL",
      acknowledgedBy: null,
      affectedOrderIds: ["BR-1043"],
      createdAt: nowIso(),
    },
  ],
  orderIssueAlerts: [],
  dispatchRequests: [
    {
      id: "dispatch-1",
      orderId: "BR-1045",
      type: "DELIVERY",
      packingRequired: true,
      expectedPickupTime: "30 min",
      notifyAdmin: true,
      notifyDelivery: true,
      notes: "Fragile packaging",
      status: "REQUESTED",
      assignee: null,
      createdAt: nowIso(),
    },
  ],
  messages: [
    {
      id: "msg-1",
      body: "READY for dispatch: BR-1044",
      sender: "Kitchen",
      targetRole: "DELIVERY",
      createdAt: nowIso(),
      template: "READY for dispatch",
    },
  ],
  orderThreads: [
    {
      orderId: "BR-1042",
      messages: [
        {
          id: "thread-1",
          sender: "Kitchen",
          body: "Waiting on almond croissant bake time update.",
          createdAt: nowIso(),
        },
      ],
    },
  ],
  setOrderStatus: (orderId, status, hold) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
              updatedAt: nowIso(),
              hold: status === "HOLD" ? hold ?? order.hold : null,
            }
          : order
      ),
    })),
  createStockAlert: (payload) =>
    set((state) => ({
      stockAlerts: [
        {
          ...payload,
          id: createId("alert"),
          status: "OPEN",
          createdAt: nowIso(),
        },
        ...state.stockAlerts,
      ],
    })),
  createOrderIssueAlert: (payload) =>
    set((state) => ({
      orderIssueAlerts: [
        {
          ...payload,
          id: createId("issue"),
          createdAt: nowIso(),
          targetRole: "ADMIN",
        },
        ...state.orderIssueAlerts,
      ],
    })),
  createDispatchRequest: (payload) =>
    set((state) => ({
      dispatchRequests: [
        {
          ...payload,
          id: createId("dispatch"),
          status: "REQUESTED",
          createdAt: nowIso(),
        },
        ...state.dispatchRequests,
      ],
    })),
  assignDispatch: (orderId, assignee) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? { ...order, status: "DISPATCH_ASSIGNED", updatedAt: nowIso() }
          : order
      ),
      dispatchRequests: state.dispatchRequests.map((request) =>
        request.orderId === orderId
          ? { ...request, status: "ASSIGNED", assignee }
          : request
      ),
    })),
  resolveAlert: (alertId) =>
    set((state) => ({
      stockAlerts: state.stockAlerts.map((alert) =>
        alert.id === alertId ? { ...alert, status: "RESOLVED" } : alert
      ),
    })),
  acknowledgeAlert: (alertId, acknowledgedBy) =>
    set((state) => ({
      stockAlerts: state.stockAlerts.map((alert) =>
        alert.id === alertId
          ? { ...alert, status: "ACK", acknowledgedBy: acknowledgedBy ?? "Admin" }
          : alert
      ),
    })),
  setAlertActionType: (alertId, actionType) =>
    set((state) => ({
      stockAlerts: state.stockAlerts.map((alert) =>
        alert.id === alertId ? { ...alert, actionType, status: "IN_PROGRESS" } : alert
      ),
    })),
  sendPing: (payload) =>
    set((state) => ({
      messages: [
        {
          ...payload,
          id: createId("ping"),
          createdAt: nowIso(),
          sender: payload.sender ?? "Kitchen",
        },
        ...state.messages,
      ],
    })),
  addOrderMessage: (orderId, message) =>
    set((state) => ({
      orderThreads: state.orderThreads.some((thread) => thread.orderId === orderId)
        ? state.orderThreads.map((thread) =>
            thread.orderId === orderId
              ? {
                  ...thread,
                  messages: [
                    {
                      ...message,
                      id: createId("thread"),
                      createdAt: nowIso(),
                    },
                    ...thread.messages,
                  ],
                }
              : thread
          )
        : [
            {
              orderId,
              messages: [
                {
                  ...message,
                  id: createId("thread"),
                  createdAt: nowIso(),
                },
              ],
            },
            ...state.orderThreads,
          ],
    })),
}));
