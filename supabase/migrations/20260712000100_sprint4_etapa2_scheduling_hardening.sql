-- Sprint 4 Etapa 2: scheduling concurrency hardening, RLS alignment and secure RPCs.

set search_path = public, extensions;

-- Application permission mirrors (aligned with company-permissions.ts).
create or replace function public.can_configure_scheduling(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_company_role(
    target_company_id,
    array['owner', 'admin', 'manager']::public.membership_role[]
  );
$$;

create or replace function public.can_manage_appointments(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_company_role(
    target_company_id,
    array['owner', 'admin', 'manager', 'member', 'employee']::public.membership_role[]
  );
$$;

revoke all on function public.can_configure_scheduling(uuid) from public;
revoke all on function public.can_manage_appointments(uuid) from public;
grant execute on function public.can_configure_scheduling(uuid) to authenticated, service_role;
grant execute on function public.can_manage_appointments(uuid) to authenticated, service_role;

-- Prevent overlapping blocked periods for the same tenant.
alter table public.blocked_periods
  add constraint blocked_periods_no_overlap
  exclude using gist (
    company_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (deleted_at is null);

-- RLS: extend scheduling configuration to manager role.
create policy business_hours_insert_manager
  on public.business_hours
  for insert to authenticated
  with check (public.can_configure_scheduling(company_id));

create policy business_hours_update_manager
  on public.business_hours
  for update to authenticated
  using (public.can_configure_scheduling(company_id))
  with check (public.can_configure_scheduling(company_id));

create policy business_hours_delete_manager
  on public.business_hours
  for delete to authenticated
  using (public.can_configure_scheduling(company_id));

create policy blocked_periods_insert_manager
  on public.blocked_periods
  for insert to authenticated
  with check (public.can_configure_scheduling(company_id));

create policy blocked_periods_update_manager
  on public.blocked_periods
  for update to authenticated
  using (public.can_configure_scheduling(company_id))
  with check (public.can_configure_scheduling(company_id));

create policy blocked_periods_delete_manager
  on public.blocked_periods
  for delete to authenticated
  using (public.can_configure_scheduling(company_id));

-- RLS: extend appointment writes to manager and employee roles.
create policy appointments_insert_manager
  on public.appointments
  for insert to authenticated
  with check (public.can_manage_appointments(company_id));

create policy appointments_update_manager
  on public.appointments
  for update to authenticated
  using (public.can_manage_appointments(company_id))
  with check (public.can_manage_appointments(company_id));

create policy appointments_delete_manager
  on public.appointments
  for delete to authenticated
  using (public.can_manage_appointments(company_id));

create policy appointments_insert_employee
  on public.appointments
  for insert to authenticated
  with check (public.can_manage_appointments(company_id));

create policy appointments_update_employee
  on public.appointments
  for update to authenticated
  using (public.can_manage_appointments(company_id))
  with check (public.can_manage_appointments(company_id));

create policy appointments_delete_employee
  on public.appointments
  for delete to authenticated
  using (public.can_manage_appointments(company_id));

create or replace function public.is_workspace_slot_available(
  target_company_id uuid,
  target_service_id uuid,
  requested_starts_at timestamptz,
  exclude_appointment_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  service_duration integer;
  requested_ends_at timestamptz;
  tenant_timezone text;
  local_start time;
  local_end time;
  slot_weekday smallint;
begin
  select service.duration_minutes, settings.timezone
    into service_duration, tenant_timezone
  from public.services service
  join public.company_settings settings on settings.company_id = service.company_id
  where service.company_id = target_company_id
    and service.id = target_service_id
    and service.active
    and service.deleted_at is null;

  if service_duration is null then
    return false;
  end if;

  requested_ends_at := requested_starts_at + make_interval(mins => service_duration);
  local_start := (requested_starts_at at time zone tenant_timezone)::time;
  local_end := (requested_ends_at at time zone tenant_timezone)::time;
  slot_weekday := extract(dow from requested_starts_at at time zone tenant_timezone)::smallint;

  if not exists (
    select 1
    from public.business_hours hours
    where hours.company_id = target_company_id
      and hours.active
      and hours.weekday = slot_weekday
      and local_start >= hours.start_time
      and local_end <= hours.end_time
  ) then
    return false;
  end if;

  if exists (
    select 1
    from public.blocked_periods blocked
    where blocked.company_id = target_company_id
      and blocked.deleted_at is null
      and tstzrange(blocked.starts_at, blocked.ends_at, '[)')
          && tstzrange(requested_starts_at, requested_ends_at, '[)')
  ) then
    return false;
  end if;

  if exists (
    select 1
    from public.appointments appointment
    where appointment.company_id = target_company_id
      and appointment.deleted_at is null
      and appointment.status in ('pending', 'confirmed')
      and (exclude_appointment_id is null or appointment.id <> exclude_appointment_id)
      and tstzrange(appointment.starts_at, appointment.ends_at, '[)')
          && tstzrange(requested_starts_at, requested_ends_at, '[)')
  ) then
    return false;
  end if;

  return true;
end;
$$;

revoke all on function public.is_workspace_slot_available(uuid, uuid, timestamptz, uuid) from public;
grant execute on function public.is_workspace_slot_available(uuid, uuid, timestamptz, uuid)
  to authenticated, service_role;

create or replace function public.create_workspace_appointment(
  target_service_id uuid,
  target_customer_id uuid,
  requested_starts_at timestamptz,
  internal_notes text default null,
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
  tenant_id uuid;
  service_duration integer;
  effective_key text := nullif(trim(idempotency_key), '');
  existing_record public.appointments%rowtype;
  appointment_uuid uuid;
  requested_ends_at timestamptz;
begin
  if requested_starts_at is null then
    raise exception 'requested start time is required' using errcode = '22023';
  end if;

  if effective_key is not null
     and (length(effective_key) < 16 or length(effective_key) > 200) then
    raise exception 'a 16-200 character idempotency key is required' using errcode = '22023';
  end if;

  select service.company_id, service.duration_minutes
    into tenant_id, service_duration
  from public.services service
  join public.customers customer
    on customer.company_id = service.company_id
   and customer.id = target_customer_id
  where service.id = target_service_id
    and service.deleted_at is null
    and customer.deleted_at is null;

  if tenant_id is null then
    raise exception 'service or customer unavailable' using errcode = 'P0002';
  end if;

  if not public.can_manage_appointments(tenant_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if effective_key is not null then
    select * into existing_record
    from public.appointments
    where company_id = tenant_id
      and source = 'dashboard'
      and appointments.idempotency_key = effective_key;

    if found then
      if existing_record.service_id <> target_service_id
         or existing_record.customer_id <> target_customer_id
         or existing_record.starts_at <> requested_starts_at then
        raise exception 'idempotency key already used for another request' using errcode = '22023';
      end if;
      return query select existing_record.id, existing_record.status;
      return;
    end if;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(tenant_id::text || ':' || requested_starts_at::text, 0)
  );

  if not public.is_workspace_slot_available(
    tenant_id, target_service_id, requested_starts_at
  ) then
    raise exception 'requested slot is unavailable' using errcode = '23P01';
  end if;

  requested_ends_at := requested_starts_at + make_interval(mins => service_duration);

  begin
    insert into public.appointments (
      company_id, service_id, customer_id, starts_at, ends_at, status,
      internal_notes, source, idempotency_key, created_by
    )
    values (
      tenant_id, target_service_id, target_customer_id, requested_starts_at,
      requested_ends_at, 'pending', nullif(trim(internal_notes), ''),
      'dashboard', effective_key, auth.uid()
    )
    returning id into appointment_uuid;
  exception
    when exclusion_violation then
      raise exception 'requested slot is unavailable' using errcode = '23P01';
    when unique_violation then
      if effective_key is not null then
        select * into existing_record
        from public.appointments
        where company_id = tenant_id
          and source = 'dashboard'
          and appointments.idempotency_key = effective_key;

        if found then
          return query select existing_record.id, existing_record.status;
          return;
        end if;
      end if;
      raise exception 'requested slot is unavailable' using errcode = '23P01';
  end;

  return query select appointment_uuid, 'pending'::public.appointment_status;
end;
$$;

create or replace function public.update_appointment_status_secure(
  target_appointment_id uuid,
  requested_status public.appointment_status,
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
begin
  if effective_key is not null
     and (length(effective_key) < 16 or length(effective_key) > 200) then
    raise exception 'a 16-200 character idempotency key is required' using errcode = '22023';
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

  if locked_record.status = requested_status then
    return query select locked_record.id, locked_record.status;
    return;
  end if;

  update public.appointments
  set status = requested_status,
      updated_at = now()
  where id = locked_record.id
  returning * into locked_record;

  return query select locked_record.id, locked_record.status;
end;
$$;

create or replace function public.cancel_appointment_secure(
  target_appointment_id uuid,
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
begin
  return query
  select *
  from public.update_appointment_status_secure(
    target_appointment_id,
    'cancelled'::public.appointment_status,
    idempotency_key
  );
end;
$$;

create or replace function public.reschedule_appointment_secure(
  target_appointment_id uuid,
  requested_starts_at timestamptz,
  idempotency_key text default null
)
returns table (
  appointment_id uuid,
  appointment_status public.appointment_status,
  starts_at timestamptz,
  ends_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  locked_record public.appointments%rowtype;
  service_duration integer;
  requested_ends_at timestamptz;
  effective_key text := nullif(trim(idempotency_key), '');
begin
  if requested_starts_at is null then
    raise exception 'requested start time is required' using errcode = '22023';
  end if;

  if effective_key is not null
     and (length(effective_key) < 16 or length(effective_key) > 200) then
    raise exception 'a 16-200 character idempotency key is required' using errcode = '22023';
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

  if locked_record.status not in ('pending', 'confirmed') then
    raise exception 'appointment cannot be rescheduled in its current status' using errcode = '22023';
  end if;

  if locked_record.starts_at = requested_starts_at then
    return query
    select locked_record.id, locked_record.status, locked_record.starts_at, locked_record.ends_at;
    return;
  end if;

  select duration_minutes into service_duration
  from public.services
  where company_id = locked_record.company_id
    and id = locked_record.service_id
    and deleted_at is null;

  if service_duration is null then
    raise exception 'service unavailable' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      locked_record.company_id::text || ':' || requested_starts_at::text,
      0
    )
  );

  if not public.is_workspace_slot_available(
    locked_record.company_id,
    locked_record.service_id,
    requested_starts_at,
    locked_record.id
  ) then
    raise exception 'requested slot is unavailable' using errcode = '23P01';
  end if;

  requested_ends_at := requested_starts_at + make_interval(mins => service_duration);

  begin
    update public.appointments
    set starts_at = requested_starts_at,
        ends_at = requested_ends_at,
        updated_at = now()
    where id = locked_record.id
    returning * into locked_record;
  exception
    when exclusion_violation then
      raise exception 'requested slot is unavailable' using errcode = '23P01';
  end;

  return query
  select locked_record.id, locked_record.status, locked_record.starts_at, locked_record.ends_at;
end;
$$;

create or replace function public.replace_business_hours(
  target_company_id uuid,
  rules jsonb
)
returns setof public.business_hours
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  parsed_rules jsonb := coalesce(rules, '[]'::jsonb);
  rule_count integer;
begin
  if jsonb_typeof(parsed_rules) <> 'array' then
    raise exception 'rules must be a json array' using errcode = '22023';
  end if;

  rule_count := jsonb_array_length(parsed_rules);
  if rule_count > 28 then
    raise exception 'at most 28 rules are allowed' using errcode = '22023';
  end if;

  if not public.can_configure_scheduling(target_company_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('business_hours:' || target_company_id::text, 0));

  delete from public.business_hours where company_id = target_company_id;

  if rule_count = 0 then
    return;
  end if;

  return query
  insert into public.business_hours (company_id, weekday, start_time, end_time, active)
  select
    target_company_id,
    (item ->> 'weekday')::smallint,
    (item ->> 'startTime')::time,
    (item ->> 'endTime')::time,
    coalesce((item ->> 'enabled')::boolean, true)
  from jsonb_array_elements(parsed_rules) item
  returning *;
end;
$$;

create or replace function public.create_public_appointment(
  company_slug text,
  requested_service_id uuid,
  requested_starts_at timestamptz,
  customer_name text,
  customer_phone text,
  customer_email text default null,
  customer_objective text default null,
  notes text default null,
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
  tenant_id uuid;
  tenant_timezone text;
  service_duration integer;
  effective_key text := coalesce(idempotency_key, public.request_idempotency_key());
  normalized_phone public.phone_e164;
  customer_uuid uuid;
  appointment_uuid uuid;
  resulting_status public.appointment_status;
  existing_record public.appointments%rowtype;
begin
  if effective_key is null or length(effective_key) < 16 or length(effective_key) > 200 then
    raise exception 'a 16-200 character idempotency key is required' using errcode = '22023';
  end if;
  if requested_starts_at is null
     or length(trim(customer_name)) not between 2 and 160
     or customer_email is not null
        and customer_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'invalid appointment data' using errcode = '22023';
  end if;

  normalized_phone := public.normalize_phone(customer_phone);

  select company.id, settings.timezone, service.duration_minutes,
         case settings.booking_flow
           when 'instant_confirmation' then 'confirmed'::public.appointment_status
           else 'pending'::public.appointment_status
         end
    into tenant_id, tenant_timezone, service_duration, resulting_status
  from public.companies company
  join public.company_settings settings on settings.company_id = company.id
  join public.landing_pages page on page.company_id = company.id
  join public.services service
    on service.company_id = company.id and service.id = requested_service_id
  where company.slug = company_slug
    and company.active
    and company.status in ('trial', 'active')
    and company.deleted_at is null
    and settings.booking_enabled
    and page.published and page.deleted_at is null
    and service.active and service.publicly_visible and service.deleted_at is null;

  if tenant_id is null then
    raise exception 'company or service unavailable' using errcode = 'P0002';
  end if;

  select * into existing_record
  from public.appointments
  where company_id = tenant_id
    and source = 'public_landing'
    and appointments.idempotency_key = effective_key;

  if found then
    if existing_record.service_id <> requested_service_id
       or existing_record.starts_at <> requested_starts_at then
      raise exception 'idempotency key already used for another request' using errcode = '22023';
    end if;
    return query select existing_record.id, existing_record.status;
    return;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(tenant_id::text || ':' || requested_starts_at::text, 0)
  );

  if not exists (
    select 1
    from public.get_public_availability(
      company_slug,
      requested_service_id,
      (requested_starts_at at time zone tenant_timezone)::date,
      (requested_starts_at at time zone tenant_timezone)::date
    ) available
    where available.slot_start = requested_starts_at
  ) then
    raise exception 'requested slot is unavailable' using errcode = '23P01';
  end if;

  insert into public.customers (company_id, full_name, phone, email, status)
  values (
    tenant_id, trim(customer_name), normalized_phone,
    nullif(trim(customer_email), '')::extensions.citext, 'new'
  )
  on conflict (company_id, phone) where deleted_at is null
  do update set
    full_name = excluded.full_name,
    email = coalesce(excluded.email, customers.email),
    updated_at = now()
  returning id into customer_uuid;

  begin
    insert into public.appointments (
      company_id, service_id, customer_id, starts_at, ends_at, status,
      objective, customer_notes, source, idempotency_key
    )
    values (
      tenant_id, requested_service_id, customer_uuid, requested_starts_at,
      requested_starts_at + make_interval(mins => service_duration), resulting_status,
      nullif(trim(customer_objective), ''), nullif(trim(notes), ''),
      'public_landing', effective_key
    )
    returning id into appointment_uuid;
  exception
    when exclusion_violation then
      raise exception 'requested slot is unavailable' using errcode = '23P01';
    when unique_violation then
      select * into existing_record
      from public.appointments
      where company_id = tenant_id
        and source = 'public_landing'
        and appointments.idempotency_key = effective_key;

      if found then
        if existing_record.service_id <> requested_service_id
           or existing_record.starts_at <> requested_starts_at then
          raise exception 'idempotency key already used for another request' using errcode = '22023';
        end if;
        return query select existing_record.id, existing_record.status;
        return;
      end if;
      raise exception 'requested slot is unavailable' using errcode = '23P01';
  end;

  insert into public.outbox_events (
    company_id, aggregate_type, aggregate_id, event_type, idempotency_key, payload
  )
  values (
    tenant_id, 'appointment', appointment_uuid, 'appointment.created',
    'appointment.created:' || effective_key,
    jsonb_build_object('appointment_id', appointment_uuid, 'company_id', tenant_id)
  );

  return query select appointment_uuid, resulting_status;
end;
$$;

revoke all on function public.create_workspace_appointment(uuid, uuid, timestamptz, text, text) from public;
revoke all on function public.update_appointment_status_secure(uuid, public.appointment_status, text) from public;
revoke all on function public.cancel_appointment_secure(uuid, text) from public;
revoke all on function public.reschedule_appointment_secure(uuid, timestamptz, text) from public;
revoke all on function public.replace_business_hours(uuid, jsonb) from public;

grant execute on function public.create_workspace_appointment(uuid, uuid, timestamptz, text, text)
  to authenticated, service_role;
grant execute on function public.update_appointment_status_secure(uuid, public.appointment_status, text)
  to authenticated, service_role;
grant execute on function public.cancel_appointment_secure(uuid, text)
  to authenticated, service_role;
grant execute on function public.reschedule_appointment_secure(uuid, timestamptz, text)
  to authenticated, service_role;
grant execute on function public.replace_business_hours(uuid, jsonb)
  to authenticated, service_role;
