"use client";

import { usePathname } from "next/navigation";
import OpsPageShell, { type OpsEmptyState } from "@/components/ops/OpsPageShell";
import { findOpsRouteMeta } from "@/lib/ops/nav";

type OpsPageContentProps = {
  showTable?: boolean;
  emptyState?: OpsEmptyState;
  tableTitle?: string;
  comingSoonTitle?: string;
  comingSoonDescription?: string;
};

export default function OpsPageContent({
  showTable,
  emptyState,
  tableTitle,
  comingSoonTitle,
  comingSoonDescription,
}: OpsPageContentProps) {
  const pathname = usePathname();
  const safePathname = pathname ?? "/ops";
  const meta = findOpsRouteMeta(safePathname);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#efe5d8] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#2a2927]">
          {meta?.label ?? "Ops module"}
        </h2>
        <p className="mt-2 text-sm text-[#6b6b6b]">
          {meta?.description ??
            "This module is wired to the Ops navigation and will surface live data soon."}
        </p>
      </section>
      <OpsPageShell
        showTable={showTable}
        emptyState={emptyState}
        tableTitle={tableTitle}
        comingSoonTitle={comingSoonTitle}
        comingSoonDescription={comingSoonDescription}
      />
    </div>
  );
}
