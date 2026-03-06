"use client";

import React from "react";
import { cn } from "@/utils/cn";

type Props = {
  search: string;
  onSearch: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
  sort: "newest" | "price-asc" | "price-desc";
  onSort: (v: "newest" | "price-asc" | "price-desc") => void;
};

const categories = ["all", "Breads", "Pastries", "Cakes", "Cookies", "Others"];

export default function FilterBar({
  search,
  onSearch,
  category,
  onCategory,
  sort,
  onSort,
}: Props) {
  return (
    <div className="mb-10 rounded-3xl border border-black/5 bg-white/60 p-4 shadow-sm backdrop-blur md:p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1.8fr_0.6fr] md:items-center">
        {/* Search */}
        <div className="relative">
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search pastries, breads, cakes..."
            className={cn(
              "w-full rounded-2xl bg-[#f6f4ee] px-4 py-3 text-sm text-[#2a2927]",
              "shadow-inner ring-1 ring-black/15 outline-none",
              "focus:ring-2 focus:ring-emerald-500 transition"
            )}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6b6b65]">
            Type to filter
          </span>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => onCategory(c)}
            className={cn(
              "px-4 py-2 rounded-full text-sm transition-all",
              "border border-black/10 bg-white hover:bg-[#f4f7f2] shadow-sm",
              category === c && "border-[#008066] bg-[#e7f0ea] text-[#005c45]"
            )}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center md:justify-end">
          <div className="relative w-full md:w-auto">
              <select
                value={sort}
                onChange={(e) => {
                  const nextSort = e.target.value as Props["sort"];
                  onSort(nextSort);
                }}
                className="w-full appearance-none rounded-full bg-white px-2 py-1 pr-4 text-sm text-[#2a2927] shadow-md ring-1 ring-black/15 border border-black/15 outline-none focus:ring-2 focus:ring-emerald-600 transition"
              >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#2a2927]">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8l4 4 4-4" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
