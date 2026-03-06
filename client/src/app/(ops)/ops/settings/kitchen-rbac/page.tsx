import Link from "next/link";
import OpsBadge from "@/components/ops/OpsBadge";
import { OPS_SETTINGS_SECTION_MAP } from "@/lib/ops/settingsMeta";

const actions = ["Queue View", "Start Prep", "Hold Order", "Mark Ready", "Dispatch Assign", "Send Ping"];
const roles = ["Kitchen Prep", "Kitchen QC", "Kitchen Dispatch", "Kitchen Manager"];

export default function OpsSettingsKitchenRbacPage() {
  const section = OPS_SETTINGS_SECTION_MAP["kitchen-rbac"];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/10 bg-[#13211d] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#89c4a7]">Kitchen Control Surface</p>
            <h2 className="mt-2 text-3xl font-semibold">{section.label}</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#c2d7cc]">Configure action-level access for station roles and map runtime controls into kitchen operations.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">Phase 3</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">Kitchen Runtime Link</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#2a2927]">Role × Action Matrix Preview</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-[#8b867f]">
                  <th className="px-3 py-2">Action</th>
                  {roles.map((role) => (
                    <th key={role} className="px-3 py-2">{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actions.map((action, index) => (
                  <tr key={action} className="border-t border-[#efe5d8]">
                    <td className="px-3 py-3 font-medium text-[#2a2927]">{action}</td>
                    {roles.map((role, colIndex) => {
                      const enabled = (index + colIndex) % 3 !== 0;
                      return (
                        <td key={`${role}-${action}`} className="px-3 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {enabled ? "Allowed" : "Blocked"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Kitchen Runtime Handshake</h3>
            <p className="mt-1 text-sm text-[#6b6b6b]">Permission model and runtime defaults will sync through this bridge in Phase 3.</p>
            <div className="mt-4 space-y-2">
              <div className="rounded-lg border border-[#efe5d8] bg-[#fbf7f1] px-3 py-2 text-sm text-[#5c5a56]">Station defaults policy slot</div>
              <div className="rounded-lg border border-[#efe5d8] bg-[#fbf7f1] px-3 py-2 text-sm text-[#5c5a56]">Queue refresh and alert behavior mapping</div>
              <div className="rounded-lg border border-[#efe5d8] bg-[#fbf7f1] px-3 py-2 text-sm text-[#5c5a56]">Permission-to-UI state enforcement</div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Kitchen Surfaces</h3>
            <div className="mt-3 space-y-2">
              {section.relatedLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block rounded-xl border border-[#efe5d8] px-3 py-2 transition hover:bg-[#f7f5f0]">
                  <p className="text-sm font-semibold text-[#2a2927]">{link.label}</p>
                  <p className="text-xs text-[#7a6f63]">{link.detail}</p>
                </Link>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <OpsBadge label="RBAC Wiring" tone="warning" />
              <OpsBadge label="Phase 3" tone="info" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
