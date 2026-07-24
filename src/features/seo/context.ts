import { buildRobotsDirective } from "./robots";
import { resolvePageIcons } from "./icons";
import { resolvePageUrl, resolveSiteUrl } from "./site-url";
import type { SeoContext, SeoPageInput } from "./types";

export function buildSeoContext(input: SeoPageInput): SeoContext {
  const isPreview = Boolean(input.indexing.isPreview);
  const siteUrl = resolveSiteUrl({
    customDomain: input.tenant.customDomain ?? null,
  });
  const canonicalUrl = resolvePageUrl({
    path: input.page.path,
    siteUrl,
    canonicalUrl: input.page.canonicalUrl,
  });
  const pageUrl = canonicalUrl;
  const locale = input.page.locale ?? "pt_BR";

  const title = input.openGraph.title ?? input.page.title;
  const description = input.openGraph.description ?? input.page.description ?? undefined;
  const imageUrl =
    input.openGraph.imageUrl ?? input.branding.bannerUrl ?? input.branding.logoUrl ?? undefined;
  const siteName = input.openGraph.siteName ?? input.tenant.name;
  const structuredData = input.structuredData ?? {};

  return {
    input,
    kind: input.kind,
    isPreview,
    isIndexable: !isPreview && input.indexing.robotsIndex,
    siteUrl,
    pageUrl,
    canonicalUrl,
    title,
    description,
    keywords: input.page.keywords ?? undefined,
    author: input.page.author ?? undefined,
    publisher: input.page.publisher ?? undefined,
    category: input.page.category ?? undefined,
    locale,
    structuredData,
    openGraph: {
      title,
      description,
      imageUrl,
      imageAlt: title,
      type: input.openGraph.type ?? "website",
      url: pageUrl,
      siteName,
      locale,
    },
    twitter: {
      card: input.twitter.card ?? "summary_large_image",
      title,
      description,
      imageUrl,
    },
    icons: resolvePageIcons(input.branding),
    robots: buildRobotsDirective({
      isPreview,
      robotsIndex: input.indexing.robotsIndex,
    }),
  };
}
