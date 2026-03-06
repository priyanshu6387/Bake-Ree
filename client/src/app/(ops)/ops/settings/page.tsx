import Link from "next/link";
import OpsBadge from "@/components/ops/OpsBadge";
import OpsKpiGrid from "@/components/ops/OpsKpiGrid";
import OpsSection from "@/components/ops/OpsSection";
import { OPS_SETTINGS_SECTIONS } from "@/lib/ops/settingsMeta";

export default function OpsSettingsHomePage() {
  const totalSections = OPS_SETTINGS_SECTIONS.length;
  const scaffoldedSections = OPS_SETTINGS_SECTIONS.filter((section) => section.readiness.ui).length;
  const apiConnectedSections = OPS_SETTINGS_SECTIONS.filter((section) => section.readiness.api).length;
  const relatedLinkCount = OPS_SETTINGS_SECTIONS.reduce(
    (count, section) => count + section.relatedLinks.length,
    0
  );

  return (
    <div className="space-y-6">
      <OpsSection
        title="Ops Settings Hub"
        description="Configuration control center for access, policy, integrations, and compliance workflows."
        action={<OpsBadge label="Phase 1" tone="info" />}
      >
        <p className="max-w-3xl text-sm text-[#5c5a56]">
          All Settings sections are now fully routable and linked. This hub tracks implementation
          readiness and provides entry points to each module.
        </p>
      </OpsSection>

      <OpsKpiGrid
        items={[
          {
            label: "Sections Routed",
            value: `${scaffoldedSections}/${totalSections}`,
            hint: "All settings routes are live and navigable.",
            tone: "positive",
          },
          {
            label: "API Wiring",
            value: `${apiConnectedSections}/${totalSections}`,
            hint: "Backend integration begins in the next phase.",
            tone: "warning",
          },
          {
            label: "Cross Links Seeded",
            value: relatedLinkCount,
            hint: "Related dashboard and feature links mapped.",
            tone: "positive",
          },
          {
            label: "Admin Bridge",
            value: "Enabled",
            hint: "/admin/settings routes now bridge to /ops/settings.",
            tone: "positive",
          },
          {
            label: "Current Stage",
            value: "Phase 1",
            hint: "Route completion and framework setup.",
            tone: "neutral",
          },
        ]}
      />

      <OpsSection
        title="Settings Modules"
        description="Open any section to continue implementation in subsequent phases."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {OPS_SETTINGS_SECTIONS.map((section) => (
            <Link
              key={section.key}
              href={section.href}
              className="rounded-2xl border border-black/10 bg-white p-5 transition hover:bg-[#f7f5f0]"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-[#2a2927]">{section.label}</h3>
                <OpsBadge label={section.phase} tone="info" />
              </div>
              <p className="mt-2 text-sm text-[#5c5a56]">{section.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <OpsBadge label={section.readiness.ui ? "UI ready" : "UI pending"} tone="success" />
                <OpsBadge
                  label={section.readiness.api ? "API ready" : "API pending"}
                  tone={section.readiness.api ? "success" : "warning"}
                />
                <OpsBadge label={`${section.relatedLinks.length} links`} tone="neutral" />
              </div>
            </Link>
          ))}
        </div>
      </OpsSection>
    </div>
  );
}
