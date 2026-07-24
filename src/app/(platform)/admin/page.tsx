import { PlatformOverviewPanel } from "@/components/platform-admin/platform-overview-panel";
import { getPlatformOverview } from "@/features/platform-admin";

export default async function PlatformAdminPage() {
  const data = await getPlatformOverview();
  return <PlatformOverviewPanel data={data} />;
}
