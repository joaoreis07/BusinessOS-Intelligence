import type { LandingSectionDTO } from "../types";
import type { SectionRegistryEntry } from "./types";
import { getSectionRegistry } from "./section-registry";

export function sortSections(sections: LandingSectionDTO[]): LandingSectionDTO[] {
  return [...sections].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function filterEnabledSections(sections: LandingSectionDTO[]): LandingSectionDTO[] {
  return sections.filter((section) => section.enabled);
}

export function resolveRenderableSections(sections: LandingSectionDTO[]): LandingSectionDTO[] {
  return sortSections(filterEnabledSections(sections));
}

export function getSectionEntry(
  type: LandingSectionDTO["type"],
): SectionRegistryEntry | undefined {
  return getSectionRegistry()[type];
}

export function isRegisteredSectionType(
  type: string,
): type is LandingSectionDTO["type"] {
  return type in getSectionRegistry();
}

export function resolveSectionEntry(
  section: LandingSectionDTO,
): SectionRegistryEntry | null {
  const entry = getSectionEntry(section.type);
  if (!entry) return null;
  return entry;
}

export function hasSectionContent(section: LandingSectionDTO): boolean {
  switch (section.type) {
    case "services":
      return section.items.length > 0;
    case "testimonials":
      return section.items.length > 0;
    case "gallery":
      return section.items.length > 0;
    case "faq":
      return section.items.length > 0;
    case "differentials":
      return section.items.length > 0;
    case "hero":
      return Boolean(section.title || section.subtitle || section.imageUrl);
    case "about":
      return Boolean(section.title || section.body || section.imageUrl);
    case "booking":
      return Boolean(section.title || section.subtitle || section.buttonHref);
    case "contact":
      return Boolean(
        section.contacts.email ||
          section.contacts.phone ||
          section.contacts.whatsapp ||
          section.contacts.address.city ||
          section.social.instagram ||
          section.social.facebook ||
          section.social.linkedin ||
          section.social.website,
      );
    case "footer":
      return Boolean(section.companyName);
    default:
      return true;
  }
}
