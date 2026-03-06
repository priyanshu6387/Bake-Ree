import { redirect } from "next/navigation";

export default function AdminSettingsAuditRedirectPage() {
  redirect("/ops/settings/audit");
}
