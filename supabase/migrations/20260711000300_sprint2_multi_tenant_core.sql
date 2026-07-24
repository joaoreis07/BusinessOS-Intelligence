-- Sprint 2 core: workspace, invitations and onboarding transaction.

set search_path = public, extensions;

alter type public.membership_role add value if not exists 'manager';
alter type public.membership_role add value if not exists 'employee';

create table if not exists public.company_invitations (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email extensions.citext not null,
  role public.membership_role not null default 'employee',
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  last_sent_at timestamptz not null default now(),
  accepted_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id)
);

create unique index if not exists company_invitations_pending_email_idx
  on public.company_invitations (company_id, email)
  where status = 'pending';

create table if not exists public.workspace_preferences (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  date_format text not null default 'dd/MM/yyyy',
  time_format text not null default '24h' check (time_format in ('12h', '24h')),
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id),
  unique (company_id, id)
);

alter table public.company_settings
  add column if not exists locale text not null default 'pt-BR',
  add column if not exists country_code char(2) not null default 'BR' check (country_code ~ '^[A-Z]{2}$'),
  add column if not exists logo_path text;

create index if not exists company_invitations_company_status_idx
  on public.company_invitations (company_id, status, created_at desc);

create or replace function public.complete_company_onboarding(
  company_name text,
  requested_slug text,
  business_type text default null,
  selected_timezone text default 'America/Sao_Paulo',
  selected_locale text default 'pt-BR',
  selected_country_code text default 'BR',
  selected_currency text default 'BRL',
  selected_logo_path text default null,
  selected_primary_color text default '#18181B'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  actor uuid := auth.uid();
  already_member uuid;
  created_company uuid;
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select membership.company_id into already_member
  from public.company_memberships membership
  where membership.user_id = actor
    and membership.deleted_at is null
    and membership.accepted_at is not null
  order by membership.created_at
  limit 1;

  if already_member is not null then
    return already_member;
  end if;

  created_company := public.create_company(company_name, requested_slug, business_type);

  update public.company_settings
  set
    timezone = selected_timezone,
    locale = selected_locale,
    country_code = upper(selected_country_code),
    currency = upper(selected_currency),
    logo_path = selected_logo_path,
    primary_color = selected_primary_color
  where company_id = created_company;

  insert into public.workspace_preferences (company_id, user_id, locale, timezone)
  values (created_company, actor, selected_locale, selected_timezone)
  on conflict (company_id, user_id) do update set
    locale = excluded.locale,
    timezone = excluded.timezone;

  return created_company;
end;
$$;

create or replace function public.accept_company_invitation(invitation_token text)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  actor uuid := auth.uid();
  actor_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  invite public.company_invitations%rowtype;
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select *
  into invite
  from public.company_invitations
  where token = invitation_token
  limit 1;

  if invite.id is null then
    raise exception 'invitation not found' using errcode = 'P0002';
  end if;
  if invite.status <> 'pending' then
    raise exception 'invitation already processed' using errcode = 'P0001';
  end if;
  if invite.expires_at < now() then
    update public.company_invitations
    set status = 'expired', updated_at = now()
    where id = invite.id;
    raise exception 'invitation expired' using errcode = 'P0001';
  end if;
  if actor_email = '' or actor_email <> lower(invite.email::text) then
    raise exception 'invitation email mismatch' using errcode = '42501';
  end if;

  insert into public.company_memberships (
    company_id, user_id, role, invited_by, accepted_at
  )
  values (
    invite.company_id, actor, invite.role, invite.invited_by, now()
  )
  on conflict (company_id, user_id)
  do update set
    role = excluded.role,
    invited_by = excluded.invited_by,
    accepted_at = coalesce(public.company_memberships.accepted_at, now()),
    deleted_at = null;

  insert into public.workspace_preferences (company_id, user_id)
  values (invite.company_id, actor)
  on conflict (company_id, user_id) do nothing;

  update public.company_invitations
  set
    status = 'accepted',
    accepted_by = actor,
    accepted_at = now(),
    updated_at = now()
  where id = invite.id;

  return invite.company_id;
end;
$$;

revoke all on function public.complete_company_onboarding(text, text, text, text, text, text, text, text, text) from public;
revoke all on function public.accept_company_invitation(text) from public;
grant execute on function public.complete_company_onboarding(text, text, text, text, text, text, text, text, text)
  to authenticated;
grant execute on function public.accept_company_invitation(text) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'company_invitations_set_updated_at'
  ) then
    create trigger company_invitations_set_updated_at
    before update on public.company_invitations
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'workspace_preferences_set_updated_at'
  ) then
    create trigger workspace_preferences_set_updated_at
    before update on public.workspace_preferences
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'workspace_preferences_company_immutable'
  ) then
    create trigger workspace_preferences_company_immutable
    before update on public.workspace_preferences
    for each row execute function public.prevent_company_id_change();
  end if;
end
$$;
