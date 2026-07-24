"use server";

import "server-only";

import { z } from "zod";
import { AppError } from "@/lib/errors/app-error";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Json, Database } from "@/types/database.generated";
import { authenticatedContext, unwrap } from "../_shared/server";
import { normalizePhoneToE164 } from "@/lib/utils";
import {
  buildMediaObjectPath,
  mapEditorLandingDTO,
  mapPreviewLandingDTO,
  mapPublicLandingDTO,
  toAboutPersistence,
  toBrandingPersistence,
  toCtaPersistence,
  toDifferentialsPersistence,
  toFaqPersistence,
  toHeroPersistence,
  toSeoPersistence,
} from "./mappers";
import {
  aboutSectionSchema,
  brandingSchema,
  ctaSectionSchema,
  differentialsSectionSchema,
  editorLandingSchema,
  faqSectionSchema,
  galleryItemCreateSchema,
  galleryItemIdSchema,
  galleryItemUpdateSchema,
  heroSectionSchema,
  landingPageUpdateSchema,
  landingSectionSchema,
  landingCompanyProfileSchema,
  mediaUploadSchema,
  previewAccessSchema,
  previewTtlSchema,
  publicSlugSchema,
  sectionReorderSchema,
  sectionToggleSchema,
  seoSchema,
  testimonialCreateSchema,
  testimonialIdSchema,
  testimonialUpdateSchema,
} from "./schemas";
import type {
  AiIntegrationDTO,
  CrmIntegrationDTO,
  EditorLandingDTO,
  FinanceIntegrationDTO,
  MediaUploadResultDTO,
  PreviewLandingDTO,
  PreviewTokenDTO,
  PublicLandingDTO,
  SchedulingIntegrationDTO,
  TestimonialItemDTO,
} from "./types";

type SectionType = Database["public"]["Enums"]["section_type"];

function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function getSupabasePublicUrl() {
  return getPublicSupabaseEnv().NEXT_PUBLIC_SUPABASE_URL;
}

async function requireLandingManageContext() {
  return authenticatedContext("landing:manage");
}

async function getLandingPageId(companyId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  return unwrap(
    await supabase.from("landing_pages").select("id").eq("company_id", companyId).single(),
    "Landing page não encontrada.",
  ).id;
}

async function upsertSection(
  companyId: string,
  landingPageId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    sectionType: SectionType;
    title: string | null;
    content: Record<string, unknown>;
    enabled: boolean;
    displayOrder: number;
  },
) {
  return unwrap(
    await supabase
      .from("landing_sections")
      .upsert(
        {
          company_id: companyId,
          landing_page_id: landingPageId,
          section_type: input.sectionType,
          title: input.title,
          content: input.content as Json,
          enabled: input.enabled,
          display_order: input.displayOrder,
        },
        { onConflict: "landing_page_id,section_type" },
      )
      .select()
      .single(),
  );
}

// ---------------------------------------------------------------------------
// Public read
// ---------------------------------------------------------------------------

