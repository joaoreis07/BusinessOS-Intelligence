-- Sprint 4 Etapa 5: appointments panel (status, cancellation reason, list indexes).

set search_path = public, extensions;

alter type public.appointment_status add value if not exists 'in_progress' after 'confirmed';

alter type public.appointment_event_type add value if not exists 'in_progress' after 'confirmed';

alter table public.appointments
  add column if not exists cancellation_reason text;

alter table public.appointments
  drop constraint if exists appointments_cancellation_reason_length;

alter table public.appointments
  add constraint appointments_cancellation_reason_length
  check (
    cancellation_reason is null
    or length(trim(cancellation_reason)) between 1 and 500
  );

create index if not exists appointments_company_starts_idx
  on public.appointments (company_id, starts_at desc)
  where deleted_at is null;

create index if not exists appointments_company_status_starts_idx
  on public.appointments (company_id, status, starts_at desc)
  where deleted_at is null;

create or replace function public.record_appointment_event()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.appointment_events
      (company_id, appointment_id, event_type, to_status, actor_user_id)
    values (new.company_id, new.id, 'created', new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.appointment_events
      (company_id, appointment_id, event_type, from_status, to_status, actor_user_id, payload)
    values (
      new.company_id,
      new.id,
      case new.status
        when 'confirmed' then 'confirmed'::public.appointment_event_type
        when 'in_progress' then 'in_progress'::public.appointment_event_type
        when 'completed' then 'completed'::public.appointment_event_type
        when 'cancelled' then 'cancelled'::public.appointment_event_type
        when 'no_show' then 'no_show'::public.appointment_event_type
        else 'rescheduled'::public.appointment_event_type
      end,
      old.status,
      new.status,
      auth.uid(),
      case
        when new.status = 'cancelled' and new.cancellation_reason is not null then
          jsonb_build_object('cancellation_reason', new.cancellation_reason)
        else '{}'::jsonb
      end
    );
  elsif new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at then
    insert into public.appointment_events
      (company_id, appointment_id, event_type, actor_user_id, payload)
    values (
      new.company_id, new.id, 'rescheduled', auth.uid(),
      jsonb_build_object('from_starts_at', old.starts_at, 'to_starts_at', new.starts_at)
    );
  end if;
  return new;
end;
$$;

create or replace function public.cancel_appointment_secure(
  target_appointment_id uuid,
  cancellation_reason text default null,
  idempotency_key text default null
)
returns table (
  appointment_id uuid,
  appointment_status public.appointment_status
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  locked_record public.appointments%rowtype;
  effective_key text := nullif(trim(idempotency_key), '');
  effective_reason text := nullif(trim(cancellation_reason), '');
begin
  if effective_reason is null then
    raise exception 'cancellation reason is required' using errcode = '22023';
  end if;

  select * into locked_record
  from public.appointments
  where id = target_appointment_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'appointment not found' using errcode = 'P0002';
  end if;

  if not public.can_manage_appointments(locked_record.company_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.appointments
  set cancellation_reason = effective_reason,
      updated_at = now()
  where id = locked_record.id;

  return query
  select *
  from public.update_appointment_status_secure(
    target_appointment_id,
    'cancelled'::public.appointment_status,
    effective_key
  );
end;
$$;

revoke all on function public.cancel_appointment_secure(uuid, text, text) from public;
grant execute on function public.cancel_appointment_secure(uuid, text, text)
  to authenticated;
