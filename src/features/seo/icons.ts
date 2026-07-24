export const DEFAULT_FAVICON_PATH = "/favicon.ico";

export function resolvePageIcons(input: { logoUrl?: string | null }) {
  const customLogo = input.logoUrl?.trim() || null;

  return {
    faviconUrl: customLogo ?? DEFAULT_FAVICON_PATH,
    appleTouchIconUrl: customLogo,
    isCustom: Boolean(customLogo),
  };
}
