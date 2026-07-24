export type DashboardCapabilitiesDTO = {
  scheduling: boolean;
  schedulingManage: boolean;
  customers: boolean;
  customersManage: boolean;
  finance: boolean;
  financeManage: boolean;
};

export type DashboardKpiDTO = {
  appointmentsToday: number;
  activeCustomers: number;
  monthIncomeCents: number;
  pendingCents: number;
};

export type DashboardAppointmentWidgetDTO = {
  id: string;
  startsAt: string;
  customerName: string;
  serviceName: string;
  status: string;
};

export type DashboardAlertDTO = {
  id: string;
  tone: "warning" | "danger" | "info";
  title: string;
  description: string;
  href?: string;
};

export type DashboardRecentCustomerDTO = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

export type DashboardChartPointDTO = {
  label: string;
  date: string;
  incomeCents: number;
  expenseCents: number;
};

export type DashboardSummaryDTO = {
  today: string;
  monthFrom: string;
  monthTo: string;
  kpis: DashboardKpiDTO;
  nextAppointment: DashboardAppointmentWidgetDTO | null;
  todayAgenda: DashboardAppointmentWidgetDTO[];
  recentCustomers: DashboardRecentCustomerDTO[];
  alerts: DashboardAlertDTO[];
  chart: DashboardChartPointDTO[];
};
