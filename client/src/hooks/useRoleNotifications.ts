"use client";

import { useEffect, useRef } from "react";
import useSocket from "./useSocket";
import { useNotificationStore } from "@/store/notificationStore";

type RoleRoom = "kitchen" | "admin";

type UseRoleNotificationsOptions = {
  playChimeOnAdminApproval?: boolean;
};

const IMPORTANT_STATUSES = new Set(["Preparing", "Ready", "HOLD", "Cancelled"]);

const getOrderCode = (order: { _id?: string } | undefined) =>
  order?._id ? `#${String(order._id).slice(-6).toUpperCase()}` : "order";

const playKitchenChime = () => {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const tones = [
    { freq: 880, start: 0, duration: 0.08 },
    { freq: 1174, start: 0.1, duration: 0.1 },
  ];

  tones.forEach((tone) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = tone.freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + tone.start);
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + tone.start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + tone.start + tone.duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + tone.start);
    osc.stop(ctx.currentTime + tone.start + tone.duration);
  });

  setTimeout(() => {
    ctx.close().catch(() => undefined);
  }, 500);
};

export default function useRoleNotifications(
  role: RoleRoom,
  options: UseRoleNotificationsOptions = {}
) {
  const { playChimeOnAdminApproval = false } = options;
  const { socket, isConnected } = useSocket({ room: role, enabled: true });
  const addNotification = useNotificationStore((state) => state.addNotification);
  const lastChimeAtRef = useRef(0);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const maybeChime = () => {
      if (!playChimeOnAdminApproval || role !== "kitchen") return;
      const now = Date.now();
      if (now - lastChimeAtRef.current < 1500) return;
      lastChimeAtRef.current = now;
      try {
        playKitchenChime();
      } catch {
        // Ignore browser audio errors silently
      }
    };

    const handleOrderCreated = (data: { order?: { _id?: string; totalAmount?: number } }) => {
      const code = getOrderCode(data.order);
      const total = typeof data.order?.totalAmount === "number" ? ` • Rs ${data.order.totalAmount}` : "";
      addNotification({
        type: "order",
        title: role === "kitchen" ? "New kitchen order" : "New order placed",
        message: `${code} is now in queue${total}`,
      });
    };

    const handleOrderApproved = (data: { order?: { _id?: string } }) => {
      const code = getOrderCode(data.order);
      addNotification({
        type: "system",
        title: "Order approved by admin",
        message: `${code} is approved and ready for kitchen action`,
      });
      maybeChime();
    };

    const handleOrderStatusUpdated = (data: {
      order?: { _id?: string };
      newStatus?: string;
      approvedByAdmin?: boolean;
    }) => {
      if (!data.newStatus || !IMPORTANT_STATUSES.has(data.newStatus)) return;
      if (data.approvedByAdmin) return;
      const code = getOrderCode(data.order);
      addNotification({
        type: "system",
        title: "Order status updated",
        message: `${code} moved to ${data.newStatus}`,
      });
    };

    socket.on("order:created", handleOrderCreated);
    socket.on("order:approved", handleOrderApproved);
    socket.on("order:statusUpdated", handleOrderStatusUpdated);

    return () => {
      socket.off("order:created", handleOrderCreated);
      socket.off("order:approved", handleOrderApproved);
      socket.off("order:statusUpdated", handleOrderStatusUpdated);
    };
  }, [socket, isConnected, addNotification, role, playChimeOnAdminApproval]);
}

