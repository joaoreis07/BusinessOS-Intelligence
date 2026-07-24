import { Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import type { ContactChannelDTO } from "../../integrations/types";
import { LandingLinkButton } from "./landing-button";

const ICONS = {
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
  address: MapPin,
  form: Send,
} as const;

export type ContactChannelsProps = {
  channels: ContactChannelDTO[];
  className?: string;
  listClassName?: string;
  showSocial?: boolean;
  companyName?: string;
  social?: {
    instagram: string | null;
    facebook: string | null;
    linkedin: string | null;
    website: string | null;
  };
};

export function ContactChannels({
  channels,
  className,
  listClassName,
  showSocial = false,
  companyName,
  social,
}: ContactChannelsProps) {
  if (!channels.length && !showSocial) return null;

  return (
    <div className={className} data-business-module="contact">
      {channels.length ? (
        <ul className={listClassName ?? "space-y-4 text-sm sm:text-base"}>
          {channels.map((channel) => {
            const Icon = ICONS[channel.kind];
            const content = channel.displayValue ?? channel.label;

            return (
              <li
                key={channel.kind}
                className="flex items-start gap-3"
                data-contact-channel={channel.kind}
              >
                <Icon
                  size={18}
                  className="mt-0.5 shrink-0 text-[var(--landing-primary)]"
                  aria-hidden
                />
                {channel.href ? (
                  <a
                    href={channel.href}
                    target={channel.external ? "_blank" : undefined}
                    rel={channel.external ? "noreferrer" : undefined}
                    className="hover:text-[var(--landing-primary)] focus-visible:outline-2 focus-visible:outline-offset-2"
                    aria-label={channel.label}
                  >
                    {channel.kind === "whatsapp" ? channel.label : content}
                  </a>
                ) : (
                  <span>{content}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
      {showSocial && social ? (
        <div className="mt-6 flex flex-wrap gap-3 border-t border-[var(--landing-muted)]/20 pt-6">
          {social.instagram ? (
            <LandingLinkButton
              href={social.instagram}
              variant="ghost"
              target="_blank"
              rel="noreferrer"
              aria-label={companyName ? `Instagram de ${companyName}` : "Instagram"}
            >
              Instagram
            </LandingLinkButton>
          ) : null}
          {social.facebook ? (
            <LandingLinkButton
              href={social.facebook}
              variant="ghost"
              target="_blank"
              rel="noreferrer"
              aria-label={companyName ? `Facebook de ${companyName}` : "Facebook"}
            >
              Facebook
            </LandingLinkButton>
          ) : null}
          {social.linkedin ? (
            <LandingLinkButton
              href={social.linkedin}
              variant="ghost"
              target="_blank"
              rel="noreferrer"
              aria-label={companyName ? `LinkedIn de ${companyName}` : "LinkedIn"}
            >
              LinkedIn
            </LandingLinkButton>
          ) : null}
          {social.website ? (
            <LandingLinkButton
              href={social.website}
              variant="ghost"
              target="_blank"
              rel="noreferrer"
              aria-label={companyName ? `Website de ${companyName}` : "Website"}
            >
              Website
            </LandingLinkButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
