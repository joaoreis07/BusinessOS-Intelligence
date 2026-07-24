-- Platform admin read APIs for web runtime without service role.

set search_path = public, extensions;

create or replace function public.get_platform_overview()
returns table (
  total_companies bigint,
  active_companies bigint,
  trial_companies bigint,
  total_subscriptions bigint,
  monthly_revenue_cents bigint
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with company_totals as (
    select
      count(*)::bigint as total_companies,
      count(*) filter (where status = 'active')::bigint as active_companies,
      count(*) filter (where status = 'trial')::bigint as trial_companies
    from public.companies
    where deleted_at is null
  ),
  subscription_totals as (
    select count(*)::bigint as total_subscriptions
    from public.subscriptions
  ),
  revenue_totals as (
    select
      coalesce(sum(round(amount * 100))::bigint, 0::bigint) as monthly_revenue_cents
    from public.subscription_payments
    where status = 'approved'
      and paid_at >= date_trunc('month', now())
      and paid_at < date_trunc('month', now()) + interval '1 month'
  )
  select
    company_totals.total_companies,
    company_totals.active_companies,
    company_totals.trial_companies,
    subscription_totals.total_subscriptions,
    revenue_totals.monthly_revenue_cents
  from company_totals, subscription_totals, revenue_totals;
end;
$$;

create or replace function public.list_platform_recent_companies(limit_count integer default 100)
returns table (
  id uuid,
  name text,
  slug extensions.citext,
  status public.company_status,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    company.id,
    company.name,
    company.slug,
    company.status,
    company.created_at
  from public.companies company
  where company.deleted_at is null
  order by company.created_at desc
  limit greatest(1, least(coalesce(limit_count, 100), 200));
end;
$$;

revoke all on function public.get_platform_overview() from public;
revoke all on function public.list_platform_recent_companies(integer) from public;
grant execute on function public.get_platform_overview() to authenticated, service_role;
grant execute on function public.list_platform_recent_companies(integer)
  to authenticated, service_role;
