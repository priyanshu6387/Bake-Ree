import Link from "next/link";
import { OPS_SETTINGS_SECTION_MAP } from "@/lib/ops/settingsMeta";
import OpsBadge from "@/components/ops/OpsBadge";

const moduleRows = [
  { label: "Orders", state: "Visible", tone: "success" as const },
  { label: "Production", state: "Visible", tone: "success" as const },
  { label: "Inventory", state: "Conditional", tone: "warning" as const },
  { label: "Logistics", state: "Visible", tone: "success" as const },
  { label: "Finance", state: "Locked", tone: "danger" as const },
  { label: "CRM", state: "Visible", tone: "success" as const },
];

export default function OpsSettingsNavigationPage() {
  const section = OPS_SETTINGS_SECTION_MAP.navigation;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-black/10 bg-[linear-gradient(120deg,#ffffff_0%,#f3fbf8_55%,#edf5ff_100%)] shadow-sm">
        <div className="grid gap-4 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6b4f2a]">Navigation Orchestrator</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#2a2927]">{section.label}</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#5c5a56]">{section.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <OpsBadge label="Phase 2" tone="info" />
              <OpsBadge label="Access Simulator" tone="warning" />
              <OpsBadge label="Critical Route Guard" tone="warning" />
            </div>
          </div>
          <div className="rounded-2xl border border-[#dbe8dd] bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8b867f]">Readiness Snapshot</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-[#f6f1ea] px-3 py-2">
                <span>UI</span>
                <OpsBadge label="Ready" tone="success" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#f6f1ea] px-3 py-2">
                <span>API</span>
                <OpsBadge label="Pending" tone="warning" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#f6f1ea] px-3 py-2">
                <span>Links</span>
                <OpsBadge label="Ready" tone="success" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#2a2927]">Module Visibility Canvas</h3>
            <span className="text-xs uppercase tracking-[0.2em] text-[#8b867f]">Role: Ops Admin</span>
          </div>
          <div className="mt-4 space-y-2">
            {moduleRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl border border-[#efe5d8] bg-[#fbf7f1] px-4 py-3">
                <div>
                  <p className="font-semibold text-[#2a2927]">{row.label}</p>
                  <p className="text-xs text-[#7a6f63]">Module route policy</p>
                </div>
                <OpsBadge label={row.state} tone={row.tone} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Impact Radar</h3>
            <p className="mt-1 text-sm text-[#6b6b6b]">Potential route impact before publishing policy.</p>
            <div className="mt-4 space-y-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">3 stable routes</div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">2 routes need review</div>
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">1 critical lock candidate</div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Related Dashboards</h3>
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

      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-[#2a2927]">Implementation Queue</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-black/10 bg-[#fbf7f1] px-4 py-3 text-sm text-[#5c5a56]">Connect role selector to API bootstrap</div>
          <div className="rounded-xl border border-black/10 bg-[#fbf7f1] px-4 py-3 text-sm text-[#5c5a56]">Enable module/page lock editing</div>
          <div className="rounded-xl border border-black/10 bg-[#fbf7f1] px-4 py-3 text-sm text-[#5c5a56]">Publish simulator + conflict warnings</div>
        </div>
      </section>
    </div>
  );
}
