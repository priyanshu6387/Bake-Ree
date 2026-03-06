import Link from "next/link";
import OpsBadge from "@/components/ops/OpsBadge";
import { OPS_SETTINGS_SECTION_MAP } from "@/lib/ops/settingsMeta";

const channels = [
  { name: "Email", color: "bg-[#fff8ef] border-[#efddc2] text-[#7a5a2d]", status: "High usage" },
  { name: "In-App", color: "bg-[#eff7ff] border-[#cfe2f7] text-[#2e577d]", status: "Primary" },
  { name: "Push", color: "bg-[#f2f9f2] border-[#cfe4cf] text-[#2e6a3e]", status: "Permission-gated" },
  { name: "Webhook", color: "bg-[#f8f2ff] border-[#decff7] text-[#5a3a8d]", status: "Integrations" },
];

export default function OpsSettingsNotificationsPage() {
  const section = OPS_SETTINGS_SECTION_MAP.notifications;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6b4f2a]">Signal Routing Center</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#2a2927]">{section.label}</h2>
            <p className="mt-2 text-sm text-[#5c5a56]">Route alerts by audience, channel, and escalation tier with policy-aware fallback paths.</p>
          </div>
          <div className="flex gap-2">
            <OpsBadge label="Phase 4" tone="info" />
            <OpsBadge label="Escalation Rules" tone="warning" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#2a2927]">Channel Lanes</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {channels.map((channel) => (
              <div key={channel.name} className={`rounded-2xl border px-4 py-4 ${channel.color}`}>
                <p className="text-lg font-semibold">{channel.name}</p>
                <p className="mt-1 text-sm opacity-90">{channel.status}</p>
                <div className="mt-3 h-2 rounded-full bg-white/70">
                  <div className="h-2 rounded-full bg-current" style={{ width: `${55 + channel.name.length * 8}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Escalation Ladder</h3>
            <div className="mt-4 space-y-2">
              {[
                "Tier 1: In-app ping to assigned role",
                "Tier 2: Email fallback after SLA threshold",
                "Tier 3: Admin broadcast and webhook trigger",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-[#efe5d8] bg-[#fbf7f1] px-3 py-2 text-sm text-[#5c5a56]">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Linked Surfaces</h3>
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
