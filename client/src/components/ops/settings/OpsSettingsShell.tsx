import Link from "next/link";
import type { ReactNode } from "react";
import OpsBadge from "@/components/ops/OpsBadge";
import OpsSection from "@/components/ops/OpsSection";
import type { OpsSettingsSectionMeta } from "@/lib/ops/settingsMeta";

type OpsSettingsShellProps = {
  section: OpsSettingsSectionMeta;
  children?: ReactNode;
  scaffoldTitle?: string;
  scaffoldDescription?: string;
  checklist?: string[];
};

const readinessLabel = (value: boolean) => (value ? "Ready" : "Pending");
const readinessTone = (value: boolean) => (value ? "success" : "warning");

export default function OpsSettingsShell({
  section,
  children,
  scaffoldTitle = "Module Scaffold",
  scaffoldDescription = "This section is now routable and UI-ready. API wiring and behavior activation follow in the next implementation phase.",
  checklist = [
    "Section route has been created and connected to Ops sub-navigation.",
    "Related dashboard links are mapped and visible in the right panel.",
    "Reusable page framework is in place for upcoming data wiring.",
  ],
}: OpsSettingsShellProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <OpsSection
          title={section.label}
          description={section.description}
          action={<OpsBadge label={section.phase} tone="info" />}
        >
          <div className="flex flex-wrap items-center gap-2">
            <OpsBadge
              label={`UI: ${readinessLabel(section.readiness.ui)}`}
              tone={readinessTone(section.readiness.ui)}
            />
            <OpsBadge
              label={`API: ${readinessLabel(section.readiness.api)}`}
              tone={readinessTone(section.readiness.api)}
            />
            <OpsBadge
              label={`Links: ${readinessLabel(section.readiness.links)}`}
              tone={readinessTone(section.readiness.links)}
            />
          </div>
        </OpsSection>

        {children}

        <OpsSection title={scaffoldTitle} description={scaffoldDescription}>
          <div className="space-y-2">
            {checklist.map((line) => (
              <div
                key={line}
                className="rounded-xl border border-black/10 bg-[#fbf7f1] px-4 py-3 text-sm text-[#5c5a56]"
              >
                {line}
              </div>
            ))}
          </div>
        </OpsSection>
      </div>

      <aside className="space-y-6">
        <OpsSection
          title="Related Dashboards & Features"
          description="Skeleton linking map for cross-module flows."
        >
          <div className="space-y-2">
            {section.relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-xl border border-black/10 bg-white px-4 py-3 text-sm transition hover:bg-[#f7f5f0]"
              >
                <p className="font-semibold text-[#2a2927]">{link.label}</p>
                <p className="mt-1 text-xs text-[#7a6f63]">{link.detail}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#9a958d]">
                  {link.href}
                </p>
              </Link>
            ))}
          </div>
        </OpsSection>

        <OpsSection
          title="Section Health"
          description="Phase-level status for this module."
          compact
        >
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-lg border border-black/10 bg-[#fbf7f1] px-3 py-2">
              <span className="uppercase tracking-[0.2em] text-[#8b867f]">Route</span>
              <OpsBadge label="Linked" tone="success" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-black/10 bg-[#fbf7f1] px-3 py-2">
              <span className="uppercase tracking-[0.2em] text-[#8b867f]">UI Shell</span>
              <OpsBadge label="Ready" tone="success" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-black/10 bg-[#fbf7f1] px-3 py-2">
              <span className="uppercase tracking-[0.2em] text-[#8b867f]">Data Wiring</span>
              <OpsBadge label={section.phase} tone="warning" />
            </div>
          </div>
        </OpsSection>
      </aside>
    </div>
  );
}
