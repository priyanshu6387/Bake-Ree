const LEGACY_TO_CANONICAL_STATUS = {
  Pending: "PENDING",
  Preparing: "PREPARING",
  Ready: "READY_FOR_HANDOFF",
  Delivered: "DELIVERED",
  Cancelled: "CANCELLED",
  Hold: "HOLD",
  HOLD: "HOLD",
};

export const ORDER_STATUSES = {
  APPROVAL_PENDING: "APPROVAL_PENDING",
  PENDING: "PENDING",
  PREPARING: "PREPARING",
  READY_FOR_HANDOFF: "READY_FOR_HANDOFF",
  DISPATCH_ASSIGNED: "DISPATCH_ASSIGNED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  PICKUP_READY: "PICKUP_READY",
  PICKED_UP: "PICKED_UP",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  HOLD: "HOLD",
  CANCELLED: "CANCELLED",
};

export const ACTIVE_ORDER_STATUSES = [
  ORDER_STATUSES.APPROVAL_PENDING,
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.READY_FOR_HANDOFF,
  ORDER_STATUSES.DISPATCH_ASSIGNED,
  ORDER_STATUSES.OUT_FOR_DELIVERY,
  ORDER_STATUSES.PICKUP_READY,
  ORDER_STATUSES.PICKED_UP,
  ORDER_STATUSES.HOLD,
];

const TRANSITIONS = {
  [ORDER_STATUSES.APPROVAL_PENDING]: new Set([
    ORDER_STATUSES.PENDING,
    ORDER_STATUSES.CANCELLED,
  ]),
  [ORDER_STATUSES.PENDING]: new Set([
    ORDER_STATUSES.PREPARING,
    ORDER_STATUSES.HOLD,
    ORDER_STATUSES.CANCELLED,
  ]),
  [ORDER_STATUSES.PREPARING]: new Set([
    ORDER_STATUSES.READY_FOR_HANDOFF,
    ORDER_STATUSES.HOLD,
    ORDER_STATUSES.CANCELLED,
  ]),
  [ORDER_STATUSES.HOLD]: new Set([
    ORDER_STATUSES.PREPARING,
    ORDER_STATUSES.CANCELLED,
  ]),
  [ORDER_STATUSES.READY_FOR_HANDOFF]: new Set([
    ORDER_STATUSES.DISPATCH_ASSIGNED,
    ORDER_STATUSES.PICKUP_READY,
  ]),
  [ORDER_STATUSES.DISPATCH_ASSIGNED]: new Set([
    ORDER_STATUSES.OUT_FOR_DELIVERY,
    ORDER_STATUSES.DELIVERED,
  ]),
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: new Set([
    ORDER_STATUSES.DELIVERED,
  ]),
  [ORDER_STATUSES.PICKUP_READY]: new Set([
    ORDER_STATUSES.PICKED_UP,
    ORDER_STATUSES.CANCELLED,
  ]),
  [ORDER_STATUSES.PICKED_UP]: new Set([
    ORDER_STATUSES.DELIVERED,
  ]),
  [ORDER_STATUSES.DELIVERED]: new Set([
    ORDER_STATUSES.COMPLETED,
  ]),
  [ORDER_STATUSES.COMPLETED]: new Set(),
  [ORDER_STATUSES.CANCELLED]: new Set(),
};

export const normalizeOrderStatus = (status) => {
  if (!status) return status;
  if (LEGACY_TO_CANONICAL_STATUS[status]) return LEGACY_TO_CANONICAL_STATUS[status];
  return status;
};

export const canTransition = ({ fromStatus, toStatus, orderType }) => {
  const from = normalizeOrderStatus(fromStatus);
  const to = normalizeOrderStatus(toStatus);

  if (!from || !to) return false;
  if (from === to) return true;

  const allowed = TRANSITIONS[from];
  if (!allowed || !allowed.has(to)) return false;

  if (from === ORDER_STATUSES.READY_FOR_HANDOFF) {
    if (orderType === "Delivery" && to !== ORDER_STATUSES.DISPATCH_ASSIGNED) {
      return false;
    }
    if (orderType === "Pickup" && to !== ORDER_STATUSES.PICKUP_READY) {
      return false;
    }
  }

  return true;
};

export const actionToStatus = ({ action, orderType }) => {
  switch (action) {
    case "START_PREPARING":
      return ORDER_STATUSES.PREPARING;
    case "MARK_READY_FOR_HANDOFF":
      return ORDER_STATUSES.READY_FOR_HANDOFF;
    case "ASSIGN_DISPATCH":
      return ORDER_STATUSES.DISPATCH_ASSIGNED;
    case "MARK_OUT_FOR_DELIVERY":
      return ORDER_STATUSES.OUT_FOR_DELIVERY;
    case "MARK_PICKUP_READY":
      return ORDER_STATUSES.PICKUP_READY;
    case "MARK_PICKED_UP":
      return ORDER_STATUSES.PICKED_UP;
    case "MARK_DELIVERED":
      return ORDER_STATUSES.DELIVERED;
    case "MARK_COMPLETED":
      return ORDER_STATUSES.COMPLETED;
    case "HOLD":
      return ORDER_STATUSES.HOLD;
    case "RESUME_FROM_HOLD":
      return ORDER_STATUSES.PREPARING;
    case "CANCEL":
      return ORDER_STATUSES.CANCELLED;
    case "AUTO_NEXT":
      if (orderType === "Delivery") return ORDER_STATUSES.DISPATCH_ASSIGNED;
      return ORDER_STATUSES.PICKUP_READY;
    default:
      return null;
  }
};

export const isActiveOrderStatus = (status) =>
  ACTIVE_ORDER_STATUSES.includes(normalizeOrderStatus(status));

export const canonicalizeOrderStatusForClient = (status) => {
  const canonical = normalizeOrderStatus(status);

  const map = {
    APPROVAL_PENDING: "Approval Pending",
    PENDING: "Pending",
    PREPARING: "Preparing",
    READY_FOR_HANDOFF: "Ready",
    DISPATCH_ASSIGNED: "Dispatch Assigned",
    OUT_FOR_DELIVERY: "Out for Delivery",
    PICKUP_READY: "Pickup Ready",
    PICKED_UP: "Picked Up",
    DELIVERED: "Delivered",
    COMPLETED: "Completed",
    HOLD: "Hold",
    CANCELLED: "Cancelled",
  };

  return map[canonical] || canonical;
};

export const statusDisplayMap = {
  APPROVAL_PENDING: "Approval Pending",
  PENDING: "Pending",
  PREPARING: "Preparing",
  READY_FOR_HANDOFF: "Ready",
  DISPATCH_ASSIGNED: "Dispatch Assigned",
  OUT_FOR_DELIVERY: "Out for Delivery",
  PICKUP_READY: "Pickup Ready",
  PICKED_UP: "Picked Up",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  HOLD: "Hold",
  CANCELLED: "Cancelled",
};
