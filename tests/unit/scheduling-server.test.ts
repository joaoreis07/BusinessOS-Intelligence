import { beforeEach, describe, expect, it, vi } from "vitest";

const COMPANY_ID = "550e8400-e29b-41d4-a716-446655440000";
const SERVICE_ID = "660e8400-e29b-41d4-a716-446655440001";
const CUSTOMER_ID = "880e8400-e29b-41d4-a716-446655440003";
const APPOINTMENT_ID = "770e8400-e29b-41d4-a716-446655440002";

const { createClientMock, authenticatedContextMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  authenticatedContextMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/features/_shared/server", async () => {
  const actual = await vi.importActual("@/features/_shared/server");
  return {
    ...(actual as object),
    authenticatedContext: authenticatedContextMock,
  };
});

import {
  cancelAppointment,
  createAppointment,
  createPublicBooking,
  getAvailableSlots,
  getPublicAvailableDates,
  listAppointments,
  rescheduleAppointment,
  setAvailabilityRules,
  updateAppointmentStatus,
} from "@/features/scheduling/server";

function chainable(result: { data: unknown; error: unknown; count?: number }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({
      data: result.data,
      error: result.error,
      count: result.count ?? (Array.isArray(result.data) ? result.data.length : 0),
    }),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => void) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

const sampleAppointmentRow = {
  id: APPOINTMENT_ID,
  service_id: SERVICE_ID,
  customer_id: CUSTOMER_ID,
  starts_at: "2026-07-15T14:00:00.000Z",
  ends_at: "2026-07-15T14:30:00.000Z",
  status: "pending",
  objective: null,
  customer_notes: null,
  internal_notes: null,
  cancellation_reason: null,
  source: "dashboard",
  created_at: "2026-07-14T10:00:00.000Z",
  updated_at: "2026-07-14T10:00:00.000Z",
  customers: [{ full_name: "Maria Silva", phone: "+5511999999999", email: "maria@example.com" }],
  services: [{ name: "Consulta", price: 150, duration_minutes: 30 }],
};

