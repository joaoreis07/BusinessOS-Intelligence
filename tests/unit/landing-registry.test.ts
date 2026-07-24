import { describe, expect, it } from "vitest";
import {
  getSectionRegistry,
  listSectionDefinitions,
  registerLandingSection,
} from "@/features/landing/registry/section-registry";
import {
  filterEnabledSections,
  hasSectionContent,
  isRegisteredSectionType,
  resolveRenderableSections,
  sortSections,
} from "@/features/landing/registry/resolve-sections";
import { toLandingRenderContext } from "@/features/landing/registry/landing-context";
import {
  buildEmptyServicesSection,
  buildPublicLanding,
  sampleAboutSection,
  sampleHeroSection,
} from "./landing-fixtures";

describe("landing section registry", () => {
  it("registers all core section types", () => {
    const registry = getSectionRegistry();
    const expected = [
      "hero",
      "about",
      "services",
      "differentials",
      "gallery",
      "testimonials",
      "faq",
      "booking",
      "contact",
      "footer",
    ];
    for (const type of expected) {
      expect(registry[type as keyof typeof registry]).toBeDefined();
      expect(registry[type as keyof typeof registry]?.id).toBe(type);
    }
  });

  it("lists definitions sorted by default display order", () => {
    const definitions = listSectionDefinitions();
    expect(definitions[0]?.id).toBe("hero");
    expect(definitions.at(-1)?.id).toBe("footer");
    expect(definitions.length).toBeGreaterThanOrEqual(10);
  });

  it("allows overriding a section entry via registerLandingSection", () => {
    const original = getSectionRegistry().hero;
    registerLandingSection({
      ...original,
      config: {
        ...original.config,
        label: "Hero Override",
      },
    });
    expect(getSectionRegistry().hero.config.label).toBe("Hero Override");
    registerLandingSection(original);
    expect(getSectionRegistry().hero.config.label).toBe(original.config.label);
  });

  it("identifies registered section types", () => {
    expect(isRegisteredSectionType("hero")).toBe(true);
    expect(isRegisteredSectionType("custom")).toBe(false);
  });
});

describe("landing section resolve helpers", () => {
  it("sorts sections by display order", () => {
    const sorted = sortSections([
      { ...sampleAboutSection, displayOrder: 30 },
      { ...sampleHeroSection, displayOrder: 10 },
    ]);
    expect(sorted[0]?.type).toBe("hero");
    expect(sorted[1]?.type).toBe("about");
  });

  it("filters disabled sections", () => {
    const enabled = filterEnabledSections([
      sampleHeroSection,
      { ...sampleAboutSection, enabled: false },
    ]);
    expect(enabled).toHaveLength(1);
    expect(enabled[0]?.type).toBe("hero");
  });

  it("resolves renderable sections in order", () => {
    const landing = buildPublicLanding();
    const renderable = resolveRenderableSections(landing.sections);
    expect(renderable.map((s) => s.type)).toEqual(["hero", "about", "services"]);
  });

  it("detects empty section content", () => {
    expect(hasSectionContent(buildEmptyServicesSection())).toBe(false);
    expect(hasSectionContent(sampleHeroSection)).toBe(true);
  });

  it("builds render context from public landing", () => {
    const landing = buildPublicLanding();
    const context = toLandingRenderContext(landing);
    expect(context.slug).toBe("clinica-saude");
    expect(context.mode).toBe("public");
    expect(context.branding.primaryColor).toBe("#173f7a");
  });
});
