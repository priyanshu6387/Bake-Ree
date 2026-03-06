"use client";

import { useEffect, useState, useMemo } from "react";
import { BsPersonFill, BsClock, BsFilter } from "react-icons/bs";
import { FiRefreshCw, FiUser } from "react-icons/fi";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import clsx from "clsx";
import axios from "axios";
import { useSocket } from "../../hooks/useSocket";
import { format } from "timeago.js";
import { BASE_URL } from "../../utils/api";

type OrderStatus = "Pending" | "Preparing" | "Ready";

interface OrderItem {
  product: {
    _id: string;
    name: string;
    image?: string;
  };
  quantity: number;
  price: number;
}

interface KitchenStaff {
  _id: string;
  name: string;
  email: string;
  isActive?: boolean;
}

interface Order {
  _id: string;
  user?: {
    name?: string;
    email?: string;
  };
  items: OrderItem[];
  status: OrderStatus;
  orderType: string;
  totalAmount: number;
  deliveryCharge?: number;
  createdAt: string;
  updatedAt: string;
  assignedKitchenStaff?: KitchenStaff | null;
}

const getStatusColor = (status: OrderStatus) => {
  return clsx(
    "text-xs font-semibold px-2.5 py-1 rounded-full transition-all duration-300",
    status === "Pending" && "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
    status === "Preparing" && "bg-orange-100 text-orange-900 ring-1 ring-orange-200",
    status === "Ready" && "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200"
  );
};

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [kitchenStaff, setKitchenStaff] = useState<KitchenStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [refreshing, setRefreshing] = useState(false);
  const [assigningStaff, setAssigningStaff] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const router = useRouter();
  const { socket, isConnected } = useSocket({ room: "kitchen" });
  const [sound] = useState(() => new Audio("/sounds/notify.mp3"));

  // Fetch orders from API
  const fetchOrders = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Please login to view orders");
        setLoading(false);
        setRefreshing(false);
        router.push("/login");
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/orders/kitchen`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data || []);
      setLastUpdated(new Date());
    } catch (error: unknown) {
      console.error("Error fetching orders:", error);
      
      let errorMessage = "Failed to fetch orders";
      if (axios.isAxiosError(error) && error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          errorMessage = "Unauthorized: Please login again";
          localStorage.removeItem("token");
          router.push("/login");
        } else if (error.response.status === 403) {
          errorMessage = "Access denied: Kitchen staff or admin access required";
        } else if (error.response.status === 500) {
          errorMessage = "Server error: Please try again later";
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (axios.isAxiosError(error) && error.request) {
        // Request made but no response
        errorMessage = "Network error: Unable to connect to server. Please check if the server is running.";
      }
      
      toast.error(errorMessage);
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch kitchen staff
  const fetchKitchenStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/kitchen-staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setKitchenStaff(response.data);
    } catch (error: unknown) {
      console.error("Error fetching kitchen staff:", error);
      // Don't show error toast - staff assignment is optional
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
    fetchKitchenStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Socket.io event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new orders
    const handleOrderCreated = (data: { order: Order }) => {
      console.log("New order created:", data.order);
      
      // Only add if status is Pending, Preparing, or Ready
      if (["Pending", "Preparing", "Ready"].includes(data.order.status)) {
        setOrders((prev) => {
          // Check if order already exists
          const exists = prev.some((o) => o._id === data.order._id);
          if (exists) return prev;
          
          // Add new order at the beginning
          return [data.order, ...prev];
        });
        
        toast.success(`New order received: ${data.order._id.slice(-8).toUpperCase()}`);
        sound.play().catch(() => {});
      }
    };

    // Listen for status updates
    const handleStatusUpdated = (data: { order: Order; oldStatus: string; newStatus: string }) => {
      console.log("Order status updated:", data);
      
      setOrders((prev) =>
        prev.map((order) =>
          order._id === data.order._id
            ? { ...order, status: data.order.status, updatedAt: data.order.updatedAt }
            : order
        )
      );

      // Remove order if status is not Pending, Preparing, or Ready
      if (!["Pending", "Preparing", "Ready"].includes(data.order.status)) {
        setOrders((prev) => prev.filter((order) => order._id !== data.order._id));
      } else {
        toast.success(
          `Order ${data.order._id.slice(-8).toUpperCase()} status: ${data.oldStatus} → ${data.newStatus}`
        );
      }
    };

    socket.on("order:created", handleOrderCreated);
    socket.on("order:statusUpdated", handleStatusUpdated);

    return () => {
      socket.off("order:created", handleOrderCreated);
      socket.off("order:statusUpdated", handleStatusUpdated);
    };
  }, [socket, isConnected, sound]);

  const updateStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/api/orders/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state optimistically
      setOrders((prev) =>
        prev.map((order) =>
          order._id === id ? { ...order, status: newStatus } : order
        )
      );

      toast.success(`Order ${id.slice(-8).toUpperCase()} marked as ${newStatus}`);
    } catch (error: unknown) {
      console.error("Error updating order status:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error
        : null;
      toast.error(message || "Failed to update order status");
      // Refetch on error
      fetchOrders();
    }
  };

  const assignStaff = async (orderId: string, staffId: string | null) => {
    try {
      setAssigningStaff(orderId);
      const token = localStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/api/orders/${orderId}`,
        { assignedKitchenStaff: staffId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setOrders((prev) =>
        prev.map((order) => {
          if (order._id === orderId) {
            const staff = staffId ? kitchenStaff.find((s) => s._id === staffId) : null;
            return { ...order, assignedKitchenStaff: staff || null };
          }
          return order;
        })
      );

      toast.success(
        staffId
          ? `Staff assigned to order ${orderId.slice(-8).toUpperCase()}`
          : `Staff unassigned from order ${orderId.slice(-8).toUpperCase()}`
      );
    } catch (error: unknown) {
      console.error("Error assigning staff:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error
        : null;
      toast.error(message || "Failed to assign staff");
    } finally {
      setAssigningStaff(null);
    }
  };

  // Filter orders by status
  const filteredOrders = useMemo(() => {
    if (statusFilter === "All") return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  // Sort orders: Pending first, then Preparing, then Ready (by createdAt)
  const sortedOrders = useMemo(() => {
    const statusPriority: Record<OrderStatus, number> = {
      Pending: 1,
      Preparing: 2,
      Ready: 3,
    };

    return [...filteredOrders].sort((a, b) => {
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [filteredOrders]);

  // Calculate order statistics
  const stats = useMemo(() => {
    const now = Date.now();
    const minutesAges = orders.map(
      (order) => Math.floor((now - new Date(order.createdAt).getTime()) / 60000)
    );
    const attention = orders.filter((order) => {
      if (order.status !== "Pending") return false;
      const minutes = Math.floor((now - new Date(order.createdAt).getTime()) / 60000);
      return minutes > 10;
    }).length;
    const totalItems = orders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );
    const uniqueItems = new Set(
      orders.flatMap((order) => order.items.map((item) => item.product?._id || item.product?.name))
    );
    const unassigned = orders.filter((order) => !order.assignedKitchenStaff).length;
    const assigned = orders.length - unassigned;
    const avgAgeMinutes = minutesAges.length
      ? Math.round(minutesAges.reduce((sum, value) => sum + value, 0) / minutesAges.length)
      : 0;
    const pickupCount = orders.filter((order) => order.orderType === "Pickup").length;
    const deliveryCount = orders.filter((order) => order.orderType === "Delivery").length;
    return {
      pending: orders.filter((o) => o.status === "Pending").length,
      preparing: orders.filter((o) => o.status === "Preparing").length,
      ready: orders.filter((o) => o.status === "Ready").length,
      total: orders.length,
      attention,
      oldestMinutes: minutesAges.length ? Math.max(...minutesAges) : 0,
      avgAgeMinutes,
      totalItems,
      uniqueItemsCount: Array.from(uniqueItems).filter(Boolean).length,
      unassigned,
      assigned,
      pickupCount,
      deliveryCount,
    };
  }, [orders]);

  if (loading) {
    return (
      <section className="min-h-screen bg-[#f3f2ec] px-4 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a2927] mx-auto mb-4"></div>
          <p className="text-xl text-[#2a2927]">Loading orders...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff8f0,_#f2ece4_55%,_#efe6da_100%)] text-[#2a2927]">
      {/* Kitchen Header */}
      <header className="sticky top-0 z-40 border-b border-[#e3dacf] bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="text-sm font-medium text-[#2a2927] hover:text-amber-700 transition-colors"
              >
                ← Back to Home
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-700/80">
                  Kitchen Control
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-[#2a2927]">
                  Kitchen Dashboard
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-[#e7ddcf] bg-white px-3 py-1 text-xs text-[#6b5f53] sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>
                  Last refresh{" "}
                  {lastUpdated ? format(lastUpdated) : "just now"}
                </span>
              </div>
              <button
                onClick={() => fetchOrders(true)}
                disabled={refreshing}
                className="flex items-center gap-2 rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3a3937] disabled:opacity-50"
              >
                <FiRefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
                Refresh
              </button>
              <div className="flex items-center gap-2 rounded-full border border-[#e7ddcf] bg-white px-3 py-1 text-sm font-medium">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  }`}
                />
                <span className="text-[#2a2927]">
                  {isConnected ? "Live" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-amber-50/70 to-white p-4 shadow-sm">
              <div className="text-2xl font-semibold text-amber-900">{stats.pending}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-amber-700/80">
                Pending
              </div>
            </div>
            <div className="rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-orange-50/70 to-white p-4 shadow-sm">
              <div className="text-2xl font-semibold text-orange-900">{stats.preparing}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-orange-700/80">
                Preparing
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-white p-4 shadow-sm">
              <div className="text-2xl font-semibold text-emerald-900">{stats.ready}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-700/80">
                Ready
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-slate-50/70 to-white p-4 shadow-sm">
              <div className="text-2xl font-semibold text-slate-900">{stats.total}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-600">
                Total Active
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#e7ddcf] bg-white/70 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <BsFilter className="text-[#2a2927]" />
              <span className="text-sm font-medium text-[#2a2927]">Filter:</span>
              {(["All", "Pending", "Preparing", "Ready"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={clsx(
                    "rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
                    statusFilter === status
                      ? "bg-[#2a2927] text-white shadow-sm"
                      : "bg-white text-[#2a2927] ring-1 ring-[#e2d8ca] hover:bg-[#f4efe7]"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#6b5f53]">
              <span className="rounded-full border border-[#e7ddcf] bg-white px-3 py-1">
                Attention: {stats.attention}
              </span>
              <span className="rounded-full border border-[#e7ddcf] bg-white px-3 py-1">
                Oldest: {stats.oldestMinutes} min
              </span>
              <span className="rounded-full border border-[#e7ddcf] bg-white px-3 py-1">
                Avg age: {stats.avgAgeMinutes} min
              </span>
              <span className="rounded-full border border-[#e7ddcf] bg-white px-3 py-1">
                Items: {stats.totalItems}
              </span>
              <span className="rounded-full border border-[#e7ddcf] bg-white px-3 py-1">
                Unique items: {stats.uniqueItemsCount}
              </span>
              <span className="rounded-full border border-[#e7ddcf] bg-white px-3 py-1">
                Unassigned: {stats.unassigned}
              </span>
              <span className="rounded-full border border-[#e7ddcf] bg-white px-3 py-1">
                Assigned: {stats.assigned}
              </span>
              <span className="rounded-full border border-[#e7ddcf] bg-white px-3 py-1">
                Pickup: {stats.pickupCount}
              </span>
              <span className="rounded-full border border-[#e7ddcf] bg-white px-3 py-1">
                Delivery: {stats.deliveryCount}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-[#e7ddcf] bg-white/80 shadow-sm">
            <p className="text-xl font-semibold text-[#2a2927]">No orders found</p>
            <p className="mt-2 text-sm text-gray-500">
              {statusFilter === "All"
                ? "Orders will appear here when they are placed"
                : `No orders with status "${statusFilter}"`}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedOrders.map((order) => {
              const timeElapsed = new Date().getTime() - new Date(order.createdAt).getTime();
              const minutesElapsed = Math.floor(timeElapsed / 60000);
              
              return (
                <div
                  key={order._id}
                  className={clsx(
                    "group relative overflow-hidden rounded-3xl border-2 bg-white/90 p-5 shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl",
                    order.status === "Pending" && "border-amber-200/80",
                    order.status === "Preparing" && "border-orange-200/80",
                    order.status === "Ready" && "border-emerald-200/80"
                  )}
                >
                  <div
                    className={clsx(
                      "absolute inset-x-0 top-0 h-1.5",
                      order.status === "Pending" && "bg-amber-400/80",
                      order.status === "Preparing" && "bg-orange-400/80",
                      order.status === "Ready" && "bg-emerald-400/80"
                    )}
                  />
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-xl font-bold text-[#2a2927]">
                        #{order._id.slice(-8).toUpperCase()}
                      </h2>
                      {order.status === "Pending" && minutesElapsed > 10 && (
                        <p className="text-xs text-red-600 font-medium mt-1">
                          ⚠️ Waiting {minutesElapsed} min
                        </p>
                      )}
                    </div>
                    <span className={getStatusColor(order.status)}>
                      {order.status}
                    </span>
                  </div>

                  <div className="mb-3 rounded-2xl border border-[#f1e8dc] bg-[#faf6f0] p-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-[#2a2927]">
                      <BsPersonFill className="text-base text-amber-700" />
                      {order.user?.name || order.user?.email || "Guest"}
                    </p>
                    {order.assignedKitchenStaff && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <FiUser className="text-xs" />
                        Assigned to: {order.assignedKitchenStaff.name}
                      </p>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <BsClock className="text-sm" />
                      {format(order.createdAt)} ({minutesElapsed} min ago)
                    </p>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Order Items:</p>
                    <ul className="space-y-1">
                      {order.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between text-sm text-[#2a2927]"
                        >
                          <span>
                            {item.product?.name || "Unknown"} × {item.quantity}
                          </span>
                          <span className="text-gray-600">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4 rounded-2xl border border-[#f1e8dc] bg-white p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Order Type:</span>
                      <span className="rounded-full bg-[#f4efe7] px-2.5 py-0.5 font-medium text-[#2a2927]">
                        {order.orderType}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-[#2a2927]">
                        ₹{order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    {kitchenStaff.length > 0 && (
                      <div className="mt-2 border-t border-[#efe5d9] pt-2">
                        <label className="text-xs text-gray-600 block mb-1">
                          Assigned Staff:
                        </label>
                        <select
                          value={order.assignedKitchenStaff?._id || ""}
                          onChange={(e) =>
                            assignStaff(order._id, e.target.value || null)
                          }
                          disabled={assigningStaff === order._id}
                          className="w-full rounded-lg border border-[#e5d8c8] bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#2a2927] disabled:opacity-50"
                        >
                          <option value="">Unassigned</option>
                          {kitchenStaff.map((staff) => (
                            <option key={staff._id} value={staff._id}>
                              {staff.name}
                            </option>
                          ))}
                        </select>
                        {order.assignedKitchenStaff && (
                          <p className="text-xs text-gray-500 mt-1">
                            👤 {order.assignedKitchenStaff.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {order.status === "Pending" && (
                      <button
                        className="flex-1 rounded-full bg-orange-500 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600"
                        onClick={() => updateStatus(order._id, "Preparing")}
                      >
                        Start Preparing
                      </button>
                    )}
                    {order.status === "Preparing" && (
                      <button
                        className="flex-1 rounded-full bg-emerald-500 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600"
                        onClick={() => updateStatus(order._id, "Ready")}
                      >
                        Mark Ready
                      </button>
                    )}
                    {order.status === "Ready" && (
                      <div className="flex-1 rounded-full border-2 border-emerald-200 bg-emerald-50 py-2.5 text-center text-sm font-semibold text-emerald-800">
                        ✅ Ready for Pickup
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
