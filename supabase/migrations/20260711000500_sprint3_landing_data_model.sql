-- Sprint 3: Landing Page Dinâmica — data model, preview tokens, gallery and future-ready config.

set search_path = public, extensions;

-- Roles allowed to manage landing content (aligned with landing:manage in application layer).
create or replace function public.can_manage_landing(target_company_id uuid)
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

revoke all on function public.can_manage_landing(uuid) from public;
grant execute on function public.can_manage_landing(uuid) to authenticated, service_role;

-- Reserved slugs cannot be used by tenant public routes.
create or replace function public.is_reserved_slug(candidate text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(candidate) = any (array[
    'login', 'cadastro', 'dashboard', 'admin', 'onboarding', 'api', 'auth',
    'preview', 'convite', 'recuperar-senha', 'redefinir-senha', 'agendar',
    'www', 'app', 'static', 'public', 'health', 'webhooks', '_next'
  ]);
$$;

revoke all on function public.is_reserved_slug(text) from public;
grant execute on function public.is_reserved_slug(text) to authenticated, anon, service_role;

-- Future-ready landing configuration without implementing templates/themes yet.
alter table public.landing_pages
  add column if not exists template_key text not null default 'default'
    check (template_key ~ '^[a-z][a-z0-9_-]{0,62}$'),
  add column if not exists layout_config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(layout_config) = 'object'),
  add column if not exists theme_config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(theme_config) = 'object'),
  add column if not exists integrations_config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(integrations_config) = 'object'),
  add column if not exists locale text not null default 'pt-BR'
    check (length(trim(locale)) between 2 and 10);

comment on column public.landing_pages.template_key is 'Future template selector. Sprint 3 uses default only.';
comment on column public.landing_pages.layout_config is 'Future drag-and-drop / layout metadata.';
comment on column public.landing_pages.theme_config is 'Future theme overrides beyond company_settings colors.';
comment on column public.landing_pages.integrations_config is 'Future analytics/pixel/GTM configuration placeholder.';
comment on column public.landing_pages.locale is 'Future i18n locale for public landing content.';

-- Secure preview tokens: store only hashed values, never plain tokens.
create table public.landing_preview_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  landing_page_id uuid not null,
  token_hash text not null check (length(token_hash) = 64),
  expires_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  access_count integer not null default 0 check (access_count >= 0),
  created_at timestamptz not null default now(),
  unique (company_id, id),
  unique (token_hash),
  foreign key (company_id, landing_page_id)
    references public.landing_pages(company_id, id) on delete cascade,
  check (expires_at > created_at)
);

create index landing_preview_tokens_company_active_idx
  on public.landing_preview_tokens (company_id, expires_at desc)
  where revoked_at is null;

create index landing_preview_tokens_expires_idx
  on public.landing_preview_tokens (expires_at)
  where revoked_at is null;

-- Ordered gallery items bound to media assets (Supabase Storage).
create table public.landing_gallery_items (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  landing_page_id uuid not null,
  media_asset_id uuid not null,
  caption text check (caption is null or length(trim(caption)) <= 300),
  alt_text text check (alt_text is null or length(trim(alt_text)) <= 200),
  display_order integer not null default 0 check (display_order >= 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, id),
  unique (landing_page_id, media_asset_id),
  foreign key (company_id, landing_page_id)
    references public.landing_pages(company_id, id) on delete cascade,
  foreign key (company_id, media_asset_id)
    references public.media_assets(company_id, id) on delete cascade
);

create index landing_gallery_items_order_idx
  on public.landing_gallery_items (landing_page_id, display_order)
  where deleted_at is null and enabled;

create index testimonials_manage_idx
  on public.testimonials (company_id, display_order)
  where deleted_at is null;

create trigger landing_gallery_items_set_updated_at
before update on public.landing_gallery_items
for each row execute function public.set_updated_at();

create trigger landing_gallery_items_prevent_company_id_change
before update on public.landing_gallery_items
for each row execute function public.prevent_company_id_change();

