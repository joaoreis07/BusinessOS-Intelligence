import type { AppointmentPanelView } from "../types";

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date: Date): Date {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay();
  copy.setUTCDate(copy.getUTCDate() - day);
  return copy;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return end;
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

export function resolvePanelViewRange(input: {
  view: AppointmentPanelView;
  anchorDate?: string;
  now?: Date;
}): { from: string; to: string } | null {
  const now = input.now ?? new Date();
  const anchor = input.anchorDate ? new Date(`${input.anchorDate}T12:00:00Z`) : now;

  if (input.view === "day") {
    const day = toDateString(anchor);
    return { from: day, to: day };
  }

  if (input.view === "week") {
    return {
      from: toDateString(startOfWeek(anchor)),
      to: toDateString(endOfWeek(anchor)),
    };
  }

  if (input.view === "month") {
    return {
      from: toDateString(startOfMonth(anchor)),
      to: toDateString(endOfMonth(anchor)),
    };
  }

  return null;
}
