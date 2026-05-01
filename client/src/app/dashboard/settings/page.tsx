"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { AxiosError } from "axios";
import { HiBell, HiMail, HiDeviceMobile, HiCheck } from "react-icons/hi";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useNotificationStore } from "../../../store/notificationStore";

interface NotificationPreferences {
  email: {
    orderUpdates: boolean;
    promotions: boolean;
    pointsEarned: boolean;
    tierUpgrades: boolean;
  };
  inApp: {
    orderUpdates: boolean;
    promotions: boolean;
    pointsEarned: boolean;
    tierUpgrades: boolean;
  };
  push: {
    orderUpdates: boolean;
    promotions: boolean;
    pointsEarned: boolean;
    tierUpgrades: boolean;
  };
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPreferences();
  }, []);

  // Load preferences into store when component mounts
  useEffect(() => {
    if (preferences) {
      const { setPreferences } = useNotificationStore.getState();
      setPreferences(preferences);
    }
  }, [preferences]);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/notification-preferences",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPreferences(response.data);
    } catch (error: unknown) {
      console.error("Error fetching preferences:", error);
      toast.error("Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (
    channel: "email" | "inApp" | "push",
    type: "orderUpdates" | "promotions" | "pointsEarned" | "tierUpgrades",
    value: boolean
  ) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      [channel]: {
        ...preferences[channel],
        [type]: value,
      },
    });
  };

  const handleToggle = async (
    channel: "email" | "inApp" | "push",
    type: "orderUpdates" | "promotions" | "pointsEarned" | "tierUpgrades"
  ) => {
    if (!preferences) return;

    const nextValue = !preferences[channel][type];
    if (channel === "push" && nextValue) {
      if (typeof window === "undefined" || !("Notification" in window)) {
        toast.error("Push notifications are not supported on this device.");
        return;
      }

      if (Notification.permission === "denied") {
        toast.error("Push notifications are blocked in your browser.");
        return;
      }

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Push permission not granted.");
          return;
        }
      }
    }

    updatePreference(channel, type, nextValue);
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      await axios.put(
        "http://localhost:5000/api/notification-preferences",
        preferences,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Notification preferences saved successfully!");
      
      // Update notification store preferences
      const { setPreferences } = useNotificationStore.getState();
      setPreferences(preferences);
    } catch (error: unknown) {
      console.error("Error saving preferences:", error);
      const errorMessage =
        error instanceof AxiosError
          ? (error.response?.data as { error?: string } | undefined)?.error
          : undefined;
      toast.error(errorMessage || "Failed to save notification preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-[#f3f2ec] px-4 py-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-[#2a2927]">Loading preferences...</p>
        </div>
      </section>
    );
  }

  if (!preferences) {
    return null;
  }

  const notificationTypes = [
    {
      key: "orderUpdates" as const,
      label: "Order Updates",
      description: "Get notified when your order status changes",
    },
    {
      key: "promotions" as const,
      label: "Promotions & Offers",
      description: "Receive notifications about special deals and discounts",
    },
    {
      key: "pointsEarned" as const,
      label: "Points Earned",
      description: "Get notified when you earn loyalty points",
    },
    {
      key: "tierUpgrades" as const,
      label: "Tier Upgrades",
      description: "Notifications when you upgrade to a new membership tier",
    },
  ];

  const channels = [
    {
      key: "email" as const,
      label: "Email",
      icon: HiMail,
      description: "Receive notifications via email",
    },
    {
      key: "inApp" as const,
      label: "In-App",
      icon: HiBell,
      description: "Show notifications in the app",
    },
    {
      key: "push" as const,
      label: "Push Notifications",
      icon: HiDeviceMobile,
      description: "Browser push notifications (requires permission)",
    },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f6efe6] px-4 py-24">
      <div className="pointer-events-none absolute -top-32 left-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(31,122,107,0.18),_rgba(31,122,107,0)_70%)]" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-4rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(242,181,95,0.22),_rgba(242,181,95,0)_70%)]" />
      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#1f7a6b] hover:text-[#176158]"
          >
            ← Back
          </button>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e6dacb] bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b4f2a]">
            Account Settings
          </span>
          <h1 className="mt-4 text-4xl font-semibold text-[#2a2927] mb-2 sm:text-5xl">
            Notification Preferences
          </h1>
          <p className="text-sm text-[#6b6b6b] sm:text-base">
            Choose how you want to receive notifications
          </p>
        </div>

        {/* Preferences Table */}
        <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_25px_60px_rgba(35,25,10,0.12)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#efe5d8]">
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
                    Notification Type
                  </th>
                  {channels.map((channel) => (
                    <th
                      key={channel.key}
                      className="text-center p-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <channel.icon className="text-2xl text-[#1f7a6b]" />
                        <span>{channel.label}</span>
                        <span className="text-[11px] font-normal text-[#8b7b69]">
                          {channel.description}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {notificationTypes.map((type) => (
                  <tr
                    key={type.key}
                    className="border-b border-[#f1e7db] hover:bg-[#fbf7f1]"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-[#2a2927]">{type.label}</p>
                        <p className="text-sm text-[#8b7b69]">{type.description}</p>
                      </div>
                    </td>
                    {channels.map((channel) => (
                      <td key={channel.key} className="p-4 text-center">
                        <button
                          onClick={() => handleToggle(channel.key, type.key)}
                          className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all ${
                            preferences[channel.key][type.key]
                              ? "border-[#1f7a6b] bg-[#1f7a6b] text-white"
                              : "border-[#e6dacb] bg-white text-[#8b7b69] hover:bg-[#f8f4ee]"
                          }`}
                        >
                          {preferences[channel.key][type.key] && (
                            <HiCheck className="text-xl" />
                          )}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-[#1f7a6b] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#176158] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-2xl border border-[#e6dacb] bg-[#fbf7f1] p-4">
          <p className="text-sm text-[#6b6b6b]">
            <strong>Note:</strong> Email notifications are sent automatically for order
            confirmations. These preferences control additional notification types. Push
            notifications require browser permission.
          </p>
        </div>
      </div>
    </section>
  );
}
