import type { Metadata } from "next";
import type { SeoContext } from "./types";

export function buildPageMetadata(context: SeoContext): Metadata {
  const { openGraph, twitter, icons } = context;

  return {
    title: context.title,
    description: context.description,
    keywords: context.keywords,
    authors: context.author ? [{ name: context.author }] : undefined,
    publisher: context.publisher,
    category: context.category,
    alternates: { canonical: context.canonicalUrl },
    robots: context.robots,
    openGraph: {
      type: openGraph.type,
      locale: openGraph.locale,
      url: openGraph.url,
      title: openGraph.title,
      description: openGraph.description,
      siteName: openGraph.siteName,
      images: openGraph.imageUrl
        ? [{ url: openGraph.imageUrl, alt: openGraph.imageAlt }]
        : undefined,
    },
    twitter: {
      card: twitter.card,
      title: twitter.title,
      description: twitter.description,
      images: twitter.imageUrl ? [twitter.imageUrl] : undefined,
    },
    icons: {
      icon: [{ url: icons.faviconUrl }],
      ...(icons.appleTouchIconUrl ? { apple: [{ url: icons.appleTouchIconUrl }] } : {}),
    },
  };
}

export function buildUnavailableMetadata(slug: string, reason: string): Metadata {
  return {
    title: reason,
    description: "Esta página não está disponível no momento.",
    robots: { index: false, follow: false },
    alternates: undefined,
  };
}
