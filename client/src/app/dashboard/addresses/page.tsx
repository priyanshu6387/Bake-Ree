"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiX,
  HiMap,
  HiHome,
  HiBriefcase,
  HiTag,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface DeliveryAddress {
  _id: string;
  label: "Home" | "Work" | "Other";
  customLabel?: string;
  recipientName: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    landmark?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DeliveryAddressesPage() {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [formData, setFormData] = useState({
    label: "Home" as "Home" | "Work" | "Other",
    customLabel: "",
    recipientName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    landmark: "",
    isDefault: false,
  });
  const router = useRouter();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/delivery-addresses",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAddresses(response.data);
    } catch (error: unknown) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const addressData = {
        label: formData.label,
        customLabel: formData.label === "Other" ? formData.customLabel : "",
        recipientName: formData.recipientName,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          landmark: formData.landmark || undefined,
        },
        isDefault: formData.isDefault,
      };

      if (editingAddress) {
        await axios.put(
          `http://localhost:5000/api/delivery-addresses/${editingAddress._id}`,
          addressData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Address updated successfully");
      } else {
        await axios.post(
          "http://localhost:5000/api/delivery-addresses",
          addressData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Address added successfully");
      }

      setShowModal(false);
      setEditingAddress(null);
      resetForm();
      fetchAddresses();
    } catch (error: unknown) {
      console.error("Error saving address:", error);
      const errorMessage =
        error instanceof AxiosError
          ? (error.response?.data as { error?: string } | undefined)?.error
          : undefined;
      toast.error(errorMessage || "Failed to save address");
    }
  };

  const handleEdit = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      customLabel: address.customLabel || "",
      recipientName: address.recipientName,
      phone: address.phone,
      street: address.address.street,
      city: address.address.city,
      state: address.address.state,
      zipCode: address.address.zipCode,
      country: address.address.country,
      landmark: address.address.landmark || "",
      isDefault: address.isDefault,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/delivery-addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Address deleted successfully");
      fetchAddresses();
    } catch (error: unknown) {
      console.error("Error deleting address:", error);
      const errorMessage =
        error instanceof AxiosError
          ? (error.response?.data as { error?: string } | undefined)?.error
          : undefined;
      toast.error(errorMessage || "Failed to delete address");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/delivery-addresses/${id}/set-default`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Default address updated");
      fetchAddresses();
    } catch (error: unknown) {
      console.error("Error setting default address:", error);
      toast.error("Failed to set default address");
    }
  };

  const resetForm = () => {
    setFormData({
      label: "Home",
      customLabel: "",
      recipientName: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
      landmark: "",
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const getLabelIcon = (label: string) => {
    switch (label) {
      case "Home":
        return <HiHome className="text-lg" />;
      case "Work":
        return <HiBriefcase className="text-lg" />;
      default:
        return <HiTag className="text-lg" />;
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-[#f3f2ec] px-4 py-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-[#2a2927]">Loading addresses...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#f3f2ec] px-4 py-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-[#2a2927] mb-2">
            Delivery Addresses
          </h1>
          <p className="text-gray-600">
            Manage your delivery addresses for faster checkout
          </p>
        </div>

        {/* Add Address Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <HiPlus className="text-lg" />
            Add New Address
          </button>
        </div>

        {/* Addresses List */}
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#2a2927]">
              <HiMap className="text-5xl mx-auto mb-4 text-gray-400" />
              <p className="text-xl text-gray-600 mb-2">No addresses saved</p>
              <p className="text-sm text-gray-500 mb-4">
                Add your first delivery address to get started
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Add Address
              </button>
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address._id}
                className={`bg-white rounded-2xl p-6 border-2 transition ${
                  address.isDefault
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {getLabelIcon(address.label)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-[#2a2927]">
                          {address.label === "Other"
                            ? address.customLabel || "Other"
                            : address.label}
                        </h3>
                        {address.isDefault && (
                          <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {address.recipientName} • {address.phone}
                      </p>
                      <div className="text-sm text-[#2a2927]">
                        <p>{address.address.street}</p>
                        <p>
                          {address.address.city}, {address.address.state}{" "}
                          {address.address.zipCode}
                        </p>
                        {address.address.landmark && (
                          <p className="text-gray-500">
                            Landmark: {address.address.landmark}
                          </p>
                        )}
                        <p className="text-gray-500">{address.address.country}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address._id)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                        title="Set as default"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <HiPencil className="text-lg" />
                    </button>
                    <button
                      onClick={() => handleDelete(address._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <HiTrash className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-[#2a2927] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#2a2927]">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <HiX className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2a2927] mb-2">
                  Address Label *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Home", "Work", "Other"] as const).map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFormData({ ...formData, label })}
                      className={`px-4 py-2 rounded-lg border-2 transition ${
                        formData.label === label
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {formData.label === "Other" && (
                  <input
                    type="text"
                    value={formData.customLabel}
                    onChange={(e) =>
                      setFormData({ ...formData, customLabel: e.target.value })
                    }
                    placeholder="Enter custom label"
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required={formData.label === "Other"}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2a2927] mb-2">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.recipientName}
                    onChange={(e) =>
                      setFormData({ ...formData, recipientName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2a2927] mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2a2927] mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2a2927] mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2a2927] mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2a2927] mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2a2927] mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2a2927] mb-2">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) =>
                    setFormData({ ...formData, landmark: e.target.value })
                  }
                  placeholder="e.g., Near Metro Station"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-[#2a2927]">Set as default address</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  {editingAddress ? "Update" : "Add"} Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

