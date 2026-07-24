import { z } from "zod";
import { isReservedPublicSlug } from "./reserved-slugs";

export const publicSlugSchema = z
  .string()
  .trim()
  .min(3)
  .max(63)
  .regex(/^[a-z0-9-]+$/)
  .refine((slug) => !isReservedPublicSlug(slug), {
    message: "Este slug é reservado pelo sistema.",
  });

export const previewTokenSchema = z.string().trim().min(16).max(128);

export const previewAccessSchema = z.object({
  slug: publicSlugSchema,
  token: previewTokenSchema,
});

export const previewTtlSchema = z.number().int().min(5).max(1440).default(60);

export const heroSectionSchema = z.object({
  title: z.string().trim().min(3).max(160).optional().nullable(),
  subtitle: z.string().trim().min(3).max(500).optional().nullable(),
  ctaLabel: z.string().trim().min(2).max(80).default("Agendar atendimento"),
  enabled: z.boolean().default(true),
  displayOrder: z.number().int().nonnegative().default(10),
});

export const aboutSectionSchema = z.object({
  title: z.string().trim().min(3).max(160).optional().nullable(),
  body: z.string().trim().min(10).max(5000).optional().nullable(),
  enabled: z.boolean().default(true),
  displayOrder: z.number().int().nonnegative().default(20),
});

export const servicesSectionSchema = z.object({
  title: z.string().trim().max(160).optional().nullable(),
  enabled: z.boolean().default(true),
  displayOrder: z.number().int().nonnegative().default(30),
});

export const differentialsSectionSchema = z.object({
  title: z.string().trim().max(160).optional().nullable(),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(2).max(120),
        description: z.string().trim().min(5).max(500),
      }),
    )
    .max(12)
    .default([]),
  enabled: z.boolean().default(true),
  displayOrder: z.number().int().nonnegative().default(35),
});

export const testimonialsSectionSchema = z.object({
  title: z.string().trim().max(160).optional().nullable(),
  enabled: z.boolean().default(true),
  displayOrder: z.number().int().nonnegative().default(40),
});

export const faqSectionSchema = z.object({
  title: z.string().trim().max(160).optional().nullable(),
  items: z
    .array(
      z.object({
        question: z.string().trim().min(5).max(200),
        answer: z.string().trim().min(5).max(2000),
      }),
    )
    .max(20)
    .default([]),
  enabled: z.boolean().default(false),
  displayOrder: z.number().int().nonnegative().default(45),
});

export const ctaSectionSchema = z.object({
  title: z.string().trim().max(160).optional().nullable(),
  subtitle: z.string().trim().max(300).optional().nullable(),
  buttonLabel: z.string().trim().min(2).max(80).default("Ver horários disponíveis"),
  enabled: z.boolean().default(true),
  displayOrder: z.number().int().nonnegative().default(50),
});

export const contactSectionSchema = z.object({
  title: z.string().trim().max(160).optional().nullable(),
  enabled: z.boolean().default(true),
  displayOrder: z.number().int().nonnegative().default(55),
});

export const gallerySectionSchema = z.object({
  title: z.string().trim().max(160).optional().nullable(),
  enabled: z.boolean().default(false),
  displayOrder: z.number().int().nonnegative().default(38),
});

export const brandingSchema = z.object({
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/),
  theme: z.enum(["light", "dark", "system"]).default("light"),
  logoPath: z.string().trim().max(500).optional().nullable(),
  avatarPath: z.string().trim().max(500).optional().nullable(),
  bannerPath: z.string().trim().max(500).optional().nullable(),
});

export const seoSchema = z.object({
  title: z.string().trim().min(3).max(160),
  metaDescription: z.string().trim().max(160).optional().nullable(),
  keywords: z.string().trim().max(500).optional().nullable(),
  canonicalUrl: z.string().url().optional().nullable(),
  ogTitle: z.string().trim().max(160).optional().nullable(),
  ogDescription: z.string().trim().max(300).optional().nullable(),
  ogImagePath: z.string().trim().max(500).optional().nullable(),
  twitterCard: z.enum(["summary", "summary_large_image"]).default("summary_large_image"),
  robotsIndex: z.boolean().default(true),
});

