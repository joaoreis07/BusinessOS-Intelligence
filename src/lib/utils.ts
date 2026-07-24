import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function toSaoPauloDateString(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function normalizePhoneToE164(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountry =
    digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return `+${withCountry}`;
}
