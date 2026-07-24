-- BusinessOS plans, subscriptions, integrations, durable events and audit.

set search_path = public, extensions;

create table public.plans (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z][a-z0-9_]{1,62}$'),
  name text not null,
  description text,
  price numeric(14,2) not null check (price >= 0),
  currency char(3) not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  billing_interval public.billing_interval not null,
  trial_days integer not null default 7 check (trial_days between 0 and 365),
  active boolean not null default true,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, code)
);

create table public.plan_features (
  id uuid primary key default extensions.gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  feature_key text not null check (feature_key ~ '^[a-z][a-z0-9_]{1,62}$'),
  enabled boolean not null default true,
  limits jsonb not null default '{}'::jsonb check (jsonb_typeof(limits) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, feature_key)
);

create table public.subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status public.subscription_status not null default 'trial',
  provider public.integration_provider not null default 'mercado_pago',
  external_customer_id text,
  external_subscription_id text,
  trial_ends_at timestamptz,
  current_period_starts_at timestamptz not null default now(),
  current_period_ends_at timestamptz,
  next_payment_at timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  grace_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  unique (provider, external_subscription_id),
  check (current_period_ends_at is null or current_period_starts_at < current_period_ends_at),
  check ((status = 'trial' and trial_ends_at is not null) or status <> 'trial')
);

create unique index subscriptions_one_current_company_idx
  on public.subscriptions (company_id)
  where status in ('trial', 'active', 'pending', 'past_due', 'suspended');

create table public.subscription_payments (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null,
  subscription_id uuid not null,
  provider public.integration_provider not null default 'mercado_pago',
  external_payment_id text,
  idempotency_key text,
  amount numeric(14,2) not null check (amount > 0),
  currency char(3) not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  status public.payment_status not null default 'pending',
  payment_method text,
  due_at timestamptz,
  paid_at timestamptz,
  raw_status text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  unique (provider, external_payment_id),
  unique (provider, idempotency_key),
  foreign key (company_id, subscription_id)
    references public.subscriptions(company_id, id) on delete restrict,
  check ((status = 'approved' and paid_at is not null) or status <> 'approved')
);

create table public.platform_roles (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('platform_admin', 'support', 'billing_admin')),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.integrations (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider public.integration_provider not null,
  status public.integration_status not null default 'disconnected',
  external_account_id text,
  public_config jsonb not null default '{}'::jsonb check (jsonb_typeof(public_config) = 'object'),
  encrypted_credentials bytea,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, provider),
  unique (company_id, id)
);

create table public.webhook_events (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  provider public.integration_provider not null,
  external_event_id text not null,
  event_type text not null,
  status public.event_status not null default 'pending',
  signature_valid boolean not null default false,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  attempts integer not null default 0 check (attempts >= 0),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  next_attempt_at timestamptz,
  last_error text,
  unique (provider, external_event_id),
  unique (company_id, id)
);

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete cascade,
  channel public.notification_channel not null default 'in_app',
  type text not null,
  title text not null,
  message text not null,
  action_url text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (company_id, id)
);

create table public.outbox_events (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  idempotency_key text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status public.event_status not null default 'pending',
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (event_type, idempotency_key),
  unique (company_id, id)
);

create table public.activity_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  module text not null,
  entity_type text,
  entity_id uuid,
  request_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  unique (company_id, id)
);

create index plan_features_plan_idx on public.plan_features (plan_id, feature_key);
create index subscriptions_company_history_idx on public.subscriptions (company_id, created_at desc);
create index subscription_payments_history_idx on public.subscription_payments (company_id, created_at desc);
create index integrations_company_status_idx on public.integrations (company_id, status) where deleted_at is null;
create index webhook_events_queue_idx on public.webhook_events (status, next_attempt_at, received_at) where status in ('pending', 'failed');
create index notifications_recipient_idx on public.notifications (recipient_user_id, created_at desc) where read_at is null;
create index outbox_events_queue_idx on public.outbox_events (status, available_at, created_at) where status in ('pending', 'failed');
create index activity_logs_company_idx on public.activity_logs (company_id, created_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'plans', 'plan_features', 'subscriptions', 'subscription_payments', 'integrations'
  ] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'subscriptions', 'subscription_payments', 'integrations'
  ] loop
    execute format('create trigger %I_company_immutable before update on public.%I for each row execute function public.prevent_company_id_change()', table_name, table_name);
  end loop;
end;
$$;
