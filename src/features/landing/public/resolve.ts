import "server-only";

import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { AppError } from "@/lib/errors/app-error";
import { createClient } from "@/lib/supabase/server";
import { previewAccessSchema, publicSlugSchema } from "../schemas";
import { getPreviewLandingBySlug, getPublicLandingBySlug } from "../server";
import type { PublicSitemapSourceRow } from "../seo/adapter";
import type { PublicLandingResolution, PublicSlugStatus } from "./types";

export type { PublicSlugStatus, PublicLandingResolution } from "./types";

async function resolvePublicLandingPageImpl(
  slug: string,
  previewToken: string | null,
): Promise<PublicLandingResolution> {
  try {
    if (previewToken) {
      noStore();
      previewAccessSchema.parse({ slug, token: previewToken });
      const preview = await getPreviewLandingBySlug(slug, previewToken);
      if (!preview) {
        return { status: "preview_invalid", slug };
      }
      return { status: "preview", landing: preview };
    }

    const landing = await getPublicLandingBySlug(slug);
    if (landing) {
      return { status: "published", landing };
    }

    const slugStatus = await getPublicSlugStatus(slug);
    if (slugStatus === "inactive") {
      return { status: "inactive", slug };
    }
    if (slugStatus === "unpublished") {
      return { status: "unpublished", slug };
    }
    return { status: "not_found", slug };
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return { status: "preview_invalid", slug };
    }
    return {
      status: "error",
      slug,
      message: error instanceof Error ? error.message : "Erro inesperado.",
    };
  }
}

const resolvePublicLandingPageCached = cache(resolvePublicLandingPageImpl);

export async function resolvePublicLandingPage(input: {
  slug: unknown;
  previewToken?: unknown;
}): Promise<PublicLandingResolution> {
  try {
    const slug = publicSlugSchema.parse(input.slug);
    const previewToken =
      typeof input.previewToken === "string" && input.previewToken.trim()
        ? input.previewToken.trim()
        : null;
    return resolvePublicLandingPageCached(slug, previewToken);
  } catch (error) {
    return {
      status: "error",
      slug: typeof input.slug === "string" ? input.slug : "",
      message: error instanceof Error ? error.message : "Slug inválido.",
    };
  }
}

export async function getPublicSlugStatus(slugInput: unknown): Promise<PublicSlugStatus> {
  const slug = publicSlugSchema.parse(slugInput);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_slug_status", {
    company_slug: slug,
  });
  if (error) {
    if (error.code === "PGRST202") {
      throw new AppError(
        "INTERNAL_ERROR",
        "Banco de dados ainda não foi inicializado. Aplique as migrations do Supabase.",
      );
    }
    return "not_found";
  }
  const status = data as PublicSlugStatus;
  if (
    status === "not_found" ||
    status === "inactive" ||
    status === "unpublished" ||
    status === "published"
  ) {
    return status;
  }
  return "not_found";
}

export async function listPublicLandingSlugs(): Promise<string[]> {
  const rows = await listPublicSitemapSourceRows();
  return rows.map((row) => row.slug);
}

export async function listPublicSitemapSourceRows(): Promise<PublicSitemapSourceRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_landing_pages")
    .select("slug, published_at, custom_domain, seo");

  return (data ?? []).map((row) => {
    const seo =
      row.seo && typeof row.seo === "object" && !Array.isArray(row.seo)
        ? (row.seo as Record<string, unknown>)
        : {};
    const canonicalUrl = typeof seo.canonicalUrl === "string" ? seo.canonicalUrl : null;
    const robotsIndex = seo.robotsIndex !== false;

    return {
      slug: row.slug,
      publishedAt: row.published_at ?? null,
      customDomain: row.custom_domain ?? null,
      canonicalUrl,
      robotsIndex,
    };
  });
}
