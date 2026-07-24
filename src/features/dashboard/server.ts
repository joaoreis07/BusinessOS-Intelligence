import "server-only";

import { listCustomersPaginated } from "@/features/customers/server";
import { getFinancialSummary, listFinancialEntriesPaginated } from "@/features/finance/server";
import { addDaysToDateString } from "@/features/scheduling/public/available-dates";
import { listAppointmentsPaginated } from "@/features/scheduling/server";
import { hasCompanyPermission } from "@/lib/permissions/company-permissions";
import type { CompanyRole } from "@/lib/tenancy/context";
import { toSaoPauloDateString } from "@/lib/utils";

import {
  buildChartPoints,
  buildDashboardAlerts,
  countAppointmentsToday,
  mapDashboardAppointment,
  mapRecentCustomer,
  pickNextAppointment,
} from "./mappers";
import { dashboardPeriodSchema } from "./schemas";
import type { DashboardCapabilitiesDTO, DashboardSummaryDTO } from "./types";

function defaultMonthPeriod(reference = new Date()) {
  return {
    from: toSaoPauloDateString(new Date(reference.getFullYear(), reference.getMonth(), 1)),
    to: toSaoPauloDateString(new Date(reference.getFullYear(), reference.getMonth() + 1, 0)),
  };
}

export function resolveDashboardCapabilities(role: CompanyRole): DashboardCapabilitiesDTO {
  return {
    scheduling: hasCompanyPermission(role, "scheduling:read"),
    schedulingManage: hasCompanyPermission(role, "scheduling:manage"),
    customers: hasCompanyPermission(role, "customers:read"),
    customersManage: hasCompanyPermission(role, "customers:manage"),
    finance: hasCompanyPermission(role, "finance:read"),
    financeManage: hasCompanyPermission(role, "finance:manage"),
  };
}

async function buildWeeklyChart(anchorDate: string): Promise<DashboardSummaryDTO["chart"]> {
  const rows = await Promise.all(
    Array.from({ length: 7 }, async (_, index) => {
      const offset = index - 6;
      const date = addDaysToDateString(anchorDate, offset);
      const summary = await getFinancialSummary({ from: date, to: date });
      return {
        date,
        incomeCents: summary.incomeCents,
        expenseCents: summary.expenseCents,
      };
    }),
  );
  return buildChartPoints(rows);
}

export async function getDashboardSummary(role: CompanyRole): Promise<DashboardSummaryDTO> {
  const capabilities = resolveDashboardCapabilities(role);
  const today = toSaoPauloDateString(new Date());
  const month = defaultMonthPeriod();

  const [
    todayAppointments,
    monthFinance,
    activeCustomers,
    recentCustomers,
    pendingFinance,
    overdueFinance,
    chart,
  ] = await Promise.all([
    capabilities.scheduling
      ? listAppointmentsPaginated({
          view: "day",
          anchorDate: today,
          page: 1,
          pageSize: 100,
          sort: "starts_at_asc",
          timeframe: "all",
        })
      : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 0, totalPages: 1 }),
    capabilities.finance
      ? getFinancialSummary(month)
      : Promise.resolve({ incomeCents: 0, expenseCents: 0, profitCents: 0, pendingCents: 0 }),
    capabilities.customers
      ? listCustomersPaginated({ status: "active", page: 1, pageSize: 1 })
      : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 1, totalPages: 1 }),
    capabilities.customers
      ? listCustomersPaginated({ sort: "created_at_desc", page: 1, pageSize: 5 })
      : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 5, totalPages: 1 }),
    capabilities.finance
      ? listFinancialEntriesPaginated({
          ...month,
          status: "pending",
          page: 1,
          pageSize: 5,
          sort: "due_date_asc",
        })
      : Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: 5,
          totalPages: 1,
          summary: { incomeCents: 0, expenseCents: 0, profitCents: 0, pendingCents: 0 },
        }),
    capabilities.finance
      ? listFinancialEntriesPaginated({
          from: month.from,
          to: today,
          status: "overdue",
          page: 1,
          pageSize: 5,
          sort: "due_date_asc",
        })
      : Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: 5,
          totalPages: 1,
          summary: { incomeCents: 0, expenseCents: 0, profitCents: 0, pendingCents: 0 },
        }),
    capabilities.finance ? buildWeeklyChart(today) : Promise.resolve([]),
  ]);

  const todayAgenda = todayAppointments.items.map(mapDashboardAppointment);
  const nextAppointment = pickNextAppointment(todayAgenda);
  const alerts = buildDashboardAlerts({
    today,
    todayAgenda,
    pendingEntries: pendingFinance.items,
    overdueEntries: overdueFinance.items,
  });

  return {
    today,
    monthFrom: month.from,
    monthTo: month.to,
    kpis: {
      appointmentsToday: countAppointmentsToday(todayAgenda),
      activeCustomers: activeCustomers.total,
      monthIncomeCents: monthFinance.incomeCents,
      pendingCents: monthFinance.pendingCents,
    },
    nextAppointment,
    todayAgenda,
    recentCustomers: recentCustomers.items.map(mapRecentCustomer),
    alerts,
    chart,
  };
}

/** @deprecated Prefer getDashboardSummary */
export async function getDashboard(input: unknown) {
  dashboardPeriodSchema.parse(input);
  const summary = await getDashboardSummary("owner");
  return {
    metrics: {
      appointments: summary.kpis.appointmentsToday,
      completedAppointments: 0,
      customers: summary.kpis.activeCustomers,
      incomeCents: summary.kpis.monthIncomeCents,
      expenseCents: 0,
    },
    upcomingAppointments: summary.todayAgenda.map((item) => ({
      id: item.id,
      starts_at: item.startsAt,
      status: item.status,
      customers: { full_name: item.customerName },
      services: { name: item.serviceName },
    })),
  };
}
