import { MessageCircle } from "lucide-react";
import { findContactChannel } from "../../integrations/contact";
import type { LandingRenderContext } from "../../registry/types";

type LandingWhatsappFloatProps = {
  context: LandingRenderContext;
};

export function LandingWhatsappFloat({ context }: LandingWhatsappFloatProps) {
  const whatsapp = findContactChannel(context.integrations.contact.channels, "whatsapp");
  if (!whatsapp?.href) return null;

  return (
    <a
      href={whatsapp.href}
      target="_blank"
      rel="noreferrer"
      aria-label="Conversar pelo WhatsApp"
      data-business-module="contact"
      data-contact-channel="whatsapp"
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--landing-primary)]"
    >
      <MessageCircle size={24} aria-hidden />
    </a>
  );
}
