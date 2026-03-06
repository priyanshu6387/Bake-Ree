"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ChevronLeft, LogOut } from "lucide-react";
import { TOP_NAV, type OpsTopNavItem } from "@/lib/ops/nav";
import { createPortal } from "react-dom";

const normalizeOpsPath = (pathname: string) =>
  pathname.startsWith("/admin") ? pathname.replace(/^\/admin/, "/ops") : pathname;

const getMatchScore = (pathname: string, href: string) => {
  const normalized = normalizeOpsPath(pathname);
  if (normalized === href) return href.length + 1000;
  if (href !== "/ops" && normalized.startsWith(`${href}/`)) return href.length;
  if (href === "/ops/inventory" && normalized.startsWith("/ops/procurement")) return href.length;
  return -1;
};

type OpsSidebarProps = {
  isOpen: boolean;
  isCollapsed: boolean;
  isCollapseLocked?: boolean;
  navItems?: OpsTopNavItem[];
  onClose: () => void;
  onToggleCollapse: () => void;
};

export default function OpsSidebar({
  isOpen,
  isCollapsed,
  isCollapseLocked = false,
  navItems: navItemsProp,
  onClose,
  onToggleCollapse,
}: OpsSidebarProps) {
  const pathname = usePathname();
  const safePathname = pathname ?? "/ops";
  const navItems = useMemo(() => navItemsProp ?? TOP_NAV, [navItemsProp]);
  const activeHref = useMemo(
    () =>
      navItems
        .map((item) => ({
          href: item.href,
          score: getMatchScore(safePathname, item.href),
        }))
        .filter((item) => item.score >= 0)
        .sort((a, b) => b.score - a.score)[0]?.href ?? null,
    [navItems, safePathname]
  );
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState<{
    label: string;
    top: number;
    left: number;
  } | null>(null);

  const showTooltip = (label: string, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    setTooltip({
      label,
      top: rect.top + rect.height / 4,
      left: rect.right + 12,
    });
  };

  const hideTooltip = () => setTooltip(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col translate-x-0 border-r border-black/10 bg-white px-5 py-6 shadow-lg transition-all lg:static lg:inset-auto lg:h-full lg:w-full lg:translate-x-0 lg:transform-none lg:rounded-none lg:border-0 lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-full lg:px-3" : "lg:w-full"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1f7a6b] text-sm font-semibold text-white">
              BR
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-semibold text-[#2a2927]">Bake-Ree</p>
                <p className="text-xs text-[#6b6b6b]">Admin Console · Ops</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              className={clsx(
                "hidden h-8 w-8 items-center justify-center rounded-full border border-[#efe5d8] text-[#3b3b3b] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40 lg:inline-flex",
                isCollapseLocked ? "opacity-50" : "hover:bg-[#f6efe6]"
              )}
              aria-label="Toggle sidebar collapse"
              title={
                isCollapseLocked
                  ? "Sidebar locked while section navigation is open"
                  : isCollapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
              }
              disabled={isCollapseLocked}
            >
              <ChevronLeft
                className={clsx("h-4 w-4 transition-transform", isCollapsed && "rotate-180")}
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#efe5d8] px-2 py-1 text-xs text-[#3b3b3b] transition hover:bg-[#f6efe6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40 lg:hidden"
            >
              Close
            </button>
          </div>
        </div>

        <nav
          className={clsx(
            "no-scrollbar mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto pr-2",
            isCollapsed && "lg:pr-0"
          )}
        >
          {navItems.map((item) => {
            const active = item.href === activeHref;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={clsx(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40",
                  active
                    ? "bg-[#1f7a6b] text-white shadow-[0_10px_20px_rgba(31,122,107,0.18)]"
                    : "text-[#2a2927] hover:bg-[#f6efe6]",
                  isCollapsed && "lg:justify-center lg:px-2"
                )}
                aria-current={active ? "page" : undefined}
                aria-label={isCollapsed ? item.label : undefined}
                onMouseEnter={
                  isCollapsed
                    ? (event) => showTooltip(item.label, event.currentTarget)
                    : undefined
                }
                onMouseLeave={isCollapsed ? hideTooltip : undefined}
                onFocus={
                  isCollapsed ? (event) => showTooltip(item.label, event.currentTarget) : undefined
                }
                onBlur={isCollapsed ? hideTooltip : undefined}
              >
                <span
                  className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    active ? "bg-white/15" : "bg-[#fbf7f1]"
                  )}
                >
                  <Icon className={clsx("h-4 w-4", active ? "text-white" : "text-[#1f7a6b]")} />
                </span>
                {!isCollapsed && <span className="flex-1">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {isCollapsed &&
          tooltip &&
          mounted &&
          createPortal(
            <div
              className="pointer-events-none fixed z-[200] whitespace-nowrap rounded-xl bg-[#1f2330] px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
              style={{ top: tooltip.top, left: tooltip.left, transform: "translateY(-50%)" }}
            >
              <span className="relative">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 border-y-6 border-y-transparent border-r-6 border-r-[#1f2330]" />
                {tooltip.label}
              </span>
            </div>,
            document.body
          )}

        <div className="mt-4">
          <button
            type="button"
            className={clsx(
              "flex w-full items-center justify-center gap-2 rounded-xl border border-[#efe5d8] bg-white px-4 py-2 text-xs font-semibold text-[#2a2927] transition hover:bg-[#f6efe6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40",
              isCollapsed && "lg:h-11 lg:w-11 lg:px-0"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
