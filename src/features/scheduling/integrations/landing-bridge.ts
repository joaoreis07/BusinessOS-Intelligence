/**
 * Bridge for landing integrations — keeps scheduling enablement rules in one place
 * without duplicating landing/integrations/scheduling.ts.
 */
export function resolveSchedulingEnabled(input: {
  bookingHref: string | null;
  bookingEnabled?: boolean;
  publiclyVisibleServices: number;
}): boolean {
  if (input.bookingEnabled === false) return false;
  if (!input.bookingHref) return false;
  if (input.publiclyVisibleServices <= 0) return false;
  return true;
}
