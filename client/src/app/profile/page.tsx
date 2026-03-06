"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { BASE_URL } from "@/services/http";
import {
  HiUser,
  HiMail,
  HiPhone,
  HiLockClosed,
  HiCheckCircle,
  HiLocationMarker,
  HiEye,
  HiEyeOff,
} from "react-icons/hi";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    allergiesInput: "",
    allergyNotes: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const parseAllergies = (input: string) =>
    input
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfileForm({
        name: response.data.name || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        allergiesInput: Array.isArray(response.data?.allergyPreferences?.allergies)
          ? response.data.allergyPreferences.allergies.join(", ")
          : "",
        allergyNotes: response.data?.allergyPreferences?.notes || "",
      });
    } catch (error: unknown) {
      console.error("Error fetching profile:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        allergyPreferences: {
          allergies: parseAllergies(profileForm.allergiesInput),
          notes: profileForm.allergyNotes.trim(),
        },
      };
      await axios.put(
        `${BASE_URL}/api/auth/profile`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Profile updated successfully!");
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error
        : null;
      toast.error(message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/api/auth/change-password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: unknown) {
      console.error("Error changing password:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error
        : null;
      toast.error(message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-[#f3f2ec] px-4 py-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-[#2a2927]">Loading profile...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f7f3ec] px-4 py-24">
      <div className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(31,122,107,0.22),_rgba(31,122,107,0)_68%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(246,196,125,0.28),_rgba(246,196,125,0)_70%)]" />
      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e7d9c8] bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b4f2a]">
              Account
            </span>
            <h1 className="mt-4 text-4xl font-semibold text-[#2a2927] sm:text-5xl">
              My Profile
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#6b6b6b] sm:text-base">
              Manage your account details, preferences, and security from one
              place.
            </p>
          </div>
          <Link
            href="/addresses"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d3c5b4] bg-white/90 px-5 py-2 text-sm font-semibold text-[#1f7a6b] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
          >
            <HiLocationMarker className="text-lg" />
            Manage Delivery Addresses
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-3 rounded-full border border-[#e6dacb] bg-white/80 p-2 shadow-sm backdrop-blur">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 rounded-full px-5 py-3 text-sm font-semibold transition ${
              activeTab === "profile"
                ? "bg-[#1f7a6b] text-white shadow"
                : "text-[#4b4b4b] hover:text-[#1f7a6b]"
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`flex-1 rounded-full px-5 py-3 text-sm font-semibold transition ${
              activeTab === "password"
                ? "bg-[#1f7a6b] text-white shadow"
                : "text-[#4b4b4b] hover:text-[#1f7a6b]"
            }`}
          >
            Change Password
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-[0_25px_60px_rgba(35,25,10,0.12)] backdrop-blur">
            <h2 className="text-2xl font-semibold text-[#2a2927] mb-2">
              Personal Information
            </h2>
            <p className="mb-8 text-sm text-[#7a746d]">
              Update the information we use for receipts and delivery.
            </p>
            <form
              onSubmit={handleProfileSubmit}
              className="grid gap-6 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69] mb-2">
                  <HiUser className="inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69] mb-2">
                  <HiMail className="inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69] mb-2">
                  <HiPhone className="inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69] mb-2">
                  Allergy Preferences
                </label>
                <input
                  type="text"
                  value={profileForm.allergiesInput}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, allergiesInput: e.target.value })
                  }
                  className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
                  placeholder="e.g. nuts, dairy, gluten"
                />
                <p className="mt-1 text-xs text-[#7a746d]">
                  These defaults are auto-filled during checkout and shown in kitchen.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69] mb-2">
                  Allergy Notes
                </label>
                <textarea
                  rows={3}
                  value={profileForm.allergyNotes}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, allergyNotes: e.target.value })
                  }
                  className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
                  placeholder="Cross-contamination risk, severe reactions, etc."
                />
              </div>

              <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[#1f7a6b] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#176158] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="rounded-full border border-[#d3c5b4] bg-white px-6 py-3 text-sm font-semibold text-[#4b4b4b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8f4ee]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <div className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-[0_25px_60px_rgba(35,25,10,0.12)] backdrop-blur">
            <h2 className="text-2xl font-semibold text-[#2a2927] mb-2">
              Change Password
            </h2>
            <p className="mb-8 text-sm text-[#7a746d]">
              Use a strong password to keep your account secure.
            </p>
            <form
              onSubmit={handlePasswordSubmit}
              className="space-y-6 max-w-2xl"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69] mb-2">
                  <HiLockClosed className="inline mr-2" />
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 pr-12 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        current: !prev.current,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7b69] transition hover:text-[#1f7a6b]"
                    aria-label={
                      showPasswords.current
                        ? "Hide current password"
                        : "Show current password"
                    }
                  >
                    {showPasswords.current ? (
                      <HiEyeOff className="text-xl" />
                    ) : (
                      <HiEye className="text-xl" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69] mb-2">
                  <HiLockClosed className="inline mr-2" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.next ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 pr-12 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        next: !prev.next,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7b69] transition hover:text-[#1f7a6b]"
                    aria-label={
                      showPasswords.next
                        ? "Hide new password"
                        : "Show new password"
                    }
                  >
                    {showPasswords.next ? (
                      <HiEyeOff className="text-xl" />
                    ) : (
                      <HiEye className="text-xl" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#8b7b69] mt-2">
                  Must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69] mb-2">
                  <HiCheckCircle className="inline mr-2" />
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 pr-12 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7b69] transition hover:text-[#1f7a6b]"
                    aria-label={
                      showPasswords.confirm
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showPasswords.confirm ? (
                      <HiEyeOff className="text-xl" />
                    ) : (
                      <HiEye className="text-xl" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[#1f7a6b] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#176158] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Changing..." : "Change Password"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="rounded-full border border-[#d3c5b4] bg-white px-6 py-3 text-sm font-semibold text-[#4b4b4b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8f4ee]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
