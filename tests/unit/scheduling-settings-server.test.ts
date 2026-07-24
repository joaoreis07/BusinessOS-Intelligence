import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/app-error";

const COMPANY_ID = "550e8400-e29b-41d4-a716-446655440000";

const { authenticatedContextMock } = vi.hoisted(() => ({
  authenticatedContextMock: vi.fn(),
}));

vi.mock("@/features/_shared/server", async () => {
  const actual = await vi.importActual("@/features/_shared/server");
  return {
    ...(actual as object),
    authenticatedContext: authenticatedContextMock,
  };
});

import {
  getSchedulingConfiguration,
  saveWeekSchedule,
  updateSchedulingSettings,
} from "@/features/scheduling/settings/server";

function chainable(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => void) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

describe("scheduling settings server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticatedContextMock.mockResolvedValue({
      companyId: COMPANY_ID,
      user: { id: "user-1" },
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "companies") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { active: true, status: "active" },
                error: null,
              }),
            };
          }

          if (table === "company_settings") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  timezone: "America/Sao_Paulo",
                  booking_enabled: true,
                  booking_flow: "manual_approval",
                  booking_min_notice_minutes: 120,
                  booking_interval_minutes: 30,
                  booking_horizon_days: 90,
                  max_appointments_per_day: 10,
                  scheduling_preferences: {},
                },
                error: null,
              }),
            };
          }

          if (table === "business_hours") {
            return chainable({
              data: [
                {
                  id: "bh-1",
                  weekday: 1,
                  start_time: "09:00",
                  end_time: "18:00",
                  active: true,
                },
              ],
              error: null,
            });
          }

          if (table === "blocked_periods") {
            return chainable({ data: [], error: null });
          }
        }),
        rpc: vi.fn(),
      },
    });
  });

  it("loads scheduling configuration with scheduling:configure", async () => {
    const configuration = await getSchedulingConfiguration();
    expect(configuration.settings.bookingEnabled).toBe(true);
    expect(configuration.weekSchedule.days).toHaveLength(7);
    expect(authenticatedContextMock).toHaveBeenCalledWith("scheduling:configure");
  });

  it("rejects inactive companies", async () => {
    authenticatedContextMock.mockResolvedValueOnce({
      companyId: COMPANY_ID,
      user: { id: "user-1" },
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { active: false, status: "inactive" },
            error: null,
          }),
        })),
      },
    });

    await expect(getSchedulingConfiguration()).rejects.toBeInstanceOf(AppError);
  });

  it("saves week schedule through replace_business_hours", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          id: "bh-1",
          weekday: 1,
          start_time: "09:00",
          end_time: "18:00",
          active: true,
        },
      ],
      error: null,
    });

    authenticatedContextMock.mockResolvedValueOnce({
      companyId: COMPANY_ID,
      user: { id: "user-1" },
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { active: true, status: "active" },
            error: null,
          }),
        })),
        rpc,
      },
    });

    const rules = await saveWeekSchedule({
      timezone: "America/Sao_Paulo",
      days: Array.from({ length: 7 }, (_, weekday) => ({
        weekday,
        enabled: weekday === 1,
        intervals: weekday === 1 ? [{ startTime: "09:00", endTime: "18:00" }] : [],
      })),
    });

    expect(rules).toHaveLength(1);
    expect(rpc).toHaveBeenCalledWith(
      "replace_business_hours",
      expect.objectContaining({
        target_company_id: COMPANY_ID,
      }),
    );
  });

  it("updates general settings through secure rpc", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        timezone: "America/Sao_Paulo",
        booking_enabled: false,
        booking_flow: "manual_approval",
        booking_min_notice_minutes: 180,
        booking_interval_minutes: 15,
        booking_horizon_days: 60,
        max_appointments_per_day: null,
        scheduling_preferences: {
          allowCancellation: true,
          allowReschedule: false,
          requireObjective: false,
          requireNotes: false,
        },
      },
      error: null,
    });

    authenticatedContextMock.mockResolvedValueOnce({
      companyId: COMPANY_ID,
      user: { id: "user-1" },
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { active: true, status: "active" },
            error: null,
          }),
        })),
        rpc,
      },
    });

    const settings = await updateSchedulingSettings({
      bookingEnabled: false,
      bookingFlow: "manual_approval",
      minNoticeMinutes: 180,
      intervalMinutes: 15,
      horizonDays: 60,
      maxAppointmentsPerDay: null,
      preferences: {
        allowCancellation: true,
        allowReschedule: false,
        requireObjective: false,
        requireNotes: false,
      },
    });

    expect(settings.bookingEnabled).toBe(false);
    expect(rpc).toHaveBeenCalledWith(
      "update_scheduling_settings",
      expect.objectContaining({
        target_company_id: COMPANY_ID,
      }),
    );
  });
});
