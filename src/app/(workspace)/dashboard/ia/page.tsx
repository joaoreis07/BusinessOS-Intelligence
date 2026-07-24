import { redirect } from "next/navigation";

import { AiPanel } from "@/components/ai/ai-panel";
import {
  getAiFeatureEnabled,
  getAiPageData,
  resolveAiPanelCapabilities,
} from "@/features/ai";
import { hasCompanyPermission } from "@/lib/permissions/company-permissions";
import { requireCompanyContext } from "@/lib/tenancy/context";

export default async function AiPage() {
  const context = await requireCompanyContext();
  if (!hasCompanyPermission(context.role, "ai:read")) {
    redirect("/dashboard");
  }

  const featureEnabled = await getAiFeatureEnabled(context.companyId);
  const [data, capabilities] = await Promise.all([
    featureEnabled ? getAiPageData(context.role, context.company.name) : Promise.resolve({
      generatedAt: new Date().toISOString(),
      dailySummary: { headline: "", paragraphs: [], highlights: [] },
      alerts: [],
      recommendations: [],
      weeklyReport: { periodLabel: "", sections: [] },
    }),
    resolveAiPanelCapabilities(context.role, featureEnabled),
  ]);

  return <AiPanel data={data} capabilities={capabilities} />;
}