export async function getPublicLandingBySlug(slugInput: unknown): Promise<PublicLandingDTO | null> {
  const slug = publicSlugSchema.parse(slugInput);
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("public_landing_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!page) return null;

  const { data: schedulingContext } = await supabase.rpc("get_public_booking_wizard_context", {
    company_slug: slug,
  });
  const bookingEnabled =
    schedulingContext &&
    typeof schedulingContext === "object" &&
    "bookingEnabled" in schedulingContext
      ? Boolean((schedulingContext as { bookingEnabled: boolean }).bookingEnabled)
      : true;

  const [{ data: sections }, { data: services }, { data: testimonials }, { data: gallery }] =
    await Promise.all([
      supabase
        .from("public_landing_sections")
        .select("section_type, title, content, display_order")
        .eq("slug", slug)
        .order("display_order"),
      supabase.from("public_services").select("*").eq("slug", slug).order("display_order"),
      supabase.from("public_testimonials").select("*").eq("slug", slug).order("display_order"),
      supabase.from("public_landing_gallery").select("*").eq("slug", slug).order("display_order"),
    ]);

  return mapPublicLandingDTO({
    page,
    sections: sections ?? [],
    services: services ?? [],
    testimonials: testimonials ?? [],
    gallery: gallery ?? [],
    supabaseUrl: getSupabasePublicUrl(),
    appBaseUrl: getAppBaseUrl(),
    bookingEnabled,
  });
}

/** @deprecated Prefer getPublicLandingBySlug returning DTO */
export async function getPublicLandingPage(slugInput: unknown) {
  const landing = await getPublicLandingBySlug(slugInput);
  if (!landing) throw new Error("Página pública não encontrada.");
  return landing;
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

export async function createLandingPreviewToken(ttlInput?: unknown): Promise<PreviewTokenDTO> {
  const ttl = previewTtlSchema.parse(ttlInput ?? 60);
  const { companyId, supabase } = await requireLandingManageContext();
  const { data, error } = await supabase.rpc("create_landing_preview_token", {
    target_company_id: companyId,
    ttl_minutes: ttl,
  });
  if (error) throw new AppError("INTERNAL_ERROR", error.message, 500);
  const row = data?.[0];
  if (!row?.preview_token || !row.expires_at || !row.company_slug) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível gerar o preview.", 500);
  }
  const appBaseUrl = getAppBaseUrl();
  return {
    token: row.preview_token,
    expiresAt: row.expires_at,
    slug: row.company_slug,
    previewUrl: `${appBaseUrl}/${row.company_slug}?preview=${encodeURIComponent(row.preview_token)}`,
  };
}

export async function revokeLandingPreviewToken(tokenInput: unknown) {
  const token = previewAccessSchema.shape.token.parse(tokenInput);
  const { supabase } = await requireLandingManageContext();
  const { data, error } = await supabase.rpc("revoke_landing_preview_token", {
    preview_token: token,
  });
  if (error) throw new AppError("INTERNAL_ERROR", error.message, 500);
  return Boolean(data);
}

// ---------------------------------------------------------------------------

export async function getPreviewLandingBySlug(
  slugInput: unknown,
  tokenInput: unknown,
): Promise<PreviewLandingDTO | null> {
  const { slug, token } = previewAccessSchema.parse({ slug: slugInput, token: tokenInput });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_preview_landing_payload", {
    preview_token: token,
    company_slug: slug,
  });

  if (error) throw new AppError("INTERNAL_ERROR", error.message, 500);
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;

  const payload = data as Record<string, unknown>;
  const company = payload.company as Record<string, unknown> | undefined;
  const page = payload.page as Record<string, unknown> | undefined;
  const settings = payload.settings as Record<string, unknown> | undefined;
  const expiresAt = typeof payload.expires_at === "string" ? payload.expires_at : null;

  if (!company || !page || !settings || !expiresAt) return null;

  const previewPage = {
    slug,
    name: String(company.name ?? ""),
    professional_name: (company.professional_name as string | null) ?? null,
    specialty: (company.specialty as string | null) ?? null,
    description: (company.description as string | null) ?? null,
    biography: (company.biography as string | null) ?? null,
    email: (company.email as string | null) ?? null,
    phone: (company.phone as string | null) ?? null,
    whatsapp: (company.whatsapp as string | null) ?? null,
    address: (company.address as Json | null) ?? null,
    social_links: (company.social_links as Json | null) ?? null,
    title: String(page.title ?? ""),
    meta_description: (page.meta_description as string | null) ?? null,
    logo_path: (page.logo_path as string | null) ?? null,
    avatar_path: (page.avatar_path as string | null) ?? null,
    banner_path: (page.banner_path as string | null) ?? null,
    seo: (page.seo as Json) ?? {},
    custom_domain: (page.custom_domain as string | null) ?? null,
    published_at: (page.published_at as string | null) ?? null,
    primary_color: String(settings.primary_color ?? "#111111"),
    secondary_color: String(settings.secondary_color ?? "#222222"),
    accent_color: String(settings.accent_color ?? "#333333"),
    background_color: String(settings.background_color ?? "#ffffff"),
    theme: String(settings.theme ?? "light"),
    published: Boolean(page.published),
  };

  const sections = Array.isArray(payload.sections) ? payload.sections : [];
  const services = Array.isArray(payload.services) ? payload.services : [];
  const testimonials = Array.isArray(payload.testimonials) ? payload.testimonials : [];
  const gallery = Array.isArray(payload.gallery) ? payload.gallery : [];

  return mapPreviewLandingDTO(previewPage, {
    sections: sections as Parameters<typeof mapPreviewLandingDTO>[1]["sections"],
    services: services as Parameters<typeof mapPreviewLandingDTO>[1]["services"],
    testimonials: testimonials as Parameters<typeof mapPreviewLandingDTO>[1]["testimonials"],
    gallery: gallery as Parameters<typeof mapPreviewLandingDTO>[1]["gallery"],
    supabaseUrl: getSupabasePublicUrl(),
    appBaseUrl: getAppBaseUrl(),
    previewExpiresAt: expiresAt,
    isPublished: Boolean(payload.is_published),
  });
}

