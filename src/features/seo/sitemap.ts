import type { MetadataRoute } from "next";
import { getAppBaseUrl, resolvePageUrl, resolveSiteUrl } from "./site-url";
import type { SitemapEntry, SitemapSourceRow } from "./types";

export function buildSitemapEntries(
  rows: SitemapSourceRow[],
  appBaseUrl: string = getAppBaseUrl(),
): SitemapEntry[] {
  return rows
    .filter((row) => row.robotsIndex)
    .map((row) => {
      const siteUrl = resolveSiteUrl({ appBaseUrl, customDomain: row.customDomain });
      const url = resolvePageUrl({
        path: row.path,
        siteUrl,
        canonicalUrl: row.canonicalUrl,
      });

      return {
        path: row.path,
        url,
        lastModified: row.publishedAt ? new Date(row.publishedAt) : new Date(),
        changeFrequency: row.changeFrequency ?? "weekly",
        priority: row.priority ?? 0.8,
      };
    });
}

export function toMetadataSitemap(entries: SitemapEntry[]): MetadataRoute.Sitemap {
  return entries.map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}

export function mergeSitemapEntries(groups: SitemapEntry[][]): SitemapEntry[] {
  const seen = new Set<string>();
  const merged: SitemapEntry[] = [];

  for (const group of groups) {
    for (const entry of group) {
      if (seen.has(entry.url)) continue;
      seen.add(entry.url);
      merged.push(entry);
    }
  }

  return merged;
}
