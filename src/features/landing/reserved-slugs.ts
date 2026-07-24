export const RESERVED_PUBLIC_SLUGS = [
  "login",
  "cadastro",
  "dashboard",
  "admin",
  "onboarding",
  "api",
  "auth",
  "preview",
  "convite",
  "recuperar-senha",
  "redefinir-senha",
  "agendar",
  "www",
  "app",
  "static",
  "public",
  "health",
  "webhooks",
  "_next",
] as const;

export type ReservedPublicSlug = (typeof RESERVED_PUBLIC_SLUGS)[number];

export function isReservedPublicSlug(slug: string) {
  return RESERVED_PUBLIC_SLUGS.includes(slug.toLowerCase() as ReservedPublicSlug);
}
