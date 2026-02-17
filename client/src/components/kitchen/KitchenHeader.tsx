"use client";

import { FiRefreshCw } from "react-icons/fi";
import clsx from "clsx";
import NotificationCenter from "@/app/components/NotificationCenter";
import useRoleNotifications from "@/hooks/useRoleNotifications";

type KitchenHeaderProps = {
  title: string;
  subtitle?: string;
  description?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  isLive?: boolean;
  lastUpdatedLabel?: string;
};

export default function KitchenHeader({
  title,
  subtitle,
  description,
  onRefresh,
  refreshing,
  isLive = true,
  lastUpdatedLabel,
}: KitchenHeaderProps) {
  useRoleNotifications("kitchen", { playChimeOnAdminApproval: true });

  return (
    <header className="relative z-30 bg-white/80 backdrop-blur border-b border-[#efe5d8] -mx-4 lg:-mx-8">
      <div className="w-full px-4 py-4 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {subtitle && (
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#b08b5a]">
                {subtitle}
              </p>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-[#2a2927]">{title}</h1>
            {description && (
              <p className="mt-1 max-w-[680px] truncate text-sm text-[#6b5f53]">{description}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lastUpdatedLabel && (
              <div className="hidden items-center gap-2 rounded-full border border-[#efe5d8] bg-white/90 px-3 py-1 text-[11px] text-[#6b5f53] sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>Updated {lastUpdatedLabel}</span>
              </div>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 rounded-full border border-[#e8dfd3] bg-white px-4 py-1.5 text-sm font-medium text-[#2a2927] transition-all hover:bg-[#f6f1ea] disabled:opacity-50"
              >
                <FiRefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
                Refresh
              </button>
            )}
            <NotificationCenter audience="kitchen" />
            <div className="flex items-center gap-2 rounded-full border border-[#efe5d8] bg-white px-3 py-1 text-xs font-medium">
              <div
                className={clsx(
                  "h-2 w-2 rounded-full",
                  isLive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                )}
              />
              <span className="text-[#2a2927]">{isLive ? "Live" : "Offline"}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
