import { redirect } from "next/navigation";

export default async function Layout({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  redirect(`/admin/crm/customers/${customerId}`);
}
