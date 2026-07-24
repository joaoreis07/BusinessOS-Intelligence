-- Sprint 4 Etapa 3: scheduling settings preferences and secure update RPC.

set search_path = public, extensions;

alter table public.company_settings
  add column if not exists scheduling_preferences jsonb not null default '{}'::jsonb;

alter table public.company_settings
  drop constraint if exists company_settings_scheduling_preferences_object;

alter table public.company_settings
  add constraint company_settings_scheduling_preferences_object
  check (jsonb_typeof(scheduling_preferences) = 'object');

alter table public.blocked_periods
  add column if not exists block_type text not null default 'custom';

alter table public.blocked_periods
  drop constraint if exists blocked_periods_block_type_check;

alter table public.blocked_periods
  add constraint blocked_periods_block_type_check
  check (block_type in ('vacation', 'holiday', 'maintenance', 'meeting', 'temporary', 'custom'));

alter table public.blocked_periods
  add column if not exists recurrence_rule jsonb;

alter table public.blocked_periods
  add column if not exists scope jsonb not null default '{}'::jsonb;

alter table public.blocked_periods
  drop constraint if exists blocked_periods_scope_object;

alter table public.blocked_periods
  add constraint blocked_periods_scope_object
  check (jsonb_typeof(scope) = 'object');

alter table public.blocked_periods
  drop constraint if exists blocked_periods_recurrence_object;

alter table public.blocked_periods
  add constraint blocked_periods_recurrence_object
  check (recurrence_rule is null or jsonb_typeof(recurrence_rule) = 'object');

create or replace function public.update_scheduling_settings(
  target_company_id uuid,
  settings jsonb
)
returns public.company_settings
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  updated_row public.company_settings%rowtype;
  parsed_preferences jsonb := coalesce(settings -> 'preferences', '{}'::jsonb);
begin
  if jsonb_typeof(settings) <> 'object' then
    raise exception 'settings must be a json object' using errcode = '22023';
  end if;

  if not public.can_configure_scheduling(target_company_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.companies company
    where company.id = target_company_id
      and company.active
      and company.status in ('trial', 'active')
      and company.deleted_at is null
  ) then
    raise exception 'company unavailable' using errcode = 'P0002';
  end if;

  update public.company_settings
  set
    booking_enabled = coalesce((settings ->> 'bookingEnabled')::boolean, booking_enabled),
    booking_flow = coalesce(
      (settings ->> 'bookingFlow')::public.booking_flow,
      booking_flow
    ),
    booking_min_notice_minutes = coalesce(
      (settings ->> 'minNoticeMinutes')::integer,
      booking_min_notice_minutes
    ),
    booking_interval_minutes = coalesce(
      (settings ->> 'intervalMinutes')::integer,
      booking_interval_minutes
    ),
    booking_horizon_days = coalesce(
      (settings ->> 'horizonDays')::integer,
      booking_horizon_days
    ),
    max_appointments_per_day = case
      when settings ? 'maxAppointmentsPerDay' then
        nullif(settings ->> 'maxAppointmentsPerDay', '')::integer
      else max_appointments_per_day
    end,
    scheduling_preferences = coalesce(
      scheduling_preferences,
      '{}'::jsonb
    ) || parsed_preferences,
    updated_at = now()
  where company_id = target_company_id
  returning * into updated_row;

  if not found then
    raise exception 'company settings not found' using errcode = 'P0002';
  end if;

  return updated_row;
end;
$$;

revoke all on function public.update_scheduling_settings(uuid, jsonb) from public;
grant execute on function public.update_scheduling_settings(uuid, jsonb)
  to authenticated, service_role;
