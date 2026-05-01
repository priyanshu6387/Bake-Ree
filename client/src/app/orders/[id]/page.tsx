"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  HiCurrencyRupee,
  HiShoppingBag,
  HiClock,
  HiCheckCircle,
  HiXCircle,
} from "react-icons/hi";
import { TruckIcon } from "@heroicons/react/24/solid";
import { format } from "timeago.js";
import { AxiosError } from "axios";

interface OrderItem {
  product: {
    _id: string;
    name: string;
    image?: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  user?: {
    name?: string;
    email?: string;
  };
  items: OrderItem[];
  status: string;
  orderType: string;
  totalAmount: number;
  deliveryCharge?: number;
  specialInstructions?: string;
  createdAt: string;
  updatedAt?: string;
}

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Preparing: "bg-orange-100 text-orange-800 border-orange-300",
  Ready: "bg-green-100 text-green-800 border-green-300",
  Delivered: "bg-blue-100 text-blue-800 border-blue-300",
  Cancelled: "bg-red-100 text-red-800 border-red-300",
};

const statusIcons: Record<string, IconType> = {
  Pending: HiClock,
  Preparing: HiClock,
  Ready: HiCheckCircle,
  Delivered: HiCheckCircle,
  Cancelled: HiXCircle,
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to view order details");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setOrder(response.data);
    } catch (err: unknown) {
      console.error("Error fetching order:", err);
      const errorMessage =
        err instanceof AxiosError
          ? (err.response?.data as { message?: string } | undefined)?.message
          : undefined;
      setError(errorMessage || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-[#f3f2ec] px-4 py-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-[#2a2927]">Loading order details...</p>
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="min-h-screen bg-[#f3f2ec] px-4 py-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error || "Order not found"}</p>
          <Link
            href="/dashboard"
            className="text-purple-600 hover:text-purple-700 underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>
    );
  }

  const StatusIcon = statusIcons[order.status] || HiClock;
  const subtotal = order.totalAmount - (order.deliveryCharge || 0);

  return (
    <section className="min-h-screen bg-[#f3f2ec] px-4 py-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-purple-600 hover:text-purple-700 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#2a2927]">
            Order Details
          </h1>
          <p className="text-gray-600">
            Order #{order._id.slice(-8).toUpperCase()}
          </p>
        </div>

        {/* Status Card */}
        <div
          className={`bg-white rounded-2xl p-6 shadow-md border-2 mb-6 ${statusColors[order.status] || "border-gray-300"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StatusIcon className="text-4xl" />
              <div>
                <h2 className="text-xl font-bold">Order {order.status}</h2>
                <p className="text-sm opacity-80">
                  Placed {format(order.createdAt)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Order Type</p>
              <p className="font-bold text-lg">{order.orderType}</p>
            </div>
          </div>
          {order.orderType === "Delivery" && order.status !== "Cancelled" && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href={`/track/${order._id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <TruckIcon className="h-5 w-5" />
                Track Order
              </Link>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-[#2a2927] mb-6">
          <h2 className="text-xl font-semibold text-[#2a2927] mb-4 flex items-center gap-2">
            <HiShoppingBag className="text-2xl" />
            Order Items
          </h2>
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  {item.product?.image && (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-medium text-[#2a2927]">
                      {item.product?.name || "Product"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold text-[#2a2927]">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-[#2a2927] mb-6">
          <h2 className="text-xl font-semibold text-[#2a2927] mb-4 flex items-center gap-2">
            <HiCurrencyRupee className="text-2xl" />
            Order Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {order.deliveryCharge && order.deliveryCharge > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge</span>
                <span>₹{order.deliveryCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-[#2a2927] pt-3 border-t">
              <span>Total</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="bg-white rounded-2xl p-6 shadow-md border border-[#2a2927] mb-6">
            <h2 className="text-xl font-semibold text-[#2a2927] mb-2">
              Special Instructions
            </h2>
            <p className="text-gray-600">{order.specialInstructions}</p>
          </div>
        )}

        {/* Order Info */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-[#2a2927]">
          <h2 className="text-xl font-semibold text-[#2a2927] mb-4">
            Order Information
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-mono">{order._id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Placed:</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            {order.updatedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span>{new Date(order.updatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/dashboard"
            className="flex-1 px-6 py-3 rounded-full border border-[#2a2927] text-[#2a2927] text-center hover:bg-[#2a2927] hover:text-white transition-all"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/product"
            className="flex-1 px-6 py-3 rounded-full bg-[#2a2927] text-white text-center hover:bg-white hover:text-[#2a2927] hover:border hover:border-[#2a2927] transition-all"
          >
            Order Again
          </Link>
        </div>
      </div>
    </section>
  );
}

