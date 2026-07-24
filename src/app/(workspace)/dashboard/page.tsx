import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { getDashboardSummary, resolveDashboardCapabilities } from "@/features/dashboard";
import { requireCompanyContext } from "@/lib/tenancy/context";

export default async function DashboardPage() {
  const context = await requireCompanyContext();
  const summary = await getDashboardSummary(context.role);

  return (
    <DashboardPanel
      companyName={context.company.name}
      timezone={context.company.timezone}
      data={summary}
      capabilities={resolveDashboardCapabilities(context.role)}
    />
  );
}
