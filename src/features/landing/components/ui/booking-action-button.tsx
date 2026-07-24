import type { BookingActionDTO } from "../../integrations/types";
import { LandingLinkButton, type LandingLinkButtonProps } from "./landing-button";

export type BookingActionButtonProps = Omit<LandingLinkButtonProps, "href" | "children"> & {
  action: BookingActionDTO;
};

export function BookingActionButton({ action, ...props }: BookingActionButtonProps) {
  if (!action.enabled) return null;

  return (
    <LandingLinkButton
      href={action.href}
      data-business-module={action.module}
      data-booking-kind={action.kind}
      {...(action.serviceId ? { "data-service-id": action.serviceId } : {})}
      {...props}
    >
      {action.label}
    </LandingLinkButton>
  );
}
