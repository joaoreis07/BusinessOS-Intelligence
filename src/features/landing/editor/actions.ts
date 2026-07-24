"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toSafeError } from "@/lib/errors/app-error";
import {
  aboutSectionSchema,
  brandingSchema,
  ctaSectionSchema,
  contactSectionSchema,
  faqSectionSchema,
  galleryItemCreateSchema,
  galleryItemIdSchema,
  galleryItemUpdateSchema,
  gallerySectionSchema,
  heroSectionSchema,
  landingCompanyProfileSchema,
  seoSchema,
  servicesSectionSchema,
  testimonialsSectionSchema,
  testimonialCreateSchema,
  testimonialIdSchema,
  testimonialUpdateSchema,
  sectionToggleSchema,
} from "../schemas";
import {
  createGalleryItem,
  createLandingPreviewToken,
  createTestimonial,
  deleteGalleryItem,
  deleteTestimonial,
  removeLandingMediaPath,
  revokeLandingPreviewToken,
  saveAboutSection,
  saveCtaSection,
  saveFaqSection,
  saveHeroSection,
  saveLandingSection,
  toggleLandingSection,
  toggleTestimonialPublished,
  unpublishLanding,
  updateGalleryItem,
  updateLandingBranding,
  updateLandingCompanyProfile,
  updateLandingPublishState,
  updateLandingSeo,
  updateTestimonial,
  uploadLandingMedia,
} from "../server";
import type { EditorActionState } from "./types";

function revalidateLandingPaths(slug: string) {
  revalidatePath("/dashboard/landing");
  revalidatePath(`/${slug}`);
}