describe("scheduling server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticatedContextMock.mockResolvedValue({
      companyId: COMPANY_ID,
      supabase: {
        from: vi.fn(() =>
          chainable({
            data: [sampleAppointmentRow],
            error: null,
            count: 1,
          }),
        ),
        rpc: vi.fn(),
      },
    });
  });

  describe("listAppointments", () => {
    it("maps appointment rows to list DTOs", async () => {
      const result = await listAppointments();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: APPOINTMENT_ID,
        customerName: "Maria Silva",
        serviceName: "Consulta",
        priceCents: 15_000,
        status: "pending",
      });
      expect(authenticatedContextMock).toHaveBeenCalledWith("scheduling:read");
    });
  });

  describe("getAvailableSlots", () => {
    it("maps rpc availability rows", async () => {
      createClientMock.mockResolvedValue({
        rpc: vi.fn().mockResolvedValue({
          data: [{ slot_start: "2026-07-15T14:00:00.000Z" }],
          error: null,
        }),
      });

      const slots = await getAvailableSlots({
        companySlug: "clinica-saude",
        serviceId: SERVICE_ID,
        date: "2026-07-15",
      });

      expect(slots).toEqual([{ startsAt: "2026-07-15T14:00:00.000Z" }]);
    });
  });

  describe("getPublicAvailableDates", () => {
    it("aggregates unique local dates from rpc slots", async () => {
      createClientMock.mockResolvedValue({
        rpc: vi.fn().mockResolvedValue({
          data: [
            { slot_start: "2026-07-15T14:00:00.000Z" },
            { slot_start: "2026-07-15T17:00:00.000Z" },
            { slot_start: "2026-07-16T14:00:00.000Z" },
          ],
          error: null,
        }),
      });

      const dates = await getPublicAvailableDates({
        companySlug: "clinica-saude",
        serviceId: SERVICE_ID,
        dateFrom: "2026-07-01",
        dateTo: "2026-07-31",
        timezone: "America/Sao_Paulo",
        horizonDays: 30,
      });

      expect(dates).toEqual(["2026-07-15", "2026-07-16"]);
    });
  });

  describe("createPublicBooking", () => {
    it("passes objective and deterministic idempotency to rpc", async () => {
      const rpc = vi.fn().mockResolvedValue({
        data: [{ appointment_id: APPOINTMENT_ID, appointment_status: "pending" }],
        error: null,
      });
      createClientMock.mockResolvedValue({ rpc });

      const result = await createPublicBooking({
        companySlug: "clinica-saude",
        serviceId: SERVICE_ID,
        startsAt: "2026-07-15T14:00:00.000Z",
        customer: {
          name: "Maria Silva",
          phone: "+5511999999999",
          email: null,
        },
        objective: "Consulta inicial",
        notes: "Prefere tarde",
      });

      expect(result).toEqual({
        appointmentId: APPOINTMENT_ID,
        status: "pending",
      });
      expect(rpc).toHaveBeenCalledWith(
        "create_public_appointment",
        expect.objectContaining({
          customer_objective: "Consulta inicial",
          notes: "Prefere tarde",
          idempotency_key: expect.stringMatching(/^pb_[a-f0-9]{48}$/),
        }),
      );
    });
  });

  describe("createAppointment", () => {
    it("uses secure workspace rpc with idempotency", async () => {
      const rpc = vi.fn().mockResolvedValue({
        data: [{ appointment_id: APPOINTMENT_ID, appointment_status: "pending" }],
        error: null,
      });
      authenticatedContextMock.mockResolvedValue({
        companyId: COMPANY_ID,
        supabase: { rpc },
      });

      const result = await createAppointment({
        serviceId: SERVICE_ID,
        customerId: CUSTOMER_ID,
        startsAt: "2026-07-15T14:00:00.000Z",
        notes: "Cliente VIP",
      });

      expect(result).toEqual({
        appointmentId: APPOINTMENT_ID,
        status: "pending",
      });
      expect(rpc).toHaveBeenCalledWith(
        "create_workspace_appointment",
        expect.objectContaining({
          target_service_id: SERVICE_ID,
          target_customer_id: CUSTOMER_ID,
          internal_notes: "Cliente VIP",
          idempotency_key: expect.stringMatching(/^wb_[a-f0-9]{48}$/),
        }),
      );
    });
  });

  describe("updateAppointmentStatus", () => {
    it("uses secure status rpc with deterministic idempotency", async () => {
      const rpc = vi.fn().mockResolvedValue({
        data: [{ appointment_id: APPOINTMENT_ID, appointment_status: "confirmed" }],
        error: null,
      });
      authenticatedContextMock.mockResolvedValue({
        companyId: COMPANY_ID,
        supabase: {
          from: vi.fn((table: string) => {
            if (table === "appointment_events") {
              return chainable({ data: [], error: null });
            }
            return chainable({ data: sampleAppointmentRow, error: null });
          }),
          rpc,
        },
      });

      const result = await updateAppointmentStatus(APPOINTMENT_ID, "confirmed");

      expect(result).toEqual({
        appointmentId: APPOINTMENT_ID,
        status: "confirmed",
      });
      expect(rpc).toHaveBeenCalledWith(
        "update_appointment_status_secure",
        expect.objectContaining({
          target_appointment_id: APPOINTMENT_ID,
          requested_status: "confirmed",
          idempotency_key: expect.stringMatching(/^su_[a-f0-9]{48}$/),
        }),
      );
    });
  });

  describe("cancelAppointment", () => {
    it("uses secure cancel rpc", async () => {
      const rpc = vi.fn().mockResolvedValue({
        data: [{ appointment_id: APPOINTMENT_ID, appointment_status: "cancelled" }],
        error: null,
      });
      authenticatedContextMock.mockResolvedValue({
        companyId: COMPANY_ID,
        supabase: { rpc },
      });

      const result = await cancelAppointment({
        id: APPOINTMENT_ID,
        reason: "Cliente desistiu",
      });

      expect(result.status).toBe("cancelled");
      expect(rpc).toHaveBeenCalledWith(
        "cancel_appointment_secure",
        expect.objectContaining({
          target_appointment_id: APPOINTMENT_ID,
          cancellation_reason: "Cliente desistiu",
        }),
      );
    });
  });

  describe("rescheduleAppointment", () => {
    it("uses secure reschedule rpc", async () => {
      const rpc = vi.fn().mockResolvedValue({
        data: [
          {
            appointment_id: APPOINTMENT_ID,
            appointment_status: "pending",
            starts_at: "2026-07-16T10:00:00.000Z",
            ends_at: "2026-07-16T11:00:00.000Z",
          },
        ],
        error: null,
      });
      authenticatedContextMock.mockResolvedValue({
        companyId: COMPANY_ID,
        supabase: { rpc },
      });

      const result = await rescheduleAppointment({
        id: APPOINTMENT_ID,
        startsAt: "2026-07-16T10:00:00.000Z",
      });

      expect(result).toEqual({
        appointmentId: APPOINTMENT_ID,
        status: "pending",
        startsAt: "2026-07-16T10:00:00.000Z",
        endsAt: "2026-07-16T11:00:00.000Z",
      });
      expect(rpc).toHaveBeenCalledWith(
        "reschedule_appointment_secure",
        expect.objectContaining({
          target_appointment_id: APPOINTMENT_ID,
          requested_starts_at: "2026-07-16T10:00:00.000Z",
          idempotency_key: expect.stringMatching(/^rs_[a-f0-9]{48}$/),
        }),
      );
    });
  });

  describe("setAvailabilityRules", () => {
    it("replaces business hours through secure rpc", async () => {
      const rpc = vi.fn().mockResolvedValue({
        data: [
          {
            id: "990e8400-e29b-41d4-a716-446655440004",
            weekday: 1,
            start_time: "09:00",
            end_time: "18:00",
            active: true,
          },
        ],
        error: null,
      });
      authenticatedContextMock.mockResolvedValue({
        companyId: COMPANY_ID,
        supabase: { rpc },
      });

      const rules = await setAvailabilityRules([
        { weekday: 1, startTime: "09:00", endTime: "18:00", enabled: true },
      ]);

      expect(rules).toHaveLength(1);
      expect(rpc).toHaveBeenCalledWith(
        "replace_business_hours",
        expect.objectContaining({
          target_company_id: COMPANY_ID,
          rules: [
            { weekday: 1, startTime: "09:00", endTime: "18:00", enabled: true },
          ],
        }),
      );
      expect(authenticatedContextMock).toHaveBeenCalledWith("scheduling:configure");
    });
  });
});
