import { describe, expect, it } from "vitest";

import {
  buildDashboardAlerts,
  countAppointmentsToday,
  pickNextAppointment,
} from "@/features/dashboard/mappers";

describe("pickNextAppointment", () => {
  it("returns the next upcoming appointment", () => {
    const now = new Date("2026-07-22T15:00:00.000Z");
    const next = pickNextAppointment(
      [
        {
          id: "1",
          startsAt: "2026-07-22T14:00:00.000Z",
          customerName: "Ana",
          serviceName: "Consulta",
          status: "completed",
        },
        {
          id: "2",
          startsAt: "2026-07-22T16:00:00.000Z",
          customerName: "Bruno",
          serviceName: "Retorno",
          status: "confirmed",
        },
      ],
      now,
    );

    expect(next?.id).toBe("2");
  });
});

describe("countAppointmentsToday", () => {
  it("ignores cancelled and no-show appointments", () => {
    const total = countAppointmentsToday([
      { id: "1", startsAt: "", customerName: "", serviceName: "", status: "confirmed" },
      { id: "2", startsAt: "", customerName: "", serviceName: "", status: "cancelled" },
    ]);

    expect(total).toBe(1);
  });
});

describe("buildDashboardAlerts", () => {
  it("returns a default alert when there are no issues", () => {
    const alerts = buildDashboardAlerts({
      today: "2026-07-22",
      todayAgenda: [],
      pendingEntries: [],
      overdueEntries: [],
    });

    expect(alerts[0]?.title).toBe("Tudo em ordem");
  });
});
