import Link from "next/link";
import OpsBadge from "@/components/ops/OpsBadge";
import { OPS_SETTINGS_SECTION_MAP } from "@/lib/ops/settingsMeta";

const roleCards = [
  { name: "Super Admin", users: 2, state: "System", tone: "info" as const },
  { name: "Ops Admin", users: 6, state: "Active", tone: "success" as const },
  { name: "Kitchen Manager", users: 9, state: "Active", tone: "success" as const },
  { name: "Finance Controller", users: 3, state: "Draft", tone: "warning" as const },
];

export default function OpsSettingsRolesPage() {
  const section = OPS_SETTINGS_SECTION_MAP.roles;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6b4f2a]">Access Governance</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#2a2927]">{section.label}</h2>
            <p className="mt-2 text-sm text-[#5c5a56]">{section.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <OpsBadge label="Phase 2" tone="info" />
            <OpsBadge label="Role CRUD" tone="warning" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Total Roles</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-900">14</p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-sky-700">System Roles</p>
            <p className="mt-1 text-2xl font-semibold text-sky-900">6</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700">Draft Changes</p>
            <p className="mt-1 text-2xl font-semibold text-amber-900">3</p>
          </div>
          <div className="rounded-2xl border border-[#eadfd1] bg-[#fbf7f1] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7a6f63]">Audit Alerts</p>
            <p className="mt-1 text-2xl font-semibold text-[#2a2927]">1</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#2a2927]">Role Stack</h3>
          <p className="mt-1 text-sm text-[#6b6b6b]">System and custom roles prepared for lifecycle actions.</p>
          <div className="mt-4 space-y-2">
            {roleCards.map((role) => (
              <div key={role.name} className="rounded-xl border border-[#efe5d8] bg-[#fbf7f1] px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#2a2927]">{role.name}</p>
                  <OpsBadge label={role.state} tone={role.tone} />
                </div>
                <p className="mt-1 text-xs text-[#7a6f63]">Assigned users: {role.users}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Permission Studio</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "ops.module.*.view",
                "ops.page.*.view",
                "ops.settings.roles.write",
                "ops.settings.navigation.write",
                "ops.action.kitchen.*",
                "ops.settings.audit.read",
              ].map((permission) => (
                <span
                  key={permission}
                  className="inline-flex rounded-full border border-[#e4d7c7] bg-[#f7f1e7] px-3 py-1 text-xs font-semibold text-[#6b4f2a]"
                >
                  {permission}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#8b867f]">Tokenized permission editor placeholder (API wiring in Phase 2).</p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2927]">Related Dashboards & Features</h3>
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
