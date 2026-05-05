"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { X } from "lucide-react";
import {
  SUB_NAV_BY_MODULE,
  type ModuleId,
  type OpsSubNavGroup,
  type OpsSubNavModule,
} from "@/lib/ops/nav";

const getMatchScore = (pathname: string, href: string) => {
  const normalizedPath = pathname.startsWith("/admin") ? pathname.replace(/^\/admin/, "/ops") : pathname;
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped.replace(/\\\[[^/]+?\\\]/g, "[^/]+");
  const regex = new RegExp(`^${pattern}$`);

  if (regex.test(normalizedPath)) return href.length + 1000;
  if (href.includes("[")) {
    const base = href.split("[")[0];
    return normalizedPath.startsWith(base) ? base.length : -1;
  }
  if (normalizedPath === href) return href.length + 1000;
  if (normalizedPath.startsWith(`${href}/`)) return href.length;
  return -1;
};

const resolveHref = (href: string) => href.replace(/\[[^/]+?\]/g, "1");
const toUserFacingHref = (href: string) =>
  href.startsWith("/ops/inventory")
    ? href.replace(/^\/ops\/inventory/, "/admin/inventory")
    : href;

export const getActiveModuleId = (pathname: string): ModuleId | null => {
  const normalizedPath = pathname.startsWith("/admin")
    ? pathname.replace(/^\/admin/, "/ops")
    : pathname;
  if (normalizedPath === "/ops") return null;
  if (normalizedPath.startsWith("/ops/crm/engagement/offers")) return "coupons";
  if (normalizedPath.startsWith("/ops/hr")) return "hr";
  if (normalizedPath.startsWith("/ops/erp/staff")) return "staff";
  if (normalizedPath.startsWith("/ops/orders")) return "orders";
  if (normalizedPath.startsWith("/ops/production")) return "production";
  if (normalizedPath.startsWith("/ops/inventory")) return "inventory";
  if (normalizedPath.startsWith("/ops/procurement")) return "inventory";
  if (normalizedPath.startsWith("/ops/logistics")) return "logistics";
  if (normalizedPath.startsWith("/ops/finance")) return "finance";
  if (normalizedPath.startsWith("/ops/crm")) return "crm";
  if (normalizedPath.startsWith("/ops/loyalty")) return "crm";
  if (normalizedPath.startsWith("/ops/analytics")) return "analytics";
  if (normalizedPath.startsWith("/ops/settings")) return "settings";
  return null;
};

const toGroups = (
  moduleId: ModuleId,
  moduleNav: OpsSubNavModule
): OpsSubNavGroup[] => {
  if (moduleNav.groups) return moduleNav.groups;
  if (!moduleNav.items || moduleNav.items.length === 0) return [];
  return [
    {
      key: `${moduleId}-items`,
      label: moduleNav.title,
      items: moduleNav.items,
    },
  ];
};

type OpsSubSidebarProps = {
  isOpen: boolean;
  subNavByModule?: Record<ModuleId, OpsSubNavModule>;
  onClose: () => void;
};

export default function OpsSubSidebar({
  isOpen,
  subNavByModule = SUB_NAV_BY_MODULE,
  onClose,
}: OpsSubSidebarProps) {
  const pathname = usePathname();
  const safePathname = pathname ?? "/ops";
  const activeModuleId = getActiveModuleId(safePathname);
  const moduleNav = activeModuleId ? subNavByModule[activeModuleId] : null;
  const groups = activeModuleId && moduleNav ? toGroups(activeModuleId, moduleNav) : [];
  const activeHref = groups
    .flatMap((group) => group.items)
    .map((item) => ({ href: item.href, score: getMatchScore(safePathname, item.href) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score)[0]?.href;

  if (!moduleNav || groups.length === 0) return null;

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
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col translate-x-0 border-r border-black/10 bg-white px-5 py-6 shadow-lg transition-all lg:static lg:inset-auto lg:h-full lg:w-full lg:rounded-none lg:border-0 lg:shadow-none lg:transform-none",
          isOpen
            ? "translate-x-0 lg:px-5 lg:py-6 lg:opacity-100"
            : "-translate-x-full lg:pointer-events-none lg:overflow-hidden lg:px-0 lg:py-0 lg:opacity-0"
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b4f2a]">
              {moduleNav.title}
            </p>
            <p className="text-sm font-semibold text-[#2a2927]">Module Navigation</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#efe5d8] p-2 text-[#3b3b3b] transition hover:bg-[#f6efe6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40"
            aria-label="Close section navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="no-scrollbar mt-6 min-h-0 flex-1 space-y-6 overflow-y-auto pr-2">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b4f2a]">
                {group.label}
              </p>
              <div className="mt-3 space-y-1">
                {group.items.map((item) => {
                  const active = item.href === activeHref;
                  return (
                    <Link
                      key={item.href}
                      href={toUserFacingHref(resolveHref(item.href))}
                      className={clsx(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a6b]/40",
                        active
                          ? "bg-[#e6f7ef] text-[#1f7a6b]"
                          : "text-[#2a2927] hover:bg-[#f6efe6]"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#7a6f63]">
                        {active ? "Active" : ""}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
