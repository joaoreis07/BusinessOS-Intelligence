import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicLandingRenderer } from "@/features/landing/components/public-landing-renderer";
import { SectionRenderer, canRenderSection } from "@/features/landing/components/section-renderer";
import { SectionFallback } from "@/features/landing/components/section-fallback";
import { brandingToCssVars } from "@/features/landing/components/ui/landing-theme";
import { toLandingRenderContext } from "@/features/landing/registry/landing-context";
import {
  buildEmptyServicesSection,
  buildPreviewLanding,
  buildPublicLanding,
  sampleHeroSection,
} from "./landing-fixtures";

describe("landing public rendering", () => {
  it("renders public landing with registered sections", () => {
    const html = renderToStaticMarkup(
      <PublicLandingRenderer landing={buildPublicLanding()} />,
    );
    expect(html).toContain('id="landing-main"');
    expect(html).toContain('id="landing-hero"');
    expect(html).toContain('id="landing-about"');
    expect(html).toContain('id="landing-services"');
    expect(html).toContain("Bem-vindo à Clínica");
    expect(html).toContain("Consulta");
  });

  it("renders preview banner in preview mode", () => {
    const html = renderToStaticMarkup(
      <PublicLandingRenderer landing={buildPreviewLanding()} />,
    );
    expect(html).toContain("Modo preview");
    expect(html).toContain('data-landing-theme="light"');
  });

  it("skips empty services section", () => {
    const landing = buildPublicLanding({
      sections: [sampleHeroSection, buildEmptyServicesSection()],
    });
    const html = renderToStaticMarkup(<PublicLandingRenderer landing={landing} />);
    expect(html).toContain('id="landing-hero"');
    expect(html).not.toContain('id="landing-services"');
  });

  it("renders section fallback for unregistered type in development", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const context = toLandingRenderContext(buildPublicLanding());
    const html = renderToStaticMarkup(
      <SectionFallback
        section={{ ...sampleHeroSection, type: "hero" }}
        context={context}
      />,
    );
    process.env.NODE_ENV = originalEnv;
    expect(html).toContain("Seção não registrada");
  });

  it("evaluates canRenderSection for enabled contentful sections", () => {
    expect(canRenderSection(sampleHeroSection)).toBe(true);
    expect(canRenderSection(buildEmptyServicesSection())).toBe(false);
    expect(canRenderSection({ ...sampleHeroSection, enabled: false })).toBe(false);
  });

  it("renders hero via SectionRenderer", () => {
    const context = toLandingRenderContext(buildPublicLanding());
    const html = renderToStaticMarkup(
      <SectionRenderer section={sampleHeroSection} context={context} />,
    );
    expect(html).toContain('aria-label="Apresentação"');
    expect(html).toContain("Agendar atendimento");
  });
});

describe("landing theme tokens", () => {
  it("maps branding to css variables", () => {
    const vars = brandingToCssVars(buildPublicLanding().branding);
    expect(vars["--landing-primary"]).toBe("#173f7a");
    expect(vars["--landing-background"]).toBe("#ffffff");
  });

  it("prepares dark theme foreground tokens", () => {
    const vars = brandingToCssVars({
      ...buildPublicLanding().branding,
      theme: "dark",
    });
    expect(vars["--landing-foreground"]).toBe("#f8fafc");
    expect(vars["--landing-surface"]).toBe("#1e293b");
  });
});
