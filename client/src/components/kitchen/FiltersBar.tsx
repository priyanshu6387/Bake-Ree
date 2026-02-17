"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";

type FiltersBarProps = {
  status: string;
  type: string;
  priority: string;
  station: string;
  assigned: string;
  attention: string;
  sort: string;
  search: string;
  statusOptions: readonly string[];
  typeOptions: readonly string[];
  priorityOptions: readonly string[];
  stationOptions: readonly string[];
  assignedOptions: readonly string[];
  attentionOptions: readonly string[];
  sortOptions: readonly string[];
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onStationChange: (value: string) => void;
  onAssignedChange: (value: string) => void;
  onAttentionChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onClearAll: () => void;
};

export default function FiltersBar({
  status,
  type,
  priority,
  station,
  assigned,
  attention,
  sort,
  search,
  statusOptions,
  typeOptions,
  priorityOptions,
  stationOptions,
  assignedOptions,
  attentionOptions,
  sortOptions,
  onStatusChange,
  onTypeChange,
  onPriorityChange,
  onStationChange,
  onAssignedChange,
  onAttentionChange,
  onSortChange,
  onSearchChange,
  onClearAll,
}: FiltersBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const appliedFilters = useMemo(() => {
    const items: { id: string; label: string; onClear: () => void }[] = [];
    if (status !== "All") items.push({ id: "status", label: `Status: ${status}`, onClear: () => onStatusChange("All") });
    if (type !== "All") items.push({ id: "type", label: `Type: ${type}`, onClear: () => onTypeChange("All") });
    if (priority !== "All")
      items.push({ id: "priority", label: `Priority: ${priority}`, onClear: () => onPriorityChange("All") });
    if (station !== "All")
      items.push({ id: "station", label: `Station: ${station}`, onClear: () => onStationChange("All") });
    if (assigned !== "All")
      items.push({ id: "assigned", label: `Assigned: ${assigned}`, onClear: () => onAssignedChange("All") });
    if (attention !== "All")
      items.push({ id: "attention", label: `Attention: ${attention}`, onClear: () => onAttentionChange("All") });
    if (sort !== "Oldest")
      items.push({ id: "sort", label: `Sort: ${sort}`, onClear: () => onSortChange("Oldest") });
    if (search.trim())
      items.push({ id: "search", label: `Search: ${search.trim()}`, onClear: () => onSearchChange("") });
    return items;
  }, [
    assigned,
    attention,
    onAssignedChange,
    onAttentionChange,
    onPriorityChange,
    onSearchChange,
    onSortChange,
    onStationChange,
    onStatusChange,
    onTypeChange,
    priority,
    search,
    sort,
    station,
    status,
    type,
  ]);

  return (
    <section className="h-auto w-full rounded-2xl border border-black/5 bg-white/85 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Filters
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] font-semibold uppercase tracking-wider text-[#6b5f53] transition hover:text-[#2a2927]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-full border border-[#eadfd1] px-3 py-1 text-[11px] font-semibold text-[#2a2927] transition hover:bg-[#f6efe6] lg:hidden"
          >
            {mobileOpen ? "Hide" : "Filter"}
          </button>
        </div>
      </div>

      <div className={clsx("mt-3 gap-2.5", mobileOpen ? "grid" : "hidden lg:grid")}>
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.4fr)_repeat(5,minmax(120px,1fr))]">
          <label className="block md:col-span-2 xl:col-span-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Search</span>
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Order id or customer"
              className="mt-1 h-9 w-full rounded-xl border border-[#eadfd1] bg-white px-3 text-sm text-[#2a2927]"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Status
            </span>
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              className="mt-1 h-9 w-full rounded-xl border border-[#eadfd1] bg-white px-3 text-sm text-[#2a2927]"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Type
            </span>
            <select
              value={type}
              onChange={(event) => onTypeChange(event.target.value)}
              className="mt-1 h-9 w-full rounded-xl border border-[#eadfd1] bg-white px-3 text-sm text-[#2a2927]"
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Priority
            </span>
            <select
              value={priority}
              onChange={(event) => onPriorityChange(event.target.value)}
              className="mt-1 h-9 w-full rounded-xl border border-[#eadfd1] bg-white px-3 text-sm text-[#2a2927]"
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Station
            </span>
            <select
              value={station}
              onChange={(event) => onStationChange(event.target.value)}
              className="mt-1 h-9 w-full rounded-xl border border-[#eadfd1] bg-white px-3 text-sm text-[#2a2927]"
            >
              {stationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Assigned
            </span>
            <select
              value={assigned}
              onChange={(event) => onAssignedChange(event.target.value)}
              className="mt-1 h-9 w-full rounded-xl border border-[#eadfd1] bg-white px-3 text-sm text-[#2a2927]"
            >
              {assignedOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-[#efe5d8] bg-[#fbf8f3] px-3 py-1.5">
          <button
            type="button"
            onClick={() => setAdvancedOpen((prev) => !prev)}
            className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
          >
            <span>More filters</span>
            <span className="text-[#a89686]">{advancedOpen ? "−" : "+"}</span>
          </button>
          <div
            className={clsx(
              "grid gap-3 overflow-hidden transition-[max-height,opacity] duration-200 lg:grid-cols-[1fr_220px]",
              advancedOpen ? "mt-2 max-h-[360px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className={clsx(advancedOpen && "pt-3 border-t border-black/5")}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Attention
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {attentionOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onAttentionChange(option)}
                    className={clsx(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition",
                      attention === option
                        ? "border-[#2a2927] bg-[#2a2927] text-white"
                        : "border-[#eadfd1] bg-white text-[#2a2927] hover:bg-[#f6efe6]"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <label className={clsx(advancedOpen && "pt-3 border-t border-black/5")}>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Sort</span>
              <select
                value={sort}
                onChange={(event) => onSortChange(event.target.value)}
                className="mt-1 h-9 w-full rounded-xl border border-[#eadfd1] bg-white px-3 text-sm text-[#2a2927]"
              >
                {sortOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {appliedFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-neutral-500">Applied</span>
            {appliedFilters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClear}
                className="inline-flex items-center gap-1 rounded-full border border-[#eadfd1] bg-white px-2.5 py-0.5 font-semibold text-[#2a2927] transition hover:bg-[#f6efe6]"
              >
                {item.label}
                <span className="text-[#a89787]">×</span>
              </button>
            ))}
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-full border border-[#eadfd1] px-2.5 py-0.5 font-semibold text-[#6b5f53] transition hover:bg-[#f6efe6]"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
