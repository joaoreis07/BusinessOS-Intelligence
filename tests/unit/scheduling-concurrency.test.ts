import { describe, expect, it } from "vitest";
import {
  buildAppointmentStatusIdempotencyKey,
  buildPublicBookingIdempotencyKey,
  buildRescheduleIdempotencyKey,
  buildWorkspaceAppointmentIdempotencyKey,
} from "@/features/scheduling/idempotency";

const APPOINTMENT_ID = "770e8400-e29b-41d4-a716-446655440002";
const COMPANY_ID = "550e8400-e29b-41d4-a716-446655440000";
const SERVICE_ID = "660e8400-e29b-41d4-a716-446655440001";
const CUSTOMER_ID = "880e8400-e29b-41d4-a716-446655440003";
const STARTS_AT = "2026-07-15T14:00:00.000Z";

describe("scheduling idempotency keys", () => {
  it("builds stable public booking keys", () => {
    const input = {
      companySlug: "clinica-saude",
      serviceId: SERVICE_ID,
      startsAt: STARTS_AT,
      customerPhone: "+5511999999999",
      customerName: "Maria Silva",
    };
    expect(buildPublicBookingIdempotencyKey(input)).toBe(
      buildPublicBookingIdempotencyKey(input),
    );
    expect(buildPublicBookingIdempotencyKey(input)).toMatch(/^pb_[a-f0-9]{48}$/);
  });

  it("builds stable workspace booking keys", () => {
    const input = {
      companyId: COMPANY_ID,
      serviceId: SERVICE_ID,
      customerId: CUSTOMER_ID,
      startsAt: STARTS_AT,
    };
    expect(buildWorkspaceAppointmentIdempotencyKey(input)).toBe(
      buildWorkspaceAppointmentIdempotencyKey(input),
    );
    expect(buildWorkspaceAppointmentIdempotencyKey(input)).toMatch(/^wb_[a-f0-9]{48}$/);
  });

  it("builds stable status update keys per target status", () => {
    const cancelled = buildAppointmentStatusIdempotencyKey({
      appointmentId: APPOINTMENT_ID,
      status: "cancelled",
    });
    const confirmed = buildAppointmentStatusIdempotencyKey({
      appointmentId: APPOINTMENT_ID,
      status: "confirmed",
    });

    expect(cancelled).toMatch(/^su_[a-f0-9]{48}$/);
    expect(confirmed).not.toBe(cancelled);
  });

  it("builds stable reschedule keys", () => {
    const input = {
      appointmentId: APPOINTMENT_ID,
      startsAt: "2026-07-16T10:00:00.000Z",
    };
    expect(buildRescheduleIdempotencyKey(input)).toBe(buildRescheduleIdempotencyKey(input));
    expect(buildRescheduleIdempotencyKey(input)).toMatch(/^rs_[a-f0-9]{48}$/);
  });

  it("changes keys when booking inputs change", () => {
    const base = buildPublicBookingIdempotencyKey({
      companySlug: "clinica-saude",
      serviceId: SERVICE_ID,
      startsAt: STARTS_AT,
      customerPhone: "+5511999999999",
      customerName: "Maria Silva",
    });
    const changedSlot = buildPublicBookingIdempotencyKey({
      companySlug: "clinica-saude",
      serviceId: SERVICE_ID,
      startsAt: "2026-07-15T15:00:00.000Z",
      customerPhone: "+5511999999999",
      customerName: "Maria Silva",
    });

    expect(changedSlot).not.toBe(base);
  });
});
