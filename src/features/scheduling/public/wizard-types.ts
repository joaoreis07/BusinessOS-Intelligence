export const BOOKING_WIZARD_STEPS = [
  "service",
  "date",
  "time",
  "customer",
  "confirm",
] as const;

export type BookingWizardStep = (typeof BOOKING_WIZARD_STEPS)[number];

export type BookingWizardState = {
  step: BookingWizardStep;
  serviceId: string;
  date: string;
  startsAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  objective: string;
  notes: string;
};

export type BookingWizardViewState =
  | "loading"
  | "ready"
  | "booking_disabled"
  | "no_services"
  | "saving"
  | "success"
  | "error";
