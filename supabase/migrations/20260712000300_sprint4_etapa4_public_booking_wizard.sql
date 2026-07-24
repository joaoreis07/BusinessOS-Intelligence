-- Sprint 4 Etapa 4: public booking wizard context RPC.

set search_path = public, extensions;

create or replace function public.get_public_booking_wizard_context(company_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'bookingEnabled', settings.booking_enabled,
    'bookingFlow', settings.booking_flow,
    'minNoticeMinutes', settings.booking_min_notice_minutes,
    'horizonDays', settings.booking_horizon_days,
    'intervalMinutes', settings.booking_interval_minutes,
    'timezone', settings.timezone,
    'preferences', coalesce(settings.scheduling_preferences, '{}'::jsonb)
  )
    into result
  from public.companies company
  join public.company_settings settings on settings.company_id = company.id
  join public.landing_pages page on page.company_id = company.id
  where company.slug = company_slug
    and company.active
    and company.status in ('trial', 'active')
    and company.deleted_at is null
    and page.published
    and page.deleted_at is null;

  return result;
end;
$$;

revoke all on function public.get_public_booking_wizard_context(text) from public;
grant execute on function public.get_public_booking_wizard_context(text)
  to anon, authenticated;
