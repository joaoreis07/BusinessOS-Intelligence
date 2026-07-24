import { describe, expect, it } from "vitest";
import {
  buildMediaObjectPath,
  buildPublicMediaUrl,
  mapBranding,
  mapContacts,
  mapPreviewLandingDTO,
  mapPublicLandingDTO,
  mapSeo,
  mapTestimonialItem,
  toAboutPersistence,
  toBrandingPersistence,
  toHeroPersistence,
  toSeoPersistence,
} from "@/features/landing/mappers";

const SUPABASE_URL = "https://example.supabase.co";
const APP_BASE_URL = "https://app.example.com";

const basePage = {
  slug: "clinica-saude",
  name: "Clínica Saúde",
  professional_name: "Dra. Ana",
  specialty: "Dermatologia",
  description: "Cuidado com a pele",
  biography: "Mais de 10 anos de experiência",
  email: "contato@clinica.com",
  phone: "+5511999999999",
  whatsapp: "+5511888888888",
  address: { city: "São Paulo", state: "SP", street: "Rua A", zip: "01000-000" },
  social_links: { instagram: "https://instagram.com/clinica" },
  title: "Clínica Saúde | Dermatologia",
  meta_description: "Agende sua consulta",
  logo_path: "c1/logo.png",
  avatar_path: "c1/avatar.png",
  banner_path: "c1/banner.png",
  seo: { ogTitle: "Clínica Saúde" },
  primary_color: "#112233",
  secondary_color: "#445566",
  accent_color: "#778899",
  background_color: "#FFFFFF",
  theme: "light",
};

