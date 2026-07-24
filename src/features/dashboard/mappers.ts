import type { AppointmentListItemDTO } from "@/features/scheduling/types";
import type { CustomerListItemDTO } from "@/features/customers/types";
import type { FinancialEntryListItemDTO } from "@/features/finance/types";

import type {
  DashboardAlertDTO,
  DashboardAppointmentWidgetDTO,
  DashboardChartPointDTO,
  DashboardRecentCustomerDTO,
} from "./types";

export function mapDashboardAppointment(
  item: AppointmentListItemDTO,
): DashboardAppointmentWidgetDTO {
  return {
    id: item.id,
    startsAt: item.startsAt,
    customerName: item.customerName,
    serviceName: item.serviceName,
    status: item.status,
  };
}

export function mapRecentCustomer(item: CustomerListItemDTO): DashboardRecentCustomerDTO {
  return {
    id: item.id,
    name: item.name,
    status: item.status,
    createdAt: item.createdAt,
  };
}

export function buildDashboardAlerts(input: {
  today: string;
  todayAgenda: DashboardAppointmentWidgetDTO[];
  pendingEntries: FinancialEntryListItemDTO[];
  overdueEntries: FinancialEntryListItemDTO[];
}): DashboardAlertDTO[] {
  const alerts: DashboardAlertDTO[] = [];

  for (const entry of input.overdueEntries.slice(0, 3)) {
    alerts.push({
      id: `overdue-${entry.id}`,
      tone: "danger",
      title: "Pagamento vencido",
      description: entry.description,
      href: "/dashboard/financeiro",
    });
  }

  for (const entry of input.pendingEntries.slice(0, 3)) {
    alerts.push({
      id: `pending-${entry.id}`,
      tone: "warning",
      title: "Pagamento pendente",
      description: entry.description,
      href: "/dashboard/financeiro",
    });
  }

  const unconfirmed = input.todayAgenda.filter((item) => item.status === "pending");
  for (const appointment of unconfirmed.slice(0, 3)) {
    alerts.push({
      id: `pending-appointment-${appointment.id}`,
      tone: "info",
      title: "Agendamento aguardando confirmação",
      description: `${appointment.customerName} · ${appointment.serviceName}`,
      href: `/dashboard/agenda?selected=${appointment.id}`,
    });
  }

  if (!alerts.length) {
    alerts.push({
      id: "all-clear",
      tone: "info",
      title: "Tudo em ordem",
      description: "Nenhum alerta crítico para hoje.",
    });
  }

  return alerts.slice(0, 6);
}

export function buildChartPointLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(new Date(`${date}T12:00:00`));
}

export function buildChartPoints(
  rows: Array<{ date: string; incomeCents: number; expenseCents: number }>,
): DashboardChartPointDTO[] {
  return rows.map((row) => ({
    label: buildChartPointLabel(row.date),
    date: row.date,
    incomeCents: row.incomeCents,
    expenseCents: row.expenseCents,
  }));
}

export function pickNextAppointment(
  items: DashboardAppointmentWidgetDTO[],
  now = new Date(),
): DashboardAppointmentWidgetDTO | null {
  const active = items.filter((item) => !["cancelled", "no_show", "completed"].includes(item.status));
  const upcoming = active.find((item) => new Date(item.startsAt) >= now);
  return upcoming ?? active[0] ?? null;
}

export function countAppointmentsToday(items: DashboardAppointmentWidgetDTO[]) {
  return items.filter((item) => !["cancelled", "no_show"].includes(item.status)).length;
}
