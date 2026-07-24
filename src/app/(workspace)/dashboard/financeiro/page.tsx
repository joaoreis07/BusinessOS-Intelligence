import { redirect } from "next/navigation";

import { FinancePanel } from "@/components/finance/finance-panel";
import {
  listFinancialCategories,
  listFinancialEntriesPaginated,
  listFinancialEntriesQuerySchema,
  resolveFinancePanelCapabilities,
} from "@/features/finance";
import { hasCompanyPermission } from "@/lib/permissions/company-permissions";
import { requireCompanyContext } from "@/lib/tenancy/context";
import { toSaoPauloDateString } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function defaultPeriod() {
  const now = new Date();
  return {
    from: toSaoPauloDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toSaoPauloDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

export default async function FinancePage({ searchParams }: PageProps) {
  const context = await requireCompanyContext();
  if (!hasCompanyPermission(context.role, "finance:read")) {
    redirect("/dashboard");
  }

  const period = defaultPeriod();
  const rawParams = await searchParams;
  const query = listFinancialEntriesQuerySchema.parse({
    from: pickParam(rawParams.from) ?? period.from,
    to: pickParam(rawParams.to) ?? period.to,
    page: pickParam(rawParams.page),
    pageSize: pickParam(rawParams.pageSize),
    q: pickParam(rawParams.q),
    kind: pickParam(rawParams.kind),
    status: pickParam(rawParams.status),
    sort: pickParam(rawParams.sort),
  });

  const [data, categories] = await Promise.all([
    listFinancialEntriesPaginated(query),
    listFinancialCategories(),
  ]);

  return (
    <FinancePanel
      data={data}
      categories={categories}
      capabilities={resolveFinancePanelCapabilities(context.role)}
      query={query}
    />
  );
}
