const DEFAULT_APP_BASE_URL = "http://localhost:3000";

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_BASE_URL;
}

export function normalizeSiteUrl(url: string) {
  return url.replace(/\/$/, "");
}

export function resolveSiteUrl(input: {
  appBaseUrl?: string;
  customDomain?: string | null;
}) {
  const appBase = normalizeSiteUrl(input.appBaseUrl ?? getAppBaseUrl());
  if (!input.customDomain?.trim()) return appBase;

  const domain = input.customDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  return domain.includes("://") ? domain : `https://${domain}`;
}

export function resolvePageUrl(input: {
  path: string;
  siteUrl: string;
  canonicalUrl?: string | null;
}) {
  if (input.canonicalUrl?.trim()) return input.canonicalUrl.trim();

  const normalizedPath = input.path.startsWith("/") ? input.path : `/${input.path}`;
  return `${normalizeSiteUrl(input.siteUrl)}${normalizedPath}`;
}
