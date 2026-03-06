import Link from "next/link";
import OpsBadge from "@/components/ops/OpsBadge";
import { OPS_SETTINGS_SECTION_MAP } from "@/lib/ops/settingsMeta";

const controls = [
  { label: "Retention Policy", detail: "SKU and transaction logs", completion: "84%" },
  { label: "Access Review", detail: "Quarterly attestation", completion: "62%" },
  { label: "Export Governance", detail: "Audit-safe data extract", completion: "76%" },
];

export default function OpsSettingsCompliancePage() {
  const section = OPS_SETTINGS_SECTION_MAP.compliance;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/10 bg-[linear-gradient(120deg,#ffffff_0%,#fbf6ef_55%,#f3efe8_100%)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6b4f2a]">Governance Console</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#2a2927]">{section.label}</h2>
            <p className="mt-2 text-sm text-[#5c5a56]">Control retention, review cadence, and policy enforcement paths for operational compliance.</p>
          </div>
          <div className="flex gap-2">
            <OpsBadge label="Phase 4" tone="info" />
            <OpsBadge label="Governance Metadata" tone="warning" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#2a2927]">Control Maturity</h3>
          <div className="mt-4 space-y-3">
            {controls.map((control) => (
              <div key={control.label} className="rounded-xl border border-[#efe5d8] bg-[#fbf7f1] px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[#2a2927]">{control.label}</p>
                  <span className="text-sm font-semibold text-[#6b4f2a]">{control.completion}</span>
                </div>
                <p className="mt-1 text-xs text-[#7a6f63]">{control.detail}</p>
                <div className="mt-2 h-2 rounded-full bg-[#ede2d3]">
                  <div className="h-2 rounded-full bg-[#8f6b3e]" style={{ width: control.completion }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Policy Surfaces</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-black/10 bg-[#fff8ef] px-4 py-3 text-sm text-[#7a5a2d]">Retention windows and archival schedules</div>
              <div className="rounded-xl border border-black/10 bg-[#f7f3ff] px-4 py-3 text-sm text-[#5a4687]">Control owners and approver hierarchy</div>
              <div className="rounded-xl border border-black/10 bg-[#f0f9f5] px-4 py-3 text-sm text-[#2f6a47]">Exception waivers and review deadlines</div>
              <div className="rounded-xl border border-black/10 bg-[#fdf3f3] px-4 py-3 text-sm text-[#8a4444]">Audit linkage and evidence references</div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Regulatory Touchpoints</h3>
            <div className="mt-3 space-y-2">
              {section.relatedLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block rounded-xl border border-[#efe5d8] px-3 py-2 transition hover:bg-[#f7f5f0]">
                  <p className="text-sm font-semibold text-[#2a2927]">{link.label}</p>
                  <p className="text-xs text-[#7a6f63]">{link.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
