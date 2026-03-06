"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "../../store/cartStore";
import { HiOutlineTrash } from "react-icons/hi";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import CouponsAPI from "@/services/coupons";
import axios from "axios";

const formatCouponError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Failed to process coupon"
    );
  }
  return "Failed to process coupon";
};

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    appliedCoupon,
    setAppliedCoupon,
    clearAppliedCoupon,
  } = useCartStore();

  const [promoCodeInput, setPromoCodeInput] = useState(appliedCoupon?.code || "");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const appliedCouponCode = appliedCoupon?.code || "";
  const couponApplied = Boolean(appliedCouponCode);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = +(subtotal * 0.05).toFixed(2);

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;

    if (appliedCoupon.discountType === "PERCENT") {
      let computed = subtotal * (appliedCoupon.discountValue / 100);
      if (appliedCoupon.maxDiscountAmount !== null) {
        computed = Math.min(computed, appliedCoupon.maxDiscountAmount);
      }
      return +computed.toFixed(2);
    }

    if (appliedCoupon.discountType === "FLAT") {
      return +Math.min(subtotal, appliedCoupon.discountValue).toFixed(2);
    }

    return +Math.min(subtotal, appliedCoupon.discountAmount || 0).toFixed(2);
  }, [appliedCoupon, subtotal]);

  const total = subtotal + tax - discount;

  const applyCoupon = async () => {
    if (!promoCodeInput.trim()) {
      toast.error("Enter a coupon code");
      return;
    }
    if (cart.length === 0) {
      toast.error("Add items before applying coupon");
      return;
    }

    try {
      setApplyingCoupon(true);
      const response = await CouponsAPI.validate({
        code: promoCodeInput.trim(),
        subtotal,
        orderType: "Pickup",
        deliveryCharge: 0,
      });

      setAppliedCoupon({
        code: response.coupon.code,
        couponId: response.coupon._id,
        discountType: response.pricing.discountType,
        discountValue: response.pricing.discountValue,
        maxDiscountAmount: response.pricing.maxDiscountAmount,
        discountAmount: response.pricing.discountAmount,
        reservationToken: null,
        reservationExpiresAt: null,
      });

      setPromoCodeInput(response.coupon.code);
      toast.success("Coupon applied");
    } catch (error: unknown) {
      toast.error(formatCouponError(error));
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = async () => {
    if (appliedCoupon?.reservationToken) {
      try {
        await CouponsAPI.release(appliedCoupon.reservationToken);
      } catch {
        // Best effort release.
      }
    }
    clearAppliedCoupon();
    setPromoCodeInput("");
    toast.success("Coupon removed");
  };

  const applyOrRemoveCoupon = async () => {
    if (couponApplied) {
      await removeCoupon();
      return;
    }
    await applyCoupon();
  };

  const handleProceedToCheckout = () => {
    const params = new URLSearchParams({
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      coupon: couponApplied ? appliedCoupon?.code || "" : "",
    });
    router.push(`/payment?${params.toString()}`);
  };

  useEffect(() => {
    setPromoCodeInput(appliedCouponCode);
  }, [appliedCouponCode]);

  useEffect(() => {
    if (!appliedCouponCode || cart.length === 0) return;

    let active = true;
    const revalidate = async () => {
      try {
        const response = await CouponsAPI.validate({
          code: appliedCouponCode,
          subtotal,
          orderType: "Pickup",
          deliveryCharge: 0,
        });

        if (!active) return;
        setAppliedCoupon({
          code: response.coupon.code,
          couponId: response.coupon._id,
          discountType: response.pricing.discountType,
          discountValue: response.pricing.discountValue,
          maxDiscountAmount: response.pricing.maxDiscountAmount,
          discountAmount: response.pricing.discountAmount,
          reservationToken: null,
          reservationExpiresAt: null,
        });
      } catch {
        if (!active) return;
        clearAppliedCoupon();
        setPromoCodeInput("");
        toast.error("Applied coupon became invalid and was removed");
      }
    };

    revalidate();
    return () => {
      active = false;
    };
  }, [appliedCouponCode, cart.length, subtotal, clearAppliedCoupon, setAppliedCoupon]);

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#f7f5f0] via-[#f3f2ec] to-[#efeee9] px-4 pt-36 pb-20">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
        <div className="flex-1">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-[#1f1d1a]">Cart Items</h2>
              <p className="text-sm text-[#6d665c]">
                {cart.length} item{cart.length !== 1 ? "s" : ""} in your bag
              </p>
            </div>
          </div>
          {cart.length === 0 ? (
            <div className="bg-white/80 border border-black/5 rounded-3xl p-10 text-center shadow-sm">
              <p className="text-[#2a2927] text-lg font-medium">Your cart is empty.</p>
              <p className="text-sm text-[#6d665c] mt-2">
                Explore fresh bakes and add your favorites.
              </p>
              <Link href="/product">
                <button className="mt-6 px-5 py-2.5 rounded-full border border-[#2a2927] text-[#2a2927] hover:bg-[#2a2927] hover:text-white transition">
                  Browse Products
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-black/5 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_10px_28px_rgba(20,15,10,0.06)]"
                >
                  <div className="flex items-center gap-4 w-full overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="rounded-2xl border border-black/10 flex-shrink-0 object-cover"
                    />
                    <div className="flex flex-col justify-center overflow-hidden">
                      <h3 className="font-semibold text-[#1f1d1a] text-base truncate max-w-[220px]">
                        {item.name}
                      </h3>
                      <p className="text-sm text-[#6a4b2a] font-medium">₹{item.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-4">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-9 h-9 text-[#2a2927] border border-[#d9d3c7] rounded-full hover:bg-[#2a2927] hover:text-white transition"
                      aria-label={`Decrease quantity for ${item.name}`}
                    >
                      −
                    </button>
                    <span className="text-[#2a2927] font-medium w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-9 h-9 text-[#2a2927] border border-[#d9d3c7] rounded-full hover:bg-[#2a2927] hover:text-white transition"
                      aria-label={`Increase quantity for ${item.name}`}
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        removeFromCart(item.id);
                        toast.success("Removed from cart");
                      }}
                      className="text-[#b44b3a] hover:text-[#8e3b2d] ml-2"
                      title="Remove"
                      aria-label={`Remove ${item.name}`}
                    >
                      <HiOutlineTrash className="text-xl" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-[360px] space-y-6">
          <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-[0_10px_28px_rgba(20,15,10,0.06)] space-y-4 lg:mt-12">
            <h3 className="text-xl font-semibold text-[#1f1d1a] mb-2">Order Summary</h3>
            <div className="flex justify-between text-sm text-[#2a2927]">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#2a2927]">
              <span>Tax (5%):</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            {couponApplied && (
              <div className="flex justify-between text-sm text-green-700">
                <span>
                  Discount
                  {appliedCoupon?.discountType === "PERCENT"
                    ? ` (${appliedCoupon.discountValue.toFixed(0)}%)`
                    : ""}:
                </span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <hr className="border-black/10" />
            <div className="flex justify-between font-semibold text-lg text-[#1f1d1a]">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <div className="flex gap-2 mt-4">
              <input
                type="text"
                value={couponApplied ? appliedCoupon?.code || "" : promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                placeholder="Promo code"
                className="flex-1 px-4 py-2.5 border border-black/10 rounded-full text-sm text-[#2a2927] bg-[#f8f7f4] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15"
                disabled={couponApplied || applyingCoupon}
              />
              <button
                onClick={applyOrRemoveCoupon}
                disabled={applyingCoupon}
                className={`${
                  couponApplied
                    ? "bg-green-700 hover:bg-green-800"
                    : "bg-[#2a2927] hover:bg-[#1f1d1a]"
                } text-white px-4 py-2.5 rounded-full text-sm transition disabled:opacity-60`}
              >
                {couponApplied ? "Remove Coupon" : applyingCoupon ? "Applying..." : "Apply"}
              </button>
            </div>
            <p className="text-xs text-[#6d665c] pt-1">
              Use your coupon code from offers, campaigns, or admin promotions.
            </p>
          </div>

          <button
            onClick={handleProceedToCheckout}
            className="w-full bg-[#2a2927] text-white py-3 rounded-full shadow-sm hover:bg-[#1f1d1a] transition font-medium"
          >
            Proceed to Checkout
          </button>

          <Link href="/#products">
            <button className="w-full border border-[#2a2927] text-[#2a2927] py-3 rounded-full hover:bg-[#2a2927] hover:text-white transition font-medium">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
