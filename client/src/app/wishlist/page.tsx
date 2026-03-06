"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { HiHeart, HiShoppingCart, HiTrash } from "react-icons/hi";
import { useCartStore } from "../../store/cartStore";
import { hashIdToNumber } from "../../utils/hashId";

interface WishlistItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    image?: string;
    price: number;
    description?: string;
    category?: string;
  };
  createdAt: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const { addToCart } = useCartStore();

  const fetchWishlist = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/wishlist",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setWishlist(response.data);
    } catch (error: unknown) {
      console.error("Error fetching wishlist:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error("Failed to load wishlist");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId: string) => {
    setRemoving(productId);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/wishlist/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setWishlist((prev) => prev.filter((item) => item.product._id !== productId));
      toast.success("Removed from wishlist");
    } catch (error: unknown) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist");
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToCart = (product: WishlistItem["product"]) => {
    const pid = hashIdToNumber(product._id);
    addToCart({
      id: pid,
      productId: product._id,
      name: product.name,
      image: product.image || "/placeholder.jpg",
      price: product.price,
      quantity: 1,
    });
    toast.success("Added to cart!");
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-[#f3f2ec] px-4 py-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-[#2a2927]">Loading wishlist...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f6efe6] px-4 py-24">
      <div className="pointer-events-none absolute -top-40 left-0 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,_rgba(31,122,107,0.18),_rgba(31,122,107,0)_70%)]" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-0 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(242,181,95,0.24),_rgba(242,181,95,0)_70%)]" />
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e6dacb] bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b4f2a]">
            Favorites
          </span>
          <h1 className="mt-4 text-4xl font-semibold text-[#2a2927] sm:text-5xl">
            My Wishlist
          </h1>
          <p className="mt-3 text-sm text-[#6b6b6b] sm:text-base">
            {wishlist.length === 0
              ? "Start adding products you love!"
              : `${wishlist.length} item${wishlist.length !== 1 ? "s" : ""} saved for later`}
          </p>
        </div>

        {/* Empty State */}
        {wishlist.length === 0 ? (
          <div className="rounded-3xl border border-white/80 bg-white/90 p-12 text-center shadow-[0_25px_60px_rgba(35,25,10,0.12)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5ede3] text-[#c04b4b]">
              <HiHeart className="text-3xl" />
            </div>
            <h2 className="text-2xl font-semibold text-[#2a2927] mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-sm text-[#7a746d] mb-6">
              Save the treats you love and come back anytime.
            </p>
            <Link
              href="/product"
              className="inline-flex items-center justify-center rounded-full bg-[#1f7a6b] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#176158]"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlist.map((item) => (
              <div
                key={item._id}
                className="group overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-[0_18px_45px_rgba(35,25,10,0.12)] transition hover:-translate-y-1"
              >
                {/* Product Image */}
                <div className="relative h-48 w-full">
                  <Image
                    src={item.product.image || "/placeholder.jpg"}
                    alt={item.product.name}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                  <button
                    onClick={() => handleRemove(item.product._id)}
                    disabled={removing === item.product._id}
                    className="absolute top-3 right-3 rounded-full border border-[#f2b9b9] bg-white/95 p-2 text-[#c04b4b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#ffecec] disabled:opacity-50"
                    title="Remove from wishlist"
                  >
                    <HiHeart className="text-lg fill-current" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-[#2a2927] mb-2 line-clamp-2">
                    {item.product.name}
                  </h3>
                  {item.product.category && (
                    <p className="text-xs text-[#8b7b69] mb-2 uppercase tracking-[0.2em]">
                      {item.product.category}
                    </p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-semibold text-[#1f7a6b]">
                      ₹{item.product.price.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(item.product)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#1f7a6b] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#176158]"
                    >
                      <HiShoppingCart className="text-lg" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(item.product._id)}
                      disabled={removing === item.product._id}
                      className="rounded-full border border-[#d3c5b4] bg-white px-3 py-2 text-sm text-[#4b4b4b] transition hover:-translate-y-0.5 hover:bg-[#f8f4ee] disabled:opacity-50"
                      title="Remove"
                    >
                      <HiTrash className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
