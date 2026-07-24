import type { TestimonialItemDTO } from "../types";

export type BusinessModuleId = "scheduling" | "crm" | "contact" | "finance" | "ai";

export type BookingActionDTO = {
  module: "scheduling";
  kind: "general" | "service";
  label: string;
  href: string;
  enabled: boolean;
  serviceId?: string;
};

export type TestimonialsFeedDTO = {
  module: "landing" | "crm";
  sourceLabel: string;
  syncEnabled: boolean;
  items: TestimonialItemDTO[];
};

export type ContactChannelKind = "whatsapp" | "email" | "phone" | "form" | "address";

export type ContactChannelDTO = {
  module: "contact";
  kind: ContactChannelKind;
  label: string;
  displayValue: string | null;
  href: string | null;
  enabled: boolean;
  external: boolean;
};

export type SchedulingIntegrationContext = {
  module: "scheduling";
  enabled: boolean;
  bookingHref: string;
  publiclyVisibleServices: number;
};

export type CrmIntegrationContext = {
  module: "crm";
  enabled: boolean;
  testimonialsSource: "landing" | "crm";
  syncReviewsEnabled: boolean;
};

export type ContactIntegrationContext = {
  module: "contact";
  enabled: boolean;
  channels: ContactChannelDTO[];
  formActionHref: string | null;
  formEnabled: boolean;
};

export type LandingIntegrationsContext = {
  scheduling: SchedulingIntegrationContext;
  crm: CrmIntegrationContext;
  contact: ContactIntegrationContext;
};