// ---------------------------------------------------------------------------
// Editor read/write
// ---------------------------------------------------------------------------

export async function getEditorLanding(): Promise<EditorLandingDTO> {
  const { companyId, supabase } = await requireLandingManageContext();
  const [{ data: company }, { data: page }, { data: settings }] = await Promise.all([
    supabase
      .from("companies")
      .select("slug, name, email, phone, whatsapp, address, social_links, professional_name, specialty, description")
      .eq("id", companyId)
      .single(),
    supabase.from("landing_pages").select("*").eq("company_id", companyId).single(),
    supabase
      .from("company_settings")
      .select("primary_color, secondary_color, accent_color, background_color, theme")
      .eq("company_id", companyId)
      .single(),
  ]);

  if (!company || !page || !settings) {
    throw new AppError("NOT_FOUND", "Landing page não encontrada.", 404);
  }

  const [{ data: sections }, { data: services }, { data: testimonials }, { data: gallery }] =
    await Promise.all([
      supabase
        .from("landing_sections")
        .select("section_type, title, content, display_order, enabled")
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .order("display_order"),
      supabase
        .from("services")
        .select("id, name, description, price, duration_minutes, image_path, display_order")
        .eq("company_id", companyId)
        .eq("active", true)
        .eq("publicly_visible", true)
        .is("deleted_at", null)
        .order("display_order"),
      supabase
        .from("testimonials")
        .select("id, customer_name, quote, rating, photo_path, published, display_order")
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .order("display_order"),
      supabase
        .from("landing_gallery_items")
        .select("id, caption, alt_text, display_order, enabled, media_assets(object_path)")
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .order("display_order"),
    ]);

  const galleryRows =
    gallery?.map((item) => {
      const asset = Array.isArray(item.media_assets)
        ? item.media_assets[0]
        : item.media_assets;
      return {
        id: item.id,
        object_path: asset?.object_path ?? "",
        caption: item.caption,
        alt_text: item.alt_text,
        display_order: item.display_order,
        enabled: item.enabled,
      };
    }) ?? [];

  return mapEditorLandingDTO({
    page,
    slug: company.slug,
    company,
    settings,
    sections: sections ?? [],
    services: services ?? [],
    testimonials: testimonials ?? [],
    gallery: galleryRows,
    supabaseUrl: getSupabasePublicUrl(),
    appBaseUrl: getAppBaseUrl(),
  });
}

