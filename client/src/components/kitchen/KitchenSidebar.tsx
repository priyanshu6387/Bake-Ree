"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { kitchenNav, type KitchenNavItem } from "@/lib/kitchen/nav";
import { clearStoredToken } from "@/utils/jwt";

const getMatchScore = (pathname: string, href: string) => {
  if (pathname === href) return href.length + 1000;
  if (pathname.startsWith(`${href}/`)) return href.length;
  return -1;
};

type KitchenSidebarProps = {
  isOpen: boolean;
  navItems?: KitchenNavItem[];
  onClose: () => void;
};

export default function KitchenSidebar({
  isOpen,
  navItems = kitchenNav,
  onClose,
}: KitchenSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const safePathname = pathname ?? "/kitchen";
  const activeHref = navItems
    .map((item) => ({ href: item.href, score: getMatchScore(safePathname, item.href) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score)[0]?.href;

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 z-30 bg-black/30 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-black/5 bg-white px-4 py-5 shadow-lg transition-transform lg:fixed lg:top-0 lg:left-0 lg:h-screen lg:translate-x-0 lg:rounded-none lg:border-r lg:border-[#efe5d8] lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9b7a4a]">
              Kitchen
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#efe5d8] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2a2927]">
              Station · Oven
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#efe5d8] px-2.5 py-1 text-[11px] text-[#3b3b3b] transition hover:bg-[#f6efe6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40 lg:hidden"
          >
            Close
          </button>
        </div>

        <div className="no-scrollbar mt-6 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-2">
          {navItems.map((item) => {
            const active = item.href === activeHref;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl border-l-2 px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40",
                  active
                    ? "border-[#2a2927] bg-[#f6f1ea] text-[#2a2927]"
                    : "border-transparent text-[#6b5f53] hover:bg-[#f6efe6] hover:text-[#2a2927]"
                )}
                aria-current={active ? "page" : undefined}
                title={item.description}
              >
                <span
                  className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    active ? "bg-white text-[#2a2927]" : "bg-[#f6efe6] text-[#8b7d6e]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="mt-4 border-t border-[#efe5d8] pt-4">
          <button
            type="button"
            onClick={() => {
              clearStoredToken();
              onClose();
              router.push("/login");
            }}
            className="flex w-full items-center justify-center rounded-full border border-[#eadfd1] px-3 py-1.5 text-[11px] font-semibold text-[#2a2927] transition hover:bg-[#f6efe6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
