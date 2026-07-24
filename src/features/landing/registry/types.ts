import type { ComponentType } from "react";
import type { z } from "zod";
import type {
  LandingSectionDTO,
  PreviewLandingDTO,
  PublicLandingDTO,
} from "../types";
import type { LandingIntegrationsContext } from "../integrations/types";

export type LandingPageMode = PublicLandingDTO["mode"] | PreviewLandingDTO["mode"];

export type LandingRenderContext = Pick<
  PublicLandingDTO,
  | "slug"
  | "companyName"
  | "professionalName"
  | "specialty"
  | "description"
  | "biography"
  | "branding"
  | "contacts"
  | "social"
  | "bookingHref"
> & {
  mode: LandingPageMode;
  integrations: LandingIntegrationsContext;
};

export type SectionComponentProps<T extends LandingSectionDTO = LandingSectionDTO> = {
  section: T;
  context: LandingRenderContext;
};

export type SectionComponent = ComponentType<SectionComponentProps<LandingSectionDTO>>;

export type SectionRegistryConfig = {
  label: string;
  description: string;
  defaultDisplayOrder: number;
  defaultEnabled: boolean;
  supportsLazyLoad: boolean;
  editorEditable: boolean;
  landmark: "banner" | "region" | "complementary" | "contentinfo";
};

export type SectionRegistryEntry = {
  id: LandingSectionDTO["type"];
  type: LandingSectionDTO["type"];
  schema: z.ZodType;
  config: SectionRegistryConfig;
  component: SectionComponent;
};

export type SectionRegistryMap = Record<LandingSectionDTO["type"], SectionRegistryEntry>;
