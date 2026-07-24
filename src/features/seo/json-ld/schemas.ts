import type { JsonLdNode, SeoContext, SeoFaqItemInput } from "../types";

export function buildWebSiteSchema(context: SeoContext): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": `${context.siteUrl}/#website`,
    url: context.siteUrl,
    name: context.openGraph.siteName,
    description: context.description,
    inLanguage: context.locale.replace("_", "-"),
    publisher: { "@id": `${context.siteUrl}/#organization` },
  };
}

export function buildOrganizationSchema(context: SeoContext): JsonLdNode {
  const { contacts, social } = context.input;

  return {
    "@type": "Organization",
    "@id": `${context.siteUrl}/#organization`,
    name: context.openGraph.siteName,
    url: context.pageUrl,
    logo: context.input.branding.logoUrl ?? undefined,
    email: contacts?.email ?? undefined,
    telephone: contacts?.phone ?? contacts?.whatsapp ?? undefined,
    sameAs: [
      social?.instagram,
      social?.facebook,
      social?.linkedin,
      social?.website,
    ].filter((value): value is string => Boolean(value)),
  };
}

export function buildLocalBusinessSchema(context: SeoContext): JsonLdNode {
  const { contacts } = context.input;
  const { structuredData } = context;
  const schemaType = structuredData.schemaType ?? "LocalBusiness";
  const address = contacts?.address;

  return {
    "@type": schemaType,
    "@id": `${context.pageUrl}#business`,
    name: context.openGraph.siteName,
    description: context.description,
    url: context.pageUrl,
    image: context.openGraph.imageUrl,
    email: contacts?.email ?? undefined,
    telephone: contacts?.phone ?? contacts?.whatsapp ?? undefined,
    address:
      address?.city || address?.street
        ? {
            "@type": "PostalAddress",
            streetAddress: address.street ?? undefined,
            addressLocality: address.city ?? undefined,
            addressRegion: address.state ?? undefined,
            postalCode: address.zip ?? undefined,
            addressCountry: address.country ?? "BR",
          }
        : undefined,
    parentOrganization: { "@id": `${context.siteUrl}/#organization` },
    ...(structuredData.bookingHref
      ? {
          potentialAction: {
            "@type": "ReserveAction",
            target: `${context.siteUrl}${structuredData.bookingHref}`,
          },
        }
      : {}),
    ...(context.keywords ? { keywords: context.keywords } : {}),
  };
}

export function buildBreadcrumbListSchema(context: SeoContext): JsonLdNode {
  const items = context.structuredData.breadcrumbs?.length
    ? context.structuredData.breadcrumbs
    : [
        { name: context.openGraph.siteName, url: context.pageUrl },
        { name: context.title, url: context.pageUrl },
      ];

  return {
    "@type": "BreadcrumbList",
    "@id": `${context.pageUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildFaqPageSchema(
  context: SeoContext,
  faqItems: SeoFaqItemInput[] = context.structuredData.faqItems ?? [],
): JsonLdNode | null {
  if (!faqItems.length) return null;

  return {
    "@type": "FAQPage",
    "@id": `${context.pageUrl}#faq`,
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildArticleSchema(context: SeoContext): JsonLdNode | null {
  if (context.kind !== "article" && context.kind !== "blog-article") return null;

  return {
    "@type": "Article",
    "@id": `${context.pageUrl}#article`,
    headline: context.title,
    description: context.description,
    author: context.author ? { "@type": "Person", name: context.author } : undefined,
    publisher: { "@id": `${context.siteUrl}/#organization` },
    image: context.openGraph.imageUrl,
    mainEntityOfPage: context.pageUrl,
    inLanguage: context.locale.replace("_", "-"),
  };
}
