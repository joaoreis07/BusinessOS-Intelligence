import { describe, expect, it } from "vitest";
import {
  aboutSectionSchema,
  brandingSchema,
  editorLandingSchema,
  galleryItemCreateSchema,
  heroSectionSchema,
  previewAccessSchema,
  previewTtlSchema,
  publicSlugSchema,
  seoSchema,
  testimonialCreateSchema,
} from "@/features/landing/schemas";

describe("landing schemas", () => {
  describe("publicSlugSchema", () => {
    it("accepts valid slugs", () => {
      expect(publicSlugSchema.parse("clinica-saude")).toBe("clinica-saude");
    });

    it("rejects uppercase and invalid characters", () => {
      expect(() => publicSlugSchema.parse("Clinica")).toThrow();
      expect(() => publicSlugSchema.parse("clinica_saude")).toThrow();
      expect(() => publicSlugSchema.parse("ab")).toThrow();
    });
  });

  describe("previewAccessSchema", () => {
    it("accepts slug and token together", () => {
      const result = previewAccessSchema.parse({
        slug: "clinica-saude",
        token: "a".repeat(32),
      });
      expect(result.slug).toBe("clinica-saude");
    });

    it("rejects short preview tokens", () => {
      expect(() =>
        previewAccessSchema.parse({
          slug: "clinica-saude",
          token: "short",
        }),
      ).toThrow();
    });
  });

  describe("previewTtlSchema", () => {
    it("defaults to 60 minutes", () => {
      expect(previewTtlSchema.parse(undefined)).toBe(60);
    });

    it("rejects ttl outside 5-1440 range", () => {
      expect(() => previewTtlSchema.parse(4)).toThrow();
      expect(() => previewTtlSchema.parse(1441)).toThrow();
    });
  });

  describe("heroSectionSchema", () => {
    it("applies defaults for optional fields", () => {
      const result = heroSectionSchema.parse({});
      expect(result.ctaLabel).toBe("Agendar atendimento");
      expect(result.enabled).toBe(true);
      expect(result.displayOrder).toBe(10);
    });

    it("rejects titles shorter than 3 characters", () => {
      expect(() => heroSectionSchema.parse({ title: "ab" })).toThrow();
    });
  });

  describe("aboutSectionSchema", () => {
    it("requires minimum body length when provided", () => {
      expect(() => aboutSectionSchema.parse({ body: "curto" })).toThrow();
      expect(aboutSectionSchema.parse({ body: "Texto com tamanho adequado." }).body).toBe(
        "Texto com tamanho adequado.",
      );
    });
  });

  describe("brandingSchema", () => {
    it("accepts valid hex colors", () => {
      const result = brandingSchema.parse({
        primaryColor: "#112233",
        secondaryColor: "#445566",
        accentColor: "#778899",
        backgroundColor: "#AABBCC",
      });
      expect(result.theme).toBe("light");
    });

    it("rejects invalid color format", () => {
      expect(() =>
        brandingSchema.parse({
          primaryColor: "red",
          secondaryColor: "#445566",
          accentColor: "#778899",
          backgroundColor: "#AABBCC",
        }),
      ).toThrow();
    });
  });

  describe("seoSchema", () => {
    it("accepts minimal seo payload", () => {
      const result = seoSchema.parse({ title: "Clínica Saúde" });
      expect(result.robotsIndex).toBe(true);
      expect(result.twitterCard).toBe("summary_large_image");
    });

    it("rejects invalid canonical url", () => {
      expect(() =>
        seoSchema.parse({
          title: "Clínica Saúde",
          canonicalUrl: "not-a-url",
        }),
      ).toThrow();
    });
  });

  describe("editorLandingSchema", () => {
    it("accepts partial section updates", () => {
      const result = editorLandingSchema.parse({
        hero: { title: "Bem-vindo" },
        published: false,
      });
      expect(result.hero?.title).toBe("Bem-vindo");
      expect(result.published).toBe(false);
    });
  });

  describe("testimonialCreateSchema", () => {
    it("accepts valid testimonial", () => {
      const result = testimonialCreateSchema.parse({
        customerName: "Maria Silva",
        quote: "Excelente atendimento!",
        rating: 5,
      });
      expect(result.published).toBe(false);
    });

    it("rejects invalid rating", () => {
      expect(() =>
        testimonialCreateSchema.parse({
          customerName: "Maria Silva",
          quote: "Excelente atendimento!",
          rating: 6,
        }),
      ).toThrow();
    });
  });

  describe("galleryItemCreateSchema", () => {
    it("requires a valid media asset id", () => {
      expect(() =>
        galleryItemCreateSchema.parse({
          mediaAssetId: "not-uuid",
        }),
      ).toThrow();

      expect(
        galleryItemCreateSchema.parse({
          mediaAssetId: "550e8400-e29b-41d4-a716-446655440000",
        }).enabled,
      ).toBe(true);
    });
  });
});
