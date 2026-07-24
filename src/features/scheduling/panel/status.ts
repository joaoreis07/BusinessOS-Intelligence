import type { AppointmentStatus } from "../schemas";

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export const APPOINTMENT_STATUS_TRANSITIONS: Record<
  AppointmentStatus,
  readonly AppointmentStatus[]
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "completed", "cancelled", "no_show"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function canTransitionAppointmentStatus(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  if (from === to) return true;
  return APPOINTMENT_STATUS_TRANSITIONS[from].includes(to);
}

export function getAllowedNextStatuses(status: AppointmentStatus): AppointmentStatus[] {
  return [...APPOINTMENT_STATUS_TRANSITIONS[status]];
}

export const TERMINAL_APPOINTMENT_STATUSES: readonly AppointmentStatus[] = [
  "completed",
  "cancelled",
  "no_show",
];

export function isTerminalAppointmentStatus(status: AppointmentStatus): boolean {
  return TERMINAL_APPOINTMENT_STATUSES.includes(status);
}