export async function saveEditorLanding(input: unknown) {
  const payload = editorLandingSchema.parse(input);
  const { companyId, supabase } = await requireLandingManageContext();
  const landingPageId = await getLandingPageId(companyId, supabase);

  if (payload.hero) await upsertSection(companyId, landingPageId, supabase, toHeroPersistence(payload.hero));
  if (payload.about) await upsertSection(companyId, landingPageId, supabase, toAboutPersistence(payload.about));
  if (payload.differentials) {
    await upsertSection(
      companyId,
      landingPageId,
      supabase,
      toDifferentialsPersistence(payload.differentials),
    );
  }
  if (payload.faq) await upsertSection(companyId, landingPageId, supabase, toFaqPersistence(payload.faq));
  if (payload.cta) await upsertSection(companyId, landingPageId, supabase, toCtaPersistence(payload.cta));

  if (payload.branding) {
    const branding = toBrandingPersistence(payload.branding);
    await supabase.from("company_settings").update(branding.settings).eq("company_id", companyId);
    await supabase.from("landing_pages").update(branding.page).eq("company_id", companyId);
  }

  if (payload.seo) {
    const seo = toSeoPersistence(payload.seo);
    await supabase
      .from("landing_pages")
      .update({
        title: seo.title,
        meta_description: seo.meta_description,
        seo: seo.seo as Json,
      })
      .eq("company_id", companyId);
  }

  if (payload.published !== undefined) {
    await updateLandingPublishState(payload.published);
  }

  return getEditorLanding();
}

export async function updateLandingPublishState(published: boolean) {
  const { companyId, supabase } = await requireLandingManageContext();
  return unwrap(
    await supabase
      .from("landing_pages")
      .update({
        published,
        published_at: published ? new Date().toISOString() : null,
      })
      .eq("company_id", companyId)
      .select()
      .single(),
  );
}

export async function updateLandingBranding(input: unknown) {
  const payload = brandingSchema.parse(input);
  const { companyId, supabase } = await requireLandingManageContext();
  const branding = toBrandingPersistence(payload);
  await supabase.from("company_settings").update(branding.settings).eq("company_id", companyId);
  return unwrap(
    await supabase.from("landing_pages").update(branding.page).eq("company_id", companyId).select().single(),
  );
}

export async function updateLandingSeo(input: unknown) {
  const payload = seoSchema.parse(input);
  const { companyId, supabase } = await requireLandingManageContext();
  const seo = toSeoPersistence(payload);
  return unwrap(
    await supabase
      .from("landing_pages")
      .update({
        title: seo.title,
        meta_description: seo.meta_description,
        seo: seo.seo as Json,
      })
      .eq("company_id", companyId)
      .select()
      .single(),
  );
}

export async function saveLandingSection(input: unknown) {
  const value = landingSectionSchema.parse(input);
  const { companyId, supabase } = await requireLandingManageContext();
  const landingPageId = await getLandingPageId(companyId, supabase);
  return upsertSection(companyId, landingPageId, supabase, {
    sectionType: value.sectionType,
    title: value.title ?? null,
    content: value.content,
    enabled: value.enabled,
    displayOrder: value.displayOrder,
  });
}

export async function toggleLandingSection(input: unknown) {
  const payload = sectionToggleSchema.parse(input);
  const { companyId, supabase } = await requireLandingManageContext();
  return unwrap(
    await supabase
      .from("landing_sections")
      .update({ enabled: payload.enabled })
      .eq("company_id", companyId)
      .eq("section_type", payload.sectionType)
      .select()
      .single(),
  );
}

export async function reorderLandingSection(input: unknown) {
  const payload = sectionReorderSchema.parse(input);
  const { companyId, supabase } = await requireLandingManageContext();
  return unwrap(
    await supabase
      .from("landing_sections")
      .update({ display_order: payload.displayOrder })
      .eq("company_id", companyId)
      .eq("section_type", payload.sectionType)
      .select()
      .single(),
  );
}

// ---------------------------------------------------------------------------
// Testimonials CRUD
// ---------------------------------------------------------------------------

export async function listEditorTestimonials(): Promise<TestimonialItemDTO[]> {
  const editor = await getEditorLanding();
  return editor.testimonials;
}