describe("landing mappers", () => {
  describe("buildPublicMediaUrl", () => {
    it("builds public storage url", () => {
      expect(buildPublicMediaUrl(SUPABASE_URL, "c1/logo.png")).toBe(
        "https://example.supabase.co/storage/v1/object/public/company-public-media/c1/logo.png",
      );
    });

    it("returns null for empty path", () => {
      expect(buildPublicMediaUrl(SUPABASE_URL, null)).toBeNull();
    });
  });

  describe("buildMediaObjectPath", () => {
    it("scopes uploads by company and kind", () => {
      const path = buildMediaObjectPath(
        "550e8400-e29b-41d4-a716-446655440000",
        "logo",
        "My Logo.PNG",
      );
      expect(path).toMatch(
        /^550e8400-e29b-41d4-a716-446655440000\/logo\/\d+-my-logo\.png$/,
      );
    });
  });

  describe("mapContacts", () => {
    it("maps address json safely", () => {
      const contacts = mapContacts(basePage);
      expect(contacts.email).toBe("contato@clinica.com");
      expect(contacts.address.city).toBe("São Paulo");
    });

    it("handles missing address", () => {
      const contacts = mapContacts({ ...basePage, address: null });
      expect(contacts.address.city).toBeNull();
    });
  });

  describe("mapBranding", () => {
    it("maps branding with media urls", () => {
      const branding = mapBranding(basePage, SUPABASE_URL);
      expect(branding.primaryColor).toBe("#112233");
      expect(branding.logoUrl).toContain("c1/logo.png");
    });
  });

  describe("mapSeo", () => {
    it("sets robotsIndex true when published", () => {
      const seo = mapSeo(basePage, basePage.slug, APP_BASE_URL, SUPABASE_URL, true);
      expect(seo.robotsIndex).toBe(true);
      expect(seo.canonicalUrl).toBe(`${APP_BASE_URL}/${basePage.slug}`);
    });

    it("sets robotsIndex false when unpublished", () => {
      const seo = mapSeo(basePage, basePage.slug, APP_BASE_URL, SUPABASE_URL, false);
      expect(seo.robotsIndex).toBe(false);
    });
  });

  describe("mapPublicLandingDTO", () => {
    it("maps view rows into public DTO", () => {
      const dto = mapPublicLandingDTO({
        page: basePage,
        sections: [
          {
            section_type: "hero",
            title: "Bem-vindo",
            content: { subtitle: "Cuide da sua pele", cta: "Agendar" },
            display_order: 10,
          },
          {
            section_type: "gallery",
            title: "Galeria",
            content: {},
            display_order: 38,
            enabled: false,
          },
        ],
        services: [
          {
            id: "svc-1",
            name: "Consulta",
            description: "Avaliação completa",
            price: 150,
            duration_minutes: 30,
            image_path: null,
            display_order: 1,
          },
        ],
        testimonials: [
          {
            customer_name: "Maria",
            quote: "Ótimo!",
            rating: 5,
            photo_path: null,
            display_order: 1,
          },
        ],
        gallery: [],
        supabaseUrl: SUPABASE_URL,
        appBaseUrl: APP_BASE_URL,
      });

      expect(dto.mode).toBe("public");
      expect(dto.slug).toBe("clinica-saude");
      expect(dto.sections.some((s) => s.type === "hero")).toBe(true);
      expect(dto.sections.some((s) => s.type === "gallery")).toBe(false);
      expect(dto.bookingHref).toBe("/clinica-saude/agendar");
    });
  });

  describe("mapPreviewLandingDTO", () => {
    it("forces preview mode and disables indexing", () => {
      const preview = mapPreviewLandingDTO(
        { ...basePage, published: false },
        {
          sections: [],
          services: [],
          testimonials: [],
          gallery: [],
          supabaseUrl: SUPABASE_URL,
          appBaseUrl: APP_BASE_URL,
          previewExpiresAt: "2026-07-11T20:00:00.000Z",
          isPublished: false,
        },
      );

      expect(preview.mode).toBe("preview");
      expect(preview.seo.robotsIndex).toBe(false);
      expect(preview.previewExpiresAt).toBe("2026-07-11T20:00:00.000Z");
      expect(preview.isPublished).toBe(false);
    });
  });

  describe("mapTestimonialItem", () => {
    it("maps editor testimonial with id", () => {
      const item = mapTestimonialItem(
        {
          id: "t-1",
          customer_name: "João",
          quote: "Recomendo",
          rating: 4,
          photo_path: "c1/photo.jpg",
          published: false,
          display_order: 2,
        },
        SUPABASE_URL,
        "t-1",
      );
      expect(item.id).toBe("t-1");
      expect(item.published).toBe(false);
      expect(item.photoUrl).toContain("c1/photo.jpg");
    });
  });

  describe("persistence mappers", () => {
    it("maps hero input to persistence shape", () => {
      expect(
        toHeroPersistence({
          title: "Hero",
          subtitle: "Sub",
          ctaLabel: "Agendar",
          enabled: true,
          displayOrder: 10,
        }),
      ).toEqual({
        sectionType: "hero",
        title: "Hero",
        content: { subtitle: "Sub", cta: "Agendar" },
        enabled: true,
        displayOrder: 10,
      });
    });

    it("maps about input to persistence shape", () => {
      expect(
        toAboutPersistence({
          title: "Sobre",
          body: "Nossa história completa aqui.",
          enabled: true,
          displayOrder: 20,
        }),
      ).toEqual({
        sectionType: "about",
        title: "Sobre",
        content: { text: "Nossa história completa aqui." },
        enabled: true,
        displayOrder: 20,
      });
    });

    it("maps branding input to db columns", () => {
      const result = toBrandingPersistence({
        primaryColor: "#111111",
        secondaryColor: "#222222",
        accentColor: "#333333",
        backgroundColor: "#FFFFFF",
        theme: "dark",
        logoPath: "c1/logo.png",
      });
      expect(result.settings.primary_color).toBe("#111111");
      expect(result.page.logo_path).toBe("c1/logo.png");
    });

    it("maps seo input to db columns", () => {
      const result = toSeoPersistence({
        title: "Título SEO",
        metaDescription: "Descrição",
        canonicalUrl: "https://app.example.com/clinica",
        twitterCard: "summary",
        robotsIndex: true,
      });
      expect(result.title).toBe("Título SEO");
      expect(result.seo.robotsIndex).toBe(true);
    });
  });
});
