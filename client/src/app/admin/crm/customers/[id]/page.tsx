import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminCrmCustomerDetailRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/ops/crm/customers/${id}`);
}