function actionError(error: unknown): EditorActionState {
  return { error: toSafeError(error).message };
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function saveHeroDraftAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const payload = heroSectionSchema.parse({
      title: formData.get("title") || null,
      subtitle: formData.get("subtitle") || null,
      ctaLabel: formData.get("ctaLabel") || undefined,
      enabled: parseBoolean(formData.get("enabled")),
      displayOrder: parseOptionalNumber(formData.get("displayOrder")) ?? 10,
    });
    await saveHeroSection(payload);
    const slug = String(formData.get("slug") ?? "");
    revalidateLandingPaths(slug);
    return { success: "Hero salvo como rascunho." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveAboutDraftAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const payload = aboutSectionSchema.parse({
      title: formData.get("title") || null,
      body: formData.get("body") || null,
      enabled: parseBoolean(formData.get("enabled")),
      displayOrder: parseOptionalNumber(formData.get("displayOrder")) ?? 20,
    });
    await saveAboutSection(payload);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Sobre salvo como rascunho." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveServicesSectionAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const payload = servicesSectionSchema.parse({
      title: formData.get("title") || null,
      enabled: parseBoolean(formData.get("enabled")),
      displayOrder: parseOptionalNumber(formData.get("displayOrder")) ?? 30,
    });
    await saveLandingSection({
      sectionType: "services",
      title: payload.title,
      content: {},
      enabled: payload.enabled,
      displayOrder: payload.displayOrder,
    });
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Seção de serviços atualizada." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveFaqDraftAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const rawItems = formData.get("items");
    const items =
      typeof rawItems === "string" && rawItems.trim()
        ? z
            .array(
              z.object({
                question: z.string().trim().min(5).max(200),
                answer: z.string().trim().min(5).max(2000),
              }),
            )
            .parse(JSON.parse(rawItems))
        : [];
    const payload = faqSectionSchema.parse({
      title: formData.get("title") || null,
      items,
      enabled: parseBoolean(formData.get("enabled")),
      displayOrder: parseOptionalNumber(formData.get("displayOrder")) ?? 45,
    });
    await saveFaqSection(payload);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "FAQ salvo como rascunho." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveCtaDraftAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const payload = ctaSectionSchema.parse({
      title: formData.get("title") || null,
      subtitle: formData.get("subtitle") || null,
      buttonLabel: formData.get("buttonLabel") || undefined,
      enabled: parseBoolean(formData.get("enabled")),
      displayOrder: parseOptionalNumber(formData.get("displayOrder")) ?? 50,
    });
    await saveCtaSection(payload);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "CTA salvo como rascunho." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveContactSectionAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const payload = contactSectionSchema.parse({
      title: formData.get("title") || null,
      enabled: parseBoolean(formData.get("enabled")),
      displayOrder: parseOptionalNumber(formData.get("displayOrder")) ?? 55,
    });
    await saveLandingSection({
      sectionType: "contact",
      title: payload.title,
      content: {},
      enabled: payload.enabled,
      displayOrder: payload.displayOrder,
    });
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Seção de contato atualizada." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveGallerySectionAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const payload = gallerySectionSchema.parse({
      title: formData.get("title") || null,
      enabled: parseBoolean(formData.get("enabled")),
      displayOrder: parseOptionalNumber(formData.get("displayOrder")) ?? 38,
    });
    await saveLandingSection({
      sectionType: "gallery",
      title: payload.title,
      content: {},
      enabled: payload.enabled,
      displayOrder: payload.displayOrder,
    });
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Seção de galeria atualizada." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveTestimonialsSectionAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const payload = testimonialsSectionSchema.parse({
      title: formData.get("title") || null,
      enabled: parseBoolean(formData.get("enabled")),
      displayOrder: parseOptionalNumber(formData.get("displayOrder")) ?? 40,
    });
    await saveLandingSection({
      sectionType: "testimonials",
      title: payload.title,
      content: {},
      enabled: payload.enabled,
      displayOrder: payload.displayOrder,
    });
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Seção de depoimentos atualizada." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveBrandingDraftAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const payload = brandingSchema.parse({
      primaryColor: formData.get("primaryColor"),
      secondaryColor: formData.get("secondaryColor"),
      accentColor: formData.get("accentColor"),
      backgroundColor: formData.get("backgroundColor"),
      theme: formData.get("theme") || "light",
      logoPath: formData.get("logoPath") || null,
      avatarPath: formData.get("avatarPath") || null,
      bannerPath: formData.get("bannerPath") || null,
    });
    await updateLandingBranding(payload);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Branding salvo como rascunho." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveSeoDraftAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const payload = seoSchema.parse({
      title: formData.get("title"),
      metaDescription: formData.get("metaDescription") || null,
      keywords: formData.get("keywords") || null,
      canonicalUrl: formData.get("canonicalUrl") || null,
      ogTitle: formData.get("ogTitle") || null,
      ogDescription: formData.get("ogDescription") || null,
      ogImagePath: formData.get("ogImagePath") || null,
      twitterCard: formData.get("twitterCard") || "summary_large_image",
      robotsIndex: parseBoolean(formData.get("robotsIndex")),
    });
    await updateLandingSeo(payload);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "SEO salvo como rascunho." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveCompanyProfileDraftAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const payload = landingCompanyProfileSchema.parse({
      name: formData.get("name"),
      professionalName: formData.get("professionalName") || null,
      specialty: formData.get("specialty") || null,
      tagline: formData.get("tagline") || null,
      email: formData.get("email") || null,
      phone: formData.get("phone") || null,
      whatsapp: formData.get("whatsapp") || null,
      street: formData.get("street") || null,
      city: formData.get("city") || null,
      state: formData.get("state") || null,
      zip: formData.get("zip") || null,
      instagram: formData.get("instagram") || null,
      facebook: formData.get("facebook") || null,
      linkedin: formData.get("linkedin") || null,
      website: formData.get("website") || null,
      businessHours: formData.get("businessHours") || null,
    });
    await updateLandingCompanyProfile(payload);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Perfil da empresa salvo como rascunho." };
  } catch (error) {
    return actionError(error);
  }
}

export async function toggleSectionAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const payload = sectionToggleSchema.parse({
      sectionType: formData.get("sectionType"),
      enabled: parseBoolean(formData.get("enabled")),
    });
    await toggleLandingSection(payload);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: payload.enabled ? "Seção ativada." : "Seção desativada." };
  } catch (error) {
    return actionError(error);
  }
}

