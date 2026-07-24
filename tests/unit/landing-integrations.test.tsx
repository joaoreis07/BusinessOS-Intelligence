import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { resolveBookingAction } from "@/features/landing/integrations/scheduling";
import { resolveTestimonialsFeed } from "@/features/landing/integrations/crm";
import {
  findContactChannel,
  resolveContactChannels,
} from "@/features/landing/integrations/contact";
import { buildLandingIntegrationsContext } from "@/features/landing/integrations/resolve";
import { toLandingRenderContext } from "@/features/landing/registry/landing-context";
import { BookingActionButton } from "@/features/landing/components/ui/booking-action-button";
import { buildPublicLanding } from "./landing-fixtures";

describe("landing module integrations", () => {
  it("builds scheduling integration context from landing dto", () => {
    const landing = buildPublicLanding();
    const integrations = buildLandingIntegrationsContext(landing);

    expect(integrations.scheduling.module).toBe("scheduling");
    expect(integrations.scheduling.enabled).toBe(true);
    expect(integrations.scheduling.bookingHref).toBe("/clinica-saude/agendar");
    expect(integrations.scheduling.publiclyVisibleServices).toBe(1);
  });

  it("disables scheduling when booking is turned off", () => {
    const integrations = buildLandingIntegrationsContext(
      buildPublicLanding({ bookingEnabled: false }),
    );
    expect(integrations.scheduling.enabled).toBe(false);
  });

  it("resolves booking action for scheduling module", () => {
    const context = toLandingRenderContext(buildPublicLanding());
    const action = resolveBookingAction(context, {
      label: "Agendar agora",
      fallbackHref: "/clinica-saude/agendar",
    });

    expect(action.module).toBe("scheduling");
    expect(action.kind).toBe("general");
    expect(action.href).toBe("/clinica-saude/agendar");
    expect(action.enabled).toBe(true);
  });

  it("resolves service-specific booking action", () => {
    const context = toLandingRenderContext(buildPublicLanding());
    const action = resolveBookingAction(context, {
      label: "Escolher serviço",
      serviceId: "svc-1",
    });

    expect(action.kind).toBe("service");
    expect(action.serviceId).toBe("svc-1");
    expect(action.href).toBe("/clinica-saude/agendar?service=svc-1");
  });

  it("prepares testimonials feed for future crm sync", () => {
    const landing = buildPublicLanding({
      sections: [
        ...buildPublicLanding().sections,
        {
          type: "testimonials",
          enabled: true,
          displayOrder: 40,
          title: "Depoimentos",
          items: [
            {
              id: "t-1",
              customerName: "Maria",
              quote: "Ótimo atendimento",
              rating: 5,
              photoUrl: null,
              published: true,
              displayOrder: 0,
            },
          ],
        },
      ],
    });
    const context = toLandingRenderContext(landing);
    const section = landing.sections.find((s) => s.type === "testimonials");
    if (section?.type !== "testimonials") throw new Error("missing testimonials");

    const feed = resolveTestimonialsFeed(section, context.integrations.crm);
    expect(feed.module).toBe("landing");
    expect(feed.syncEnabled).toBe(false);
    expect(feed.items).toHaveLength(1);
  });

  it("resolves contact channels for whatsapp email and phone", () => {
    const landing = buildPublicLanding();
    const channels = resolveContactChannels({
      slug: landing.slug,
      contacts: landing.contacts,
      social: landing.social,
    });

    expect(findContactChannel(channels, "whatsapp")?.href).toContain("wa.me");
    expect(findContactChannel(channels, "email")?.href).toBe("mailto:contato@clinica.com");
    expect(findContactChannel(channels, "phone")?.href).toContain("tel:");
  });

  it("keeps contact form channel disabled until form module exists", () => {
    const landing = buildPublicLanding();
    const integrations = buildLandingIntegrationsContext(landing);

    expect(integrations.contact.formActionHref).toBe("/clinica-saude/contato");
    expect(integrations.contact.formEnabled).toBe(false);
    expect(integrations.contact.channels.some((c) => c.kind === "form")).toBe(false);
  });

  it("renders booking action button with module metadata", () => {
    const context = toLandingRenderContext(buildPublicLanding());
    const action = resolveBookingAction(context, { label: "Agendar agora" });
    const html = renderToStaticMarkup(<BookingActionButton action={action} />);

    expect(html).toContain('data-business-module="scheduling"');
    expect(html).toContain('data-booking-kind="general"');
    expect(html).toContain("Agendar agora");
  });
});
