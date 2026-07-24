import { redirect } from "next/navigation";

import { CustomersPanel } from "@/components/customers/customers-panel";
import {
  listCustomersPaginated,
  listCustomersQuerySchema,
  resolveCustomerPanelCapabilities,
} from "@/features/customers";
import { hasCompanyPermission } from "@/lib/permissions/company-permissions";
import { requireCompanyContext } from "@/lib/tenancy/context";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const context = await requireCompanyContext();
  if (!hasCompanyPermission(context.role, "customers:read")) {
    redirect("/dashboard");
  }

  const rawParams = await searchParams;
  const query = listCustomersQuerySchema.parse({
    page: pickParam(rawParams.page),
    pageSize: pickParam(rawParams.pageSize),
    q: pickParam(rawParams.q),
    status: pickParam(rawParams.status),
    sort: pickParam(rawParams.sort),
  });

  const data = await listCustomersPaginated(query);

  return (
    <CustomersPanel
      data={data}
      capabilities={resolveCustomerPanelCapabilities(context.role)}
      query={query}
    />
  );
}
