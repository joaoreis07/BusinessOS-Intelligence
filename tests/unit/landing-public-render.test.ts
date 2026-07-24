import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveRenderableSections } from "@/features/landing/registry/resolve-sections";
import { buildPreviewLanding, buildPublicLanding, sampleHeroSection } from "./landing-fixtures";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/cache", () => ({
  unstable_noStore: vi.fn(),
}));

const getPublicLandingBySlugMock = vi.fn();
const getPreviewLandingBySlugMock = vi.fn();

vi.mock("@/features/landing/server", async () => {
  const actual = await vi.importActual<typeof import("@/features/landing/server")>(
    "@/features/landing/server",
  );
  return {
    ...actual,
    getPublicLandingBySlug: getPublicLandingBySlugMock,
    getPreviewLandingBySlug: getPreviewLandingBySlugMock,
  };
});

describe("landing public section order", () => {
  it("renders only enabled sections in display order", () => {
    const landing = buildPublicLanding({
      sections: [
        { ...sampleHeroSection, displayOrder: 10, enabled: true },
        {
          type: "about",
          enabled: false,
          displayOrder: 20,
          title: "Sobre",
          body: "Texto",
          imageUrl: null,
        },
        {
          type: "services",
          enabled: true,
          displayOrder: 30,
          title: "Serviços",
          items: [],
        },
      ],
    });

    const renderable = resolveRenderableSections(landing.sections);
    expect(renderable.map((s) => s.type)).toEqual(["hero", "services"]);
  });
});

describe("resolvePublicLandingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPublicLandingBySlugMock.mockResolvedValue(null);
    getPreviewLandingBySlugMock.mockResolvedValue(null);
  });

  it("returns published landing by slug", async () => {
    const landing = buildPublicLanding();
    getPublicLandingBySlugMock.mockResolvedValue(landing);

    const { resolvePublicLandingPage } = await import("@/features/landing/public/resolve");
    const result = await resolvePublicLandingPage({ slug: "clinica-saude" });
    expect(result.status).toBe("published");
    if (result.status === "published") {
      expect(result.landing.slug).toBe("clinica-saude");
    }
  });

  it("returns preview landing with valid token", async () => {
    const preview = buildPreviewLanding();
    getPreviewLandingBySlugMock.mockResolvedValue(preview);

    const { resolvePublicLandingPage } = await import("@/features/landing/public/resolve");
    const result = await resolvePublicLandingPage({
      slug: "clinica-saude",
      previewToken: "a".repeat(32),
    });
    expect(result.status).toBe("preview");
  });

  it("returns inactive when slug exists but company is inactive", async () => {
    createClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: "inactive", error: null }),
    });

    const { resolvePublicLandingPage } = await import("@/features/landing/public/resolve");
    const result = await resolvePublicLandingPage({ slug: "clinica-inativa" });
    expect(result.status).toBe("inactive");
  });

  it("returns not_found for unknown slug", async () => {
    createClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: "not_found", error: null }),
    });

    const { resolvePublicLandingPage } = await import("@/features/landing/public/resolve");
    const result = await resolvePublicLandingPage({ slug: "inexistente" });
    expect(result.status).toBe("not_found");
  });
});
