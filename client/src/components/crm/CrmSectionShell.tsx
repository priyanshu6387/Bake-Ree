import Link from "next/link";
import type { ReactNode } from "react";

export type CrmSectionShellProps = {
  title: string;
  subtitle: string;
  description: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  headerActions?: ReactNode;
  children?: ReactNode;
};

export default function CrmSectionShell({
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
  headerActions,
  children,
}: CrmSectionShellProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b867f]">
          {subtitle}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[#2a2927]">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-[#5c5a56]">{description}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {secondaryAction && (
              <Link
                href={secondaryAction.href}
                className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[#2a2927] transition hover:bg-[#f7f5f0]"
              >
                {secondaryAction.label}
              </Link>
            )}
            {headerActions}
            {primaryAction && (
              <Link
                href={primaryAction.href}
                className="rounded-full bg-[#2a2927] px-4 py-2 text-xs font-semibold text-white"
              >
                {primaryAction.label}
              </Link>
            )}
          </div>
        </div>
      </section>
      {children}
    </div>
  );
}
