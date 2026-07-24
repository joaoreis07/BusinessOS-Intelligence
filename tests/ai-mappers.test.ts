import { describe, expect, it } from "vitest";

import {
  buildAiAlerts,
  buildAiDailySummary,
  buildAiRecommendations,
  buildAiWeeklyReport,
  calculateRevenueDeltaPercent,
} from "@/features/ai/mappers";

describe("buildAiDailySummary", () => {
  it("builds summary with scheduling and finance highlights", () => {
    const summary = buildAiDailySummary({
      companyName: "Acme",
      data: {
        today: "2026-07-23",
        kpis: {
          appointmentsToday: 2,
          activeCustomers: 10,
          monthIncomeCents: 150000,
          pendingCents: 20000,
        },
        nextAppointment: {
          id: "00000000-0000-4000-8000-000000000001",
          startsAt: "2026-07-23T15:00:00.000Z",
          customerName: "Maria",
          serviceName: "Consulta",
          status: "confirmed",
        },
      },
      capabilities: { scheduling: true, customers: true, finance: true },
    });

    expect(summary.headline).toContain("Acme");
    expect(summary.highlights).toHaveLength(4);
    expect(summary.paragraphs.some((line) => line.includes("Maria"))).toBe(true);
  });
});

describe("buildAiAlerts", () => {
  it("creates inactive customer alert", () => {
    const alerts = buildAiAlerts({
      dashboardAlerts: [],
      inactiveCustomers: 3,
      appointmentsToday: 0,
      pendingCents: 0,
      revenueDeltaPercent: null,
    });

    expect(alerts.some((alert) => alert.id === "inactive-customers")).toBe(true);
    expect(alerts.some((alert) => alert.id === "empty-agenda")).toBe(true);
  });
});

describe("buildAiRecommendations", () => {
  it("prioritizes pending receivables", () => {
    const recommendations = buildAiRecommendations({
      inactiveCustomers: 0,
      appointmentsToday: 1,
      pendingCents: 50000,
      revenueDeltaPercent: null,
      capabilities: { scheduling: true, customers: true, finance: true },
    });

    expect(recommendations[0]?.id).toBe("collect-pending");
  });
});

describe("buildAiWeeklyReport", () => {
  it("builds weekly sections", () => {
    const report = buildAiWeeklyReport({
      weekFrom: "2026-07-17",
      weekTo: "2026-07-23",
      appointmentsTotal: 8,
      newCustomers: 2,
      weekIncomeCents: 90000,
      pendingCents: 10000,
      inactiveCustomers: 1,
    });

    expect(report.sections).toHaveLength(3);
    expect(report.periodLabel).toContain("jul");
  });
});

describe("calculateRevenueDeltaPercent", () => {
  it("calculates delta between weeks", () => {
    expect(calculateRevenueDeltaPercent(80000, 100000)).toBe(-20);
  });
});
