import { redirect } from "next/navigation";

export default function AdminSettingsIntegrationsRedirectPage() {
  redirect("/ops/settings/integrations");
}
