import type { MetadataRoute } from "next";
import {
  buildLandingSitemapEntries,
  getAppBaseUrl,
  toMetadataSitemap,
} from "@/features/landing/seo";
import { listPublicSitemapSourceRows } from "@/features/landing/public/resolve";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await listPublicSitemapSourceRows();
  const entries = buildLandingSitemapEntries(rows, getAppBaseUrl());
  return toMetadataSitemap(entries);
}
