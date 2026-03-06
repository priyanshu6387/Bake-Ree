type OpsKpi = {
  label: string;
  value: string | number;
  hint?: string;
  delta?: string;
  tone?: string;
};

const toneStyles: Record<string, string> = {
  neutral: "border-black/10 bg-white",
  positive: "border-emerald-200 bg-emerald-50/60",
  warning: "border-amber-200 bg-amber-50/60",
  critical: "border-rose-200 bg-rose-50/60",
};

export default function OpsKpiGrid({ items }: { items: OpsKpi[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-2xl border px-4 py-3 shadow-sm ${
            toneStyles[item.tone || "neutral"] || toneStyles.neutral
          }`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#8b867f]">{item.label}</p>
          <p className="mt-2 text-xl font-semibold text-[#2a2927]">{item.value}</p>
          {item.hint && <p className="mt-1 text-xs text-[#7a6f63]">{item.hint}</p>}
          {item.delta && <p className="mt-2 text-xs font-semibold text-[#1f7a6b]">{item.delta}</p>}
        </div>
      ))}
    </div>
  );
}
