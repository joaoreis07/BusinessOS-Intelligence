import type { ContactSectionDTO } from "../../../types";
import type { SectionComponentProps } from "../../../registry/types";
import { ContactChannels } from "../../ui/contact-channels";
import { LandingCard } from "../../ui/landing-card";
import { LandingSectionShell } from "../../ui/landing-section-shell";

export type ContactSectionProps = SectionComponentProps<ContactSectionDTO>;

export function ContactSection({ section, context }: ContactSectionProps) {
  const { channels, formEnabled, formActionHref } = context.integrations.contact;
  const hasSocial = Boolean(
    section.social.instagram ||
      section.social.facebook ||
      section.social.linkedin ||
      section.social.website,
  );

  if (!channels.length && !hasSocial && !formEnabled) return null;

  return (
    <LandingSectionShell
      id="landing-contact"
      ariaLabel="Contato"
      dataSectionType="contact"
      className="py-16 sm:py-20"
      data-business-module="contact"
      data-contact-form-enabled={formEnabled ? "true" : "false"}
      {...(formActionHref ? { "data-contact-form-href": formActionHref } : {})}
    >
      {section.title ? (
        <h2 className="text-center font-serif text-3xl font-semibold sm:text-4xl">
          {section.title}
        </h2>
      ) : null}
      <LandingCard className="mt-8 sm:mt-10">
        <ContactChannels
          channels={channels}
          showSocial
          companyName={context.companyName}
          social={section.social}
        />
      </LandingCard>
    </LandingSectionShell>
  );
}
