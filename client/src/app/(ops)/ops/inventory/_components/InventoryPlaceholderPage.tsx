type InventoryPlaceholderPageProps = {
  title: string;
  description: string;
};

export default function InventoryPlaceholderPage({
  title,
  description,
}: InventoryPlaceholderPageProps) {
  return (
    <section className="rounded-2xl border border-[#efe5d8] bg-white p-6">
      <h1 className="text-2xl font-semibold text-[#2a2927]">{title}</h1>
      <p className="mt-2 text-sm text-[#5c5a56]">{description}</p>
      <p className="mt-4 text-sm text-[#6b4f2a]">
        This inventory page will be built in the next phase.
      </p>
    </section>
  );
}
