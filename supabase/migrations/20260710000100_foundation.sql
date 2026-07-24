-- BusinessOS database foundation: extensions, domains, enums and shared helpers.
-- All application objects live in public; extensions are isolated in extensions.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;
create extension if not exists citext with schema extensions;

set search_path = public, extensions;

create domain public.phone_e164 as text
  check (value ~ '^\+[1-9][0-9]{7,14}$');

create type public.membership_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.company_status as enum ('trial', 'active', 'inactive', 'blocked', 'cancelled');
create type public.booking_flow as enum ('instant_confirmation', 'manual_approval', 'payment_required');
create type public.section_type as enum ('hero', 'about', 'services', 'differentials', 'testimonials', 'gallery', 'faq', 'contact', 'location', 'social', 'booking', 'footer', 'custom');
create type public.media_kind as enum ('logo', 'avatar', 'banner', 'service', 'testimonial', 'gallery', 'document', 'other');
create type public.customer_status as enum ('new', 'active', 'following', 'inactive');
create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
create type public.appointment_event_type as enum ('created', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show', 'note_added');
create type public.financial_type as enum ('income', 'expense');
create type public.financial_status as enum ('pending', 'paid', 'cancelled', 'overdue');
create type public.billing_interval as enum ('month', 'year');
create type public.subscription_status as enum ('trial', 'active', 'pending', 'past_due', 'cancelled', 'suspended', 'expired');
create type public.payment_status as enum ('pending', 'approved', 'failed', 'refunded', 'cancelled');
create type public.integration_provider as enum ('mercado_pago', 'whatsapp', 'email', 'google_calendar', 'google_meet', 'outlook', 'apple_calendar', 'zapier', 'custom');
create type public.integration_status as enum ('disconnected', 'pending', 'connected', 'error', 'revoked');
create type public.event_status as enum ('pending', 'processing', 'processed', 'failed', 'dead_letter');
create type public.notification_channel as enum ('in_app', 'email', 'whatsapp', 'push');

create or replace function public.normalize_phone(input text)
returns public.phone_e164
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  digits text := regexp_replace(input, '[^0-9]', '', 'g');
begin
  if left(digits, 2) = '00' then
    digits := substring(digits from 3);
  end if;
  if length(digits) in (10, 11) then
    digits := '55' || digits;
  end if;
  return ('+' || digits)::public.phone_e164;
end;
$$;

create or replace function public.slugify(input text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    translate(lower(input),
      'áàâãäåéèêëíìîïóòôõöúùûüçñ',
      'aaaaaaeeeeiiiiooooouuuucn'),
    '[^a-z0-9]+', '-', 'g'
  ));
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.prevent_company_id_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.company_id is distinct from old.company_id then
    raise exception 'company_id is immutable' using errcode = '22023';
  end if;
  return new;
end;
$$;

create or replace function public.request_idempotency_key()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(current_setting('request.headers', true)::jsonb ->> 'x-idempotency-key', '');
$$;

revoke all on function public.normalize_phone(text) from public;
grant execute on function public.normalize_phone(text) to anon, authenticated, service_role;
revoke all on function public.slugify(text) from public;
grant execute on function public.slugify(text) to authenticated, service_role;
