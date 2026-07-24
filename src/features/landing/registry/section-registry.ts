import {
  aboutSectionSchema,
  contactSectionSchema,
  ctaSectionSchema,
  differentialsSectionSchema,
  faqSectionSchema,
  gallerySectionSchema,
  heroSectionSchema,
  servicesSectionSchema,
  testimonialsSectionSchema,
} from "../schemas";
import { AboutSection } from "../components/public/about/about-section";
import { ContactSection } from "../components/public/contact/contact-section";
import { CtaSection } from "../components/public/cta/cta-section";
import { DifferentialsSection } from "../components/public/differentials/differentials-section";
import { FaqSection } from "../components/public/faq/faq-section";
import { GallerySection } from "../components/public/gallery/gallery-section";
import { HeroSection } from "../components/public/hero/hero-section";
import { ServicesSection } from "../components/public/services/services-section";
import { TestimonialsSection } from "../components/public/testimonials/testimonials-section";
import { FooterSection } from "../components/public/footer/footer-section";
import type { ComponentType } from "react";
import type { LandingSectionDTO } from "../types";
import type { SectionRegistryEntry, SectionRegistryMap, SectionComponentProps } from "./types";

const registry = new Map<LandingSectionDTO["type"], SectionRegistryEntry>();

function defineSection<T extends LandingSectionDTO>(entry: {
  id: T["type"];
  type: T["type"];
  schema: SectionRegistryEntry["schema"];
  config: SectionRegistryEntry["config"];
  component: ComponentType<SectionComponentProps<T>>;
}): void {
  registry.set(entry.id, {
    ...entry,
    component: entry.component as SectionRegistryEntry["component"],
  });
}

defineSection({
  id: "hero",
  type: "hero",
  schema: heroSectionSchema,
  config: {
    label: "Hero",
    description: "Apresentação principal da landing",
    defaultDisplayOrder: 10,
    defaultEnabled: true,
    supportsLazyLoad: false,
    editorEditable: true,
    landmark: "banner",
  },
  component: HeroSection,
});

defineSection({
  id: "about",
  type: "about",
  schema: aboutSectionSchema,
  config: {
    label: "Sobre",
    description: "História e apresentação do profissional",
    defaultDisplayOrder: 20,
    defaultEnabled: true,
    supportsLazyLoad: false,
    editorEditable: true,
    landmark: "region",
  },
  component: AboutSection,
});

defineSection({
  id: "services",
  type: "services",
  schema: servicesSectionSchema,
  config: {
    label: "Serviços",
    description: "Lista de serviços públicos",
    defaultDisplayOrder: 30,
    defaultEnabled: true,
    supportsLazyLoad: false,
    editorEditable: true,
    landmark: "region",
  },
  component: ServicesSection,
});

defineSection({
  id: "differentials",
  type: "differentials",
  schema: differentialsSectionSchema,
  config: {
    label: "Diferenciais",
    description: "Destaques e diferenciais do negócio",
    defaultDisplayOrder: 35,
    defaultEnabled: false,
    supportsLazyLoad: false,
    editorEditable: true,
    landmark: "region",
  },
  component: DifferentialsSection,
});

defineSection({
  id: "gallery",
  type: "gallery",
  schema: gallerySectionSchema,
  config: {
    label: "Galeria",
    description: "Galeria de imagens públicas",
    defaultDisplayOrder: 38,
    defaultEnabled: false,
    supportsLazyLoad: true,
    editorEditable: true,
    landmark: "region",
  },
  component: GallerySection,
});

defineSection({
  id: "testimonials",
  type: "testimonials",
  schema: testimonialsSectionSchema,
  config: {
    label: "Depoimentos",
    description: "Depoimentos de clientes",
    defaultDisplayOrder: 40,
    defaultEnabled: true,
    supportsLazyLoad: true,
    editorEditable: true,
    landmark: "region",
  },
  component: TestimonialsSection,
});

defineSection({
  id: "faq",
  type: "faq",
  schema: faqSectionSchema,
  config: {
    label: "FAQ",
    description: "Perguntas frequentes",
    defaultDisplayOrder: 45,
    defaultEnabled: false,
    supportsLazyLoad: false,
    editorEditable: true,
    landmark: "region",
  },
  component: FaqSection,
});

defineSection({
  id: "booking",
  type: "booking",
  schema: ctaSectionSchema,
  config: {
    label: "CTA",
    description: "Chamada para agendamento",
    defaultDisplayOrder: 50,
    defaultEnabled: true,
    supportsLazyLoad: false,
    editorEditable: true,
    landmark: "region",
  },
  component: CtaSection,
});

defineSection({
  id: "contact",
  type: "contact",
  schema: contactSectionSchema,
  config: {
    label: "Contato",
    description: "Informações de contato e redes sociais",
    defaultDisplayOrder: 55,
    defaultEnabled: true,
    supportsLazyLoad: false,
    editorEditable: true,
    landmark: "region",
  },
  component: ContactSection,
});

defineSection({
  id: "footer",
  type: "footer",
  schema: contactSectionSchema,
  config: {
    label: "Rodapé",
    description: "Rodapé institucional",
    defaultDisplayOrder: 60,
    defaultEnabled: true,
    supportsLazyLoad: false,
    editorEditable: false,
    landmark: "contentinfo",
  },
  component: FooterSection,
});

export function registerLandingSection(entry: SectionRegistryEntry): void {
  registry.set(entry.id, entry);
}

export function getSectionRegistry(): SectionRegistryMap {
  return Object.fromEntries(registry) as SectionRegistryMap;
}

export function listSectionDefinitions(): SectionRegistryEntry[] {
  return Array.from(registry.values()).sort(
    (a, b) => a.config.defaultDisplayOrder - b.config.defaultDisplayOrder,
  );
}
