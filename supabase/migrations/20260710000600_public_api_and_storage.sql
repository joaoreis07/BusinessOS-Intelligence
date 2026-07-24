-- Curated public surface: published content, availability and anonymous booking.

set search_path = public, extensions;

create view public.public_landing_pages
with (security_barrier = true)
as
select
  company.id as company_id,
  company.slug::text as slug,
  company.name,
  company.professional_name,
  company.specialty,
  company.description,
  company.biography,
  company.email::text as email,
  company.phone,
  company.whatsapp,
  company.address,
  company.social_links,
  page.title,
  page.meta_description,
  page.logo_path,
  page.avatar_path,
  page.banner_path,
  page.seo,
  settings.primary_color,
  settings.secondary_color,
  settings.accent_color,
  settings.background_color,
  settings.theme
from public.companies company
join public.landing_pages page on page.company_id = company.id
join public.company_settings settings on settings.company_id = company.id
where company.active
  and company.status in ('trial', 'active')
  and company.deleted_at is null
  and page.published
  and page.deleted_at is null;

create view public.public_landing_sections
with (security_barrier = true)
as
select
  company.slug::text as slug,
  section.section_type,
  section.title,
  section.content,
  section.display_order
from public.landing_sections section
join public.landing_pages page
  on page.company_id = section.company_id and page.id = section.landing_page_id
join public.companies company on company.id = section.company_id
where company.active
  and company.status in ('trial', 'active')
  and company.deleted_at is null
  and page.published
  and page.deleted_at is null
  and section.enabled
  and section.deleted_at is null;

create view public.public_services
with (security_barrier = true)
as
select
  company.slug::text as slug,
  service.id,
  service.name,
  service.description,
  service.category,
  service.price,
  service.duration_minutes,
  service.image_path,
  service.display_order
from public.services service
join public.companies company on company.id = service.company_id
join public.landing_pages page on page.company_id = company.id
where company.active
  and company.status in ('trial', 'active')
  and company.deleted_at is null
  and page.published
  and page.deleted_at is null
  and service.active
  and service.publicly_visible
  and service.deleted_at is null;

create view public.public_testimonials
with (security_barrier = true)
as
select
  company.slug::text as slug,
  testimonial.customer_name,
  testimonial.quote,
  testimonial.rating,
  testimonial.photo_path,
  testimonial.display_order
from public.testimonials testimonial
join public.companies company on company.id = testimonial.company_id
join public.landing_pages page on page.company_id = company.id
where company.active
  and company.status in ('trial', 'active')
  and company.deleted_at is null
  and page.published
  and page.deleted_at is null
  and testimonial.published
  and testimonial.deleted_at is null;

revoke all on public.public_landing_pages, public.public_landing_sections,
  public.public_services, public.public_testimonials from public;
grant select on public.public_landing_pages, public.public_landing_sections,
  public.public_services, public.public_testimonials to anon, authenticated;

create or replace function public.get_public_availability(
  company_slug text,
  requested_service_id uuid,
  date_from date,
  date_to date default null
)
returns table (
  slot_start timestamptz,
  slot_end timestamptz
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  tenant_id uuid;
  tenant_timezone text;
  service_duration integer;
  interval_minutes integer;
  minimum_notice integer;
  horizon integer;
  daily_limit integer;
  effective_to date := coalesce(date_to, date_from);
begin
  if date_from is null
     or effective_to < date_from
     or effective_to > date_from + 30 then
    raise exception 'date range must contain 1 to 31 days' using errcode = '22023';
  end if;

  select company.id, settings.timezone, service.duration_minutes,
         settings.booking_interval_minutes, settings.booking_min_notice_minutes,
         settings.booking_horizon_days, settings.max_appointments_per_day
    into tenant_id, tenant_timezone, service_duration, interval_minutes,
         minimum_notice, horizon, daily_limit
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
    return;
  end if;

  if date_from > (now() at time zone tenant_timezone)::date + horizon then
    return;
  end if;

  return query
  with candidate_slots as (
    select
      generated.slot_start,
      generated.slot_start + make_interval(mins => service_duration) as slot_end
    from generate_series(date_from, effective_to, interval '1 day') requested_day
    join public.business_hours hours
      on hours.company_id = tenant_id
     and hours.weekday = extract(dow from requested_day)::smallint
     and hours.active
    cross join lateral generate_series(
      (requested_day::date + hours.start_time) at time zone tenant_timezone,
      ((requested_day::date + hours.end_time) at time zone tenant_timezone)
        - make_interval(mins => service_duration),
      make_interval(mins => interval_minutes)
    ) generated(slot_start)
  )
  select candidate.slot_start, candidate.slot_end
  from candidate_slots candidate
  where candidate.slot_start >= now() + make_interval(mins => minimum_notice)
    and candidate.slot_start
      < (((now() at time zone tenant_timezone)::date + horizon + 1)::timestamp
          at time zone tenant_timezone)
    and not exists (
      select 1 from public.blocked_periods blocked
      where blocked.company_id = tenant_id
        and blocked.deleted_at is null
        and tstzrange(blocked.starts_at, blocked.ends_at, '[)')
          && tstzrange(candidate.slot_start, candidate.slot_end, '[)')
    )
    and not exists (
      select 1 from public.appointments appointment
      where appointment.company_id = tenant_id
        and appointment.deleted_at is null
        and appointment.status in ('pending', 'confirmed')
        and tstzrange(appointment.starts_at, appointment.ends_at, '[)')
          && tstzrange(candidate.slot_start, candidate.slot_end, '[)')
    )
    and (
      daily_limit is null
      or (
        select count(*)
        from public.appointments appointment
        where appointment.company_id = tenant_id
          and appointment.deleted_at is null
          and appointment.status in ('pending', 'confirmed')
          and (appointment.starts_at at time zone tenant_timezone)::date
            = (candidate.slot_start at time zone tenant_timezone)::date
      ) < daily_limit
    )
  order by candidate.slot_start;
end;
$$;

revoke all on function public.get_public_availability(text, uuid, date, date) from public;
grant execute on function public.get_public_availability(text, uuid, date, date)
  to anon, authenticated;

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

  -- Serialize contenders for the same tenant/start instant before checking availability.
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

revoke all on function public.create_public_appointment(
  text, uuid, timestamptz, text, text, text, text, text, text
) from public;
grant execute on function public.create_public_appointment(
  text, uuid, timestamptz, text, text, text, text, text, text
) to anon, authenticated;

-- Public images only. Private documents should use a separate private bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-public-media',
  'company-public-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy company_public_media_read
on storage.objects for select to anon, authenticated
using (bucket_id = 'company-public-media');

create policy company_public_media_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'company-public-media'
  and public.has_company_role(
    (storage.foldername(name))[1]::uuid,
    array['owner', 'admin']::public.membership_role[]
  )
);

create policy company_public_media_update
on storage.objects for update to authenticated
using (
  bucket_id = 'company-public-media'
  and public.has_company_role(
    (storage.foldername(name))[1]::uuid,
    array['owner', 'admin']::public.membership_role[]
  )
)
with check (
  bucket_id = 'company-public-media'
  and public.has_company_role(
    (storage.foldername(name))[1]::uuid,
    array['owner', 'admin']::public.membership_role[]
  )
);

create policy company_public_media_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'company-public-media'
  and public.has_company_role(
    (storage.foldername(name))[1]::uuid,
    array['owner', 'admin']::public.membership_role[]
  )
);