export const landingCompanyProfileSchema = z.object({
  name: z.string().trim().min(2).max(160),
  professionalName: z.string().trim().max(160).optional().nullable(),
  specialty: z.string().trim().max(160).optional().nullable(),
  tagline: z.string().trim().max(500).optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  phone: z.string().trim().max(30).optional().nullable(),
  whatsapp: z.string().trim().max(30).optional().nullable(),
  street: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(2).optional().nullable(),
  zip: z.string().trim().max(20).optional().nullable(),
  instagram: z.string().trim().url().optional().nullable().or(z.literal("")),
  facebook: z.string().trim().url().optional().nullable().or(z.literal("")),
  linkedin: z.string().trim().url().optional().nullable().or(z.literal("")),
  website: z.string().trim().url().optional().nullable().or(z.literal("")),
  businessHours: z.string().trim().max(500).optional().nullable(),
});

export const landingPageSchema = z.object({
  title: z.string().trim().min(3).max(160),
  metaDescription: z.string().trim().max(160).optional().nullable(),
  logoPath: z.string().trim().max(500).optional().nullable(),
  avatarPath: z.string().trim().max(500).optional().nullable(),
  bannerPath: z.string().trim().max(500).optional().nullable(),
  seo: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
  published: z.boolean().default(false),
  locale: z.string().trim().min(2).max(10).default("pt-BR"),
  templateKey: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_-]{0,62}$/)
    .default("default"),
});

export const landingPageUpdateSchema = landingPageSchema.partial();

export const landingSectionSchema = z.object({
  sectionType: z.enum([
    "hero",
    "about",
    "services",
    "differentials",
    "testimonials",
    "gallery",
    "faq",
    "contact",
    "booking",
    "footer",
    "custom",
  ]),
  title: z.string().trim().max(160).optional().nullable(),
  content: z.record(z.string(), z.unknown()).default({}),
  enabled: z.boolean().default(true),
  displayOrder: z.number().int().nonnegative().default(0),
});

export const editorLandingSchema = z.object({
  hero: heroSectionSchema.optional(),
  about: aboutSectionSchema.optional(),
  services: servicesSectionSchema.optional(),
  differentials: differentialsSectionSchema.optional(),
  testimonials: testimonialsSectionSchema.optional(),
  faq: faqSectionSchema.optional(),
  cta: ctaSectionSchema.optional(),
  contact: contactSectionSchema.optional(),
  gallery: gallerySectionSchema.optional(),
  branding: brandingSchema.optional(),
  seo: seoSchema.optional(),
  published: z.boolean().optional(),
});

export const testimonialCreateSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  quote: z.string().trim().min(3).max(2000),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  photoPath: z.string().trim().max(500).optional().nullable(),
  published: z.boolean().default(false),
  displayOrder: z.number().int().nonnegative().default(0),
});

export const testimonialUpdateSchema = testimonialCreateSchema.partial();

export const testimonialIdSchema = z.uuid();

export const galleryItemCreateSchema = z.object({
  mediaAssetId: z.uuid(),
  caption: z.string().trim().max(300).optional().nullable(),
  altText: z.string().trim().max(200).optional().nullable(),
  enabled: z.boolean().default(true),
  displayOrder: z.number().int().nonnegative().default(0),
});

export const galleryItemUpdateSchema = galleryItemCreateSchema
  .omit({ mediaAssetId: true })
  .partial();

export const galleryItemIdSchema = z.uuid();

export const sectionToggleSchema = z.object({
  sectionType: landingSectionSchema.shape.sectionType,
  enabled: z.boolean(),
});

export const sectionReorderSchema = z.object({
  sectionType: landingSectionSchema.shape.sectionType,
  displayOrder: z.number().int().nonnegative(),
});

export const mediaUploadSchema = z.object({
  kind: z.enum(["logo", "avatar", "banner", "gallery", "testimonial", "service", "other"]),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  byteSize: z.number().int().positive().max(10 * 1024 * 1024),
});

export type HeroSectionInput = z.infer<typeof heroSectionSchema>;
export type AboutSectionInput = z.infer<typeof aboutSectionSchema>;
export type EditorLandingInput = z.infer<typeof editorLandingSchema>;
export type LandingPageInput = z.infer<typeof landingPageSchema>;
export type TestimonialCreateInput = z.infer<typeof testimonialCreateSchema>;
export type TestimonialUpdateInput = z.infer<typeof testimonialUpdateSchema>;
export type GalleryItemCreateInput = z.infer<typeof galleryItemCreateSchema>;
export type CtaSectionInput = z.infer<typeof ctaSectionSchema>;
export type DifferentialsSectionInput = z.infer<typeof differentialsSectionSchema>;
export type FaqSectionInput = z.infer<typeof faqSectionSchema>;
export type BrandingInput = z.infer<typeof brandingSchema>;
export type SeoInput = z.infer<typeof seoSchema>;
export type LandingCompanyProfileInput = z.infer<typeof landingCompanyProfileSchema>;
