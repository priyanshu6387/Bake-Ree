"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiStar,
  HiHome,
  HiOfficeBuilding,
  HiLocationMarker,
} from "react-icons/hi";
import { HiMapPin } from "react-icons/hi2";
import AddressFormModal from "./AddressFormModal";

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
  createdAt: string;
}

const labelIcons: Record<string, ComponentType<{ className?: string }>> = {
  Home: HiHome,
  Work: HiOfficeBuilding,
  Office: HiOfficeBuilding,
};

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Address | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/addresses",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAddresses(response.data);
    } catch (error: unknown) {
      console.error("Error fetching addresses:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error("Failed to load addresses");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleAdd = () => {
    setEditingAddress(null);
    setShowModal(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setShowModal(true);
  };

  const handleRequestDelete = (address: Address) => {
    setPendingDelete(address);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) {
      return;
    }

    const addressId = pendingDelete._id;
    setDeletingId(addressId);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/addresses/${addressId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAddresses((prev) => prev.filter((addr) => addr._id !== addressId));
      toast.success("Address deleted successfully");
    } catch (error: unknown) {
      console.error("Error deleting address:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error
        : null;
      toast.error(message || "Failed to delete address");
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    if (!deletingId) {
      setPendingDelete(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/addresses/${addressId}/set-default`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr._id === addressId,
        }))
      );
      toast.success("Default address updated");
    } catch (error: unknown) {
      console.error("Error setting default address:", error);
      toast.error("Failed to set default address");
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingAddress(null);
  };

  const handleModalSave = () => {
    fetchAddresses();
    handleModalClose();
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
    <section className="relative min-h-screen overflow-hidden bg-[#f7f3ec] px-4 py-24">
      <div className="pointer-events-none absolute -top-36 right-[-6rem] h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(31,122,107,0.22),_rgba(31,122,107,0)_68%)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(246,196,125,0.28),_rgba(246,196,125,0)_70%)]" />
      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e7d9c8] bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b4f2a]">
              Delivery
            </span>
            <h1 className="mt-4 text-4xl font-semibold text-[#2a2927] sm:text-5xl">
              My Addresses
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#6b6b6b] sm:text-base">
              Organize where your orders arrive and set a default for faster
              checkout.
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1f7a6b] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#176158]"
          >
            <HiPlus className="text-lg" />
            Add New Address
          </button>
        </div>

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className="rounded-3xl border border-white/80 bg-white/90 p-12 text-center shadow-[0_25px_60px_rgba(35,25,10,0.12)] backdrop-blur">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5ede3] text-[#1f7a6b]">
              <HiMapPin className="text-3xl" />
            </div>
            <h2 className="text-2xl font-semibold text-[#2a2927] mb-2">
              No addresses saved
            </h2>
            <p className="text-sm text-[#7a746d] mb-6">
              Add your first delivery address to get started.
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-full bg-[#1f7a6b] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#176158]"
            >
              <HiPlus className="text-lg" />
              Add Address
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {addresses.map((address) => {
              const LabelIcon = labelIcons[address.label] || HiLocationMarker;
              return (
                <div
                  key={address._id}
                  className={`rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(35,25,10,0.12)] transition ${
                    address.isDefault
                      ? "ring-2 ring-[#1f7a6b]/30"
                      : "hover:-translate-y-1"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5ede3] text-[#1f7a6b]">
                        <LabelIcon className="text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#2a2927]">
                          {address.label}
                        </h3>
                        {address.isDefault && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#e7f4f0] px-2 py-0.5 text-xs font-semibold text-[#1f7a6b]">
                            <HiStar className="text-xs" />
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Details */}
                  <div className="space-y-1 text-sm text-[#6b6b6b] mb-5">
                    <p className="font-medium text-[#2a2927]">
                      {address.fullName}
                    </p>
                    <p>{address.phone}</p>
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    <p>
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p>{address.country}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 border-t border-[#efe5d8] pt-4">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address._id)}
                        className="flex-1 rounded-full border border-[#d3c5b4] bg-white px-3 py-2 text-xs font-semibold text-[#4b4b4b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8f4ee]"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="flex items-center gap-1 rounded-full border border-[#d3c5b4] bg-white px-3 py-2 text-xs font-semibold text-[#4b4b4b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8f4ee]"
                    >
                      <HiPencil className="text-sm" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleRequestDelete(address)}
                      disabled={deletingId === address._id}
                      className="flex items-center gap-1 rounded-full border border-[#f2b9b9] bg-white px-3 py-2 text-xs font-semibold text-[#c04b4b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#ffecec] disabled:opacity-50"
                    >
                      <HiTrash className="text-sm" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Address Form Modal */}
        {showModal && (
          <AddressFormModal
            address={editingAddress}
            onClose={handleModalClose}
            onSave={handleModalSave}
          />
        )}

        {/* Delete Confirmation Modal */}
        {pendingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/95 p-6 text-center shadow-[0_30px_80px_rgba(35,25,10,0.25)]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffecec] text-[#c04b4b]">
                <HiTrash className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-[#2a2927]">
                Delete this address?
              </h3>
              <p className="mt-2 text-sm text-[#7a746d]">
                This will remove &quot;{pendingDelete.label}&quot; and cannot be undone.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="flex-1 rounded-full border border-[#d3c5b4] bg-white px-4 py-2 text-sm font-semibold text-[#4b4b4b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8f4ee]"
                  disabled={deletingId !== null}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 rounded-full bg-[#c04b4b] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#a63d3d] disabled:opacity-60"
                  disabled={deletingId !== null}
                >
                  {deletingId ? "Deleting..." : "Delete Address"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
