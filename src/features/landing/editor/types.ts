import type { EditorLandingDTO, LandingSectionDTO } from "../types";

export type EditorActionState = {
  error?: string;
  success?: string;
  previewUrl?: string;
  mediaAssetId?: string;
  objectPath?: string;
  publicUrl?: string;
};

export type EditorTabId =
  | "hero"
  | "about"
  | "services"
  | "gallery"
  | "testimonials"
  | "faq"
  | "cta"
  | "contact"
  | "seo"
  | "branding";

export type EditorTabDefinition = {
  id: EditorTabId;
  label: string;
  description: string;
  sectionType?: LandingSectionDTO["type"];
};

export const EDITOR_TABS: EditorTabDefinition[] = [
  { id: "hero", label: "Hero", description: "Apresentação principal", sectionType: "hero" },
  { id: "about", label: "Sobre", description: "História e credenciais", sectionType: "about" },
  { id: "services", label: "Serviços", description: "Exibição dos serviços", sectionType: "services" },
  { id: "gallery", label: "Galeria", description: "Imagens públicas", sectionType: "gallery" },
  { id: "testimonials", label: "Depoimentos", description: "Avaliações de clientes", sectionType: "testimonials" },
  { id: "faq", label: "FAQ", description: "Perguntas frequentes", sectionType: "faq" },
  { id: "cta", label: "CTA", description: "Chamada para agendamento", sectionType: "booking" },
  { id: "contact", label: "Contato", description: "Seção de contato", sectionType: "contact" },
  { id: "seo", label: "SEO", description: "Metadados e indexação" },
  { id: "branding", label: "Branding", description: "Identidade visual e empresa" },
];

export function findEditorSection<T extends LandingSectionDTO["type"]>(
  data: EditorLandingDTO,
  type: T,
): Extract<LandingSectionDTO, { type: T }> | undefined {
  return data.sections.find((section) => section.type === type) as
    | Extract<LandingSectionDTO, { type: T }>
    | undefined;
}

export function getSectionEnabled(data: EditorLandingDTO, type: LandingSectionDTO["type"]) {
  return findEditorSection(data, type)?.enabled ?? false;
}
