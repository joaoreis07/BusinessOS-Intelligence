import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { BookingWizard } from "@/components/scheduling/public/booking-wizard";
import { resolvePublicBookingWizard, toBookingWizardProps } from "@/features/scheduling";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
};

export const metadata: Metadata = {
  title: "Agendar atendimento",
  robots: { index: false, follow: false },
};

export default async function BookingPage({ params, searchParams }: PageProps) {
  const [{ slug }, { service: initialServiceId }] = await Promise.all([
    params,
    searchParams,
  ]);
  const wizard = await resolvePublicBookingWizard(slug);

  if (!wizard) notFound();

  const props = toBookingWizardProps(wizard);

  return (
    <BookingWizard
      company={props.company}
      services={props.services}
      scheduling={props.scheduling}
      initialServiceId={initialServiceId}
    />
  );
}
