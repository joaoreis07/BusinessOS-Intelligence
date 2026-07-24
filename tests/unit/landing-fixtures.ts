import type {
  AboutSectionDTO,
  HeroSectionDTO,
  LandingSectionDTO,
  PreviewLandingDTO,
  PublicLandingDTO,
  ServicesSectionDTO,
} from "@/features/landing/types";

export const sampleBranding: PublicLandingDTO["branding"] = {
  primaryColor: "#173f7a",
  secondaryColor: "#445566",
  accentColor: "#e8f1ff",
  backgroundColor: "#ffffff",
  theme: "light",
  logoUrl: null,
  avatarUrl: null,
  bannerUrl: "https://example.supabase.co/storage/v1/object/public/company-public-media/c1/banner.png",
};

export const sampleHeroSection: HeroSectionDTO = {
  type: "hero",
  enabled: true,
  displayOrder: 10,
  title: "Bem-vindo à Clínica",
  subtitle: "Cuidado personalizado para você",
  ctaLabel: "Agendar atendimento",
  ctaHref: "/clinica-saude/agendar",
  imageUrl: sampleBranding.bannerUrl,
};

export const sampleAboutSection: AboutSectionDTO = {
  type: "about",
  enabled: true,
  displayOrder: 20,
  title: "Sobre nós",
  body: "Somos especialistas em atendimento humanizado.",
  imageUrl: null,
};

export const sampleServicesSection: ServicesSectionDTO = {
  type: "services",
  enabled: true,
  displayOrder: 30,
  title: "Serviços",
  items: [
    {
      id: "svc-1",
      name: "Consulta",
      description: "Avaliação completa",
      priceLabel: "R$ 150,00",
      durationMinutes: 30,
      imageUrl: null,
      bookingHref: "/clinica-saude/agendar?service=svc-1",
    },
  ],
};

export function buildPublicLanding(
  overrides: Partial<PublicLandingDTO> = {},
): PublicLandingDTO {
  return {
    mode: "public",
    slug: "clinica-saude",
    companyName: "Clínica Saúde",
    professionalName: "Dra. Ana",
    specialty: "Dermatologia",
    description: "Cuidado com a pele",
    biography: "Mais de 10 anos de experiência",
    customDomain: null,
    publishedAt: "2026-07-01T12:00:00.000Z",
    branding: sampleBranding,
    seo: {
      title: "Clínica Saúde",
      metaDescription: "Agende online",
      keywords: null,
      canonicalUrl: "https://app.example.com/clinica-saude",
      ogTitle: null,
      ogDescription: null,
      ogImageUrl: null,
      twitterCard: "summary_large_image",
      robotsIndex: true,
      structuredData: { "@type": "LocalBusiness", name: "Clínica Saúde" },
    },
    contacts: {
      email: "contato@clinica.com",
      phone: "+5511999999999",
      whatsapp: "+5511888888888",
      address: { city: "São Paulo", state: "SP", street: "Rua A", zip: "01000-000" },
    },
    social: {
      instagram: "https://instagram.com/clinica",
      facebook: null,
      linkedin: null,
      website: null,
    },
    sections: [sampleHeroSection, sampleAboutSection, sampleServicesSection],
    bookingHref: "/clinica-saude/agendar",
    bookingEnabled: true,
    ...overrides,
  };
}

export function buildPreviewLanding(
  overrides: Partial<PreviewLandingDTO> = {},
): PreviewLandingDTO {
  const base = buildPublicLanding();
  return {
    ...base,
    mode: "preview",
    previewExpiresAt: "2026-07-11T20:00:00.000Z",
    isPublished: false,
    seo: { ...base.seo, robotsIndex: false },
    ...overrides,
  };
}

export function buildEmptyServicesSection(): ServicesSectionDTO {
  return {
    type: "services",
    enabled: true,
    displayOrder: 30,
    title: "Serviços",
    items: [],
  };
}

export function buildUnknownSection(): LandingSectionDTO {
  return {
    type: "hero",
    enabled: true,
    displayOrder: 99,
    title: null,
    subtitle: null,
    ctaLabel: "Agendar",
    ctaHref: null,
    imageUrl: null,
  };
}
