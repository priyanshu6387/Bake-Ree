"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  HiCurrencyRupee,
  HiShoppingBag,
  HiTrendingUp,
  HiFire,
  HiCalendar,
  HiChartBar,
  HiStar,
  HiGift,
  HiClock,
  HiCog,
  HiMap,
  HiUser,
  HiHeart,
} from "react-icons/hi";
import Link from "next/link";
import { format } from "timeago.js";
import { useSocket } from "../../hooks/useSocket";
import { getUserIdFromToken } from "../../utils/jwt";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import PointsRedemptionModal from "../components/PointsRedemptionModal";
import NotificationCenter from "../components/NotificationCenter";
import { useNotificationStore } from "../../store/notificationStore";

interface CustomerAnalytics {
  lifetimeSpending: number;
  totalOrders: number;
  averageOrderValue: number;
  currentStreak: number;
  longestStreak: number;
  lastOrderDate: string | null;
  favoriteProducts: Array<{
    product: string;
    orderCount: number;
  }>;
  preferredOrderType: string | null;
  membershipTier: "Bronze" | "Silver" | "Gold" | "Platinum";
  visitFrequency: "New" | "Occasional" | "Regular" | "VIP";
}

interface MonthlySpending {
  month: string;
  total: number;
  orders: number;
}

interface LoyaltyPoints {
  balance: number;
  currencyValue: number;
  pointsPerRupee: number;
  rupeePerPoint: number;
}

interface PointsTransaction {
  _id: string;
  points: number;
  balance: number;
  transactionType: string;
  description: string;
  createdAt: string;
  order?: {
    _id: string;
    totalAmount: number;
  };
}

interface RecentOrder {
  _id: string;
  status: string;
  totalAmount: number;
  orderType: string;
  createdAt: string;
  updatedAt?: string;
  items: Array<{
    product: { name: string; image?: string };
    quantity: number;
  }>;
}

const tierColors = {
  Bronze: "bg-[#f7e7d0] text-[#7a4b1a] border-[#e6caa4]",
  Silver: "bg-[#eef1f4] text-[#5b6470] border-[#d7dde5]",
  Gold: "bg-[#fff1c2] text-[#8a6a10] border-[#f1d37a]",
  Platinum: "bg-[#e6f0f2] text-[#2c5b63] border-[#bcd5da]",
};

const frequencyColors = {
  New: "bg-[#e8f0ff] text-[#2657a3]",
  Occasional: "bg-[#e6f7ef] text-[#1f6b46]",
  Regular: "bg-[#fff1d6] text-[#8a5a12]",
  VIP: "bg-[#ffe8e0] text-[#9c3d2b]",
};

const cardHover =
  "transition-transform duration-200 ease-out hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100";

