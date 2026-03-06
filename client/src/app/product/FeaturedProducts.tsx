"use client";

import React from "react";
import Image from "next/image";
import { ProductsAPI } from "@/services/products";
import type { Product } from "@/types";
import { cn } from "@/utils/cn";
import { useCartStore } from "@/store/cartStore";
import { hashIdToNumber } from "@/utils/hashId";
import toast from "react-hot-toast";

export default function FeaturedProducts() {
  const [items, setItems] = React.useState<Product[]>([]);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    let mounted = true;
    ProductsAPI.getFeatured()
      .then((res) => mounted && setItems(res))
      .catch(() => setItems([]));
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!items.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  const p = items[idx];
  const pid = p ? hashIdToNumber(p._id) : 0;

  const qty = useCartStore((s) => s.getQty(pid));
  const addToCart = useCartStore((s) => s.addToCart);
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);

  if (!p) return null;

  const onAdd = () => {
    addToCart({
      id: pid,
      productId: p._id,
      name: p.name,
      image: p.image || "/placeholder.jpg",
      price: p.price,
      quantity: 1,
    });
    toast.success("Added to cart");
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <div
        className={cn(
          "grid items-center gap-8 md:grid-cols-2",
          "rounded-3xl bg-white/60 backdrop-blur ring-1 ring-black/5 p-4 sm:p-6 lg:p-8 shadow-sm"
        )}
      >
        {/* LEFT: Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
          <Image
            src={p.image || "/placeholder.jpg"}
            alt={p.name}
            fill
            className="object-cover"
            sizes="(min-width:1024px) 50vw, 100vw"
            priority
          />
          <div className="absolute left-4 top-4 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            Featured
          </div>
        </div>

        {/* RIGHT: Text */}
        <div className="p-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{p.name}</h2>
          <p className="mt-3 text-gray-600">{p.description || "Freshly crafted delight."}</p>

          <div className="mt-6 flex items-center gap-4">
            <div className="text-2xl font-extrabold text-emerald-700">
              ₹{p.price.toLocaleString("en-IN")}
            </div>
            <span className="text-sm text-gray-500">Category: {p.category}</span>
          </div>

          <div className="mt-6">
            {qty === 0 ? (
              <button
                onClick={onAdd}
                className="rounded-full bg-emerald-600 px-6 py-3 text-white shadow hover:bg-emerald-700 transition"
              >
                Add to Cart
              </button>
            ) : (
              <div className="inline-flex items-center gap-3 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
                <button
                  onClick={() => dec(pid)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-emerald-200 hover:bg-emerald-100 transition"
                >
                  –
                </button>
                <span className="min-w-[2ch] text-center">{qty}</span>
                <button
                  onClick={() => inc(pid)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)}
              className="rounded-full bg-white px-4 py-2 ring-1 ring-black/10 shadow hover:bg-gray-50 transition"
            >
              ← Prev
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % items.length)}
              className="rounded-full bg-emerald-600 px-5 py-2 text-white shadow hover:bg-emerald-700 transition"
            >
              Next →
            </button>
          </div>

          {/* Dots */}
          <div className="mt-6 flex items-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to ${i + 1}`}
                onClick={() => setIdx(i)}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition",
                  i === idx ? "bg-emerald-600 w-6" : "bg-emerald-200"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
