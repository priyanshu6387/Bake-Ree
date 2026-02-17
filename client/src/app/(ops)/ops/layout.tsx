"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import OpsSidebar from "@/components/ops/OpsSidebar";
import OpsSubSidebar, { getActiveModuleId } from "@/components/ops/OpsSubSidebar";
import OpsHeader from "@/components/ops/OpsHeader";
import NotificationCenter from "@/app/components/NotificationCenter";
import useRoleNotifications from "@/hooks/useRoleNotifications";
import {
  getOpsBreadcrumbs,
  getOpsDescription,
  getOpsTitle,
  SUB_NAV_BY_MODULE,
} from "@/lib/ops/nav";

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSubnavOpen, setIsSubnavOpen] = useState(false);
  useRoleNotifications("admin");

  const activeModuleId = useMemo(() => getActiveModuleId(pathname), [pathname]);
  const activeModuleNav = activeModuleId ? SUB_NAV_BY_MODULE[activeModuleId] : null;
  const hasSubnav = Boolean(
    activeModuleNav &&
      ((activeModuleNav.items && activeModuleNav.items.length > 0) ||
        (activeModuleNav.groups && activeModuleNav.groups.length > 0))
  );
  const showSubnavColumn = hasSubnav && isSubnavOpen;
  const sidebarWidth = isSidebarCollapsed ? "96px" : "260px";
  const headerTitle = useMemo(() => getOpsTitle(pathname), [pathname]);
  const headerDescription = useMemo(() => getOpsDescription(pathname), [pathname]);
  const breadcrumbs = useMemo(() => getOpsBreadcrumbs(pathname), [pathname]);

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsSubnavOpen(hasSubnav);
    setIsSidebarCollapsed(hasSubnav);
  }, [pathname, hasSubnav]);

  useEffect(() => {
    if (isSubnavOpen) {
      setIsSidebarOpen(false);
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  }, [isSubnavOpen]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f6efe6]">
      <div
        className="min-h-screen w-full lg:grid"
        style={{
          gridTemplateColumns: showSubnavColumn
            ? `${sidebarWidth} 240px 1fr`
            : `${sidebarWidth} 1fr`,
        }}
      >
        <aside className="relative z-30 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-r lg:border-black/5 lg:bg-white">
          <OpsSidebar
            isOpen={isSidebarOpen}
            isCollapsed={isSidebarCollapsed}
            isCollapseLocked={isSubnavOpen}
            onClose={() => setIsSidebarOpen(false)}
            onToggleCollapse={() => {
              if (!isSubnavOpen) {
                setIsSidebarCollapsed((prev) => !prev);
              }
            }}
          />
        </aside>

        {showSubnavColumn && (
          <aside className="relative z-20 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-r lg:border-black/5 lg:bg-white/70 lg:backdrop-blur">
            <OpsSubSidebar isOpen={isSubnavOpen} onClose={() => setIsSubnavOpen(false)} />
          </aside>
        )}

        <main className="min-w-0 overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-4 lg:px-6 lg:py-6">
            <OpsHeader
              title={headerTitle}
              description={headerDescription}
              breadcrumbs={breadcrumbs}
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
              onToggleSubnav={hasSubnav ? () => setIsSubnavOpen((prev) => !prev) : undefined}
              showSubnavToggle={hasSubnav}
              actions={<NotificationCenter audience="admin" />}
            />
            <div className="mt-6 w-full min-w-0">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
