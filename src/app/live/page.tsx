import { LiveMonitor } from "@/components/live-monitor";
import { getPipeline } from "@/lib/store";
import { runPipeline } from "@/lib/pipeline";
import { catalogForRegions } from "@/lib/source-catalog";
import { getWorkspace } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const workspace = await getWorkspace();
  const sources = catalogForRegions(workspace.monitorConfig.regions);
  const initialResult = (await getPipeline()) ?? (await runPipeline());

  return <LiveMonitor config={workspace.monitorConfig} sources={sources} initialResult={initialResult} />;
}
