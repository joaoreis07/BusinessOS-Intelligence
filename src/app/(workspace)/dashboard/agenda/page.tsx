import { redirect } from "next/navigation";

import { AppointmentsPanel } from "@/components/scheduling/appointments/appointments-panel";
import {
  getAppointment,
  listAppointmentsPaginated,
  listAppointmentsQuerySchema,
  resolveAppointmentPanelCapabilities,
} from "@/features/scheduling";
import { listServices } from "@/features/services/server";
import { hasCompanyPermission } from "@/lib/permissions/company-permissions";
import { requireCompanyContext } from "@/lib/tenancy/context";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const context = await requireCompanyContext();
  if (!hasCompanyPermission(context.role, "scheduling:read")) {
    redirect("/dashboard");
  }

  const rawParams = await searchParams;
  const query = listAppointmentsQuerySchema.parse({
    page: pickParam(rawParams.page),
    pageSize: pickParam(rawParams.pageSize),
    from: pickParam(rawParams.from),
    to: pickParam(rawParams.to),
    anchorDate: pickParam(rawParams.anchorDate),
    status: pickParam(rawParams.status),
    serviceId: pickParam(rawParams.serviceId),
    customerId: pickParam(rawParams.customerId),
    q: pickParam(rawParams.q),
    timeframe: pickParam(rawParams.timeframe),
    view: pickParam(rawParams.view),
    sort: pickParam(rawParams.sort),
  });

  const selectedId = pickParam(rawParams.selected);
  const [data, services, initialDetail] = await Promise.all([
    listAppointmentsPaginated(query),
    listServices({ activeOnly: true }),
    selectedId ? getAppointment(selectedId) : Promise.resolve(null),
  ]);

  return (
    <AppointmentsPanel
      data={data}
      services={services.map((service) => ({ id: service.id, name: service.name }))}
      capabilities={resolveAppointmentPanelCapabilities(context.role)}
      initialDetail={initialDetail}
      timezone={context.company.timezone}
      query={query}
    />
  );
}
