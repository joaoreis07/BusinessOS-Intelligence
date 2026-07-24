-- BusinessOS services, scheduling, CRM and finance.

set search_path = public, extensions;

create table public.services (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 160),
  description text,
  category text,
  price numeric(14,2) not null default 0 check (price >= 0),
  duration_minutes integer not null check (duration_minutes between 5 and 1440),
  image_path text,
  active boolean not null default true,
  publicly_visible boolean not null default true,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, id)
);

create table public.business_hours (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, weekday, start_time, end_time),
  unique (company_id, id),
  check (start_time < end_time)
);

alter table public.business_hours
  add constraint business_hours_no_overlap
  exclude using gist (
    company_id with =,
    weekday with =,
    (int4range(
      extract(epoch from start_time)::integer,
      extract(epoch from end_time)::integer,
      '[)'
    )) with &&
  ) where (active);

create table public.blocked_periods (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  all_day boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, id),
  check (starts_at < ends_at)
);

create table public.customers (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 2 and 160),
  email extensions.citext,
  phone public.phone_e164 not null,
  whatsapp public.phone_e164,
  birth_date date,
  gender text,
  city text,
  state text check (state is null or state ~ '^[A-Z]{2}$'),
  profession text,
  acquisition_source text,
  objectives text,
  status public.customer_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, id)
);

create unique index customers_company_phone_idx
  on public.customers (company_id, phone)
  where deleted_at is null;

create table public.customer_notes (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null,
  customer_id uuid not null,
  content text not null check (length(trim(content)) between 1 and 10000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, id),
  foreign key (company_id, customer_id)
    references public.customers(company_id, id) on delete restrict
);

create table public.appointments (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  service_id uuid not null,
  customer_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'pending',
  objective text,
  customer_notes text,
  internal_notes text,
  source text not null default 'dashboard' check (source in ('dashboard', 'public_landing', 'integration', 'import')),
  idempotency_key text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, id),
  foreign key (company_id, service_id)
    references public.services(company_id, id) on delete restrict,
  foreign key (company_id, customer_id)
    references public.customers(company_id, id) on delete restrict,
  check (starts_at < ends_at),
  check (length(idempotency_key) <= 200)
);

create unique index appointments_idempotency_idx
  on public.appointments (company_id, source, idempotency_key)
  where idempotency_key is not null;

alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    company_id with =,
    (tstzrange(starts_at, ends_at, '[)')) with &&
  ) where (status in ('pending', 'confirmed') and deleted_at is null);

create table public.appointment_events (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null,
  appointment_id uuid not null,
  event_type public.appointment_event_type not null,
  from_status public.appointment_status,
  to_status public.appointment_status,
  actor_user_id uuid references auth.users(id) on delete set null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, appointment_id)
    references public.appointments(company_id, id) on delete cascade
);

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
      (company_id, appointment_id, event_type, from_status, to_status, actor_user_id)
    values (
      new.company_id,
      new.id,
      case new.status
        when 'confirmed' then 'confirmed'::public.appointment_event_type
        when 'completed' then 'completed'::public.appointment_event_type
        when 'cancelled' then 'cancelled'::public.appointment_event_type
        when 'no_show' then 'no_show'::public.appointment_event_type
        else 'rescheduled'::public.appointment_event_type
      end,
      old.status,
      new.status,
      auth.uid()
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

create trigger appointments_record_event
after insert or update on public.appointments
for each row execute function public.record_appointment_event();

create table public.financial_categories (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 100),
  transaction_type public.financial_type not null,
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, name, transaction_type),
  unique (company_id, id)
);

create table public.financial_transactions (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid not null,
  customer_id uuid,
  service_id uuid,
  appointment_id uuid,
  transaction_type public.financial_type not null,
  description text not null check (length(trim(description)) between 2 and 500),
  amount numeric(14,2) not null check (amount > 0),
  status public.financial_status not null default 'pending',
  payment_method text,
  due_date date not null,
  paid_at timestamptz,
  external_reference text,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, id),
  foreign key (company_id, category_id)
    references public.financial_categories(company_id, id) on delete restrict,
  foreign key (company_id, customer_id)
    references public.customers(company_id, id) on delete restrict,
  foreign key (company_id, service_id)
    references public.services(company_id, id) on delete restrict,
  foreign key (company_id, appointment_id)
    references public.appointments(company_id, id) on delete restrict,
  check ((status = 'paid' and paid_at is not null) or status <> 'paid'),
  check (length(idempotency_key) <= 200)
);

create unique index financial_transactions_idempotency_idx
  on public.financial_transactions (company_id, idempotency_key)
  where idempotency_key is not null;

create index services_public_idx on public.services (company_id, display_order) where active and publicly_visible and deleted_at is null;
create index business_hours_lookup_idx on public.business_hours (company_id, weekday, start_time) where active;
create index blocked_periods_lookup_idx on public.blocked_periods (company_id, starts_at, ends_at) where deleted_at is null;
create index customers_search_idx on public.customers (company_id, full_name) where deleted_at is null;
create index customer_notes_customer_idx on public.customer_notes (company_id, customer_id, created_at desc) where deleted_at is null;
create index appointments_calendar_idx on public.appointments (company_id, starts_at, status) where deleted_at is null;
create index appointments_customer_idx on public.appointments (company_id, customer_id, starts_at desc) where deleted_at is null;
create index financial_transactions_due_idx on public.financial_transactions (company_id, due_date, status) where deleted_at is null;
create index financial_transactions_customer_idx on public.financial_transactions (company_id, customer_id, created_at desc) where deleted_at is null;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'services', 'business_hours', 'blocked_periods', 'customers', 'customer_notes',
    'appointments', 'financial_categories', 'financial_transactions'
  ] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
    execute format('create trigger %I_company_immutable before update on public.%I for each row execute function public.prevent_company_id_change()', table_name, table_name);
  end loop;
end;
$$;
