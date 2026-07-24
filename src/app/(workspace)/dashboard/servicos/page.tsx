import { redirect } from "next/navigation";

import { ServicesPanel } from "@/components/services/services-panel";
import { listServices } from "@/features/services";
import { hasCompanyPermission } from "@/lib/permissions/company-permissions";
import { requireCompanyContext } from "@/lib/tenancy/context";

export default async function ServicesPage() {
  const context = await requireCompanyContext();
  if (!hasCompanyPermission(context.role, "company:read")) {
    redirect("/dashboard");
  }

  const services = await listServices();
  const canManage = hasCompanyPermission(context.role, "services:manage");

  return <ServicesPanel services={services} canManage={canManage} />;
}
