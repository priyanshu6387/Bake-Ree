"use client";

import clsx from "clsx";
import { BsClock, BsPersonFill, BsExclamationTriangle } from "react-icons/bs";
import { FiUser } from "react-icons/fi";
import type { KitchenOrder } from "@/store/kitchenStore";
import OrderTimeline from "./OrderTimeline";
import ActionsMenu from "./ActionsMenu";

const statusStyles: Record<string, string> = {
  PENDING: "text-amber-700",
  PREPARING: "text-orange-700",
  READY: "text-emerald-700",
  HANDOFF_REQUESTED: "text-sky-700",
  DISPATCH_ASSIGNED: "text-indigo-700",
  HOLD: "text-rose-700",
  COMPLETED: "text-slate-600",
};

const borderStyles: Record<string, string> = {
  PENDING: "border-amber-200/80",
  PREPARING: "border-orange-200/80",
  READY: "border-emerald-200/80",
  HANDOFF_REQUESTED: "border-sky-200/80",
  DISPATCH_ASSIGNED: "border-indigo-200/80",
  HOLD: "border-rose-200/80",
  COMPLETED: "border-slate-200/80",
};

const accentStyles: Record<string, string> = {
  PENDING: "border-l-amber-400/70",
  PREPARING: "border-l-orange-400/70",
  READY: "border-l-emerald-400/70",
  HANDOFF_REQUESTED: "border-l-sky-400/70",
  DISPATCH_ASSIGNED: "border-l-indigo-400/70",
  HOLD: "border-l-rose-400/70",
  COMPLETED: "border-l-slate-400/70",
};

type OrderCardProps = {
  order: KitchenOrder;
  onStart: (orderId: string) => void;
  onReady: (orderId: string) => void;
  onHandoff: (orderId: string) => void;
  onHold: (orderId: string) => void;
  onPing: (orderId: string) => void;
  onPrint: (orderId: string) => void;
  onView: (orderId: string) => void;
  onAssignDispatch: (orderId: string) => void;
  onComplete: (orderId: string) => void;
};

export default function OrderCard({
  order,
  onStart,
  onReady,
  onHandoff,
  onHold,
  onPing,
  onPrint,
  onView,
  onAssignDispatch,
  onComplete,
}: OrderCardProps) {
  const displayCode =
    order.id.length >= 8 ? order.id.slice(-8).toUpperCase() : order.id;
  const minutesElapsed = Math.max(
    0,
    Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
  );

  const primaryAction = (() => {
    if (order.status === "PENDING") return { label: "Start", onClick: () => onStart(order.id) };
    if (order.status === "PREPARING") return { label: "Ready", onClick: () => onReady(order.id) };
    if (order.status === "READY") return { label: "Handoff", onClick: () => onHandoff(order.id) };
    return { label: "View", onClick: () => onView(order.id) };
  })();

  const actions = [
    { label: "View details", onClick: () => onView(order.id) },
    { label: "Hold", onClick: () => onHold(order.id), tone: "danger" as const },
    { label: "Ping admin", onClick: () => onPing(order.id) },
    { label: "Print KOT", onClick: () => onPrint(order.id) },
  ];

  if (order.status === "HANDOFF_REQUESTED" || order.status === "DISPATCH_ASSIGNED") {
    actions.push({ label: "Mark dispatch assigned", onClick: () => onAssignDispatch(order.id) });
    actions.push({ label: "Mark completed", onClick: () => onComplete(order.id) });
  }

  return (
    <div
      className={clsx(
        "group relative rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md border-l-4",
        borderStyles[order.status],
        accentStyles[order.status]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#2a2927]">#{displayCode}</h2>
          <p className="text-[11px] text-[#7a6f63]">
            Created {new Date(order.createdAt).toLocaleTimeString()} · {minutesElapsed} min elapsed
          </p>
        </div>
        <span className={clsx("text-[11px] font-semibold uppercase tracking-[0.2em]", statusStyles[order.status])}>
          {order.status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-3">
        <p className="flex items-center gap-2 text-sm font-medium text-[#2a2927]">
          <BsPersonFill className="text-base text-amber-700" />
          {order.customerName || "Guest"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#6b5f53]">
          {[order.orderType, order.priority, order.station].map((tag) => (
            <span key={tag} className="rounded-full border border-[#eadfd1] bg-white px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
        {order.assignedTo && (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-[#6b5f53]">
            <FiUser className="text-xs" />
            Assigned to {order.assignedTo}
          </p>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#7a6f63]">Items</p>
        <ul className="mt-2 max-h-28 space-y-2 overflow-y-auto pr-1 text-sm text-[#2a2927]">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {item.quantity}x {item.name}
                </p>
                {item.notes && <p className="text-xs text-[#7a6f63] break-words">{item.notes}</p>}
                {item.allergens && item.allergens.length > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                    <BsExclamationTriangle className="text-[10px]" />
                    Allergens: {item.allergens.join(", ")}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
        {order.specialInstructions && (
          <div className="mt-3 rounded-xl border border-[#efe5d8] bg-[#fbf8f3] px-3 py-2 text-xs text-[#6b5f53]">
            <p className="font-semibold text-[#2a2927]">Special instructions</p>
            <p className="mt-1 break-words">{order.specialInstructions}</p>
          </div>
        )}
        {order.allergens && order.allergens.length > 0 && (
          <div className="mt-3 rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-2 text-xs text-rose-900">
            <p className="font-semibold">Allergy alert: {order.allergens.join(", ")}</p>
            {order.allergyNotes && <p className="mt-1 break-words">{order.allergyNotes}</p>}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-[#6b5f53]">
          <BsClock className="text-sm" />
          <span className="break-words">
            Delivery: {order.delivery.address} · Zone {order.delivery.zone} · ETA {order.delivery.eta || "TBD"}
          </span>
        </div>
        {order.flags && (order.flags.needsAdmin || order.flags.lowStockImpact || order.flags.delayRisk) && (
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[#2a2927]">
            {order.flags.needsAdmin && (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5">Needs admin</span>
            )}
            {order.flags.lowStockImpact && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5">
                Low stock impact
              </span>
            )}
            {order.flags.delayRisk && (
              <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5">Delay risk</span>
            )}
          </div>
        )}
        {order.hold && (
          <div className="mt-3 rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-2 text-xs text-rose-900">
            <p className="font-semibold">Hold: {order.hold.reason}</p>
            <p className="mt-1 break-words">{order.hold.notes || "Awaiting admin guidance."}</p>
          </div>
        )}
      </div>

      {(order.status === "READY" || order.status === "HANDOFF_REQUESTED" || order.status === "DISPATCH_ASSIGNED" || order.status === "COMPLETED") && (
        <OrderTimeline status={order.status} />
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={primaryAction.onClick}
          className="rounded-full border border-[#2a2927] bg-[#2a2927] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3a3937]"
        >
          {primaryAction.label}
        </button>
        <ActionsMenu actions={actions} />
      </div>
    </div>
  );
}
