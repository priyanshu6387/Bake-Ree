"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { hashIdToNumber } from "@/utils/hashId";
import { cn } from "@/utils/cn";
import axios from "axios";
import toast from "react-hot-toast";
import { HiHeart } from "react-icons/hi";
import { useRouter } from "next/navigation";

type Props = { product: Product };

export default function ProductCard({ product }: Props) {
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // ✅ correct: use product._id
  const pid = React.useMemo(() => hashIdToNumber(product._id), [product._id]);

  const qty = useCartStore((s) => s.getQty(pid));
  const addToCart = useCartStore((s) => s.addToCart);
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);

  // Check if product is in wishlist
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get(`http://localhost:5000/api/wishlist/check/${product._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setInWishlist(res.data.inWishlist))
        .catch(() => {});
    }
  }, [product._id]);

  const onAdd = () => {
    addToCart({
      id: pid,
      productId: product._id,
      name: product.name,
      image: product.image || "/placeholder.jpg",
      price: product.price,
      quantity: 1,
    });
    toast.success("Added to cart");
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await axios.delete(
          `http://localhost:5000/api/wishlist/${product._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await axios.post(
          `http://localhost:5000/api/wishlist`,
          { productId: product._id },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (error: unknown) {
      console.error("Wishlist error:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error
        : null;
      toast.error(message || "Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[28px] bg-[#fbfaf6]",
        "shadow-[0_12px_30px_rgba(36,68,56,0.12)] ring-1 ring-black/5",
        "hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(36,68,56,0.18)]",
        "transition-all duration-300"
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={product.image || "/placeholder.jpg"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
        {product.isFeatured ? (
          <span className="absolute left-4 top-4 rounded-full bg-[#ffa938] px-3 py-1 text-xs font-semibold text-white shadow">
            Featured
          </span>
        ) : null}
        {product.status === "inactive" || product.isActive === false ? (
          <span className="absolute right-4 top-4 rounded-full bg-gray-800/80 px-3 py-1 text-xs text-white">
            Inactive
          </span>
        ) : null}
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          className={cn(
            "absolute right-4 top-4 p-2 rounded-full shadow-md transition-colors disabled:opacity-50",
            inWishlist
              ? "bg-white hover:bg-red-50"
              : "bg-white/90 hover:bg-white"
          )}
          title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <HiHeart
            className={cn(
              "text-xl transition-colors",
              inWishlist ? "text-red-500 fill-current" : "text-gray-400"
            )}
          />
        </button>
        <span className="absolute left-4 bottom-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#244438] shadow">
          {product.category}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-[#2a2927]">{product.name}</h3>
          <div className="text-xl font-extrabold text-[#005c45]">
            ₹{product.price.toLocaleString("en-IN")}
          </div>
        </div>

        {product.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-[#4a4a46]">
            {product.description}
          </p>
        ) : (
          <p className="mt-2 text-sm text-[#6b6b65]">Delicious and freshly baked.</p>
        )}

        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-[#8a8a84]">Baked today</span>

          {qty === 0 ? (
            <button
              onClick={onAdd}
              className={cn(
                "relative rounded-full px-5 py-2 text-sm font-semibold",
                "bg-[#005c45] text-white shadow hover:bg-[#00785b]",
                "transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#67c6a0]"
              )}
            >
              <span className="inline-block translate-y-[1px]">Add to Cart</span>
            </button>
          ) : (
            <div
              className={cn(
                "inline-flex items-center gap-3 rounded-full bg-[#e7f0ea]",
                "px-3 py-1.5 text-sm font-semibold text-[#005c45] ring-1 ring-[#cce1d6]"
              )}
            >
              <button
                onClick={() => dec(pid)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white ring-1 ring-[#cce1d6] hover:bg-[#f4f7f2] transition"
                aria-label="Decrease"
              >
                –
              </button>
              <span className="min-w-[2ch] text-center">{qty}</span>
              <button
                onClick={() => inc(pid)}
                className="grid h-8 w-8 place-items-center rounded-full bg-[#005c45] text-white hover:bg-[#00785b] transition"
                aria-label="Increase"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
