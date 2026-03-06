"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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
  // Keep route transitions predictable when main content is the only scroll container.
  const mainScrollRef = useRef<HTMLElement | null>(null);
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

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f6efe6]">
      <div
        className="flex h-full w-full flex-col lg:grid"
        style={{
          gridTemplateColumns: showSubnavColumn
            ? `${sidebarWidth} 240px 1fr`
            : `${sidebarWidth} 1fr`,
        }}
      >
        <aside className="relative z-30 lg:h-full lg:min-h-0 lg:border-r lg:border-black/5 lg:bg-white">
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
          <aside className="relative z-20 lg:h-full lg:min-h-0 lg:border-r lg:border-black/5 lg:bg-white/70 lg:backdrop-blur">
            <OpsSubSidebar isOpen={isSubnavOpen} onClose={() => setIsSubnavOpen(false)} />
          </aside>
        )}

        <main
          ref={mainScrollRef}
          className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto"
        >
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
