"use client";

import { useState } from "react";
import axios from "axios";
import { HiX, HiGift, HiCurrencyRupee } from "react-icons/hi";
import toast from "react-hot-toast";
import { useNotificationStore } from "../../store/notificationStore";

interface PointsRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  currencyValue: number;
  rupeePerPoint: number;
  onRedeemSuccess: () => void;
}

export default function PointsRedemptionModal({
  isOpen,
  onClose,
  currentBalance,
  currencyValue,
  rupeePerPoint,
  onRedeemSuccess,
}: PointsRedemptionModalProps) {
  const [pointsToRedeem, setPointsToRedeem] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotificationStore();

  if (!isOpen) return null;

  const points = parseInt(pointsToRedeem) || 0;
  const discountAmount = (points / rupeePerPoint).toFixed(2);
  const isValid = points > 0 && points <= currentBalance && points >= rupeePerPoint;

  const handleRedeem = async () => {
    if (!isValid) {
      toast.error("Please enter a valid amount of points to redeem");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to redeem points");
        return;
      }

      await axios.post(
        "http://localhost:5000/api/loyalty-points/redeem",
        {
          points: points,
          description: description || `Redeemed ${points} points for discount`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`Successfully redeemed ${points} points!`);
      addNotification({
        type: "points",
        title: "Points redeemed",
        message: `You redeemed ${points} points for ₹${discountAmount}.`,
        link: "/dashboard",
      });
      setPointsToRedeem("");
      setDescription("");
      onRedeemSuccess();
      onClose();
    } catch (error: unknown) {
      console.error("Error redeeming points:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error
        : null;
      toast.error(message || "Failed to redeem points. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickRedeemOptions = [
    { label: "₹10", points: 1000 },
    { label: "₹25", points: 2500 },
    { label: "₹50", points: 5000 },
    { label: "₹100", points: 10000 },
  ].filter((option) => option.points <= currentBalance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_30px_80px_rgba(35,25,10,0.28)]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5ede3] text-[#1f7a6b]">
              <HiGift className="text-2xl" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
                Rewards
              </p>
              <h2 className="text-2xl font-semibold text-[#2a2927]">
                Redeem Points
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-[#e7d9c8] p-2 text-[#8b7b69] transition hover:bg-[#f8f4ee] hover:text-[#1f7a6b]"
            aria-label="Close modal"
          >
            <HiX className="text-xl" />
          </button>
        </div>

        {/* Current Balance */}
        <div className="mb-6 rounded-2xl border border-white/60 bg-gradient-to-br from-[#1f7a6b] via-[#2f8f7f] to-[#f2b55f] p-4 text-white shadow-[0_16px_40px_rgba(35,25,10,0.2)]">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">
            Available points
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {currentBalance.toLocaleString()}
          </p>
          <p className="text-sm text-white/80">
            ≈ ₹{currencyValue.toFixed(2)} value
          </p>
        </div>

        {/* Quick Redeem Options */}
        {quickRedeemOptions.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
              Quick picks
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickRedeemOptions.map((option) => (
                <button
                  key={option.points}
                  onClick={() => setPointsToRedeem(option.points.toString())}
                  className="rounded-full border border-[#d3c5b4] bg-white px-3 py-2 text-xs font-semibold text-[#4b4b4b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8f4ee]"
                >
                  {option.label} · {option.points.toLocaleString()} pts
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Points Input */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
            Points to redeem
          </label>
          <input
            type="number"
            value={pointsToRedeem}
            onChange={(e) => setPointsToRedeem(e.target.value)}
            placeholder="Enter points to redeem"
            min={rupeePerPoint}
            max={currentBalance}
            step={rupeePerPoint}
            className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
          />
          <p className="mt-2 text-xs text-[#8b7b69]">
            Minimum: {rupeePerPoint} points (₹1)
          </p>
        </div>

        {/* Discount Amount Preview */}
        {points > 0 && (
          <div className="mb-4 rounded-2xl border border-[#cfe7dd] bg-[#eef8f3] p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#4b4b4b]">Discount Amount</span>
              <span className="flex items-center gap-1 text-lg font-semibold text-[#1f7a6b]">
                <HiCurrencyRupee />
                {discountAmount}
              </span>
            </div>
          </div>
        )}

        {/* Description (Optional) */}
        <div className="mb-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Discount for next order"
            className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
          />
        </div>

        {/* Error Messages */}
        {points > currentBalance && (
          <div className="mb-4 rounded-2xl border border-[#f2b9b9] bg-[#ffecec] p-3">
            <p className="text-sm text-[#c04b4b]">
              You do not have enough points. Available: {currentBalance.toLocaleString()}
            </p>
          </div>
        )}

        {points > 0 && points < rupeePerPoint && (
          <div className="mb-4 rounded-2xl border border-[#f1d37a] bg-[#fff1d6] p-3">
            <p className="text-sm text-[#8a5a12]">
              Minimum redemption is {rupeePerPoint} points (₹1)
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-[#d3c5b4] bg-white px-4 py-2 text-sm font-semibold text-[#4b4b4b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8f4ee]"
          >
            Cancel
          </button>
          <button
            onClick={handleRedeem}
            disabled={!isValid || loading}
            className="flex-1 rounded-full bg-[#1f7a6b] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#176158] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Redeeming..." : "Redeem Points"}
          </button>
        </div>

        {/* Info */}
        <p className="mt-4 text-center text-xs text-[#8b7b69]">
          Redeemed points will be converted to discount codes that can be used on your next order.
        </p>
      </div>
    </div>
  );
}
