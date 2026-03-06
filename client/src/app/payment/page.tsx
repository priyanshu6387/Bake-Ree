"use client";

import { useCartStore } from "../../store/cartStore";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaStore } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { BASE_URL } from "@/services/http";
import CouponsAPI from "@/services/coupons";

interface Address {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface ProfileResponse {
  name?: string;
  email?: string;
  phone?: string;
  allergyPreferences?: {
    allergies?: string[];
    notes?: string;
  };
}

const ADDRESS_LABELS = ["Home", "Work", "Office", "Other"];

export default function PaymentPage() {
  const {
    cart,
    clearCart,
    appliedCoupon,
    setAppliedCoupon,
    setCouponReservation,
    clearAppliedCoupon,
  } = useCartStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [orderType, setOrderType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [locationDenied, setLocationDenied] = useState(false);
  const [manualPincode, setManualPincode] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(false);
  const [profileAllergies, setProfileAllergies] = useState<string[]>([]);
  const [checkoutAllergies, setCheckoutAllergies] = useState("");
  const [allergyNotes, setAllergyNotes] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const orderSubmissionInFlightRef = useRef(false);
  const orderPlacedRef = useRef(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardName: "",
  });
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotal = parseFloat(searchParams?.get("subtotal") || "0") || cartSubtotal;
  const tax = parseFloat(searchParams?.get("tax") || "0") || subtotal * 0.05;
  const deliveryCharge = orderType === "delivery" ? deliveryFee : 0;
  const discount = (() => {
    if (appliedCoupon) {
      if (appliedCoupon.discountType === "PERCENT") {
        let value = subtotal * (appliedCoupon.discountValue / 100);
        if (appliedCoupon.maxDiscountAmount !== null) {
          value = Math.min(value, appliedCoupon.maxDiscountAmount);
        }
        return +value.toFixed(2);
      }
      if (appliedCoupon.discountType === "FLAT") {
        return +Math.min(subtotal, appliedCoupon.discountValue).toFixed(2);
      }
      return orderType === "delivery"
        ? +Math.min(deliveryCharge, appliedCoupon.discountAmount).toFixed(2)
        : 0;
    }
    return parseFloat(searchParams?.get("discount") || "0");
  })();
  const total = subtotal + tax - discount + deliveryCharge;

  const bakeryLocation = {
    lat: 28.5702,
    lng: 77.3268,
  };

  // Fetch user's location and calculate delivery distance
  useEffect(() => {
    if (orderType === "delivery") {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const dist = await getDistance(userLat, userLng);
            calculateDeliveryCharge(dist);
          },
          () => {
            setLocationDenied(true);
          }
        );
      } else {
        setLocationDenied(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderType]);

  useEffect(() => {
    const loadProfileAndAddresses = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const [profileResponse, addressResponse] = await Promise.all([
          axios.get(`${BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/api/addresses`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const user: ProfileResponse = profileResponse.data;
        const nameParts = (user?.name || "").trim().split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ");

        setForm((prev) => ({
          ...prev,
          firstName: prev.firstName || firstName,
          lastName: prev.lastName || lastName,
          email: prev.email || user?.email || "",
          phone: prev.phone || user?.phone || "",
        }));

        setAddressForm((prev) => ({
          ...prev,
          fullName: prev.fullName || user?.name || "",
          phone: prev.phone || user?.phone || "",
        }));

        const preferredAllergies = Array.isArray(user?.allergyPreferences?.allergies)
          ? user.allergyPreferences.allergies
          : [];
        setProfileAllergies(preferredAllergies);
        if (preferredAllergies.length > 0) {
          setCheckoutAllergies(preferredAllergies.join(", "));
        }
        if (user?.allergyPreferences?.notes) {
          setAllergyNotes(user.allergyPreferences.notes);
        }

        const loadedAddresses = Array.isArray(addressResponse.data)
          ? addressResponse.data
          : [];
        setAddresses(loadedAddresses);
        if (loadedAddresses.length > 0) {
          const defaultAddress =
            loadedAddresses.find((address: Address) => address.isDefault) ||
            loadedAddresses[0];
          setSelectedAddressId(defaultAddress._id);
        } else {
          setShowAddressForm(true);
        }
      } catch (error: unknown) {
        console.error("Error loading checkout profile:", error);
        toast.error("Failed to load saved details");
      }
    };

    loadProfileAndAddresses();
  }, []);

  const getDistance = async (lat: number, lng: number) => {
    const apiKey = "YOUR_GOOGLE_API_KEY"; // 🔐 Replace with actual key

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=${bakeryLocation.lat},${bakeryLocation.lng}&key=${apiKey}`
      );

      const data = await response.json();
      const distanceText =
        data?.rows?.[0]?.elements?.[0]?.distance?.text || "0";
      const distance = parseFloat(distanceText.replace(" km", "").trim());
      return distance;
    } catch (err) {
      console.error("Error calculating distance:", err);
      return 0;
    }
  };

  const calculateDeliveryCharge = (distance: number) => {
    setDeliveryDistance(distance);
    if (distance <= 2) {
      setDeliveryFee(0);
    } else {
      const charge = Math.ceil(distance - 2) * 10;
      setDeliveryFee(charge);
    }
  };

  useEffect(() => {
    if (orderPlacedRef.current || orderSubmissionInFlightRef.current) return;
    if (orderPlaced) return;
    if (cart.length === 0) router.replace("/cart");
  }, [cart.length, orderPlaced, router]);

  useEffect(() => {
    if (orderType === "delivery") return;
    setErrors((prev) => ({ ...prev, deliveryAddress: false }));
    setShowAddressForm(false);
  }, [orderType]);

  useEffect(() => {
    if (orderType !== "delivery") return;
    if (selectedAddressId) return;
    if (addresses.length === 0) {
      setShowAddressForm(true);
      return;
    }
    const defaultAddress =
      addresses.find((address) => address.isDefault) || addresses[0];
    setSelectedAddressId(defaultAddress._id);
  }, [addresses, orderType, selectedAddressId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddressInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleUseNewAddress = async () => {
    const nextErrors = {
      label: !addressForm.label.trim(),
      fullName: !addressForm.fullName.trim(),
      phone: !addressForm.phone.trim(),
      addressLine1: !addressForm.addressLine1.trim(),
      city: !addressForm.city.trim(),
      state: !addressForm.state.trim(),
      postalCode: !addressForm.postalCode.trim(),
      country: !addressForm.country.trim(),
    };

    setAddressErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) return;

    if (saveAddressToProfile) {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to save this address");
        return;
      }

      try {
        const response = await axios.post(
          `${BASE_URL}/api/addresses`,
          { ...addressForm, isDefault: false },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const savedAddress = response.data?.address;
        if (savedAddress?._id) {
          setAddresses((prev) => [savedAddress, ...prev]);
          setSelectedAddressId(savedAddress._id);
          setErrors((prev) => ({ ...prev, deliveryAddress: false }));
          setShowAddressForm(false);
          setSaveAddressToProfile(false);
          setAddressForm({
            label: "Home",
            fullName: form.firstName
              ? `${form.firstName} ${form.lastName}`.trim()
              : addressForm.fullName,
            phone: form.phone || addressForm.phone,
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            postalCode: "",
            country: "India",
          });
          toast.success("Address saved to your profile");
        }
      } catch (error: unknown) {
        console.error("Error saving address:", error);
        const message = axios.isAxiosError(error)
          ? error.response?.data?.error
          : null;
        toast.error(message || "Failed to save address");
      }
      return;
    }

    setSelectedAddressId("manual");
    setErrors((prev) => ({ ...prev, deliveryAddress: false }));
    toast.success("Address added for this order");
  };

  const [errors, setErrors] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    cardNumber: false,
    expiry: false,
    cvv: false,
    cardName: false,
    orderType: false,
    deliveryAddress: false,
  });
  const [addressErrors, setAddressErrors] = useState({
    label: false,
    fullName: false,
    phone: false,
    addressLine1: false,
    city: false,
    state: false,
    postalCode: false,
    country: false,
  });

  const parseAllergyInput = (value: string) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

  const resolveCouponError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.error || error.response?.data?.message || "Failed to apply coupon";
    }
    return "Failed to apply coupon";
  };

  const handleOrder = async () => {
    const needsDeliveryAddress =
      orderType === "delivery" && !selectedAddressId;
    const newErrors = {
      firstName: !form.firstName.trim(),
      lastName: !form.lastName.trim(),
      email: !form.email.trim(),
      phone: !form.phone.trim(),
      orderType: !orderType,
      deliveryAddress: needsDeliveryAddress,
      cardNumber: paymentMethod === "card" ? !form.cardNumber.trim() : false,
      expiry: paymentMethod === "card" ? !form.expiry.trim() : false,
      cvv: paymentMethod === "card" ? !form.cvv.trim() : false,
      cardName: paymentMethod === "card" ? !form.cardName.trim() : false,
    };

    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      router.push("/cart");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to place your order");
      router.push("/login");
      return;
    }

    const missingProduct = cart.find((item) => !item.productId);
    if (missingProduct) {
      toast.error("Cart contains invalid items. Please re-add products.");
      return;
    }

    if (orderType === "delivery" && selectedAddressId === "manual") {
      const manualErrors = {
        label: !addressForm.label.trim(),
        fullName: !addressForm.fullName.trim(),
        phone: !addressForm.phone.trim(),
        addressLine1: !addressForm.addressLine1.trim(),
        city: !addressForm.city.trim(),
        state: !addressForm.state.trim(),
        postalCode: !addressForm.postalCode.trim(),
        country: !addressForm.country.trim(),
      };
      setAddressErrors(manualErrors);
      if (Object.values(manualErrors).some(Boolean)) {
        toast.error("Please complete delivery address details");
        return;
      }
    }

    const allergies = parseAllergyInput(checkoutAllergies);
    const effectiveAllergies = allergies.length > 0 ? allergies : profileAllergies;

    let couponReservationToken: string | null = null;
    let finalDiscount = 0;

    if (appliedCoupon?.code) {
      try {
        const reservation = await CouponsAPI.reserve({
          code: appliedCoupon.code,
          subtotal,
          orderType: orderType === "delivery" ? "Delivery" : "Pickup",
          deliveryCharge,
          cartItemsCount: cart.length,
        });

        couponReservationToken = reservation.reservationToken;
        finalDiscount = Number(reservation.pricing.discountAmount || 0);
        setCouponReservation(reservation.reservationToken, reservation.expiresAt);
        setAppliedCoupon({
          code: reservation.coupon.code,
          couponId: reservation.coupon._id,
          discountType: reservation.pricing.discountType,
          discountValue: reservation.pricing.discountValue,
          maxDiscountAmount: reservation.pricing.maxDiscountAmount,
          discountAmount: reservation.pricing.discountAmount,
          reservationToken: reservation.reservationToken,
          reservationExpiresAt: reservation.expiresAt,
        });
      } catch (couponError: unknown) {
        clearAppliedCoupon();
        toast.error(resolveCouponError(couponError));
        return;
      }
    }

    const payload: Record<string, unknown> = {
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      simplifiedItems: cart.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      orderType: orderType === "delivery" ? "Delivery" : "Pickup",
      paymentMethod: paymentMethod === "cod" ? "COD" : "CARD",
      specialInstructions: specialInstructions.trim(),
      allergies: effectiveAllergies,
      allergyNotes: allergyNotes.trim(),
      discount: finalDiscount,
      tax,
      deliveryCharge,
      requiresApproval: true,
      couponReservationToken,
    };

    if (orderType === "delivery") {
      if (selectedAddressId && selectedAddressId !== "manual") {
        payload.deliveryAddressId = selectedAddressId;
      } else {
        payload.deliveryAddress = {
          recipientName: addressForm.fullName,
          fullName: addressForm.fullName,
          phone: addressForm.phone,
          street: addressForm.addressLine1,
          addressLine1: addressForm.addressLine1,
          addressLine2: addressForm.addressLine2,
          city: addressForm.city,
          state: addressForm.state,
          postalCode: addressForm.postalCode,
          zipCode: addressForm.postalCode,
          country: addressForm.country,
          landmark: addressForm.addressLine2,
        };
      }
    }

    try {
      setIsPlacingOrder(true);
      orderSubmissionInFlightRef.current = true;
      const response = await axios.post(`${BASE_URL}/api/orders`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const createdOrder = response.data;
      orderPlacedRef.current = true;
      setOrderPlaced(true);
      clearCart();
      clearAppliedCoupon();

      const query = new URLSearchParams({
        orderId: createdOrder?._id || "",
        orderType,
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        status: createdOrder?.status || "APPROVAL_PENDING",
        coupon: createdOrder?.couponCode || "",
      }).toString();

      toast.success(
        `Order ${createdOrder?._id ? `#${String(createdOrder._id).slice(-8).toUpperCase()}` : ""} placed successfully`
      );
      router.push(`/confirmation?${query}`);
    } catch (error: unknown) {
      if (couponReservationToken) {
        try {
          await CouponsAPI.release(couponReservationToken);
        } catch {
          // Best effort release when order creation fails.
        }
      }
      console.error("Order placement failed:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || error.response?.data?.message
        : null;
      toast.error(message || "Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
      orderSubmissionInFlightRef.current = false;
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#f7f5f0] via-[#f3f2ec] to-[#efeee9] px-4 pt-32 pb-16">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        {/* Left Form Section */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Type */}
          <div
            className={`bg-white p-6 rounded-3xl border ${
              errors.orderType ? "border-red-500" : "border-black/5"
            } shadow-[0_10px_28px_rgba(20,15,10,0.06)]`}
          >
            <h2 className="text-xl font-semibold text-[#1f1d1a] mb-4 flex items-center gap-2">
              <FaStore className="text-[#1f1d1a]" /> Order Type
            </h2>

            <div className="space-y-3">
              {/* Pickup Option */}
              <label
                className={`flex items-center justify-between border rounded-2xl p-4 cursor-pointer transition ${
                  orderType === "pickup"
                    ? "border-[#2a2927] bg-[#f8f7f4]"
                    : "border-black/10 hover:border-[#2a2927]/40"
                }`}
              >
                <div className="flex items-center gap-3 text-[#2a2927]">
                  <input
                    type="radio"
                    name="orderType"
                    value="pickup"
                    checked={orderType === "pickup"}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="accent-[#2a2927]"
                  />
                  <div>
                    <p className="font-medium">Outlet Pickup</p>
                    <p className="text-xs text-gray-500">
                      Ready in 15–30 minutes
                    </p>
                  </div>
                </div>
              </label>

              {/* Delivery Option */}
              <label
                className={`flex items-center justify-between border rounded-2xl p-4 cursor-pointer transition ${
                  orderType === "delivery"
                    ? "border-[#2a2927] bg-[#f8f7f4]"
                    : "border-black/10 hover:border-[#2a2927]/40"
                }`}
              >
                <div className="flex items-center gap-3 text-[#2a2927]">
                  <input
                    type="radio"
                    name="orderType"
                    value="delivery"
                    checked={orderType === "delivery"}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="accent-[#2a2927]"
                  />
                  <div>
                    <p className="font-medium">
                      Delivery{" "}
                      <span className="text-sm text-[#6a4b2a]">
                        (₹10/km after 2 km)
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Delivery in 45–60 minutes
                    </p>
                  </div>
                </div>
              </label>

              {/* Delivery distance */}
              {orderType === "delivery" && deliveryDistance > 0 && (
                <p className="text-xs text-gray-500">
                  📍 Estimated distance: {deliveryDistance.toFixed(2)} km
                </p>
              )}

              {/* Pincode fallback */}
              {locationDenied && orderType === "delivery" && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Enter your pincode"
                    value={manualPincode}
                    onChange={(e) => setManualPincode(e.target.value)}
                    className="border border-black/10 p-3 rounded-xl w-full text-[#2a2927] bg-[#f8f7f4] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15"
                  />
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Location denied. Estimate using your pincode.
                  </p>
                </div>
              )}

              {/* Order type error message */}
              {errors.orderType && (
                <p className="text-xs text-red-600 mt-2">
                  Please select an order type
                </p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-[0_10px_28px_rgba(20,15,10,0.06)] space-y-4">
            <h2 className="text-xl font-semibold text-[#1f1d1a]">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  name="firstName"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={handleInputChange}
                  className={`w-full border ${
                    errors.firstName ? "border-red-500" : "border-black/10"
                  } p-3 rounded-xl bg-[#f8f7f4] text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-600 mt-1">
                    First name is required
                  </p>
                )}
              </div>

              <div>
                <input
                  name="lastName"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={handleInputChange}
                  className={`w-full border ${
                    errors.lastName ? "border-red-500" : "border-black/10"
                  } p-3 rounded-xl bg-[#f8f7f4] text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-600 mt-1">
                    Last name is required
                  </p>
                )}
              </div>
            </div>

            <div>
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleInputChange}
                className={`w-full border ${
                  errors.email ? "border-red-500" : "border-black/10"
                } p-3 rounded-xl bg-[#f8f7f4] text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">Email is required</p>
              )}
            </div>

            <div>
              <input
                name="phone"
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={handleInputChange}
                className={`w-full border ${
                  errors.phone ? "border-red-500" : "border-black/10"
                } p-3 rounded-xl bg-[#f8f7f4] text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
              />
              {errors.phone && (
                <p className="text-xs text-red-600 mt-1">
                  Phone number is required
                </p>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          {orderType === "delivery" && (
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-[0_10px_28px_rgba(20,15,10,0.06)] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#1f1d1a]">
                  Delivery Address
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddressForm((prev) => !prev)}
                  className="text-sm text-[#2a2927] hover:text-[#1f1d1a] underline"
                >
                  {showAddressForm ? "Hide form" : "Add new address"}
                </button>
              </div>

              {addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address._id}
                      className={`flex items-start gap-3 border rounded-2xl p-4 cursor-pointer transition ${
                        selectedAddressId === address._id
                          ? "border-[#2a2927] bg-[#f8f7f4]"
                          : "border-black/10 hover:border-[#2a2927]/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryAddress"
                        checked={selectedAddressId === address._id}
                        onChange={() => {
                          setSelectedAddressId(address._id);
                          setErrors((prev) => ({
                            ...prev,
                            deliveryAddress: false,
                          }));
                        }}
                        className="mt-1 accent-[#2a2927]"
                      />
                      <div className="text-sm text-[#2a2927]">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{address.label}</p>
                          {address.isDefault && (
                            <span className="text-xs text-[#6a4b2a]">
                              Default
                            </span>
                          )}
                        </div>
                        <p>{address.fullName}</p>
                        <p>{address.phone}</p>
                        <p>{address.addressLine1}</p>
                        {address.addressLine2 && <p>{address.addressLine2}</p>}
                        <p>
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        <p>{address.country}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No saved addresses yet. Add one below to continue.
                </p>
              )}

              {showAddressForm && (
                <div className="border border-black/10 rounded-2xl p-4 bg-[#f8f7f4] space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Label
                      </label>
                      <select
                        name="label"
                        value={addressForm.label}
                        onChange={handleAddressInputChange}
                        className={`w-full border ${
                          addressErrors.label ? "border-red-500" : "border-black/10"
                        } p-3 rounded-xl bg-white text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
                      >
                        {ADDRESS_LABELS.map((label) => (
                          <option key={label} value={label}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {addressErrors.label && (
                        <p className="text-xs text-red-600 mt-1">
                          Label is required
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Full Name
                      </label>
                      <input
                        name="fullName"
                        value={addressForm.fullName}
                        onChange={handleAddressInputChange}
                        className={`w-full border ${
                          addressErrors.fullName ? "border-red-500" : "border-black/10"
                        } p-3 rounded-xl bg-white text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
                      />
                      {addressErrors.fullName && (
                        <p className="text-xs text-red-600 mt-1">
                          Full name is required
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Phone
                    </label>
                    <input
                      name="phone"
                      value={addressForm.phone}
                      onChange={handleAddressInputChange}
                      className={`w-full border ${
                        addressErrors.phone ? "border-red-500" : "border-black/10"
                      } p-3 rounded-xl bg-white text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
                    />
                    {addressErrors.phone && (
                      <p className="text-xs text-red-600 mt-1">
                        Phone is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Address Line 1
                    </label>
                    <input
                      name="addressLine1"
                      value={addressForm.addressLine1}
                      onChange={handleAddressInputChange}
                      className={`w-full border ${
                        addressErrors.addressLine1
                          ? "border-red-500"
                          : "border-black/10"
                      } p-3 rounded-xl bg-white text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
                    />
                    {addressErrors.addressLine1 && (
                      <p className="text-xs text-red-600 mt-1">
                        Address line 1 is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      name="addressLine2"
                      value={addressForm.addressLine2}
                      onChange={handleAddressInputChange}
                      className="w-full border border-black/10 p-3 rounded-xl bg-white text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        City
                      </label>
                      <input
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressInputChange}
                        className={`w-full border ${
                          addressErrors.city ? "border-red-500" : "border-black/10"
                        } p-3 rounded-xl bg-white text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
                      />
                      {addressErrors.city && (
                        <p className="text-xs text-red-600 mt-1">
                          City is required
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        State
                      </label>
                      <input
                        name="state"
                        value={addressForm.state}
                        onChange={handleAddressInputChange}
                        className={`w-full border ${
                          addressErrors.state ? "border-red-500" : "border-black/10"
                        } p-3 rounded-xl bg-white text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
                      />
                      {addressErrors.state && (
                        <p className="text-xs text-red-600 mt-1">
                          State is required
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Postal Code
                      </label>
                      <input
                        name="postalCode"
                        value={addressForm.postalCode}
                        onChange={handleAddressInputChange}
                        className={`w-full border ${
                          addressErrors.postalCode
                            ? "border-red-500"
                            : "border-black/10"
                        } p-3 rounded-xl bg-white text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
                      />
                      {addressErrors.postalCode && (
                        <p className="text-xs text-red-600 mt-1">
                          Postal code is required
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Country
                    </label>
                    <input
                      name="country"
                      value={addressForm.country}
                      onChange={handleAddressInputChange}
                      className={`w-full border ${
                        addressErrors.country ? "border-red-500" : "border-black/10"
                      } p-3 rounded-xl bg-white text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
                    />
                    {addressErrors.country && (
                      <p className="text-xs text-red-600 mt-1">
                        Country is required
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="saveAddressToProfile"
                      checked={saveAddressToProfile}
                      onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                      className="h-4 w-4 accent-[#2a2927]"
                    />
                    <label
                      htmlFor="saveAddressToProfile"
                      className="text-sm text-[#2a2927]"
                    >
                      Save this address to my profile for future orders
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleUseNewAddress}
                    className="w-full bg-[#2a2927] text-white py-2.5 rounded-full shadow-sm hover:bg-[#1f1d1a] transition"
                  >
                    Use this address
                  </button>
                </div>
              )}

              {selectedAddressId === "manual" && (
                <p className="text-xs text-[#6a4b2a]">
                  Using the address entered above for this order.
                </p>
              )}

              {errors.deliveryAddress && (
                <p className="text-xs text-red-600">
                  Please select or add a delivery address
                </p>
              )}
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-[0_10px_28px_rgba(20,15,10,0.06)] space-y-4">
            <h2 className="text-xl font-semibold text-[#1f1d1a]">
              Payment Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 text-[#2a2927] border border-black/10 rounded-2xl p-3 hover:border-[#2a2927]/40 transition">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="accent-[#2a2927]"
                />
                Credit / Debit Card
              </label>
              <label className="flex items-center gap-3 text-[#2a2927] border border-black/10 rounded-2xl p-3 hover:border-[#2a2927]/40 transition">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="accent-[#2a2927]"
                />
                Cash on Delivery
              </label>
            </div>

            {paymentMethod === "card" && (
              <div className="space-y-3">
                <div>
                  <input
                    name="cardNumber"
                    placeholder="Card Number"
                    value={form.cardNumber}
                    onChange={handleInputChange}
                    className={`w-full border ${
                      errors.cardNumber ? "border-red-500" : "border-black/10"
                    } p-3 rounded-xl bg-[#f8f7f4] text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
                  />
                  {errors.cardNumber && (
                    <p className="text-xs text-red-600 mt-1">
                      Card number is required
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <input
                      name="expiry"
                      placeholder="MM/YY"
                      value={form.expiry}
                      onChange={handleInputChange}
                      className={`w-full border ${
                        errors.expiry ? "border-red-500" : "border-black/10"
                      } p-3 rounded-xl bg-[#f8f7f4] text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
                    />
                    {errors.expiry && (
                      <p className="text-xs text-red-600 mt-1">
                        Expiry date is required
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      name="cvv"
                      placeholder="CVV"
                      value={form.cvv}
                      onChange={handleInputChange}
                      className={`w-full border ${
                        errors.cvv ? "border-red-500" : "border-black/10"
                      } p-3 rounded-xl bg-[#f8f7f4] text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
                    />
                    {errors.cvv && (
                      <p className="text-xs text-red-600 mt-1">
                        CVV is required
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    name="cardName"
                    placeholder="Name on Card"
                    value={form.cardName}
                    onChange={handleInputChange}
                    className={`w-full border ${
                      errors.cardName ? "border-red-500" : "border-black/10"
                    } p-3 rounded-xl bg-[#f8f7f4] text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15`}
                  />
                  {errors.cardName && (
                    <p className="text-xs text-red-600 mt-1">
                      Card name is required
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Special Instructions */}
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-[0_10px_28px_rgba(20,15,10,0.06)]">
            <h2 className="text-xl font-semibold text-[#1f1d1a] mb-2">
              Special Instructions
            </h2>
            <textarea
              rows={4}
              placeholder="Any special requests or delivery instructions..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full border border-black/10 p-3 rounded-xl bg-[#f8f7f4] text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15"
            />
          </div>

          {/* Allergies */}
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-[0_10px_28px_rgba(20,15,10,0.06)]">
            <h2 className="text-xl font-semibold text-[#1f1d1a] mb-2">
              Allergy Information
            </h2>
            <p className="text-xs text-[#6b6b6b] mb-3">
              Add comma-separated allergies so kitchen can flag and verify before prep.
            </p>
            {profileAllergies.length > 0 && (
              <p className="text-xs text-[#6a4b2a] mb-2">
                Profile defaults: {profileAllergies.join(", ")}
              </p>
            )}
            <input
              value={checkoutAllergies}
              onChange={(e) => setCheckoutAllergies(e.target.value)}
              placeholder="e.g. nuts, dairy, gluten"
              className="w-full border border-black/10 p-3 rounded-xl bg-[#f8f7f4] text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15"
            />
            <textarea
              rows={3}
              value={allergyNotes}
              onChange={(e) => setAllergyNotes(e.target.value)}
              placeholder="Any cross-contamination risk or allergy handling notes..."
              className="mt-3 w-full border border-black/10 p-3 rounded-xl bg-[#f8f7f4] text-[#2a2927] focus:outline-none focus:ring-2 focus:ring-[#2a2927]/15"
            />
          </div>
        </div>

        {/* Right Order Summary */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-[0_10px_28px_rgba(20,15,10,0.06)] h-fit md:sticky md:top-28">
          <h2 className="text-xl font-semibold text-[#1f1d1a] mb-4">
            Order Summary
          </h2>
          <div className="space-y-2 text-[#2a2927] text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%):</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>
                  Discount
                  {appliedCoupon?.discountType === "PERCENT"
                    ? ` (${appliedCoupon.discountValue.toFixed(0)}%)`
                    : ""}:
                </span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            {appliedCoupon?.code && (
              <div className="text-xs text-[#6a4b2a]">Coupon: {appliedCoupon.code}</div>
            )}
            {orderType === "delivery" && (
              <div className="flex justify-between text-[#6a4b2a]">
                <span>Delivery Charge:</span>
                <span>₹{deliveryCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-2 border-t border-black/10 mt-3">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <div className="bg-[#f6f1e8] text-[#6a4b2a] text-xs p-3 rounded-xl mt-3">
              ⏱️ Ready in 15–30 minutes
            </div>
          </div>
          <button
            onClick={handleOrder}
            disabled={isPlacingOrder}
            className="w-full mt-6 bg-[#2a2927] text-white py-3 rounded-full shadow-sm hover:bg-[#1f1d1a] transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPlacingOrder ? "Placing Order..." : `Place Order – ₹${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </section>
  );
}
