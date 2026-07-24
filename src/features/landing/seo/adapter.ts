import type { PreviewLandingDTO, PublicLandingDTO } from "../types";
import {
  buildPageJsonLdGraph,
  buildPageMetadata,
  buildSeoContext,
  buildSitemapEntries,
  pickPrimaryJsonLdNode,
  type SeoPageInput,
} from "@/features/seo";

export type LandingPageDTO = PublicLandingDTO | PreviewLandingDTO;

function findFaqItems(landing: LandingPageDTO) {
  const section = landing.sections.find((item) => item.type === "faq");
  if (section?.type !== "faq" || !section.enabled) return [];
  return section.items.map((item) => ({
    question: item.question,
    answer: item.answer,
  }));
}

export function toLandingSeoInput(landing: LandingPageDTO): SeoPageInput {
  const { seo, branding, companyName, professionalName, specialty, contacts, social } = landing;
  const pageUrlPath = `/${landing.slug}`;

  return {
    kind: "landing",
    tenant: {
      name: companyName,
      slug: landing.slug,
      customDomain: landing.customDomain ?? null,
    },
    page: {
      path: pageUrlPath,
      canonicalUrl: seo.canonicalUrl,
      title: seo.title,
      description: seo.metaDescription,
      keywords: seo.keywords,
      author: professionalName ?? companyName,
      publisher: companyName,
      category: specialty,
      locale: "pt_BR",
    },
    indexing: {
      isPreview: landing.mode === "preview",
      robotsIndex: seo.robotsIndex,
    },
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      imageUrl: seo.ogImageUrl ?? branding.bannerUrl ?? branding.logoUrl,
      type: "website",
      siteName: companyName,
    },
    twitter: {
      card: seo.twitterCard,
    },
    branding: {
      logoUrl: branding.logoUrl,
      bannerUrl: branding.bannerUrl,
    },
    contacts: {
      email: contacts.email,
      phone: contacts.phone,
      whatsapp: contacts.whatsapp,
      address: {
        street: contacts.address.street,
        city: contacts.address.city,
        state: contacts.address.state,
        zip: contacts.address.zip,
        country: "BR",
      },
    },
    social,
    structuredData: {
      schemaType:
        typeof seo.structuredData["@type"] === "string"
          ? seo.structuredData["@type"]
          : "LocalBusiness",
      bookingHref: landing.bookingHref,
      faqItems: findFaqItems(landing),
    },
  };
}

export function buildLandingSeoContext(landing: LandingPageDTO) {
  return buildSeoContext(toLandingSeoInput(landing));
}

export function buildLandingMetadata(landing: LandingPageDTO) {
  return buildPageMetadata(buildLandingSeoContext(landing));
}

export function buildLandingJsonLdGraph(landing: LandingPageDTO) {
  return buildPageJsonLdGraph(buildLandingSeoContext(landing));
}

/** @deprecated Use buildLandingJsonLdGraph for multi-schema output */
export function buildLandingJsonLd(landing: LandingPageDTO) {
  const graph = buildLandingJsonLdGraph(landing);
  const schemaType =
    typeof landing.seo.structuredData["@type"] === "string"
      ? landing.seo.structuredData["@type"]
      : "LocalBusiness";
  return pickPrimaryJsonLdNode(graph, schemaType) ?? graph["@graph"][0];
}

export type PublicSitemapSourceRow = {
  slug: string;
  publishedAt: string | null;
  customDomain: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean;
};

export function buildLandingSitemapEntries(
  rows: PublicSitemapSourceRow[],
  appBaseUrl?: string,
) {
  return buildSitemapEntries(
    rows.map((row) => ({
      path: `/${row.slug}`,
      publishedAt: row.publishedAt,
      customDomain: row.customDomain,
      canonicalUrl: row.canonicalUrl,
      robotsIndex: row.robotsIndex,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
    appBaseUrl,
  );
}
