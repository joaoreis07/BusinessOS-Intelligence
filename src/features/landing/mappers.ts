import type { Json } from "@/types/database.generated";
import { formatCurrencyFromCents } from "@/lib/utils";
import type {
  AboutSectionDTO,
  ContactSectionDTO,
  CtaSectionDTO,
  DifferentialsSectionDTO,
  EditorLandingDTO,
  FaqSectionDTO,
  FooterSectionDTO,
  GalleryItemDTO,
  GallerySectionDTO,
  HeroSectionDTO,
  LandingBrandingDTO,
  LandingContactsDTO,
  LandingSectionDTO,
  LandingSeoDTO,
  LandingSocialLinksDTO,
  PreviewLandingDTO,
  PublicLandingDTO,
  ServiceItemDTO,
  ServicesSectionDTO,
  TestimonialItemDTO,
  TestimonialsSectionDTO,
} from "./types";
import type {
  AboutSectionInput,
  CtaSectionInput,
  DifferentialsSectionInput,
  FaqSectionInput,
  HeroSectionInput,
  BrandingInput,
  SeoInput,
} from "./schemas";

type PublicPageRow = {
  slug: string;
  name: string;
  professional_name: string | null;
  specialty: string | null;
  description: string | null;
  biography: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: Json | null;
  social_links: Json | null;
  title: string;
  meta_description: string | null;
  logo_path: string | null;
  avatar_path: string | null;
  banner_path: string | null;
  seo: Json;
  custom_domain?: string | null;
  published_at?: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  theme: string;
};

type SectionRow = {
  section_type: string;
  title: string | null;
  content: Json;
  display_order: number;
  enabled?: boolean;
};

type PublicServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  image_path: string | null;
  display_order: number;
};

type PublicTestimonialRow = {
  customer_name: string;
  quote: string;
  rating: number | null;
  photo_path: string | null;
  display_order: number;
};

type PublicGalleryRow = {
  id: string;
  object_path: string;
  caption: string | null;
  alt_text: string | null;
  display_order: number;
};

type EditorPageRow = {
  company_id: string;
  title: string;
  meta_description: string | null;
  logo_path: string | null;
  avatar_path: string | null;
  banner_path: string | null;
  published: boolean;
  published_at: string | null;
  seo: Json;
  locale: string;
  template_key: string;
};

type EditorTestimonialRow = {
  id: string;
  customer_name: string;
  quote: string;
  rating: number | null;
  photo_path: string | null;
  published: boolean;
  display_order: number;
};

type EditorGalleryRow = {
  id: string;
  object_path: string;
  caption: string | null;
  alt_text: string | null;
  display_order: number;
  enabled: boolean;
};

const MEDIA_BUCKET = "company-public-media";

