"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { HiX } from "react-icons/hi";

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

interface Props {
  address: Address | null;
  onClose: () => void;
  onSave: () => void;
}

const ADDRESS_LABELS = ["Home", "Work", "Office", "Other"];

export default function AddressFormModal({ address, onClose, onSave }: Props) {
  const [formData, setFormData] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (address) {
      setFormData({
        label: address.label,
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || "",
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        isDefault: address.isDefault,
      });
    }
  }, [address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to continue");
        return;
      }

      const url = address
        ? `http://localhost:5000/api/addresses/${address._id}`
        : "http://localhost:5000/api/addresses";

      const method = address ? "put" : "post";

      await axios[method](
        url,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(
        address ? "Address updated successfully" : "Address added successfully"
      );
      onSave();
    } catch (error: unknown) {
      console.error("Error saving address:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error
        : null;
      toast.error(message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/80 bg-white/95 shadow-[0_30px_80px_rgba(35,25,10,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#efe5d8] px-8 py-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e7d9c8] bg-white/80 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#6b4f2a]">
              Delivery
            </span>
            <h2 className="mt-3 text-2xl font-semibold text-[#2a2927]">
              {address ? "Edit Address" : "Add New Address"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-[#e7d9c8] p-2 text-[#8b7b69] transition hover:bg-[#f8f4ee] hover:text-[#1f7a6b]"
            aria-label="Close modal"
          >
            <HiX className="text-xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-6">
          {/* Label */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
              Address Label
            </label>
            <select
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
              required
            >
              {ADDRESS_LABELS.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Full Name */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
              required
            />
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
              Address Line 1 *
            </label>
            <input
              type="text"
              value={formData.addressLine1}
              onChange={(e) =>
                setFormData({ ...formData, addressLine1: e.target.value })
              }
              className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
              required
            />
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
              Address Line 2 (Optional)
            </label>
            <input
              type="text"
              value={formData.addressLine2}
              onChange={(e) =>
                setFormData({ ...formData, addressLine2: e.target.value })
              }
              className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
            />
          </div>

          {/* City, State, Postal Code */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
                State *
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
                Postal Code *
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) =>
                  setFormData({ ...formData, postalCode: e.target.value })
                }
                className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
                required
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7b69]">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className="w-full rounded-2xl border border-[#e6dacb] bg-white px-4 py-3 text-sm text-[#2a2927] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
            />
          </div>

          {/* Default Address Checkbox */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#efe5d8] bg-[#fbf7f1] px-4 py-3">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) =>
                setFormData({ ...formData, isDefault: e.target.checked })
              }
              className="h-4 w-4 rounded border-[#d3c5b4] text-[#1f7a6b] focus:ring-[#1f7a6b]"
            />
            <label htmlFor="isDefault" className="text-sm font-medium text-[#4b4b4b]">
              Set as default address
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#d3c5b4] bg-white px-6 py-3 text-sm font-semibold text-[#4b4b4b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8f4ee]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-[#1f7a6b] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#176158] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : address ? "Update Address" : "Add Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