export default function CustomerDashboard() {
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [monthlySpending, setMonthlySpending] = useState<MonthlySpending[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoints | null>(null);
  const [pointsHistory, setPointsHistory] = useState<PointsTransaction[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const userId = getUserIdFromToken();
  const { socket, isConnected } = useSocket({ room: "user", userId: userId || undefined, enabled: !!userId });
  const router = useRouter();
  const { addNotification } = useNotificationStore();

  const refreshDashboardData = () => {
    fetchAnalytics();
    fetchMonthlySpending();
    fetchLoyaltyPoints();
    fetchPointsHistory();
  };

  // Initial dashboard bootstrap on first mount.
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to view your dashboard");
      setLoading(false);
      router.push("/login");
      return;
    }

    // Fetch all data
    fetchAnalytics();
    fetchMonthlySpending();
    fetchLoyaltyPoints();
    fetchPointsHistory();
    fetchRecentOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Fetch recent orders
  const fetchRecentOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        "http://localhost:5000/api/orders/my-orders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Get last 5 orders, sorted by most recent
      const sorted = response.data
        .sort((a: RecentOrder, b: RecentOrder) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);
      setRecentOrders(sorted);
    } catch (err) {
      console.error("Error fetching recent orders:", err);
    }
  };

  // Real-time order status updates via WebSocket
  // Socket listeners are intentionally bound to socket connection lifecycle.
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleOrderStatusUpdated = (data: { 
      order: RecentOrder; 
      oldStatus: string; 
      newStatus: string 
    }) => {
      console.log("Order status updated:", data);
      
      setRecentOrders((prev) =>
        prev.map((order) =>
          order._id === data.order._id
            ? { ...order, status: data.order.status, updatedAt: data.order.updatedAt }
            : order
        )
      );

      toast.success(
        `Order #${data.order._id.slice(-8).toUpperCase()} status updated: ${data.oldStatus} → ${data.newStatus}`,
        { icon: "🎉" }
      );

      addNotification({
        type: "order",
        title: "Order status updated",
        message: `Order #${data.order._id.slice(-8).toUpperCase()} is now ${data.newStatus}.`,
        orderId: data.order._id,
        link: `/orders/${data.order._id}`,
      });

      refreshDashboardData();
    };

    const handleOrderCreated = (data: { order: RecentOrder }) => {
      console.log("New order created:", data.order);
      
      setRecentOrders((prev) => {
        // Check if order already exists
        const exists = prev.some((o) => o._id === data.order._id);
        if (exists) return prev;
        
        // Add new order at the beginning
        return [data.order, ...prev].slice(0, 5);
      });

      toast.success(
        `Order #${data.order._id.slice(-8).toUpperCase()} placed successfully!`,
        { icon: "✅" }
      );

      addNotification({
        type: "order",
        title: "New order placed",
        message: `Order #${data.order._id.slice(-8).toUpperCase()} has been created.`,
        orderId: data.order._id,
        link: `/orders/${data.order._id}`,
      });

      refreshDashboardData();
    };

    socket.on("order:statusUpdated", handleOrderStatusUpdated);
    socket.on("order:created", handleOrderCreated);

    return () => {
      socket.off("order:statusUpdated", handleOrderStatusUpdated);
      socket.off("order:created", handleOrderCreated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to view your dashboard");
        setLoading(false);
        router.push("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/customer-analytics/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAnalytics(response.data);
      setError(null); // Clear any previous errors
    } catch (err: unknown) {
      console.error("Error fetching analytics:", err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      
      // Handle authentication errors
      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        setError("Your session has expired. Please login again.");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(message || "Failed to load analytics. Please try refreshing the page.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySpending = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        "http://localhost:5000/api/customer-analytics/me/monthly?months=12",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMonthlySpending(response.data);
    } catch (err) {
      console.error("Error fetching monthly spending:", err);
    }
  };

  const fetchLoyaltyPoints = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        "http://localhost:5000/api/loyalty-points/balance",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setLoyaltyPoints(response.data);
    } catch (err) {
      console.error("Error fetching loyalty points:", err);
    }
  };

  const fetchPointsHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        "http://localhost:5000/api/loyalty-points/history?limit=10",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPointsHistory(response.data);
    } catch (err) {
      console.error("Error fetching points history:", err);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-[#f3f2ec] px-4 py-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-[#2a2927]">Loading your dashboard...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen bg-[#f3f2ec] px-4 py-24 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchAnalytics();
            }}
            className="px-6 py-2 bg-[#2a2927] text-white rounded-full hover:bg-white hover:text-[#2a2927] hover:border hover:border-[#2a2927] transition-all"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!analytics) {
    return (
      <section className="min-h-screen bg-[#f3f2ec] px-4 py-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-[#2a2927]">Loading your dashboard...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f6efe6] px-4 py-24">
      <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(31,122,107,0.18),_rgba(31,122,107,0)_70%)]" />
      <div className="pointer-events-none absolute right-0 top-[-6rem] h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(194,107,45,0.2),_rgba(194,107,45,0)_70%)]" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-4rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(242,181,95,0.22),_rgba(242,181,95,0)_70%)]" />
      <div className="relative mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e6dacb] bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b4f2a]">
              Customer Hub
            </span>
            <h1 className="mt-4 text-4xl font-semibold text-[#2a2927] sm:text-5xl">
              My Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#6b6b6b] sm:text-base">
              Track orders, loyalty rewards, and account insights in a single
              space.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NotificationCenter audience="user" />
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e6dacb] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b4f2a]">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              Live Updates
            </div>
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            {loyaltyPoints && (
              <div
                className={`rounded-[2rem] border border-white/80 bg-gradient-to-br from-[#1f7a6b] via-[#2a8c78] to-[#f2b55f] p-6 text-white shadow-[0_30px_70px_rgba(35,25,10,0.25)] ${cardHover}`}
              >
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-white/70">
                      Loyalty vault
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      Rewards & points
                    </h2>
                    <p className="mt-2 text-sm text-white/80">
                      Earn points on every order and redeem for discounts.
                    </p>
                  </div>
                  <HiStar className="text-5xl text-[#ffe9b6]" />
                </div>
                <div className="flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <p className="text-4xl font-semibold">
                      {loyaltyPoints.balance.toLocaleString()}
                    </p>
                    <p className="text-sm text-white/80">
                      ≈ ₹{loyaltyPoints.currencyValue.toFixed(2)} value
                    </p>
                  </div>
                  <div className="text-right text-sm text-white/80">
                    <p>{loyaltyPoints.pointsPerRupee} point per ₹1 spent</p>
                    <p>{loyaltyPoints.rupeePerPoint} points = ₹1</p>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80">
                  Tier bonus: {analytics.membershipTier} members earn{" "}
                  {analytics.membershipTier === "Bronze" && "1x"}
                  {analytics.membershipTier === "Silver" && "1.1x"}
                  {analytics.membershipTier === "Gold" && "1.2x"}
                  {analytics.membershipTier === "Platinum" && "1.5x"} points
                </div>
                <button
                  onClick={() => setShowRedeemModal(true)}
                  className="mt-5 w-full rounded-full bg-white/95 py-2 text-sm font-semibold text-[#1f7a6b] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Redeem Points
                </button>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className={`rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(35,25,10,0.1)] ${cardHover}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
                    Lifetime spending
                  </p>
                  <HiCurrencyRupee className="text-2xl text-[#1f7a6b]" />
                </div>
                <p className="mt-4 text-3xl font-semibold text-[#2a2927]">
                  ₹{analytics.lifetimeSpending.toFixed(2)}
                </p>
              </div>
              <div
                className={`rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(35,25,10,0.1)] ${cardHover}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
                    Total orders
                  </p>
                  <HiShoppingBag className="text-2xl text-[#1f7a6b]" />
                </div>
                <p className="mt-4 text-3xl font-semibold text-[#2a2927]">
                  {analytics.totalOrders}
                </p>
              </div>
              <div
                className={`rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(35,25,10,0.1)] ${cardHover}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
                    Avg order value
                  </p>
                  <HiTrendingUp className="text-2xl text-[#c26b2d]" />
                </div>
                <p className="mt-4 text-3xl font-semibold text-[#2a2927]">
                  ₹{analytics.averageOrderValue.toFixed(2)}
                </p>
              </div>
              <div
                className={`rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(35,25,10,0.1)] ${cardHover}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
                    Current streak
                  </p>
                  <HiFire className="text-2xl text-[#c04b4b]" />
                </div>
                <p className="mt-4 text-3xl font-semibold text-[#2a2927]">
                  {analytics.currentStreak} days
                </p>
                <p className="mt-1 text-xs text-[#8b7b69]">
                  Best: {analytics.longestStreak} days
                </p>
              </div>
            </div>

            {monthlySpending.length > 0 && (
              <div
                className={`rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(35,25,10,0.12)] ${cardHover}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-[#2a2927]">
                    Monthly Spending
                  </h2>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
                    Last 12 months
                  </span>
                </div>
                <div className="space-y-3">
                  {monthlySpending.map((month, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-20 text-sm text-[#6b6b6b]">
                        {new Date(month.month + "-01").toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-[#efe5d8]">
                        <div
                          className="flex h-full items-center justify-end rounded-full bg-[#1f7a6b] pr-2"
                          style={{
                            width: `${
                              (month.total /
                                Math.max(
                                  ...monthlySpending.map((m) => m.total),
                                  1
                                )) *
                              100
                            }%`,
                          }}
                        >
                          <span className="text-xs font-medium text-white">
                            ₹{month.total.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <div className="w-16 text-xs text-[#6b6b6b] text-right">
                        {month.orders} orders
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className={`rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(35,25,10,0.12)] ${cardHover}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#2a2927]">
                    Recent Orders
                  </h2>
                  <p className="text-sm text-[#8b7b69]">
                    Your latest orders with real-time status updates
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-xs text-[#8b7b69]">
                    {isConnected ? "Live" : "Offline"}
                  </span>
                </div>
              </div>

              {recentOrders.length === 0 ? (
                <div className="text-center py-10 text-[#8b7b69]">
                  <HiShoppingBag className="text-4xl mx-auto mb-2 opacity-60" />
                  <p>No orders yet</p>
                  <button
                    onClick={() => router.push("/product")}
                    className="mt-4 text-sm font-semibold text-[#1f7a6b] underline decoration-[#1f7a6b]/50"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => {
                    const statusColors: Record<string, string> = {
                      APPROVAL_PENDING: "bg-violet-100 text-violet-800",
                      PENDING: "bg-yellow-100 text-yellow-800",
                      PREPARING: "bg-orange-100 text-orange-800",
                      READY_FOR_HANDOFF: "bg-emerald-100 text-emerald-800",
                      DISPATCH_ASSIGNED: "bg-cyan-100 text-cyan-800",
                      OUT_FOR_DELIVERY: "bg-blue-100 text-blue-800",
                      PICKUP_READY: "bg-lime-100 text-lime-800",
                      PICKED_UP: "bg-teal-100 text-teal-800",
                      DELIVERED: "bg-indigo-100 text-indigo-800",
                      COMPLETED: "bg-green-100 text-green-800",
                      HOLD: "bg-rose-100 text-rose-800",
                      CANCELLED: "bg-red-100 text-red-800",
                      Pending: "bg-yellow-100 text-yellow-800",
                      Preparing: "bg-orange-100 text-orange-800",
                      Ready: "bg-green-100 text-green-800",
                      Delivered: "bg-blue-100 text-blue-800",
                      Cancelled: "bg-red-100 text-red-800",
                    };
                    const statusLabel = String(order.status || "")
                      .replace(/_/g, " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (char) => char.toUpperCase());

                    return (
                      <div
                        key={order._id}
                        className="flex items-center justify-between rounded-2xl border border-[#efe5d8] bg-[#fbf7f1] p-4 transition hover:-translate-y-0.5 hover:bg-[#f6efe6]"
                        onClick={() => router.push(`/orders/${order._id}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-[#2a2927]">
                              Order #{order._id.slice(-8).toUpperCase()}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                statusColors[order.status] ||
                                "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[#6b6b6b]">
                            <span className="flex items-center gap-1">
                              <HiClock className="text-xs" />
                              {format(order.createdAt)}
                            </span>
                            <span>•</span>
                            <span>{order.orderType}</span>
                            <span>•</span>
                            <span>
                              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-lg font-semibold text-[#2a2927]">
                            ₹{order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div
              className={`rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(35,25,10,0.12)] ${cardHover}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#2a2927]">
                  Quick Actions
                </h2>
                <HiCalendar className="text-xl text-[#c26b2d]" />
              </div>
              <div className="grid gap-3">
                <Link
                  href="/product"
                  className="flex items-center justify-between rounded-2xl border border-[#efe5d8] bg-[#fbf7f1] px-4 py-3 text-sm font-semibold text-[#2a2927] transition hover:-translate-y-0.5 hover:bg-[#f6efe6]"
                >
                  <span className="flex items-center gap-2">
                    <HiShoppingBag className="text-lg text-[#1f7a6b]" />
                    Explore Products
                  </span>
                  <span className="text-xs text-[#8b7b69]">Shop</span>
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center justify-between rounded-2xl border border-[#efe5d8] bg-[#fbf7f1] px-4 py-3 text-sm font-semibold text-[#2a2927] transition hover:-translate-y-0.5 hover:bg-[#f6efe6]"
                >
                  <span className="flex items-center gap-2">
                    <HiHeart className="text-lg text-red-500" />
                    Wishlist Vault
                  </span>
                  <span className="text-xs text-[#8b7b69]">Saved</span>
                </Link>
                <Link
                  href="/addresses"
                  className="flex items-center justify-between rounded-2xl border border-[#efe5d8] bg-[#fbf7f1] px-4 py-3 text-sm font-semibold text-[#2a2927] transition hover:-translate-y-0.5 hover:bg-[#f6efe6]"
                >
                  <span className="flex items-center gap-2">
                    <HiMap className="text-lg text-[#1f7a6b]" />
                    Delivery Addresses
                  </span>
                  <span className="text-xs text-[#8b7b69]">Manage</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center justify-between rounded-2xl border border-[#efe5d8] bg-[#fbf7f1] px-4 py-3 text-sm font-semibold text-[#2a2927] transition hover:-translate-y-0.5 hover:bg-[#f6efe6]"
                >
                  <span className="flex items-center gap-2">
                    <HiUser className="text-lg text-[#5b6470]" />
                    Profile Details
                  </span>
                  <span className="text-xs text-[#8b7b69]">Update</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center justify-between rounded-2xl border border-[#efe5d8] bg-[#fbf7f1] px-4 py-3 text-sm font-semibold text-[#2a2927] transition hover:-translate-y-0.5 hover:bg-[#f6efe6]"
                >
                  <span className="flex items-center gap-2">
                    <HiCog className="text-lg text-[#5b6470]" />
                    Account Settings
                  </span>
                  <span className="text-xs text-[#8b7b69]">Preferences</span>
                </Link>
              </div>
            </div>

            <div
              className={`rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(35,25,10,0.12)] ${cardHover}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#2a2927]">
                  Membership Tier
                </h2>
                <HiStar className="text-2xl text-[#f2b55f]" />
              </div>
              <div
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${
                  tierColors[analytics.membershipTier]
                }`}
              >
                {analytics.membershipTier}
              </div>
              <p className="mt-3 text-sm text-[#6b6b6b]">
                {analytics.membershipTier === "Bronze" && "Keep ordering to unlock Silver tier!"}
                {analytics.membershipTier === "Silver" && "You're on your way to Gold!"}
                {analytics.membershipTier === "Gold" && "Amazing! You're close to Platinum!"}
                {analytics.membershipTier === "Platinum" && "You're our top customer! 🎉"}
              </p>
            </div>

            <div
              className={`rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(35,25,10,0.12)] ${cardHover}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#2a2927]">
                  Visit Frequency
                </h2>
                <HiChartBar className="text-2xl text-[#1f7a6b]" />
              </div>
              <div
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${
                  frequencyColors[analytics.visitFrequency]
                }`}
              >
                {analytics.visitFrequency} Customer
              </div>
              <p className="mt-3 text-sm text-[#6b6b6b]">
                {analytics.visitFrequency === "New" && "Welcome! Start your journey with us."}
                {analytics.visitFrequency === "Occasional" && "You're getting to know us better!"}
                {analytics.visitFrequency === "Regular" && "You're a regular! We appreciate you."}
                {analytics.visitFrequency === "VIP" && "You're a VIP customer! Thank you for your loyalty!"}
              </p>
            </div>

            <div
              className={`rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(35,25,10,0.12)] ${cardHover}`}
            >
              <h2 className="text-lg font-semibold text-[#2a2927] mb-4">
                Purchase Streaks
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b6b6b]">Current Streak</span>
                  <span className="font-semibold text-[#c26b2d]">
                    {analytics.currentStreak} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b6b6b]">Longest Streak</span>
                  <span className="font-semibold text-[#5a3c8f]">
                    {analytics.longestStreak} days
                  </span>
                </div>
                {analytics.lastOrderDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6b6b6b]">Last Order</span>
                    <span className="text-sm text-[#8b7b69]">
                      {format(analytics.lastOrderDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(35,25,10,0.12)] ${cardHover}`}
            >
              <h2 className="text-lg font-semibold text-[#2a2927] mb-4">
                Preferences
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b6b6b]">Preferred Order Type</span>
                  <span className="font-semibold text-[#2a2927]">
                    {analytics.preferredOrderType || "N/A"}
                  </span>
                </div>
                {analytics.favoriteProducts.length > 0 && (
                  <div>
                    <span className="text-sm text-[#6b6b6b] block mb-2">
                      Favorite Products
                    </span>
                    <div className="space-y-2">
                      {analytics.favoriteProducts.slice(0, 3).map((fav, idx) => (
                        <div
                          key={idx}
                          className="rounded-2xl border border-[#efe5d8] bg-[#fbf7f1] px-3 py-2 text-sm text-[#4b4b4b]"
                        >
                          Product #{idx + 1} - Ordered {fav.orderCount} times
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {pointsHistory.length > 0 && (
              <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(35,25,10,0.12)]">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#2a2927]">
                  <HiGift className="text-xl text-[#1f7a6b]" />
                  Points Activity
                </h2>
                <div className="space-y-3">
                  {pointsHistory.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between rounded-2xl border border-[#efe5d8] bg-[#fbf7f1] p-4"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#2a2927]">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-[#8b7b69]">
                          {format(transaction.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-semibold ${
                            transaction.transactionType === "earned" ||
                            transaction.transactionType === "bonus"
                              ? "text-[#1f7a6b]"
                              : "text-[#c04b4b]"
                          }`}
                        >
                          {transaction.transactionType === "earned" ||
                          transaction.transactionType === "bonus"
                            ? "+"
                            : "-"}
                          {transaction.points.toLocaleString()}
                        </p>
                        <p className="text-xs text-[#8b7b69]">
                          Balance: {transaction.balance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Points Redemption Modal */}
      {loyaltyPoints && (
        <PointsRedemptionModal
          isOpen={showRedeemModal}
          onClose={() => setShowRedeemModal(false)}
          currentBalance={loyaltyPoints.balance}
          currencyValue={loyaltyPoints.currencyValue}
          rupeePerPoint={loyaltyPoints.rupeePerPoint}
          onRedeemSuccess={() => {
            fetchLoyaltyPoints();
            fetchPointsHistory();
          }}
        />
      )}
    </section>
  );
}
