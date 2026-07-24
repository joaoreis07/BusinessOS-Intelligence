-- BusinessOS tenants, memberships, feature catalog and public-page content.

set search_path = public, extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  phone public.phone_e164,
  avatar_url text,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.companies (
  id uuid primary key default extensions.gen_random_uuid(),
  slug extensions.citext not null unique check (slug::text ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$'),
  name text not null check (length(trim(name)) between 2 and 160),
  legal_name text,
  tax_id text,
  business_type text,
  professional_name text,
  specialty text,
  description text,
  biography text,
  email extensions.citext,
  phone public.phone_e164,
  whatsapp public.phone_e164,
  address jsonb not null default '{}'::jsonb check (jsonb_typeof(address) = 'object'),
  social_links jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links) = 'object'),
  status public.company_status not null default 'trial',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, slug)
);

create table public.company_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null default 'member',
  invited_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, user_id),
  unique (company_id, id)
);

create unique index company_one_owner_idx
  on public.company_memberships (company_id)
  where role = 'owner' and deleted_at is null;

create table public.company_settings (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  timezone text not null default 'America/Sao_Paulo',
  currency char(3) not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  booking_enabled boolean not null default true,
  booking_flow public.booking_flow not null default 'manual_approval',
  booking_min_notice_minutes integer not null default 120 check (booking_min_notice_minutes >= 0),
  booking_interval_minutes integer not null default 30 check (booking_interval_minutes between 5 and 1440),
  booking_horizon_days integer not null default 90 check (booking_horizon_days between 1 and 730),
  max_appointments_per_day integer check (max_appointments_per_day > 0),
  default_financial_status public.financial_status not null default 'pending',
  theme text not null default 'light' check (theme in ('light', 'dark', 'system')),
  primary_color text not null default '#18181B' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color text not null default '#71717A' check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color text not null default '#2563EB' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  background_color text not null default '#FFFFFF' check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id)
);

create table public.company_features (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  feature_key text not null check (feature_key ~ '^[a-z][a-z0-9_]{1,62}$'),
  enabled boolean not null default false,
  source text not null default 'manual' check (source in ('plan', 'addon', 'manual', 'trial')),
  configuration jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration) = 'object'),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, feature_key),
  unique (company_id, id)
);

create table public.landing_pages (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  title text not null,
  meta_description text,
  custom_domain extensions.citext unique,
  logo_path text,
  avatar_path text,
  banner_path text,
  published boolean not null default false,
  published_at timestamptz,
  seo jsonb not null default '{}'::jsonb check (jsonb_typeof(seo) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, id),
  check ((published and published_at is not null) or not published)
);

create table public.landing_sections (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null,
  landing_page_id uuid not null,
  section_type public.section_type not null,
  title text,
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  enabled boolean not null default true,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (landing_page_id, section_type),
  unique (company_id, id),
  foreign key (company_id, landing_page_id)
    references public.landing_pages(company_id, id) on delete cascade
);

create table public.testimonials (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_name text not null check (length(trim(customer_name)) between 2 and 120),
  quote text not null check (length(trim(quote)) between 3 and 2000),
  rating smallint check (rating between 1 and 5),
  photo_path text,
  published boolean not null default false,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, id)
);

create table public.media_assets (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  bucket_id text not null default 'company-public-media'
    check (bucket_id = 'company-public-media'),
  object_path text not null,
  kind public.media_kind not null default 'other',
  alt_text text,
  mime_type text,
  byte_size bigint check (byte_size >= 0),
  width integer check (width > 0),
  height integer check (height > 0),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (bucket_id, object_path),
  unique (company_id, id),
  check (object_path like company_id::text || '/%')
);

create index company_memberships_user_idx on public.company_memberships (user_id, company_id) where deleted_at is null;
create index company_features_enabled_idx on public.company_features (company_id, feature_key) where enabled;
create index landing_sections_order_idx on public.landing_sections (landing_page_id, display_order) where deleted_at is null and enabled;
create index testimonials_public_idx on public.testimonials (company_id, display_order) where published and deleted_at is null;
create index media_assets_company_kind_idx on public.media_assets (company_id, kind) where deleted_at is null;

create or replace function public.bootstrap_company_records()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.company_settings (company_id) values (new.id);
  insert into public.landing_pages (company_id, title) values (new.id, new.name);
  insert into public.company_features (company_id, feature_key, enabled, source)
  values
    (new.id, 'landing_page', true, 'trial'),
    (new.id, 'appointments', true, 'trial'),
    (new.id, 'crm', true, 'trial'),
    (new.id, 'financial', true, 'trial');
  return new;
end;
$$;

create trigger companies_bootstrap_after_insert
after insert on public.companies
for each row execute function public.bootstrap_company_records();

create or replace function public.create_company(company_name text, requested_slug text, business_type text default null)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  actor uuid := auth.uid();
  company_uuid uuid;
  clean_slug text := public.slugify(requested_slug);
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if length(trim(company_name)) < 2 or clean_slug = '' then
    raise exception 'invalid company name or slug' using errcode = '22023';
  end if;

  insert into public.companies (name, slug, business_type)
  values (trim(company_name), clean_slug, business_type)
  returning id into company_uuid;

  insert into public.company_memberships (company_id, user_id, role, accepted_at)
  values (company_uuid, actor, 'owner', now());

  return company_uuid;
end;
$$;

revoke all on function public.create_company(text, text, text) from public;
grant execute on function public.create_company(text, text, text) to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'companies', 'company_memberships', 'company_settings',
    'company_features', 'landing_pages', 'landing_sections', 'testimonials',
    'media_assets'
  ] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'company_memberships', 'company_settings', 'company_features', 'landing_pages',
    'landing_sections', 'testimonials', 'media_assets'
  ] loop
    execute format('create trigger %I_company_immutable before update on public.%I for each row execute function public.prevent_company_id_change()', table_name, table_name);
  end loop;
end;
$$;
