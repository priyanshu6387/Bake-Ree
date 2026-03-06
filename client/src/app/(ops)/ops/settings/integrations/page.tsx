import Link from "next/link";
import OpsBadge from "@/components/ops/OpsBadge";
import { OPS_SETTINGS_SECTION_MAP } from "@/lib/ops/settingsMeta";

const providers = [
  { name: "Payments Gateway", latency: "142ms", state: "Connected", tone: "success" as const },
  { name: "Delivery Maps", latency: "311ms", state: "Degraded", tone: "warning" as const },
  { name: "CRM Broadcast", latency: "98ms", state: "Connected", tone: "success" as const },
  { name: "Webhook Relay", latency: "N/A", state: "Draft", tone: "info" as const },
];

export default function OpsSettingsIntegrationsPage() {
  const section = OPS_SETTINGS_SECTION_MAP.integrations;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6b4f2a]">Connectivity Control Plane</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#2a2927]">{section.label}</h2>
            <p className="mt-2 text-sm text-[#5c5a56]">Provider health, webhook behavior, and sync dependencies in one control workspace.</p>
          </div>
          <OpsBadge label="Phase 4" tone="info" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#2a2927]">Provider Status Deck</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {providers.map((provider) => (
              <div key={provider.name} className="rounded-xl border border-[#efe5d8] bg-[#fbf7f1] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[#2a2927]">{provider.name}</p>
                  <OpsBadge label={provider.state} tone={provider.tone} />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#8b867f]">Latency</p>
                <p className="mt-1 text-xl font-semibold text-[#2a2927]">{provider.latency}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Sync Flow Map</h3>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-3 text-sky-800">Order Events</div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-amber-800">Webhook Router</div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-emerald-800">External Providers</div>
            </div>
            <p className="mt-3 text-xs text-[#8b867f]">Flow and retry policy wiring will be activated in Phase 4.</p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Dependency Matrix</h3>
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
