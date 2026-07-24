-- BusinessOS authorization helpers, grants and Row Level Security.

set search_path = public, extensions;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.company_memberships membership
    where membership.company_id = target_company_id
      and membership.user_id = auth.uid()
      and membership.accepted_at is not null
      and membership.deleted_at is null
  );
$$;

create or replace function public.has_company_role(
  target_company_id uuid,
  allowed_roles public.membership_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.company_memberships membership
    where membership.company_id = target_company_id
      and membership.user_id = auth.uid()
      and membership.role = any(allowed_roles)
      and membership.accepted_at is not null
      and membership.deleted_at is null
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.platform_roles
    where user_id = auth.uid()
      and role = 'platform_admin'
      and revoked_at is null
  );
$$;

revoke all on function public.is_company_member(uuid) from public;
revoke all on function public.has_company_role(uuid, public.membership_role[]) from public;
revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_company_member(uuid) to authenticated, service_role;
grant execute on function public.has_company_role(uuid, public.membership_role[]) to authenticated, service_role;
grant execute on function public.is_platform_admin() to authenticated, service_role;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.plans, public.plan_features to anon;
grant usage on all sequences in schema public to authenticated, service_role;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'companies', 'company_memberships', 'company_settings',
    'company_features', 'landing_pages', 'landing_sections', 'testimonials',
    'media_assets', 'services', 'business_hours', 'blocked_periods', 'customers',
    'customer_notes', 'appointments', 'appointment_events', 'financial_categories',
    'financial_transactions', 'plans', 'plan_features', 'subscriptions',
    'subscription_payments', 'platform_roles', 'integrations', 'webhook_events',
    'notifications', 'outbox_events', 'activity_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

create policy profiles_select on public.profiles for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.company_memberships mine
    join public.company_memberships theirs on theirs.company_id = mine.company_id
    where mine.user_id = auth.uid()
      and mine.accepted_at is not null and mine.deleted_at is null
      and theirs.user_id = profiles.id
      and theirs.accepted_at is not null and theirs.deleted_at is null
  )
);
create policy profiles_insert_self on public.profiles for insert to authenticated
with check (id = auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy companies_select_members on public.companies for select to authenticated
using (public.is_company_member(id));
create policy companies_update_admins on public.companies for update to authenticated
using (public.has_company_role(id, array['owner', 'admin']::public.membership_role[]))
with check (public.has_company_role(id, array['owner', 'admin']::public.membership_role[]));
create policy companies_delete_owners on public.companies for delete to authenticated
using (public.has_company_role(id, array['owner']::public.membership_role[]));

create policy memberships_select_members on public.company_memberships for select to authenticated
using (public.is_company_member(company_id));
create policy memberships_insert_admins on public.company_memberships for insert to authenticated
with check (
  public.has_company_role(company_id, array['owner', 'admin']::public.membership_role[])
  and (role <> 'owner' or public.has_company_role(company_id, array['owner']::public.membership_role[]))
);
create policy memberships_update_admins on public.company_memberships for update to authenticated
using (
  public.has_company_role(company_id, array['owner', 'admin']::public.membership_role[])
  and (role <> 'owner' or public.has_company_role(company_id, array['owner']::public.membership_role[]))
)
with check (
  public.has_company_role(company_id, array['owner', 'admin']::public.membership_role[])
  and (role <> 'owner' or public.has_company_role(company_id, array['owner']::public.membership_role[]))
);
create policy memberships_delete_admins on public.company_memberships for delete to authenticated
using (
  public.has_company_role(company_id, array['owner', 'admin']::public.membership_role[])
  and role <> 'owner'
);

-- Administrative tenant tables.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'company_settings', 'company_features', 'landing_pages', 'landing_sections',
    'testimonials', 'media_assets', 'business_hours', 'blocked_periods', 'integrations'
  ] loop
    execute format(
      'create policy %1$I_select on public.%1$I for select to authenticated using (public.is_company_member(company_id))',
      table_name
    );
    execute format(
      'create policy %1$I_insert on public.%1$I for insert to authenticated with check (public.has_company_role(company_id, array[''owner'', ''admin'']::public.membership_role[]))',
      table_name
    );
    execute format(
      'create policy %1$I_update on public.%1$I for update to authenticated using (public.has_company_role(company_id, array[''owner'', ''admin'']::public.membership_role[])) with check (public.has_company_role(company_id, array[''owner'', ''admin'']::public.membership_role[]))',
      table_name
    );
    execute format(
      'create policy %1$I_delete on public.%1$I for delete to authenticated using (public.has_company_role(company_id, array[''owner'', ''admin'']::public.membership_role[]))',
      table_name
    );
  end loop;
end;
$$;

-- Operational tables: viewers are read-only; members and above may write.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'services', 'customers', 'customer_notes', 'appointments',
    'financial_categories', 'financial_transactions'
  ] loop
    execute format(
      'create policy %1$I_select on public.%1$I for select to authenticated using (public.is_company_member(company_id))',
      table_name
    );
    execute format(
      'create policy %1$I_insert on public.%1$I for insert to authenticated with check (public.has_company_role(company_id, array[''owner'', ''admin'', ''member'']::public.membership_role[]))',
      table_name
    );
    execute format(
      'create policy %1$I_update on public.%1$I for update to authenticated using (public.has_company_role(company_id, array[''owner'', ''admin'', ''member'']::public.membership_role[])) with check (public.has_company_role(company_id, array[''owner'', ''admin'', ''member'']::public.membership_role[]))',
      table_name
    );
    execute format(
      'create policy %1$I_delete on public.%1$I for delete to authenticated using (public.has_company_role(company_id, array[''owner'', ''admin'', ''member'']::public.membership_role[]))',
      table_name
    );
  end loop;
end;
$$;

create policy appointment_events_select on public.appointment_events for select to authenticated
using (public.is_company_member(company_id));

create policy subscriptions_select on public.subscriptions for select to authenticated
using (public.is_company_member(company_id));
create policy subscriptions_update_owner on public.subscriptions for update to authenticated
using (public.has_company_role(company_id, array['owner']::public.membership_role[]))
with check (public.has_company_role(company_id, array['owner']::public.membership_role[]));

create policy subscription_payments_select on public.subscription_payments for select to authenticated
using (public.has_company_role(company_id, array['owner', 'admin']::public.membership_role[]));

create policy plans_public_select on public.plans for select to anon, authenticated
using (active and deleted_at is null);
create policy plan_features_public_select on public.plan_features for select to anon, authenticated
using (exists (
  select 1 from public.plans
  where plans.id = plan_features.plan_id and plans.active and plans.deleted_at is null
));

create policy notifications_select on public.notifications for select to authenticated
using (
  recipient_user_id = auth.uid()
  or (recipient_user_id is null and public.is_company_member(company_id))
);
create policy notifications_update_recipient on public.notifications for update to authenticated
using (recipient_user_id = auth.uid())
with check (recipient_user_id = auth.uid());

create policy activity_logs_select_admins on public.activity_logs for select to authenticated
using (
  company_id is not null
  and public.has_company_role(company_id, array['owner', 'admin']::public.membership_role[])
);

-- Sensitive and append-only platform tables have no client write policy.
revoke all on public.platform_roles, public.webhook_events, public.outbox_events from anon, authenticated;
revoke insert, update, delete on public.appointment_events, public.subscription_payments, public.activity_logs from authenticated;
revoke select on public.integrations from authenticated;
grant select (
  id, company_id, provider, status, external_account_id, public_config,
  last_synced_at, last_error, created_at, updated_at, deleted_at
) on public.integrations to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
