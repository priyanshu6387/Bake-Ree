import Link from "next/link";
import OpsBadge from "@/components/ops/OpsBadge";
import { OPS_SETTINGS_SECTION_MAP } from "@/lib/ops/settingsMeta";

const events = [
  { time: "09:10", action: "ROLE_UPDATED", actor: "ops_admin", entity: "kitchen_manager" },
  { time: "09:02", action: "NAV_POLICY_UPDATED", actor: "super_admin", entity: "ops_admin" },
  { time: "08:48", action: "COMPLIANCE_SETTINGS_UPDATED", actor: "ops_admin", entity: "default" },
  { time: "08:31", action: "INTEGRATION_SETTINGS_UPDATED", actor: "super_admin", entity: "default" },
];

export default function OpsSettingsAuditPage() {
  const section = OPS_SETTINGS_SECTION_MAP.audit;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6b4f2a]">Traceability Ledger</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#2a2927]">{section.label}</h2>
            <p className="mt-2 text-sm text-[#5c5a56]">Immutable event timeline for settings and access control changes.</p>
          </div>
          <div className="flex gap-2">
            <OpsBadge label="Phase 5" tone="info" />
            <OpsBadge label="Timeline Feed" tone="warning" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#2a2927]">Event Stream</h3>
            <span className="text-xs uppercase tracking-[0.2em] text-[#8b867f]">Today</span>
          </div>
          <div className="mt-4 space-y-3">
            {events.map((event) => (
              <div key={`${event.time}-${event.action}`} className="rounded-xl border border-[#efe5d8] bg-[#fbf7f1] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#2a2927]">{event.action}</p>
                  <span className="text-xs font-semibold text-[#7a6f63]">{event.time}</span>
                </div>
                <p className="mt-1 text-xs text-[#7a6f63]">Actor: {event.actor}</p>
                <p className="text-xs text-[#7a6f63]">Entity: {event.entity}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Inspector Preview</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="rounded-lg border border-[#efe5d8] bg-[#f8fbff] px-3 py-2 text-[#3a5674]">Before snapshot payload</div>
              <div className="rounded-lg border border-[#efe5d8] bg-[#f5fbf6] px-3 py-2 text-[#315f42]">After snapshot payload</div>
              <div className="rounded-lg border border-[#efe5d8] bg-[#fff8ef] px-3 py-2 text-[#7a5a2d]">Metadata and version markers</div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Deep Links</h3>
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
