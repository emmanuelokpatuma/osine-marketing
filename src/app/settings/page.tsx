import { SettingsClient } from "@/components/settings/settings-client";
import { catalogForRegions } from "@/lib/source-catalog";
import { getWorkspace } from "@/lib/store";

export default async function SettingsPage() {
  const workspace = await getWorkspace();
  const sources = catalogForRegions(workspace.monitorConfig.regions);

  return <SettingsClient initialWorkspace={workspace} initialSources={sources} />;
}