-- Create preview token (authenticated, landing managers only).
create or replace function public.create_landing_preview_token(
  target_company_id uuid,
  ttl_minutes integer default 60
)
returns table (
  preview_token text,
  expires_at timestamptz,
  company_slug text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_landing_page_id uuid;
  v_slug text;
  v_plain_token text;
  v_token_hash text;
  v_expires_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if target_company_id is null then
    raise exception 'Company id is required';
  end if;

  if ttl_minutes < 5 or ttl_minutes > 1440 then
    raise exception 'Preview TTL must be between 5 and 1440 minutes';
  end if;

  if not exists (
    select 1
    from public.company_memberships membership
    where membership.company_id = target_company_id
      and membership.user_id = v_user_id
      and membership.deleted_at is null
      and membership.accepted_at is not null
  ) or not public.can_manage_landing(target_company_id) then
    raise exception 'Not authorized to preview landing page';
  end if;

  select lp.id, c.slug::text
  into v_landing_page_id, v_slug
  from public.landing_pages lp
  join public.companies c on c.id = lp.company_id
  where lp.company_id = target_company_id
    and lp.deleted_at is null
    and c.deleted_at is null;

  if v_landing_page_id is null then
    raise exception 'Landing page not found';
  end if;

  -- Revoke previous active tokens for this company to keep a single active preview link.
  update public.landing_preview_tokens
  set revoked_at = now()
  where company_id = target_company_id
    and revoked_at is null
    and expires_at > now();

  v_plain_token := encode(extensions.gen_random_bytes(32), 'base64');
  v_plain_token := replace(replace(replace(v_plain_token, '+', '-'), '/', '_'), '=', '');
  v_token_hash := encode(extensions.digest(v_plain_token, 'sha256'), 'hex');
  v_expires_at := now() + make_interval(mins => ttl_minutes);

  insert into public.landing_preview_tokens (
    company_id,
    landing_page_id,
    token_hash,
    expires_at,
    created_by
  ) values (
    target_company_id,
    v_landing_page_id,
    v_token_hash,
    v_expires_at,
    v_user_id
  );

  preview_token := v_plain_token;
  expires_at := v_expires_at;
  company_slug := v_slug;
  return next;
end;
$$;

revoke all on function public.create_landing_preview_token(uuid, integer) from public;
grant execute on function public.create_landing_preview_token(uuid, integer) to authenticated;

-- Validate preview token for a slug without exposing draft data directly to anon queries.
create or replace function public.validate_landing_preview_token(
  preview_token text,
  company_slug text
)
returns table (
  company_id uuid,
  landing_page_id uuid,
  token_id uuid
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token_hash text;
  v_row public.landing_preview_tokens%rowtype;
begin
  if preview_token is null
    or length(trim(preview_token)) < 16
    or company_slug is null
    or public.is_reserved_slug(company_slug) then
    return;
  end if;

  v_token_hash := encode(extensions.digest(preview_token, 'sha256'), 'hex');

  select token.*
  into v_row
  from public.landing_preview_tokens token
  join public.companies company on company.id = token.company_id
  where token.token_hash = v_token_hash
    and company.slug::text = company_slug
    and token.revoked_at is null
    and token.expires_at > now()
    and company.deleted_at is null
    and company.active
    and company.status in ('trial', 'active')
  limit 1;

  if v_row.id is null then
    return;
  end if;

  update public.landing_preview_tokens
  set
    last_accessed_at = now(),
    access_count = access_count + 1
  where id = v_row.id;

  company_id := v_row.company_id;
  landing_page_id := v_row.landing_page_id;
  token_id := v_row.id;
  return next;
end;
$$;

revoke all on function public.validate_landing_preview_token(text, text) from public;
grant execute on function public.validate_landing_preview_token(text, text) to anon, authenticated;

-- Revoke preview token explicitly.
create or replace function public.revoke_landing_preview_token(preview_token text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_token_hash text;
  v_updated integer;
begin
  if v_user_id is null or preview_token is null then
    return false;
  end if;

  v_token_hash := encode(extensions.digest(preview_token, 'sha256'), 'hex');

  update public.landing_preview_tokens token
  set revoked_at = now()
  where token.token_hash = v_token_hash
    and token.revoked_at is null
    and public.can_manage_landing(token.company_id)
    and exists (
      select 1
      from public.company_memberships membership
      where membership.company_id = token.company_id
        and membership.user_id = v_user_id
        and membership.deleted_at is null
        and membership.accepted_at is not null
    );

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

revoke all on function public.revoke_landing_preview_token(text) from public;
grant execute on function public.revoke_landing_preview_token(text) to authenticated;

-- Public gallery view (published landing only).
create or replace view public.public_landing_gallery
with (security_barrier = true)
as
select
  company.slug::text as slug,
  item.id,
  asset.object_path,
  asset.kind,
  item.caption,
  coalesce(item.alt_text, asset.alt_text) as alt_text,
  item.display_order
from public.landing_gallery_items item
join public.media_assets asset
  on asset.company_id = item.company_id
  and asset.id = item.media_asset_id
join public.landing_pages page
  on page.company_id = item.company_id
  and page.id = item.landing_page_id
join public.companies company on company.id = item.company_id
where company.active
  and company.status in ('trial', 'active')
  and company.deleted_at is null
  and page.published
  and page.deleted_at is null
  and item.enabled
  and item.deleted_at is null
  and asset.deleted_at is null;

revoke all on public.public_landing_gallery from public;
grant select on public.public_landing_gallery to anon, authenticated;
