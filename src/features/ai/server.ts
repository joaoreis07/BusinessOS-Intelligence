import "server-only";

import { getDashboardSummary, resolveDashboardCapabilities } from "@/features/dashboard/server";
import { listCustomersPaginated } from "@/features/customers/server";
import { getFinancialSummary } from "@/features/finance/server";
import { addDaysToDateString } from "@/features/scheduling/public/available-dates";
import { listAppointmentsPaginated } from "@/features/scheduling/server";
import { COMPANY_FEATURE_KEYS, isCompanyFeatureEnabled } from "@/lib/features/company-features";
import { hasCompanyPermission } from "@/lib/permissions/company-permissions";
import type { CompanyRole } from "@/lib/tenancy/context";
import { toSaoPauloDateString } from "@/lib/utils";

import {
  buildAiAlerts,
  buildAiDailySummary,
  buildAiRecommendations,
  buildAiWeeklyReport,
  calculateRevenueDeltaPercent,
} from "./mappers";
import type { AiPageDTO, AiPanelCapabilitiesDTO } from "./types";

function weekRange(reference = new Date()) {
  const today = toSaoPauloDateString(reference);
  const weekTo = today;
  const weekFrom = addDaysToDateString(today, -6);
  const previousWeekTo = addDaysToDateString(weekFrom, -1);
  const previousWeekFrom = addDaysToDateString(previousWeekTo, -6);
  return { weekFrom, weekTo, previousWeekFrom, previousWeekTo };
}

export async function resolveAiPanelCapabilities(
  role: CompanyRole,
  featureEnabled: boolean,
): Promise<AiPanelCapabilitiesDTO> {
  return {
    canRead: hasCompanyPermission(role, "ai:read"),
    featureEnabled,
    scheduling: hasCompanyPermission(role, "scheduling:read"),
    customers: hasCompanyPermission(role, "customers:read"),
    finance: hasCompanyPermission(role, "finance:read"),
  };
}

export async function getAiFeatureEnabled(companyId: string) {
  return isCompanyFeatureEnabled(companyId, COMPANY_FEATURE_KEYS.AI);
}

export async function getAiPageData(
  role: CompanyRole,
  companyName: string,
): Promise<AiPageDTO> {
  const dashboard = await getDashboardSummary(role);
  const capabilities = resolveDashboardCapabilities(role);
  const periods = weekRange(new Date(dashboard.today));

  const [
    inactiveCustomers,
    newCustomersWeek,
    weekAppointments,
    currentWeekFinance,
    previousWeekFinance,
  ] = await Promise.all([
    capabilities.customers
      ? listCustomersPaginated({ status: "inactive", page: 1, pageSize: 1 })
      : Promise.resolve({ total: 0, items: [], page: 1, pageSize: 1, totalPages: 1 }),
    capabilities.customers
      ? listCustomersPaginated({ sort: "created_at_desc", page: 1, pageSize: 100 })
      : Promise.resolve({ total: 0, items: [], page: 1, pageSize: 100, totalPages: 1 }),
    capabilities.scheduling
      ? listAppointmentsPaginated({
          from: periods.weekFrom,
          to: periods.weekTo,
          page: 1,
          pageSize: 200,
          sort: "starts_at_asc",
          timeframe: "all",
          view: "list",
        })
      : Promise.resolve({ total: 0, items: [], page: 1, pageSize: 200, totalPages: 1 }),
    capabilities.finance
      ? getFinancialSummary({ from: periods.weekFrom, to: periods.weekTo })
      : Promise.resolve({ incomeCents: 0, expenseCents: 0, profitCents: 0, pendingCents: 0 }),
    capabilities.finance
      ? getFinancialSummary({ from: periods.previousWeekFrom, to: periods.previousWeekTo })
      : Promise.resolve({ incomeCents: 0, expenseCents: 0, profitCents: 0, pendingCents: 0 }),
  ]);

  const newCustomersInWeek = newCustomersWeek.items.filter(
    (customer) => customer.createdAt.slice(0, 10) >= periods.weekFrom,
  ).length;

  const revenueDeltaPercent = capabilities.finance
    ? calculateRevenueDeltaPercent(
        currentWeekFinance.incomeCents,
        previousWeekFinance.incomeCents,
      )
    : null;

  return {
    generatedAt: new Date().toISOString(),
    dailySummary: buildAiDailySummary({
      companyName,
      data: dashboard,
      capabilities,
    }),
    alerts: buildAiAlerts({
      dashboardAlerts: dashboard.alerts,
      inactiveCustomers: inactiveCustomers.total,
      appointmentsToday: dashboard.kpis.appointmentsToday,
      pendingCents: dashboard.kpis.pendingCents,
      revenueDeltaPercent,
    }),
    recommendations: buildAiRecommendations({
      inactiveCustomers: inactiveCustomers.total,
      appointmentsToday: dashboard.kpis.appointmentsToday,
      pendingCents: dashboard.kpis.pendingCents,
      revenueDeltaPercent,
      capabilities,
    }),
    weeklyReport: buildAiWeeklyReport({
      weekFrom: periods.weekFrom,
      weekTo: periods.weekTo,
      appointmentsTotal: weekAppointments.total,
      newCustomers: newCustomersInWeek,
      weekIncomeCents: currentWeekFinance.incomeCents,
      pendingCents: dashboard.kpis.pendingCents,
      inactiveCustomers: inactiveCustomers.total,
    }),
  };
}
