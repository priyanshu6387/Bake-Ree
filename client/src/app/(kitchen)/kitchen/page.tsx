"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { format } from "timeago.js";
import KitchenHeader from "@/components/kitchen/KitchenHeader";
import OrderCard from "@/components/kitchen/OrderCard";
import HoldOrderModal from "@/components/kitchen/HoldOrderModal";
import HandoffModal from "@/components/kitchen/HandoffModal";
import PingModal from "@/components/kitchen/PingModal";
import FiltersBar from "@/components/kitchen/FiltersBar";
import OrderDetailsModal from "@/components/kitchen/OrderDetailsModal";
import { useKitchenStore } from "@/store/kitchenStore";
import type { KitchenOrder, KitchenOrderStatus } from "@/store/kitchenStore";

const statusFilters = ["All", "PENDING", "PREPARING", "READY", "HOLD", "HANDOFF_REQUESTED"] as const;
const typeFilters = ["All", "DELIVERY", "PICKUP"] as const;
const priorityFilters = ["All", "NORMAL", "RUSH", "VIP"] as const;
const stationFilters = ["All", "OVEN", "FRYER", "BEVERAGE", "PACKING"] as const;
const assignedFilters = ["All", "Me", "Unassigned"] as const;
const attentionFilters = ["All", "Needs admin", "Low stock impact", "Delay risk"] as const;
const sortFilters = ["Oldest", "Newest", "Priority"] as const;

