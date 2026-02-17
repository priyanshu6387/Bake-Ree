"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminNav } from "./admin-nav";
import { getAdminSubnav, hasAdminSubnav } from "./admin-subnav";
import NotificationCenter from "@/app/components/NotificationCenter";
import useRoleNotifications from "@/hooks/useRoleNotifications";

const isActive = (pathname: string, href: string) =>
  pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const subnav = getAdminSubnav(pathname);
  const [manualCollapsed, setManualCollapsed] = useState(false);
  const [subnavVisible, setSubnavVisible] = useState(true);
  useRoleNotifications("admin");
  const hasSubnav = Boolean(subnav);
  const showSubnav = hasSubnav && subnavVisible;
  const isCollapsed = showSubnav ? true : manualCollapsed;

  useEffect(() => {
    if (hasSubnav) {
      setSubnavVisible(true);
    }
  }, [hasSubnav]);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      router.replace("/ops");
    }
  }, [pathname, router]);

  if (pathname?.startsWith("/admin")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f2ec] text-sm text-[#6b6b6b]">
        Redirecting to Ops Console…
      </div>
    );
  }

  const iconMap: Record<string, JSX.Element> = {
    Overview: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12l9-9 9 9" />
        <path d="M9 21V9h6v12" />
      </svg>
    ),
    Orders: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 8h10M7 12h10M7 16h6" />
      </svg>
    ),
    Products: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 7v10l9 4 9-4V7" />
      </svg>
    ),
    Inventory: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    CRM: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-4 6-6 8-6s6.5 2 8 6" />
      </svg>
    ),
    ERP: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
        <circle cx="8" cy="7" r="2" />
        <circle cx="16" cy="12" r="2" />
        <circle cx="10" cy="17" r="2" />
      </svg>
    ),
    Delivery: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7h11v10H3z" />
        <path d="M14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="19" r="2" />
        <circle cx="18" cy="19" r="2" />
      </svg>
    ),
    Analytics: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19V5" />
        <path d="M10 19V9" />
        <path d="M16 19v-6" />
        <path d="M22 19V7" />
      </svg>
    ),
    Settings: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.8 1.8 0 0 0 .4 2l-1.7 1.7a1.8 1.8 0 0 0-2-.4l-1 0.5a1.8 1.8 0 0 0-1 1.6h-2a1.8 1.8 0 0 0-1-1.6l-1-0.5a1.8 1.8 0 0 0-2 .4L4.2 17a1.8 1.8 0 0 0 .4-2l-.5-1a1.8 1.8 0 0 0-1.6-1v-2a1.8 1.8 0 0 0 1.6-1l.5-1a1.8 1.8 0 0 0-.4-2L6 4.2a1.8 1.8 0 0 0 2 .4l1-.5a1.8 1.8 0 0 0 1-1.6h2a1.8 1.8 0 0 0 1 1.6l1 .5a1.8 1.8 0 0 0 2-.4L19.8 6a1.8 1.8 0 0 0-.4 2l.5 1a1.8 1.8 0 0 0 1.6 1v2a1.8 1.8 0 0 0-1.6 1l-.5 1z" />
      </svg>
    ),
  };

  return (
    <div className="min-h-screen bg-[#f3f2ec]">
      <div className="px-4 py-4 lg:px-6 lg:py-6">
        <div
          className={`grid gap-4 ${
            showSubnav
              ? "lg:grid-cols-[92px_240px_1fr]"
              : isCollapsed
                ? "lg:grid-cols-[92px_1fr]"
                : "lg:grid-cols-[280px_1fr]"
          }`}
        >
          <aside
            className={`sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-2xl border border-black/10 bg-white shadow-sm transition-all duration-200 ${
              isCollapsed
                ? "w-[88px] max-w-[88px] p-3"
                : "w-full p-5"
            }`}
          >
            <div className={`mb-5 flex ${isCollapsed ? "flex-col items-center gap-3" : "items-center justify-between"}`}>
              <div className={`flex ${isCollapsed ? "flex-col items-center gap-2" : "items-center gap-3"}`}>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2a2927] text-sm font-semibold text-white">
                  BR
                </div>
                {!isCollapsed && (
                  <div>
                    <p className="text-sm font-semibold text-[#1b1b1b]">Bake-Ree</p>
                    <p className="text-xs text-[#8b8b8b]">Admin Console</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setManualCollapsed((prev) => !prev)}
                className={`flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-[#2a2927] transition ${
                  showSubnav ? "opacity-40" : "hover:bg-[#f7f5f0]"
                } ${isCollapsed ? "order-2" : ""}`}
                disabled={showSubnav}
                aria-label="Toggle sidebar"
                title={showSubnav ? "Sidebar locked when sub-sections are open" : "Toggle sidebar"}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 transition-transform ${
                    isCollapsed ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
            </div>
            {!isCollapsed && (
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-[0.2em] text-[#7a766f]">
                  Search
                </label>
                <input
                  placeholder="Search"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#f7f7f7] px-3 py-2 text-sm text-[#2a2927]"
                />
              </div>
            )}
            <nav className={`flex-1 space-y-2 ${isCollapsed ? "items-center" : ""}`}>
              {adminNav.map((item) => {
                const active = isActive(pathname, item.href);
                const hasSub = hasAdminSubnav(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-xl text-sm transition ${
                      active
                        ? "bg-[#2a2927] text-white"
                        : "border border-transparent text-[#2a2927] hover:border-black/10 hover:bg-[#f7f5f0]"
                    } ${isCollapsed ? "h-12 justify-center px-2" : "px-3 py-2 justify-between"}`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border border-black/5 ${
                        active
                          ? "bg-white/10 text-white"
                          : "bg-[#f2f2f2] text-[#2a2927]"
                      }`}
                    >
                      {iconMap[item.label] ?? item.label.slice(0, 1)}
                    </span>
                    {!isCollapsed && (
                      <span className="flex-1">{item.label}</span>
                    )}
                    {!isCollapsed && (
                      <span
                        className={`text-xs ${
                          active ? "text-white/70" : "text-[#9a958d]"
                        }`}
                      >
                        {hasSub ? "▸" : ""}
                      </span>
                    )}
                    {isCollapsed && (
                      <span className="pointer-events-none absolute left-full top-1/2 z-10 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#2a2927] px-3 py-2 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <button
              className={`mt-4 rounded-xl border border-black/10 px-3 py-2 text-xs font-semibold text-[#2a2927] ${
                isCollapsed ? "h-11 w-11 px-0" : "w-full"
              }`}
              aria-label="Logout"
            >
              {isCollapsed ? (
                <span className="inline-flex h-full w-full items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10 17l5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M21 19V5" />
                  </svg>
                </span>
              ) : (
                "Logout"
              )}
            </button>
          </aside>

          {showSubnav ? (
            <aside className="sticky top-4 h-fit self-start rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a766f]">
                  {subnav.label} Sections
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubnavVisible(false);
                    setManualCollapsed(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-[#2a2927] hover:bg-[#f7f5f0]"
                  aria-label="Close sub navigation"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12" />
                    <path d="M18 6l-12 12" />
                  </svg>
                </button>
              </div>
              {subnav.items.length > 0 ? (
                <nav className="space-y-2">
                  {subnav.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-xl px-3 py-2 text-sm transition ${
                          active
                            ? "bg-[#2a2927] text-white"
                            : "border border-transparent text-[#2a2927] hover:border-black/10 hover:bg-[#f7f5f0]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              ) : (
                <div className="rounded-xl border border-dashed border-black/10 bg-[#f9f7f2] p-4 text-sm text-[#8b867f]">
                  Sub-options will appear here once configured.
                </div>
              )}
            </aside>
          ) : null}

          <div className="space-y-4">
            <div className="flex justify-end">
              <NotificationCenter audience="admin" />
            </div>
            <main>{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
