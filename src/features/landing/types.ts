import type { Database } from "@/types/database.generated";

export type SectionType = Database["public"]["Enums"]["section_type"];
export type MediaKind = Database["public"]["Enums"]["media_kind"];

export type LandingContactsDTO = {
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: {
    city: string | null;
    state: string | null;
    street: string | null;
    zip: string | null;
  };
};

export type LandingSocialLinksDTO = {
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  website: string | null;
};

export type LandingBrandingDTO = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  theme: string;
  logoUrl: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
};

export type LandingSeoDTO = {
  title: string;
  metaDescription: string | null;
  keywords: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  twitterCard: "summary" | "summary_large_image";
  robotsIndex: boolean;
  structuredData: Record<string, string | number | boolean | null>;
};

export type HeroSectionDTO = {
  type: "hero";
  enabled: boolean;
  displayOrder: number;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string;
  ctaHref: string | null;
  imageUrl: string | null;
};

export type AboutSectionDTO = {
  type: "about";
  enabled: boolean;
  displayOrder: number;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
};

export type ServiceItemDTO = {
  id: string;
  name: string;
  description: string | null;
  priceLabel: string;
  durationMinutes: number;
  imageUrl: string | null;
  bookingHref: string;
};

export type ServicesSectionDTO = {
  type: "services";
  enabled: boolean;
  displayOrder: number;
  title: string | null;
  items: ServiceItemDTO[];
};

export type TestimonialItemDTO = {
  id: string;
  customerName: string;
  quote: string;
  rating: number | null;
  photoUrl: string | null;
  published: boolean;
  displayOrder: number;
};

export type TestimonialsSectionDTO = {
  type: "testimonials";
  enabled: boolean;
  displayOrder: number;
  title: string | null;
  items: TestimonialItemDTO[];
};

export type FaqItemDTO = {
  question: string;
  answer: string;
};

export type FaqSectionDTO = {
  type: "faq";
  enabled: boolean;
  displayOrder: number;
  title: string | null;
  items: FaqItemDTO[];
};

export type CtaSectionDTO = {
  type: "booking";
  enabled: boolean;
  displayOrder: number;
  title: string | null;
  subtitle: string | null;
  buttonLabel: string;
  buttonHref: string;
};

export type GalleryItemDTO = {
  id: string;
  objectPath: string;
  imageUrl: string;
  caption: string | null;
  altText: string | null;
  displayOrder: number;
  enabled: boolean;
};

export type GallerySectionDTO = {
  type: "gallery";
  enabled: boolean;
  displayOrder: number;
  title: string | null;
  items: GalleryItemDTO[];
};

export type ContactSectionDTO = {
  type: "contact";
  enabled: boolean;
  displayOrder: number;
  title: string | null;
  contacts: LandingContactsDTO;
  social: LandingSocialLinksDTO;
};

export type DifferentialsSectionDTO = {
  type: "differentials";
  enabled: boolean;
  displayOrder: number;
  title: string | null;
  items: { title: string; description: string }[];
};

export type FooterSectionDTO = {
  type: "footer";
  enabled: boolean;
  displayOrder: number;
  companyName: string;
  contacts: LandingContactsDTO;
};

export type LandingSectionDTO =
  | HeroSectionDTO
  | AboutSectionDTO
  | ServicesSectionDTO
  | DifferentialsSectionDTO
  | TestimonialsSectionDTO
  | FaqSectionDTO
  | CtaSectionDTO
  | GallerySectionDTO
  | ContactSectionDTO
  | FooterSectionDTO;

export type PublicLandingDTO = {
  mode: "public";
  slug: string;
  companyName: string;
  professionalName: string | null;
  specialty: string | null;
  description: string | null;
  biography: string | null;
  customDomain: string | null;
  publishedAt: string | null;
  branding: LandingBrandingDTO;
  seo: LandingSeoDTO;
  contacts: LandingContactsDTO;
  social: LandingSocialLinksDTO;
  sections: LandingSectionDTO[];
  bookingHref: string;
  bookingEnabled: boolean;
};

export type PreviewLandingDTO = Omit<PublicLandingDTO, "mode" | "seo"> & {
  mode: "preview";
  previewExpiresAt: string;
  isPublished: boolean;
  seo: LandingSeoDTO;
};

export type EditorLandingDTO = {
  mode: "editor";
  companyId: string;
  slug: string;
  companyName: string;
  professionalName: string | null;
  specialty: string | null;
  description: string | null;
  published: boolean;
  publishedAt: string | null;
  locale: string;
  templateKey: string;
  branding: LandingBrandingDTO;
  mediaPaths: {
    logoPath: string | null;
    avatarPath: string | null;
    bannerPath: string | null;
  };
  seo: LandingSeoDTO;
  contacts: LandingContactsDTO;
  social: LandingSocialLinksDTO;
  sections: LandingSectionDTO[];
  testimonials: TestimonialItemDTO[];
  gallery: GalleryItemDTO[];
};

export type PreviewTokenDTO = {
  token: string;
  expiresAt: string;
  previewUrl: string;
  slug: string;
};

export type MediaUploadResultDTO = {
  objectPath: string;
  publicUrl: string;
  mediaAssetId: string;
  kind: MediaKind;
};

export type SchedulingIntegrationDTO = {
  enabled: boolean;
  bookingHref: string;
  publiclyVisibleServices: number;
};

export type CrmIntegrationDTO = {
  enabled: boolean;
  totalCustomers: number;
};

export type FinanceIntegrationDTO = {
  enabled: boolean;
  monthlyRevenueLabel: string;
};

export type AiIntegrationDTO = {
  enabled: boolean;
  suggestionsAvailable: boolean;
};
