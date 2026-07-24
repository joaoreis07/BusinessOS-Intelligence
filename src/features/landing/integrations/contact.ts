import type { LandingContactsDTO, LandingSocialLinksDTO } from "../types";
import type { ContactChannelDTO } from "./types";

function buildWhatsappHref(phone: string | null) {
  const digits = phone?.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent("Olá! Gostaria de entrar em contato.")}`;
}

export function resolveContactChannels(input: {
  slug: string;
  contacts: LandingContactsDTO;
  social: LandingSocialLinksDTO;
  formEnabled?: boolean;
}): ContactChannelDTO[] {
  const { contacts, slug } = input;
  const addressParts = [
    contacts.address.street,
    contacts.address.city,
    contacts.address.state,
    contacts.address.zip,
  ].filter(Boolean);
  const addressValue = addressParts.length ? addressParts.join(" · ") : null;

  const channels: ContactChannelDTO[] = [
    {
      module: "contact",
      kind: "email",
      label: "E-mail",
      displayValue: contacts.email,
      href: contacts.email ? `mailto:${contacts.email}` : null,
      enabled: Boolean(contacts.email),
      external: false,
    },
    {
      module: "contact",
      kind: "phone",
      label: "Telefone",
      displayValue: contacts.phone,
      href: contacts.phone ? `tel:${contacts.phone}` : null,
      enabled: Boolean(contacts.phone),
      external: false,
    },
    {
      module: "contact",
      kind: "whatsapp",
      label: "WhatsApp",
      displayValue: contacts.whatsapp,
      href: buildWhatsappHref(contacts.whatsapp),
      enabled: Boolean(contacts.whatsapp),
      external: true,
    },
    {
      module: "contact",
      kind: "address",
      label: "Endereço",
      displayValue: addressValue,
      href: null,
      enabled: Boolean(addressValue),
      external: false,
    },
    {
      module: "contact",
      kind: "form",
      label: "Enviar mensagem",
      displayValue: null,
      href: `/${slug}/contato`,
      enabled: Boolean(input.formEnabled),
      external: false,
    },
  ];

  return channels.filter((channel) => channel.enabled);
}

export function findContactChannel(
  channels: ContactChannelDTO[],
  kind: ContactChannelDTO["kind"],
) {
  return channels.find((channel) => channel.kind === kind && channel.enabled);
}
