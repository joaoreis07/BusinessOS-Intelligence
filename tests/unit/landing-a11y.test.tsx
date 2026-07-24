import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicLandingRenderer } from "@/features/landing/components/public-landing-renderer";
import { LandingInactivePage, LandingPreviewInvalidPage } from "@/features/landing/public/states";
import { buildPreviewLanding, buildPublicLanding } from "./landing-fixtures";

describe("landing accessibility", () => {
  it("renders skip link to main content", () => {
    const html = renderToStaticMarkup(<PublicLandingRenderer landing={buildPublicLanding()} />);
    expect(html).toContain('href="#landing-main"');
    expect(html).toContain("Pular para o conteúdo");
    expect(html).toContain('id="landing-main"');
  });

  it("keeps single heading hierarchy in hero section", () => {
    const html = renderToStaticMarkup(<PublicLandingRenderer landing={buildPublicLanding()} />);
    expect(html).toMatch(/<h1[^>]*>/);
    expect(html).toMatch(/<h2[^>]*>/);
  });

  it("exposes faq accordion semantics", () => {
    const landing = buildPublicLanding({
      sections: [
        ...buildPublicLanding().sections,
        {
          type: "faq",
          enabled: true,
          displayOrder: 50,
          title: "FAQ",
          items: [{ question: "Como agendar?", answer: "Pelo site." }],
        },
      ],
    });
    const html = renderToStaticMarkup(<PublicLandingRenderer landing={landing} />);
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-controls=');
  });

  it("renders unavailable states with focusable back link", () => {
    const inactive = renderToStaticMarkup(<LandingInactivePage slug="clinica" />);
    const invalidPreview = renderToStaticMarkup(<LandingPreviewInvalidPage slug="clinica" />);

    expect(inactive).toContain("focus-visible:outline");
    expect(inactive).toContain("<h1");
    expect(invalidPreview).toContain("Preview inválido ou expirado");
  });

  it("labels social links for screen readers", () => {
    const landing = buildPublicLanding({
      sections: [
        {
          type: "contact",
          enabled: true,
          displayOrder: 90,
          title: "Contato",
          contacts: buildPublicLanding().contacts,
          social: {
            instagram: "https://instagram.com/clinica",
            facebook: null,
            linkedin: null,
            website: null,
          },
        },
      ],
    });
    const html = renderToStaticMarkup(<PublicLandingRenderer landing={landing} />);
    expect(html).toContain('aria-label="Instagram de Clínica Saúde"');
  });

  it("marks preview banner as live status region", () => {
    const html = renderToStaticMarkup(<PublicLandingRenderer landing={buildPreviewLanding()} />);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('role="status"');
  });
});