export async function createTestimonial(input: unknown) {
  const payload = testimonialCreateSchema.parse(input);
  const { companyId, supabase } = await requireLandingManageContext();
  return unwrap(
    await supabase
      .from("testimonials")
      .insert({
        company_id: companyId,
        customer_name: payload.customerName,
        quote: payload.quote,
        rating: payload.rating ?? null,
        photo_path: payload.photoPath ?? null,
        published: payload.published,
        display_order: payload.displayOrder,
      })
      .select()
      .single(),
  );
}

export async function updateTestimonial(idInput: unknown, input: unknown) {
  const id = testimonialIdSchema.parse(idInput);
  const payload = testimonialUpdateSchema.parse(input);
  const { companyId, supabase } = await requireLandingManageContext();
  return unwrap(
    await supabase
      .from("testimonials")
      .update({
        ...(payload.customerName !== undefined && { customer_name: payload.customerName }),
        ...(payload.quote !== undefined && { quote: payload.quote }),
        ...(payload.rating !== undefined && { rating: payload.rating }),
        ...(payload.photoPath !== undefined && { photo_path: payload.photoPath }),
        ...(payload.published !== undefined && { published: payload.published }),
        ...(payload.displayOrder !== undefined && { display_order: payload.displayOrder }),
      })
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single(),
  );
}

export async function deleteTestimonial(idInput: unknown) {
  const id = testimonialIdSchema.parse(idInput);
  const { companyId, supabase } = await requireLandingManageContext();
  return unwrap(
    await supabase
      .from("testimonials")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single(),
  );
}

export async function toggleTestimonialPublished(idInput: unknown, published: boolean) {
  return updateTestimonial(idInput, { published });
}

// ---------------------------------------------------------------------------
// Gallery CRUD
// ---------------------------------------------------------------------------

export async function createGalleryItem(input: unknown) {
  const payload = galleryItemCreateSchema.parse(input);
  const { companyId, supabase } = await requireLandingManageContext();
  const landingPageId = await getLandingPageId(companyId, supabase);
  return unwrap(
    await supabase
      .from("landing_gallery_items")
      .insert({
        company_id: companyId,
        landing_page_id: landingPageId,
        media_asset_id: payload.mediaAssetId,
        caption: payload.caption ?? null,
        alt_text: payload.altText ?? null,
        enabled: payload.enabled,
        display_order: payload.displayOrder,
      })
      .select()
      .single(),
  );
}

export async function updateGalleryItem(idInput: unknown, input: unknown) {
  const id = galleryItemIdSchema.parse(idInput);
  const payload = galleryItemUpdateSchema.parse(input);
  const { companyId, supabase } = await requireLandingManageContext();
  return unwrap(
    await supabase
      .from("landing_gallery_items")
      .update({
        ...(payload.caption !== undefined && { caption: payload.caption }),
        ...(payload.altText !== undefined && { alt_text: payload.altText }),
        ...(payload.enabled !== undefined && { enabled: payload.enabled }),
        ...(payload.displayOrder !== undefined && { display_order: payload.displayOrder }),
      })
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single(),
  );
}