export function buildPublicMediaUrl(
  supabaseUrl: string,
  objectPath: string | null,
): string | null {
  if (!objectPath) return null;
  if (
    objectPath.startsWith("http://") ||
    objectPath.startsWith("https://") ||
    objectPath.startsWith("/")
  ) {
    return objectPath;
  }
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${objectPath}`;
}

function asRecord(value: Json | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function mapContacts(
  page: Pick<PublicPageRow, "email" | "phone" | "whatsapp" | "address">,
): LandingContactsDTO {
  const address = asRecord(page.address);
  return {
    email: page.email,
    phone: page.phone,
    whatsapp: page.whatsapp,
    address: {
      city: asString(address.city),
      state: asString(address.state),
      street: asString(address.street),
      zip: asString(address.zip),
    },
  };
}

export function mapSocialLinks(socialLinks: Json | null): LandingSocialLinksDTO {
  const social = asRecord(socialLinks);
  return {
    instagram: asString(social.instagram),
    facebook: asString(social.facebook),
    linkedin: asString(social.linkedin),
    website: asString(social.website),
  };
}

export function mapBranding(
  page: Pick<
    PublicPageRow,
    | "primary_color"
    | "secondary_color"
    | "accent_color"
    | "background_color"
    | "theme"
    | "logo_path"
    | "avatar_path"
    | "banner_path"
  >,
  supabaseUrl: string,
): LandingBrandingDTO {
  return {
    primaryColor: page.primary_color,
    secondaryColor: page.secondary_color,
    accentColor: page.accent_color,
    backgroundColor: page.background_color,
    theme: page.theme,
    logoUrl: buildPublicMediaUrl(supabaseUrl, page.logo_path),
    avatarUrl: buildPublicMediaUrl(supabaseUrl, page.avatar_path),
    bannerUrl: buildPublicMediaUrl(supabaseUrl, page.banner_path),
  };
}

export function mapSeo(
  page: Pick<PublicPageRow, "title" | "meta_description" | "seo" | "banner_path" | "logo_path">,
  slug: string,
  appBaseUrl: string,
  supabaseUrl: string,
  published: boolean,
): LandingSeoDTO {
  const seo = asRecord(page.seo);
  const ogImagePath = asString(seo.ogImagePath) ?? page.banner_path ?? page.logo_path;
  return {
    title: page.title,
    metaDescription: page.meta_description,
    keywords: asString(seo.keywords),
    canonicalUrl: asString(seo.canonicalUrl) ?? `${appBaseUrl}/${slug}`,
    ogTitle: asString(seo.ogTitle) ?? page.title,
    ogDescription: asString(seo.ogDescription) ?? page.meta_description,
    ogImageUrl: buildPublicMediaUrl(supabaseUrl, ogImagePath),
    twitterCard:
      seo.twitterCard === "summary" ? "summary" : "summary_large_image",
    robotsIndex: published && seo.robotsIndex !== false,
    structuredData: {
      "@type": asString(seo.schemaType) ?? "LocalBusiness",
      name: page.title,
      ...(asString(seo.keywords) ? { keywords: asString(seo.keywords) } : {}),
    },
  };
}

export function mapHeroSection(
  row: SectionRow | undefined,
  branding: LandingBrandingDTO,
  slug: string,
): HeroSectionDTO {
  const content = asRecord(row?.content);
  return {
    type: "hero",
    enabled: row?.enabled ?? true,
    displayOrder: row?.display_order ?? 10,
    title: row?.title ?? null,
    subtitle: asString(content.subtitle),
    ctaLabel: asString(content.cta) ?? "Agendar atendimento",
    ctaHref: `/${slug}/agendar`,
    imageUrl: branding.bannerUrl,
  };
}

export function mapAboutSection(
  row: SectionRow | undefined,
  branding: LandingBrandingDTO,
): AboutSectionDTO {
  const content = asRecord(row?.content);
  return {
    type: "about",
    enabled: row?.enabled ?? true,
    displayOrder: row?.display_order ?? 20,
    title: row?.title ?? null,
    body: asString(content.text),
    imageUrl: branding.avatarUrl,
  };
}

export function mapServicesSection(
  row: SectionRow | undefined,
  services: PublicServiceRow[],
  slug: string,
  supabaseUrl: string,
): ServicesSectionDTO {
  const items: ServiceItemDTO[] = services.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    priceLabel: formatCurrencyFromCents(Math.round(Number(service.price) * 100)),
    durationMinutes: service.duration_minutes,
    imageUrl: buildPublicMediaUrl(supabaseUrl, service.image_path),
    bookingHref: `/${slug}/agendar?service=${service.id}`,
  }));
  return {
    type: "services",
    enabled: row?.enabled ?? true,
    displayOrder: row?.display_order ?? 30,
    title: row?.title ?? "Serviços",
    items,
  };
}

export function mapDifferentialsSection(row: SectionRow | undefined): DifferentialsSectionDTO {
  const content = asRecord(row?.content);
  const rawItems = Array.isArray(content.items) ? content.items : [];
  const items = rawItems
    .map((item) => {
      const record = asRecord(item as Json);
      const title = asString(record.title);
      const description = asString(record.description);
      if (!title || !description) return null;
      return { title, description };
    })
    .filter((item): item is { title: string; description: string } => item !== null);

  return {
    type: "differentials",
    enabled: row?.enabled ?? true,
    displayOrder: row?.display_order ?? 35,
    title: row?.title ?? "Diferenciais",
    items,
  };
}

export function mapTestimonialItem(
  row: PublicTestimonialRow | EditorTestimonialRow,
  supabaseUrl: string,
  id?: string,
): TestimonialItemDTO {
  const published = "published" in row ? row.published : true;
  return {
    id: id ?? `public-${row.customer_name}-${row.display_order}`,
    customerName: row.customer_name,
    quote: row.quote,
    rating: row.rating,
    photoUrl: buildPublicMediaUrl(supabaseUrl, row.photo_path),
    published,
    displayOrder: row.display_order,
  };
}

export function mapTestimonialsSection(
  row: SectionRow | undefined,
  testimonials: PublicTestimonialRow[],
  supabaseUrl: string,
): TestimonialsSectionDTO {
  return {
    type: "testimonials",
    enabled: row?.enabled ?? true,
    displayOrder: row?.display_order ?? 40,
    title: row?.title ?? "Depoimentos",
    items: testimonials.map((item) => mapTestimonialItem(item, supabaseUrl)),
  };
}

export function mapFaqSection(row: SectionRow | undefined): FaqSectionDTO {
  const content = asRecord(row?.content);
  const rawItems = Array.isArray(content.items) ? content.items : [];
  const items = rawItems
    .map((item) => {
      const record = asRecord(item as Json);
      const question = asString(record.question);
      const answer = asString(record.answer);
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item): item is { question: string; answer: string } => item !== null);

  return {
    type: "faq",
    enabled: row?.enabled ?? true,
    displayOrder: row?.display_order ?? 45,
    title: row?.title ?? "Perguntas frequentes",
    items,
  };
}

export function mapCtaSection(row: SectionRow | undefined, slug: string): CtaSectionDTO {
  const content = asRecord(row?.content);
  return {
    type: "booking",
    enabled: row?.enabled ?? true,
    displayOrder: row?.display_order ?? 50,
    title: row?.title ?? "Pronto para agendar?",
    subtitle: asString(content.subtitle) ?? "Escolha um serviço, data e horário em poucos passos.",
    buttonLabel: asString(content.buttonLabel) ?? "Ver horários disponíveis",
    buttonHref: `/${slug}/agendar`,
  };
}

export function mapGalleryItem(
  row: PublicGalleryRow | EditorGalleryRow,
  supabaseUrl: string,
): GalleryItemDTO {
  const enabled = "enabled" in row ? row.enabled : true;
  return {
    id: row.id,
    objectPath: row.object_path,
    imageUrl: buildPublicMediaUrl(supabaseUrl, row.object_path) ?? "",
    caption: row.caption,
    altText: row.alt_text,
    displayOrder: row.display_order,
    enabled,
  };
}

export function mapGallerySection(
  row: SectionRow | undefined,
  gallery: PublicGalleryRow[],
  supabaseUrl: string,
): GallerySectionDTO {
  return {
    type: "gallery",
    enabled: row?.enabled ?? true,
    displayOrder: row?.display_order ?? 38,
    title: row?.title ?? "Galeria",
    items: gallery.map((item) => mapGalleryItem(item, supabaseUrl)),
  };
}

export function mapContactSection(
  row: SectionRow | undefined,
  contacts: LandingContactsDTO,
  social: LandingSocialLinksDTO,
): ContactSectionDTO {
  return {
    type: "contact",
    enabled: row?.enabled ?? true,
    displayOrder: row?.display_order ?? 55,
    title: row?.title ?? "Contato",
    contacts,
    social,
  };
}

export function mapFooterSection(
  row: SectionRow | undefined,
  companyName: string,
  contacts: LandingContactsDTO,
): FooterSectionDTO {
  return {
    type: "footer",
    enabled: row?.enabled ?? true,
    displayOrder: row?.display_order ?? 60,
    companyName,
    contacts,
  };
}

function findSection(rows: SectionRow[], type: string): SectionRow | undefined {
  return rows.find((row) => row.section_type === type);
}

export function mapPublicLandingDTO(input: {
  page: PublicPageRow;
  sections: SectionRow[];
  services: PublicServiceRow[];
  testimonials: PublicTestimonialRow[];
  gallery: PublicGalleryRow[];
  supabaseUrl: string;
  appBaseUrl: string;
  bookingEnabled?: boolean;
}): PublicLandingDTO {
  const {
    page,
    sections,
    services,
    testimonials,
    gallery,
    supabaseUrl,
    appBaseUrl,
    bookingEnabled = true,
  } = input;
  const branding = mapBranding(page, supabaseUrl);
  const contacts = mapContacts(page);
  const social = mapSocialLinks(page.social_links);
  const slug = page.slug;

  const mappedSections: LandingSectionDTO[] = [
    mapHeroSection(findSection(sections, "hero"), branding, slug),
    mapAboutSection(findSection(sections, "about"), branding),
    mapServicesSection(findSection(sections, "services"), services, slug, supabaseUrl),
    mapDifferentialsSection(findSection(sections, "differentials")),
    mapGallerySection(findSection(sections, "gallery"), gallery, supabaseUrl),
    mapTestimonialsSection(findSection(sections, "testimonials"), testimonials, supabaseUrl),
    mapFaqSection(findSection(sections, "faq")),
    mapCtaSection(findSection(sections, "booking"), slug),
    mapContactSection(findSection(sections, "contact"), contacts, social),
    mapFooterSection(findSection(sections, "footer"), page.name, contacts),
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  return {
    mode: "public",
    slug,
    companyName: page.name,
    professionalName: page.professional_name,
    specialty: page.specialty,
    description: page.description,
    biography: page.biography,
    customDomain: page.custom_domain ?? null,
    publishedAt: page.published_at ?? null,
    branding,
    seo: mapSeo(page, slug, appBaseUrl, supabaseUrl, true),
    contacts,
    social,
    sections: mappedSections.filter((section) => section.enabled),
    bookingHref: `/${slug}/agendar`,
    bookingEnabled,
  };
}

export function mapPreviewLandingDTO(
  publicLikePage: PublicPageRow & { published?: boolean },
  args: Omit<Parameters<typeof mapPublicLandingDTO>[0], "page"> & {
    previewExpiresAt: string;
    isPublished: boolean;
  },
): PreviewLandingDTO {
  const base = mapPublicLandingDTO({ ...args, page: publicLikePage });
  return {
    ...base,
    mode: "preview",
    previewExpiresAt: args.previewExpiresAt,
    isPublished: args.isPublished,
    seo: {
      ...base.seo,
      robotsIndex: false,
    },
  };
}

export function mapEditorLandingDTO(input: {
  page: EditorPageRow;
  slug: string;
  company: Pick<PublicPageRow, "name" | "email" | "phone" | "whatsapp" | "address" | "social_links" | "professional_name" | "specialty" | "description">;
  settings: Pick<
    PublicPageRow,
    "primary_color" | "secondary_color" | "accent_color" | "background_color" | "theme"
  >;
  sections: SectionRow[];
  services: PublicServiceRow[];
  testimonials: EditorTestimonialRow[];
  gallery: EditorGalleryRow[];
  supabaseUrl: string;
  appBaseUrl: string;
}): EditorLandingDTO {
  const publicPage: PublicPageRow = {
    slug: input.slug,
    name: input.company.name,
    professional_name: input.company.professional_name ?? null,
    specialty: input.company.specialty ?? null,
    description: input.company.description ?? null,
    biography: null,
    email: input.company.email,
    phone: input.company.phone,
    whatsapp: input.company.whatsapp,
    address: input.company.address,
    social_links: input.company.social_links,
    title: input.page.title,
    meta_description: input.page.meta_description,
    logo_path: input.page.logo_path,
    avatar_path: input.page.avatar_path,
    banner_path: input.page.banner_path,
    seo: input.page.seo,
    primary_color: input.settings.primary_color,
    secondary_color: input.settings.secondary_color,
    accent_color: input.settings.accent_color,
    background_color: input.settings.background_color,
    theme: input.settings.theme,
  };

  const publicDto = mapPublicLandingDTO({
    page: publicPage,
    sections: input.sections,
    services: input.services,
    testimonials: input.testimonials.map((item) => ({
      customer_name: item.customer_name,
      quote: item.quote,
      rating: item.rating,
      photo_path: item.photo_path,
      display_order: item.display_order,
    })),
    gallery: input.gallery,
    supabaseUrl: input.supabaseUrl,
    appBaseUrl: input.appBaseUrl,
  });

  return {
    mode: "editor",
    companyId: input.page.company_id,
    slug: input.slug,
    companyName: input.company.name,
    professionalName: publicPage.professional_name,
    specialty: publicPage.specialty,
    description: publicPage.description,
    published: input.page.published,
    publishedAt: input.page.published_at,
    locale: input.page.locale,
    templateKey: input.page.template_key,
    branding: publicDto.branding,
    mediaPaths: {
      logoPath: input.page.logo_path,
      avatarPath: input.page.avatar_path,
      bannerPath: input.page.banner_path,
    },
    seo: mapSeo(publicPage, input.slug, input.appBaseUrl, input.supabaseUrl, input.page.published),
    contacts: publicDto.contacts,
    social: publicDto.social,
    sections: publicDto.sections,
    testimonials: input.testimonials.map((item) =>
      mapTestimonialItem(item, input.supabaseUrl, item.id),
    ),
    gallery: input.gallery.map((item) => mapGalleryItem(item, input.supabaseUrl)),
  };
}

export function toHeroPersistence(input: HeroSectionInput) {
  return {
    sectionType: "hero" as const,
    title: input.title ?? null,
    content: {
      subtitle: input.subtitle ?? null,
      cta: input.ctaLabel,
    },
    enabled: input.enabled,
    displayOrder: input.displayOrder,
  };
}

export function toAboutPersistence(input: AboutSectionInput) {
  return {
    sectionType: "about" as const,
    title: input.title ?? null,
    content: { text: input.body ?? null },
    enabled: input.enabled,
    displayOrder: input.displayOrder,
  };
}

export function toDifferentialsPersistence(input: DifferentialsSectionInput) {
  return {
    sectionType: "differentials" as const,
    title: input.title ?? null,
    content: { items: input.items },
    enabled: input.enabled,
    displayOrder: input.displayOrder,
  };
}

export function toFaqPersistence(input: FaqSectionInput) {
  return {
    sectionType: "faq" as const,
    title: input.title ?? null,
    content: { items: input.items },
    enabled: input.enabled,
    displayOrder: input.displayOrder,
  };
}

export function toCtaPersistence(input: CtaSectionInput) {
  return {
    sectionType: "booking" as const,
    title: input.title ?? null,
    content: {
      subtitle: input.subtitle ?? null,
      buttonLabel: input.buttonLabel,
    },
    enabled: input.enabled,
    displayOrder: input.displayOrder,
  };
}

export function toBrandingPersistence(input: BrandingInput) {
  return {
    settings: {
      primary_color: input.primaryColor,
      secondary_color: input.secondaryColor,
      accent_color: input.accentColor,
      background_color: input.backgroundColor,
      theme: input.theme,
    },
    page: {
      logo_path: input.logoPath ?? null,
      avatar_path: input.avatarPath ?? null,
      banner_path: input.bannerPath ?? null,
    },
  };
}

export function toSeoPersistence(input: SeoInput) {
  return {
    title: input.title,
    meta_description: input.metaDescription ?? null,
    seo: {
      canonicalUrl: input.canonicalUrl ?? null,
      ogTitle: input.ogTitle ?? null,
      ogDescription: input.ogDescription ?? null,
      ogImagePath: input.ogImagePath ?? null,
      twitterCard: input.twitterCard,
      robotsIndex: input.robotsIndex,
      keywords: input.keywords ?? null,
    },
  };
}

export function buildMediaObjectPath(companyId: string, kind: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const timestamp = Date.now();
  return `${companyId}/${kind}/${timestamp}-${safeName}`;
}
