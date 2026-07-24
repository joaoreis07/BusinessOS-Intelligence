/** Date helpers for public booking — availability always comes from RPCs. */

export function formatDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);
}

export function slotToLocalDate(slotStart: string, timezone: string): string {
  return formatDateInTimezone(new Date(slotStart), timezone);
}

export function addDaysToDateString(date: string, days: number): string {
  const base = new Date(`${date}T12:00:00`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export function clampAvailabilityRange(input: {
  dateFrom: string;
  dateTo: string;
  minDate: string;
  maxDate: string;
}): { dateFrom: string; dateTo: string } | null {
  const dateFrom = input.dateFrom < input.minDate ? input.minDate : input.dateFrom;
  const dateTo = input.dateTo > input.maxDate ? input.maxDate : input.dateTo;
  if (dateFrom > dateTo) return null;
  return { dateFrom, dateTo };
}

export function collectAvailableDatesFromSlots(
  slots: Array<{ slot_start: string }>,
  timezone: string,
): string[] {
  const dates = new Set<string>();
  for (const slot of slots) {
    dates.add(slotToLocalDate(slot.slot_start, timezone));
  }
  return [...dates].sort();
}

export function getBookingDateBounds(input: {
  timezone: string;
  horizonDays: number;
  now?: Date;
}): { minDate: string; maxDate: string } {
  const now = input.now ?? new Date();
  const minDate = formatDateInTimezone(now, input.timezone);
  const maxDate = addDaysToDateString(minDate, input.horizonDays);
  return { minDate, maxDate };
}

export function monthRange(year: number, month: number): { dateFrom: string; dateTo: string } {
  const dateFrom = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dateTo = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { dateFrom, dateTo };
}
