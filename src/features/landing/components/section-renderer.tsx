import type { LandingSectionDTO } from "../types";
import {
  getSectionEntry,
  hasSectionContent,
  resolveSectionEntry,
} from "../registry/resolve-sections";
import type { LandingRenderContext } from "../registry/types";
import { SectionFallback } from "./section-fallback";

export type SectionRendererProps = {
  section: LandingSectionDTO;
  context: LandingRenderContext;
};

export function SectionRenderer({ section, context }: SectionRendererProps) {
  const entry = resolveSectionEntry(section);
  if (!entry) {
    return <SectionFallback section={section} context={context} />;
  }

  if (!hasSectionContent(section)) {
    return null;
  }

  const Component = entry.component;
  return <Component section={section} context={context} />;
}

export function canRenderSection(section: LandingSectionDTO): boolean {
  const entry = getSectionEntry(section.type);
  return Boolean(entry) && section.enabled && hasSectionContent(section);
}
