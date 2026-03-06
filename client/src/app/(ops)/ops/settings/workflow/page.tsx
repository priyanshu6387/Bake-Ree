import Link from "next/link";
import OpsBadge from "@/components/ops/OpsBadge";
import { OPS_SETTINGS_SECTION_MAP } from "@/lib/ops/settingsMeta";

const pipeline = [
  { step: "Order Intake", note: "validation and priority gate", tone: "info" as const },
  { step: "Kitchen Prep", note: "station assignment and allergen checks", tone: "warning" as const },
  { step: "Ready / Handoff", note: "dispatch request and SLA checkpoint", tone: "success" as const },
  { step: "Delivery Closure", note: "exceptions and escalation hooks", tone: "danger" as const },
];

export default function OpsSettingsWorkflowPage() {
  const section = OPS_SETTINGS_SECTION_MAP.workflow;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-[#6b4f2a]">Process Architecture</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold text-[#2a2927]">{section.label}</h2>
            <p className="mt-2 max-w-3xl text-sm text-[#5c5a56]">Set approval flows, status rules, and escalation policies without breaking downstream operations.</p>
          </div>
          <OpsBadge label="Phase 4" tone="info" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#2a2927]">Workflow Timeline</h3>
          <div className="mt-4 space-y-3">
            {pipeline.map((item, index) => (
              <div key={item.step} className="relative rounded-xl border border-[#efe5d8] bg-[#fbf7f1] px-4 py-3">
                {index !== pipeline.length - 1 && <span className="absolute left-6 top-full h-3 w-px bg-[#d5c8b5]" />}
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[#2a2927]">{item.step}</p>
                  <OpsBadge label={`Step ${index + 1}`} tone={item.tone} />
                </div>
                <p className="mt-1 text-xs text-[#7a6f63]">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Policy Blocks</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-black/10 bg-[#f8fafc] px-4 py-3 text-sm text-[#44576b]">Approval chain policy schema</div>
              <div className="rounded-xl border border-black/10 bg-[#fff8f0] px-4 py-3 text-sm text-[#7a5c2a]">Status transition guardrails</div>
              <div className="rounded-xl border border-black/10 bg-[#f0faf3] px-4 py-3 text-sm text-[#2f6a47]">Escalation + SLA thresholds</div>
              <div className="rounded-xl border border-black/10 bg-[#fff3f3] px-4 py-3 text-sm text-[#824343]">Exception rollback strategy</div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Operational Dependencies</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {section.relatedLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-xl border border-[#efe5d8] px-3 py-3 transition hover:bg-[#f7f5f0]">
                  <p className="text-sm font-semibold text-[#2a2927]">{link.label}</p>
                  <p className="mt-1 text-xs text-[#7a6f63]">{link.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
