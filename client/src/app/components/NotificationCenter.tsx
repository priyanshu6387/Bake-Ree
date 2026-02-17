"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useNotificationStore } from "../../store/notificationStore";
import {
  HiBell,
  HiX,
  HiShoppingBag,
  HiGift,
  HiSparkles,
  HiCog,
} from "react-icons/hi";
import { format } from "timeago.js";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Notification } from "@/types/notification";

type NotificationAudience = "user" | "kitchen" | "admin";
type NotificationCategoryId =
  | "all"
  | "my_orders"
  | "rewards"
  | "offers"
  | "account"
  | "incoming"
  | "approvals"
  | "prep"
  | "dispatch"
  | "orders"
  | "alerts"
  | "team"
  | "system_admin";

type NotificationCenterProps = {
  audience?: NotificationAudience;
};

const CATEGORY_CHIPS: Record<
  NotificationAudience,
  { id: NotificationCategoryId; label: string }[]
> = {
  user: [
    { id: "all", label: "All" },
    { id: "my_orders", label: "My Orders" },
    { id: "rewards", label: "Rewards" },
    { id: "offers", label: "Offers" },
    { id: "account", label: "Account" },
  ],
  kitchen: [
    { id: "all", label: "All" },
    { id: "incoming", label: "Incoming Orders" },
    { id: "approvals", label: "Admin Approvals" },
    { id: "prep", label: "Prep / Queue" },
    { id: "dispatch", label: "Dispatch" },
  ],
  admin: [
    { id: "all", label: "All" },
    { id: "orders", label: "Orders" },
    { id: "alerts", label: "Alerts / Exceptions" },
    { id: "team", label: "Team Ops" },
    { id: "system_admin", label: "System" },
  ],
};

const includesAny = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword));

const getCombinedText = (notification: Notification) =>
  `${notification.title} ${notification.message}`.toLowerCase();

const matchesCategory = (
  notification: Notification,
  category: NotificationCategoryId,
  audience: NotificationAudience
) => {
  if (category === "all") return true;

  const text = getCombinedText(notification);

  if (audience === "user") {
    if (category === "my_orders") {
      return (
        notification.type === "order" ||
        includesAny(text, ["order", "delivery", "pickup", "status", "shipped"])
      );
    }
    if (category === "rewards") {
      return (
        notification.type === "points" ||
        includesAny(text, ["reward", "points", "tier", "loyalty", "redeem"])
      );
    }
    if (category === "offers") {
      return (
        notification.type === "promotion" ||
        includesAny(text, ["offer", "promo", "promotion", "discount", "sale", "deal"])
      );
    }
    if (category === "account") {
      return (
        notification.type === "system" ||
        includesAny(text, ["account", "profile", "password", "security", "address", "settings"])
      );
    }
  }

  if (audience === "kitchen") {
    if (category === "incoming") {
      return (
        notification.type === "order" ||
        includesAny(text, ["new order", "incoming", "queue", "ticket"])
      );
    }
    if (category === "approvals") {
      return includesAny(text, ["approved", "approval", "admin", "permission", "hold"]);
    }
    if (category === "prep") {
      return includesAny(text, ["preparing", "ready", "kitchen", "station", "recipe", "allergen"]);
    }
    if (category === "dispatch") {
      return includesAny(text, ["dispatch", "handoff", "delivery", "rider", "pickup"]);
    }
  }

  if (audience === "admin") {
    if (category === "orders") {
      return notification.type === "order" || includesAny(text, ["order", "queue", "status"]);
    }
    if (category === "alerts") {
      return includesAny(text, ["alert", "exception", "delay", "risk", "critical", "issue", "stock", "hold"]);
    }
    if (category === "team") {
      return includesAny(text, ["kitchen", "delivery", "staff", "employee", "shift", "attendance"]);
    }
    if (category === "system_admin") {
      return notification.type === "system" || includesAny(text, ["system", "settings", "audit", "security", "integration"]);
    }
  }

  return false;
};

export default function NotificationCenter({ audience }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NotificationCategoryId>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  const resolvedAudience: NotificationAudience = useMemo(() => {
    if (audience) return audience;
    if (pathname?.startsWith("/kitchen")) return "kitchen";
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/ops")) return "admin";
    return "user";
  }, [audience, pathname]);

  const categoryChips = CATEGORY_CHIPS[resolvedAudience];

  useEffect(() => {
    setActiveCategory("all");
  }, [resolvedAudience]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <HiShoppingBag className="text-blue-500" />;
      case "points":
        return <HiGift className="text-purple-500" />;
      case "promotion":
        return <HiSparkles className="text-yellow-500" />;
      default:
        return <HiCog className="text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter((notification) =>
    matchesCategory(notification, activeCategory, resolvedAudience)
  );

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    } else if (notification.orderId) {
      router.push(`/confirmation?id=${notification.orderId}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative z-[90]" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full border border-[#e6dacb] bg-white/80 p-2 text-[#2a2927] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8f4ee]"
        aria-label="Notifications"
      >
        <HiBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#c04b4b] text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 rounded-3xl border border-white/80 bg-white/95 shadow-[0_25px_60px_rgba(35,25,10,0.18)] z-[120] max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#efe5d8] p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
                Inbox
              </p>
              <h3 className="text-lg font-semibold text-[#2a2927]">
                Notifications
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    markAllAsRead();
                    toast.success("All notifications marked as read");
                  }}
                  className="text-xs font-semibold text-[#1f7a6b] hover:text-[#176158] px-2 py-1"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#8b7b69] hover:text-[#1f7a6b]"
              >
                <HiX className="text-xl" />
              </button>
            </div>
          </div>

          <div className="border-b border-[#efe5d8] px-3 py-2">
            <div className="no-scrollbar flex gap-2 overflow-x-scroll pb-1">
              {categoryChips.map((category) => {
                const active = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-[#2a2927] bg-[#2a2927] text-white"
                        : "border-[#e6dacb] bg-white text-[#6b5f53] hover:bg-[#f6f1ea]"
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications List */}
          <div className="no-scrollbar flex-1 overflow-y-scroll">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-[#8b7b69]">
                <HiBell className="text-4xl mx-auto mb-2 opacity-60" />
                <p>No notifications in this category</p>
                <p className="text-sm mt-1">
                  Try another category or check back in a moment
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#efe5d8]">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition cursor-pointer ${
                      !notification.read ? "bg-[#fbf7f1]" : "bg-transparent"
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium ${
                                !notification.read
                                  ? "text-[#2a2927]"
                                  : "text-[#4b4b4b]"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <p className="text-xs text-[#6b6b6b] mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-[#8b7b69] mt-1">
                              {format(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-[#1f7a6b] rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                          toast.success("Notification removed");
                        }}
                        className="text-[#8b7b69] hover:text-[#c04b4b] transition ml-2"
                      >
                        <HiX className="text-sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-[#efe5d8]">
              <button
                onClick={() => {
                  clearAll();
                  toast.success("All notifications cleared");
                }}
                className="w-full text-sm font-semibold text-[#6b6b6b] hover:text-[#c04b4b] py-2"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