export default function KitchenQueuePage() {
  const {
    orders,
    setOrderStatus,
    createOrderIssueAlert,
    createDispatchRequest,
    assignDispatch,
    sendPing,
  } = useKitchenStore();

  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("All");
  const [typeFilter, setTypeFilter] = useState<(typeof typeFilters)[number]>("All");
  const [priorityFilter, setPriorityFilter] = useState<(typeof priorityFilters)[number]>("All");
  const [stationFilter, setStationFilter] = useState<(typeof stationFilters)[number]>("All");
  const [assignedFilter, setAssignedFilter] = useState<(typeof assignedFilters)[number]>("All");
  const [attentionFilter, setAttentionFilter] = useState<(typeof attentionFilters)[number]>("All");
  const [sortFilter, setSortFilter] = useState<(typeof sortFilters)[number]>("Oldest");
  const [searchFilter, setSearchFilter] = useState("");

  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [holdOpen, setHoldOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [pingOpen, setPingOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const stats = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== "COMPLETED");
    return {
      pending: activeOrders.filter((order) => order.status === "PENDING").length,
      preparing: activeOrders.filter((order) => order.status === "PREPARING").length,
      ready: activeOrders.filter((order) => order.status === "READY").length,
      handoff: activeOrders.filter((order) => order.status === "HANDOFF_REQUESTED").length,
      total: activeOrders.length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      if (statusFilter !== "All" && order.status !== statusFilter) return false;
      if (typeFilter !== "All" && order.orderType !== typeFilter) return false;
      if (priorityFilter !== "All" && order.priority !== priorityFilter) return false;
      if (stationFilter !== "All" && order.station !== stationFilter) return false;
      if (assignedFilter === "Me" && order.assignedTo !== "Me") return false;
      if (assignedFilter === "Unassigned" && order.assignedTo) return false;
      if (attentionFilter === "Needs admin" && !order.flags?.needsAdmin) return false;
      if (attentionFilter === "Low stock impact" && !order.flags?.lowStockImpact) return false;
      if (attentionFilter === "Delay risk" && !order.flags?.delayRisk) return false;
      if (searchFilter.trim()) {
        const needle = searchFilter.trim().toLowerCase();
        const matchesId = order.id.toLowerCase().includes(needle);
        const matchesCustomer = order.customerName?.toLowerCase().includes(needle);
        if (!matchesId && !matchesCustomer) return false;
      }
      return true;
    });

    const priorityScore: Record<string, number> = { VIP: 3, RUSH: 2, NORMAL: 1 };

    return filtered.sort((a, b) => {
      if (sortFilter === "Priority") {
        return priorityScore[b.priority] - priorityScore[a.priority];
      }
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortFilter === "Newest" ? bTime - aTime : aTime - bTime;
    });
  }, [
    orders,
    statusFilter,
    typeFilter,
    priorityFilter,
    stationFilter,
    assignedFilter,
    attentionFilter,
    searchFilter,
    sortFilter,
  ]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setRefreshing(false);
      toast.success("Kitchen queue refreshed");
    }, 400);
  };

  const handleSetStatus = (orderId: string, status: KitchenOrderStatus) => {
    setOrderStatus(orderId, status);
    toast.success(`Order ${orderId} marked as ${status.replace("_", " ")}`);
  };

  const openHold = (orderId: string) => {
    setSelectedOrder(orders.find((order) => order.id === orderId) ?? null);
    setHoldOpen(true);
  };

  const openHandoff = (orderId: string) => {
    setSelectedOrder(orders.find((order) => order.id === orderId) ?? null);
    setHandoffOpen(true);
  };

  const openPing = (orderId: string) => {
    setSelectedOrder(orders.find((order) => order.id === orderId) ?? null);
    setPingOpen(true);
  };

  const openDetails = (orderId: string) => {
    setSelectedOrder(orders.find((order) => order.id === orderId) ?? null);
    setDetailsOpen(true);
  };

  return (
    <div>
      <KitchenHeader
        title="Kitchen Queue"
        subtitle="Kitchen Control"
        description="Pending to dispatch-ready orders in one place."
        onRefresh={handleRefresh}
        refreshing={refreshing}
        isLive
        lastUpdatedLabel={lastUpdated ? format(lastUpdated) : "just now"}
      />

      <div className="w-full py-6">
        <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-5">
          {[
            { label: "Pending", value: stats.pending, tone: "amber" },
            { label: "Preparing", value: stats.preparing, tone: "orange" },
            { label: "Ready", value: stats.ready, tone: "emerald" },
            { label: "Handoff Requested", value: stats.handoff, tone: "sky" },
            { label: "Total Active", value: stats.total, tone: "slate" },
          ].map((card) => (
            <div
              key={card.label}
              className={clsx(
                "min-w-[160px] rounded-2xl border border-black/5 bg-white/80 p-3 shadow-sm",
                card.tone === "amber" && "border-amber-200/70",
                card.tone === "orange" && "border-orange-200/70",
                card.tone === "emerald" && "border-emerald-200/70",
                card.tone === "sky" && "border-sky-200/70",
                card.tone === "slate" && "border-slate-200/70"
              )}
            >
              <div className="text-xl font-semibold text-[#2a2927]">{card.value}</div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#7a6f63]">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <FiltersBar
            status={statusFilter}
            type={typeFilter}
            priority={priorityFilter}
            station={stationFilter}
            assigned={assignedFilter}
            attention={attentionFilter}
            sort={sortFilter}
            search={searchFilter}
            statusOptions={statusFilters}
            typeOptions={typeFilters}
            priorityOptions={priorityFilters}
            stationOptions={stationFilters}
            assignedOptions={assignedFilters}
            attentionOptions={attentionFilters}
            sortOptions={sortFilters}
            onStatusChange={(value) => setStatusFilter(value as (typeof statusFilters)[number])}
            onTypeChange={(value) => setTypeFilter(value as (typeof typeFilters)[number])}
            onPriorityChange={(value) => setPriorityFilter(value as (typeof priorityFilters)[number])}
            onStationChange={(value) => setStationFilter(value as (typeof stationFilters)[number])}
            onAssignedChange={(value) => setAssignedFilter(value as (typeof assignedFilters)[number])}
            onAttentionChange={(value) => setAttentionFilter(value as (typeof attentionFilters)[number])}
            onSortChange={(value) => setSortFilter(value as (typeof sortFilters)[number])}
            onSearchChange={setSearchFilter}
            onClearAll={() => {
              setStatusFilter("All");
              setTypeFilter("All");
              setPriorityFilter("All");
              setStationFilter("All");
              setAssignedFilter("All");
              setAttentionFilter("All");
              setSortFilter("Oldest");
              setSearchFilter("");
            }}
          />

          <div className="mt-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 rounded-3xl border border-[#e7ddcf] bg-white/80 shadow-sm">
              <p className="text-xl font-semibold text-[#2a2927]">No orders found</p>
              <p className="mt-2 text-sm text-gray-500">
                {statusFilter === "All"
                  ? "Orders will appear here when they are placed"
                  : `No orders with status "${statusFilter}"`}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStart={(id) => handleSetStatus(id, "PREPARING")}
                  onReady={(id) => handleSetStatus(id, "READY")}
                  onHandoff={openHandoff}
                  onHold={openHold}
                  onPing={openPing}
                  onPrint={(id) => toast.success(`Print KOT queued for ${id}`)}
                  onView={openDetails}
                  onAssignDispatch={(id) => {
                    assignDispatch(id, "Dispatch Team");
                    toast.success(`Dispatch assigned for ${id}`);
                  }}
                  onComplete={(id) => handleSetStatus(id, "COMPLETED")}
                />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      <HoldOrderModal
        open={holdOpen}
        order={selectedOrder}
        onClose={() => setHoldOpen(false)}
        onSubmit={(payload) => {
          if (!selectedOrder) return;
          setOrderStatus(selectedOrder.id, "HOLD", {
            reason: payload.reason,
            severity: payload.severity,
            notes: payload.notes,
          });
          createOrderIssueAlert({
            orderId: selectedOrder.id,
            reason: payload.reason,
            severity: payload.severity,
            notes: payload.notes,
          });
          toast.success(`Hold created for ${selectedOrder.id}`);
          setHoldOpen(false);
        }}
      />

      <HandoffModal
        open={handoffOpen}
        order={selectedOrder}
        onClose={() => setHandoffOpen(false)}
        onSubmit={(payload) => {
          if (!selectedOrder) return;
          setOrderStatus(selectedOrder.id, "HANDOFF_REQUESTED");
          createDispatchRequest({
            orderId: selectedOrder.id,
            type: payload.type,
            packingRequired: payload.packingRequired,
            expectedPickupTime: payload.expectedPickupTime,
            notifyAdmin: payload.notifyAdmin,
            notifyDelivery: payload.notifyDelivery,
            notes: payload.notes,
            assignee: null,
          });
          if (payload.notifyAdmin) {
            sendPing({
              body: `Dispatch request created for ${selectedOrder.id}`,
              targetRole: "ADMIN",
              template: "READY for dispatch",
            });
          }
          if (payload.notifyDelivery) {
            sendPing({
              body: `Dispatch request created for ${selectedOrder.id}`,
              targetRole: "DELIVERY",
              template: "READY for dispatch",
            });
          }
          toast.success(`Dispatch request sent for ${selectedOrder.id}`);
          setHandoffOpen(false);
        }}
      />

      <PingModal
        open={pingOpen}
        orderId={selectedOrder?.id}
        onClose={() => setPingOpen(false)}
        onSubmit={(payload) => {
          sendPing({ ...payload, orderId: selectedOrder?.id });
          toast.success(`Ping sent to ${payload.targetRole}`);
          setPingOpen(false);
        }}
      />

      <OrderDetailsModal
        open={detailsOpen}
        order={selectedOrder}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
}
