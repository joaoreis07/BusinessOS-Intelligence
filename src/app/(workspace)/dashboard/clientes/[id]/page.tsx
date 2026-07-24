import { notFound, redirect } from "next/navigation";

import { CustomerProfilePanel } from "@/components/customers/customer-profile-panel";
import { getCustomer, resolveCustomerPanelCapabilities } from "@/features/customers";
import { hasCompanyPermission } from "@/lib/permissions/company-permissions";
import { requireCompanyContext } from "@/lib/tenancy/context";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerProfilePage({ params }: PageProps) {
  const context = await requireCompanyContext();
  if (!hasCompanyPermission(context.role, "customers:read")) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <CustomerProfilePanel
      customer={customer}
      capabilities={resolveCustomerPanelCapabilities(context.role)}
    />
  );
}
