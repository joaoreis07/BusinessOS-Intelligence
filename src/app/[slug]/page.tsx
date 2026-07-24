import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PublicLandingPageView,
  buildLandingMetadata,
  buildUnavailableMetadata,
  resolvePublicLandingPage,
  LandingErrorPage,
  LandingInactivePage,
  LandingPreviewInvalidPage,
  LandingUnpublishedPage,
} from "@/features/landing/public";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const resolution = await resolvePublicLandingPage({
    slug,
    previewToken: query.preview,
  });

  if (resolution.status === "preview" || resolution.status === "published") {
    return buildLandingMetadata(resolution.landing);
  }
  if (resolution.status === "inactive") {
    return buildUnavailableMetadata(slug, "Empresa indisponível");
  }
  if (resolution.status === "unpublished") {
    return buildUnavailableMetadata(slug, "Página em preparação");
  }
  if (resolution.status === "preview_invalid") {
    return buildUnavailableMetadata(slug, "Preview inválido");
  }
  return buildUnavailableMetadata(slug, "Página não encontrada");
}

export default async function PublicLandingRoute({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const resolution = await resolvePublicLandingPage({
    slug,
    previewToken: query.preview,
  });

  switch (resolution.status) {
    case "preview":
    case "published":
      return <PublicLandingPageView landing={resolution.landing} />;
    case "inactive":
      return <LandingInactivePage slug={resolution.slug} />;
    case "unpublished":
      return <LandingUnpublishedPage slug={resolution.slug} />;
    case "preview_invalid":
      return <LandingPreviewInvalidPage slug={resolution.slug} />;
    case "not_found":
      notFound();
    case "error":
      return <LandingErrorPage message={resolution.message} />;
    default:
      notFound();
  }
}