export async function deleteGalleryItem(idInput: unknown) {
  const id = galleryItemIdSchema.parse(idInput);
  const { companyId, supabase } = await requireLandingManageContext();
  return unwrap(
    await supabase
      .from("landing_gallery_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single(),
  );
}

// ---------------------------------------------------------------------------
// Media upload
// ---------------------------------------------------------------------------

export async function uploadLandingMedia(input: {
  kind: unknown;
  fileName: unknown;
  mimeType: unknown;
  byteSize: unknown;
  fileBase64: unknown;
}): Promise<MediaUploadResultDTO> {
  const meta = mediaUploadSchema.parse({
    kind: input.kind,
    fileName: input.fileName,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
  });
  const fileBase64 = z.string().min(1).parse(input.fileBase64);
  const { companyId, user, supabase } = await requireLandingManageContext();

  const objectPath = buildMediaObjectPath(companyId, meta.kind, meta.fileName);
  const buffer = Buffer.from(fileBase64, "base64");
  if (buffer.byteLength > meta.byteSize || buffer.byteLength > 10 * 1024 * 1024) {
    throw new AppError("VALIDATION_ERROR", "Arquivo excede o tamanho permitido.", 400);
  }
  if (!objectPath.startsWith(`${companyId}/`)) {
    throw new AppError("FORBIDDEN", "Caminho de upload inválido.", 403);
  }

  const upload = await supabase.storage
    .from("company-public-media")
    .upload(objectPath, buffer, { contentType: meta.mimeType, upsert: false });
  if (upload.error) throw new AppError("INTERNAL_ERROR", upload.error.message, 500);

  const asset = unwrap(
    await supabase
      .from("media_assets")
      .insert({
        company_id: companyId,
        object_path: objectPath,
        kind: meta.kind,
        mime_type: meta.mimeType,
        byte_size: meta.byteSize,
        created_by: user.id,
      })
      .select()
      .single(),
  );

  if (meta.kind === "logo" || meta.kind === "avatar" || meta.kind === "banner") {
    const pageUpdate =
      meta.kind === "logo"
        ? { logo_path: objectPath }
        : meta.kind === "avatar"
          ? { avatar_path: objectPath }
          : { banner_path: objectPath };
    await supabase.from("landing_pages").update(pageUpdate).eq("company_id", companyId);
  }

  const publicUrl =
    supabase.storage.from("company-public-media").getPublicUrl(objectPath).data.publicUrl;

  return {
    objectPath,
    publicUrl,
    mediaAssetId: asset.id,
    kind: meta.kind,
  };
}

// ---------------------------------------------------------------------------
// Future integration stubs
// ---------------------------------------------------------------------------

export async function getSchedulingIntegrationContext(): Promise<SchedulingIntegrationDTO> {
  const { companyId, supabase } = await authenticatedContext("company:read");
  const { data: company } = await supabase.from("companies").select("slug").eq("id", companyId).single();
  const { count } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("publicly_visible", true)
    .eq("active", true)
    .is("deleted_at", null);
  return {
    enabled: Boolean(company?.slug),
    bookingHref: company?.slug ? `/${company.slug}/agendar` : "/",
    publiclyVisibleServices: count ?? 0,
  };
}

export async function getCrmIntegrationContext(): Promise<CrmIntegrationDTO> {
  const { companyId, supabase } = await authenticatedContext("company:read");
  const { count } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .is("deleted_at", null);
  return { enabled: true, totalCustomers: count ?? 0 };
}

export async function getFinanceIntegrationContext(): Promise<FinanceIntegrationDTO> {
  const { companyId, supabase } = await authenticatedContext("company:read");
  const { data } = await supabase
    .from("financial_transactions")
    .select("amount")
    .eq("company_id", companyId)
    .eq("transaction_type", "income")
    .eq("status", "paid")
    .is("deleted_at", null);
  const total = (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  return {
    enabled: true,
    monthlyRevenueLabel: new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(total),
  };
}

export async function getAiIntegrationContext(): Promise<AiIntegrationDTO> {
  return { enabled: false, suggestionsAvailable: false };
}

// ---------------------------------------------------------------------------
// Legacy compatibility (Sprint 1/2 consumers)
// ---------------------------------------------------------------------------

export async function getLandingPage() {
  const { companyId, supabase } = await authenticatedContext("company:read");
  const result = await supabase.from("landing_pages").select("*").eq("company_id", companyId).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function listLandingSections(sectionTypes?: SectionType[]) {
  const { companyId, supabase } = await authenticatedContext("company:read");
  let query = supabase
    .from("landing_sections")
    .select("section_type, title, content")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("display_order");
  if (sectionTypes?.length) query = query.in("section_type", sectionTypes);
  return unwrap(await query);
}

export async function updateLandingPage(input: unknown) {
  const value = landingPageUpdateSchema.parse(input);
  const { companyId, supabase } = await requireLandingManageContext();
  const payload = {
    ...(value.title !== undefined && { title: value.title }),
    ...(value.metaDescription !== undefined && { meta_description: value.metaDescription }),
    ...(value.logoPath !== undefined && { logo_path: value.logoPath }),
    ...(value.avatarPath !== undefined && { avatar_path: value.avatarPath }),
    ...(value.bannerPath !== undefined && { banner_path: value.bannerPath }),
    ...(value.seo !== undefined && { seo: value.seo as Json }),
    ...(value.locale !== undefined && { locale: value.locale }),
    ...(value.templateKey !== undefined && { template_key: value.templateKey }),
    ...(value.published !== undefined && {
      published: value.published,
      published_at: value.published ? new Date().toISOString() : null,
    }),
  };
  return unwrap(
    await supabase.from("landing_pages").update(payload).eq("company_id", companyId).select().single(),
  );
}

export async function saveHeroSection(input: unknown) {
  const payload = heroSectionSchema.parse(input);
  return saveLandingSection(toHeroPersistence(payload));
}

export async function saveAboutSection(input: unknown) {
  const payload = aboutSectionSchema.parse(input);
  return saveLandingSection(toAboutPersistence(payload));
}

export async function saveDifferentialsSection(input: unknown) {
  const payload = differentialsSectionSchema.parse(input);
  return saveLandingSection(toDifferentialsPersistence(payload));
}

export async function saveFaqSection(input: unknown) {
  const payload = faqSectionSchema.parse(input);
  return saveLandingSection(toFaqPersistence(payload));
}

export async function saveCtaSection(input: unknown) {
  const payload = ctaSectionSchema.parse(input);
  return saveLandingSection(toCtaPersistence(payload));
}

export async function updateLandingCompanyProfile(input: unknown) {
  const payload = landingCompanyProfileSchema.parse(input);
  const { companyId, supabase } = await requireLandingManageContext();
  const landingPageId = await getLandingPageId(companyId, supabase);

  const current = unwrap(
    await supabase.from("companies").select("address").eq("id", companyId).single(),
  );
  const currentAddress = (current.address ?? {}) as Record<string, string | null>;

  await supabase
    .from("companies")
    .update({
      name: payload.name,
      professional_name: payload.professionalName ?? null,
      specialty: payload.specialty ?? null,
      description: payload.tagline ?? null,
      email: payload.email || null,
      phone: payload.phone ? normalizePhoneToE164(payload.phone) : null,
      whatsapp: payload.whatsapp ? normalizePhoneToE164(payload.whatsapp) : null,
      address: {
        ...currentAddress,
        street: payload.street ?? currentAddress.street ?? null,
        city: payload.city ?? currentAddress.city ?? null,
        state: payload.state ? payload.state.toUpperCase() : currentAddress.state ?? null,
        zip: payload.zip ?? currentAddress.zip ?? null,
      },
      social_links: {
        instagram: payload.instagram || null,
        facebook: payload.facebook || null,
        linkedin: payload.linkedin || null,
        website: payload.website || null,
      },
    })
    .eq("id", companyId);

  if (payload.businessHours !== undefined) {
    await upsertSection(companyId, landingPageId, supabase, {
      sectionType: "contact",
      title: "Contato",
      content: { businessHours: payload.businessHours },
      enabled: true,
      displayOrder: 55,
    });
  }

  return getEditorLanding();
}

export async function unpublishLanding() {
  return updateLandingPublishState(false);
}

export async function removeLandingMediaPath(
  field: "logoPath" | "avatarPath" | "bannerPath",
) {
  const { companyId, supabase } = await requireLandingManageContext();
  const pageUpdate =
    field === "logoPath"
      ? { logo_path: null }
      : field === "avatarPath"
        ? { avatar_path: null }
        : { banner_path: null };
  return unwrap(
    await supabase.from("landing_pages").update(pageUpdate).eq("company_id", companyId).select().single(),
  );
}