export async function createPreviewAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const ttl = parseOptionalNumber(formData.get("ttlMinutes")) ?? 60;
    const preview = await createLandingPreviewToken(ttl);
    return {
      success: "Preview gerado com sucesso.",
      previewUrl: preview.previewUrl,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function revokePreviewAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const token = String(formData.get("token") ?? "");
    await revokeLandingPreviewToken(token);
    return { success: "Preview revogado." };
  } catch (error) {
    return actionError(error);
  }
}

export async function publishLandingAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    await updateLandingPublishState(true);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Landing publicada com sucesso." };
  } catch (error) {
    return actionError(error);
  }
}

export async function unpublishLandingAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    await unpublishLanding();
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Landing despublicada. O rascunho foi preservado." };
  } catch (error) {
    return actionError(error);
  }
}

export async function uploadMediaAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const result = await uploadLandingMedia({
      kind: formData.get("kind"),
      fileName: formData.get("fileName"),
      mimeType: formData.get("mimeType"),
      byteSize: Number(formData.get("byteSize")),
      fileBase64: formData.get("fileBase64"),
    });
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return {
      success: "Upload concluído.",
      mediaAssetId: result.mediaAssetId,
      objectPath: result.objectPath,
      publicUrl: result.publicUrl,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeMediaAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const field = z.enum(["logoPath", "avatarPath", "bannerPath"]).parse(formData.get("field"));
    await removeLandingMediaPath(field);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Mídia removida." };
  } catch (error) {
    return actionError(error);
  }
}

export async function createTestimonialAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const payload = testimonialCreateSchema.parse({
      customerName: formData.get("customerName"),
      quote: formData.get("quote"),
      rating: parseOptionalNumber(formData.get("rating")) ?? null,
      photoPath: formData.get("photoPath") || null,
      published: parseBoolean(formData.get("published")),
      displayOrder: parseOptionalNumber(formData.get("displayOrder")) ?? 0,
    });
    await createTestimonial(payload);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Depoimento adicionado." };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateTestimonialAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const id = testimonialIdSchema.parse(formData.get("id"));
    const payload = testimonialUpdateSchema.parse({
      customerName: formData.get("customerName") || undefined,
      quote: formData.get("quote") || undefined,
      rating: parseOptionalNumber(formData.get("rating")),
      photoPath: formData.get("photoPath") || undefined,
      published:
        formData.get("published") === null ? undefined : parseBoolean(formData.get("published")),
      displayOrder: parseOptionalNumber(formData.get("displayOrder")),
    });
    await updateTestimonial(id, payload);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Depoimento atualizado." };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteTestimonialAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const id = testimonialIdSchema.parse(formData.get("id"));
    await deleteTestimonial(id);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Depoimento removido." };
  } catch (error) {
    return actionError(error);
  }
}

export async function toggleTestimonialAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const id = testimonialIdSchema.parse(formData.get("id"));
    const published = parseBoolean(formData.get("published"));
    await toggleTestimonialPublished(id, published);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: published ? "Depoimento publicado." : "Depoimento ocultado." };
  } catch (error) {
    return actionError(error);
  }
}

export async function createGalleryItemAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const payload = galleryItemCreateSchema.parse({
      mediaAssetId: formData.get("mediaAssetId"),
      caption: formData.get("caption") || null,
      altText: formData.get("altText") || null,
      enabled: parseBoolean(formData.get("enabled")),
      displayOrder: parseOptionalNumber(formData.get("displayOrder")) ?? 0,
    });
    await createGalleryItem(payload);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Item adicionado à galeria." };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateGalleryItemAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const id = galleryItemIdSchema.parse(formData.get("id"));
    const payload = galleryItemUpdateSchema.parse({
      caption: formData.get("caption") || undefined,
      altText: formData.get("altText") || undefined,
      enabled: formData.get("enabled") === null ? undefined : parseBoolean(formData.get("enabled")),
      displayOrder: parseOptionalNumber(formData.get("displayOrder")),
    });
    await updateGalleryItem(id, payload);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Item da galeria atualizado." };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteGalleryItemAction(
  _: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  try {
    const id = galleryItemIdSchema.parse(formData.get("id"));
    await deleteGalleryItem(id);
    revalidateLandingPaths(String(formData.get("slug") ?? ""));
    return { success: "Item removido da galeria." };
  } catch (error) {
    return actionError(error);
  }
}
