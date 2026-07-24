import { describe, expect, it } from "vitest";

import { resolvePanelViewRange } from "@/features/scheduling/panel/query-range";
import { listAppointmentsQuerySchema } from "@/features/scheduling/schemas";

describe("appointments panel query", () => {
  it("parses paginated list filters", () => {
    const parsed = listAppointmentsQuerySchema.parse({
      page: "2",
      pageSize: "10",
      status: "confirmed",
      timeframe: "upcoming",
      view: "week",
      anchorDate: "2026-07-15",
      q: "Maria",
    });

    expect(parsed.page).toBe(2);
    expect(parsed.status).toEqual(["confirmed"]);
    expect(parsed.view).toBe("week");
  });

  it("resolves week range from anchor date", () => {
    expect(
      resolvePanelViewRange({
        view: "week",
        anchorDate: "2026-07-15",
        now: new Date("2026-07-15T12:00:00.000Z"),
      }),
    ).toEqual({ from: "2026-07-12", to: "2026-07-18" });
  });

  it("resolves month range from anchor date", () => {
    expect(
      resolvePanelViewRange({
        view: "month",
        anchorDate: "2026-07-15",
      }),
    ).toEqual({ from: "2026-07-01", to: "2026-07-31" });
  });
});
