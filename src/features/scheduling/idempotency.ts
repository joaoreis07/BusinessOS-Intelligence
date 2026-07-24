import { createHash } from "node:crypto";

const IDEMPOTENCY_PREFIX = {
  publicBooking: "pb_",
  workspaceBooking: "wb_",
  statusUpdate: "su_",
  reschedule: "rs_",
} as const;

function digestPayload(parts: string[]): string {
  const digest = createHash("sha256").update(parts.join("|")).digest("hex");
  return digest.slice(0, 48);
}

type PublicBookingIdempotencyInput = {
  companySlug: string;
  serviceId: string;
  startsAt: string;
  customerPhone: string;
  customerName: string;
};

export function buildPublicBookingIdempotencyKey(
  input: PublicBookingIdempotencyInput,
): string {
  return `${IDEMPOTENCY_PREFIX.publicBooking}${digestPayload([
    input.companySlug,
    input.serviceId,
    input.startsAt,
    input.customerPhone.trim(),
    input.customerName.trim().toLowerCase(),
  ])}`;
}

type WorkspaceBookingIdempotencyInput = {
  companyId: string;
  serviceId: string;
  customerId: string;
  startsAt: string;
};

export function buildWorkspaceAppointmentIdempotencyKey(
  input: WorkspaceBookingIdempotencyInput,
): string {
  return `${IDEMPOTENCY_PREFIX.workspaceBooking}${digestPayload([
    input.companyId,
    input.serviceId,
    input.customerId,
    input.startsAt,
  ])}`;
}

type AppointmentStatusIdempotencyInput = {
  appointmentId: string;
  status: string;
};

export function buildAppointmentStatusIdempotencyKey(
  input: AppointmentStatusIdempotencyInput,
): string {
  return `${IDEMPOTENCY_PREFIX.statusUpdate}${digestPayload([
    input.appointmentId,
    input.status,
  ])}`;
}

type RescheduleIdempotencyInput = {
  appointmentId: string;
  startsAt: string;
};

export function buildRescheduleIdempotencyKey(
  input: RescheduleIdempotencyInput,
): string {
  return `${IDEMPOTENCY_PREFIX.reschedule}${digestPayload([
    input.appointmentId,
    input.startsAt,
  ])}`;
}
