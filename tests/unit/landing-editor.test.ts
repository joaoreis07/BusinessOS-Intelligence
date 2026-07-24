import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  aboutSectionSchema,
  heroSectionSchema,
  landingCompanyProfileSchema,
  seoSchema,
} from "@/features/landing/schemas";
import { EDITOR_TABS, findEditorSection } from "@/features/landing/editor/types";
import { buildPublicLanding } from "./landing-fixtures";

const { authenticatedContextMock } = vi.hoisted(() => ({
  authenticatedContextMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  getPublicSupabaseEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
  }),
}));

vi.mock("@/features/_shared/server", async () => {
  const actual = await vi.importActual("@/features/_shared/server");
  return {
    ...(actual as object),
    authenticatedContext: authenticatedContextMock,
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("landing editor schemas", () => {
  it("validates hero draft payload", () => {
    const result = heroSectionSchema.parse({
      title: "Bem-vindo",
      subtitle: "Cuidado personalizado",
      ctaLabel: "Agendar",
      enabled: true,
      displayOrder: 10,
    });
    expect(result.ctaLabel).toBe("Agendar");
  });

  it("rejects invalid about body", () => {
    expect(() =>
      aboutSectionSchema.parse({
        body: "curto",
      }),
    ).toThrow();
  });

  it("validates seo with keywords", () => {
    const result = seoSchema.parse({
      title: "Clínica Saúde",
      keywords: "clínica, dermatologia",
      robotsIndex: true,
    });
    expect(result.keywords).toBe("clínica, dermatologia");
  });

  it("validates company profile for branding editor", () => {
    const result = landingCompanyProfileSchema.parse({
      name: "Clínica Saúde",
      tagline: "Cuidado com a pele",
      businessHours: "Seg-Sex 9h-18h",
    });
    expect(result.name).toBe("Clínica Saúde");
  });
});

describe("landing editor structure", () => {
  it("defines all required editor tabs", () => {
    const ids = EDITOR_TABS.map((tab) => tab.id);
    expect(ids).toEqual([
      "hero",
      "about",
      "services",
      "gallery",
      "testimonials",
      "faq",
      "cta",
      "contact",
      "seo",
      "branding",
    ]);
  });

  it("finds sections from editor dto shape", () => {
    const landing = buildPublicLanding();
    const editorLike = {
      mode: "editor" as const,
      companyId: "c-1",
      slug: landing.slug,
      companyName: landing.companyName,
      professionalName: landing.professionalName,
      specialty: landing.specialty,
      description: landing.description,
      published: false,
      publishedAt: null,
      locale: "pt-BR",
      templateKey: "default",
      branding: landing.branding,
      mediaPaths: { logoPath: null, avatarPath: null, bannerPath: null },
      seo: landing.seo,
      contacts: landing.contacts,
      social: landing.social,
      sections: landing.sections,
      testimonials: [],
      gallery: [],
    };
    expect(findEditorSection(editorLike, "hero")?.type).toBe("hero");
  });
});

describe("landing editor publish flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("publish action uses landing manage context via updateLandingPublishState", async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { published: true },
            error: null,
          }),
        }),
      }),
    });
    authenticatedContextMock.mockResolvedValue({
      companyId: "550e8400-e29b-41d4-a716-446655440000",
      supabase: { from: vi.fn(() => ({ update })) },
    });

    const { updateLandingPublishState } = await import("@/features/landing/server");
    const result = await updateLandingPublishState(true);
    expect(result.published).toBe(true);
    expect(authenticatedContextMock).toHaveBeenCalledWith("landing:manage");
  });

  it("preview token creation requires landing manage permission", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          preview_token: "a".repeat(32),
          expires_at: "2026-07-11T20:00:00.000Z",
          company_slug: "clinica-saude",
        },
      ],
      error: null,
    });
    authenticatedContextMock.mockResolvedValue({
      companyId: "550e8400-e29b-41d4-a716-446655440000",
      supabase: { rpc },
    });

    const { createLandingPreviewToken } = await import("@/features/landing/server");
    const result = await createLandingPreviewToken(60);
    expect(result.previewUrl).toContain("?preview=");
    expect(authenticatedContextMock).toHaveBeenCalledWith("landing:manage");
  });
});
