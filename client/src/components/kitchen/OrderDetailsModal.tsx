"use client";

import type { KitchenOrder } from "@/store/kitchenStore";

type OrderDetailsModalProps = {
  open: boolean;
  order: KitchenOrder | null;
  onClose: () => void;
};

export default function OrderDetailsModal({ open, order, onClose }: OrderDetailsModalProps) {
  if (!open || !order) return null;
  const displayCode =
    order.id.length >= 8 ? order.id.slice(-8).toUpperCase() : order.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#7a6f63]">Order details</p>
            <h2 className="text-xl font-semibold text-[#2a2927]">#{displayCode}</h2>
            <p className="mt-1 text-sm text-[#6b5f53]">
              {order.orderType} · {order.priority} · {order.station}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-[#eadfd1] px-3 py-1 text-xs text-[#2a2927]"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4 text-sm text-[#2a2927] md:grid-cols-2">
          <div className="rounded-2xl border border-[#efe5d8] bg-[#fbf8f3] p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#7a6f63]">Customer</p>
            <p className="mt-2 font-semibold">{order.customerName || "Guest"}</p>
            {order.assignedTo && <p className="mt-1 text-xs text-[#6b5f53]">Assigned: {order.assignedTo}</p>}
          </div>
          <div className="rounded-2xl border border-[#efe5d8] bg-[#fbf8f3] p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#7a6f63]">Delivery</p>
            <p className="mt-2 text-sm">{order.delivery.address}</p>
            <p className="mt-1 text-xs text-[#6b5f53]">
              Zone {order.delivery.zone} · ETA {order.delivery.eta || "TBD"}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#7a6f63]">Items</p>
            <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-2 text-sm">
              {order.items.map((item) => (
                <li key={item.id}>
                  <p className="font-medium">
                    {item.quantity}x {item.name}
                  </p>
                  {item.notes && <p className="text-xs text-[#6b5f53]">{item.notes}</p>}
                  {item.allergens && item.allergens.length > 0 && (
                    <p className="text-xs text-rose-600">Allergens: {item.allergens.join(", ")}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {order.specialInstructions && (
            <div className="md:col-span-2 rounded-2xl border border-[#efe5d8] bg-[#fbf8f3] p-4 text-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#7a6f63]">Special instructions</p>
              <p className="mt-2">{order.specialInstructions}</p>
            </div>
          )}
          {order.allergens && order.allergens.length > 0 && (
            <div className="md:col-span-2 rounded-2xl border border-rose-200/70 bg-rose-50 p-4 text-sm text-rose-900">
              <p className="text-[11px] uppercase tracking-[0.2em] text-rose-700">Allergy Alert</p>
              <p className="mt-2 font-semibold">{order.allergens.join(", ")}</p>
              {order.allergyNotes && <p className="mt-1">{order.allergyNotes}</p>}
            </div>
          )}
          {order.hold && (
            <div className="md:col-span-2 rounded-2xl border border-rose-200/70 bg-rose-50 p-4 text-sm text-rose-900">
              <p className="text-[11px] uppercase tracking-[0.2em] text-rose-700">Hold</p>
              <p className="mt-2 font-semibold">{order.hold.reason}</p>
              <p className="mt-1">{order.hold.notes || "Awaiting admin guidance."}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full border border-[#eadfd1] px-4 py-2 text-sm text-[#2a2927]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
