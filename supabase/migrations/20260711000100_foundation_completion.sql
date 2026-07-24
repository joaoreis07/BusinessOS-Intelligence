-- Complete tenant provisioning required by the foundation sprint.

set search_path = public, extensions;

insert into public.plans (
  id, code, name, description, price, billing_interval, trial_days, display_order
)
values (
  '10000000-0000-0000-0000-000000000001',
  'starter_monthly',
  'Starter',
  'Landing page, agenda, serviços e CRM.',
  49.90,
  'month',
  7,
  10
)
on conflict (code) do nothing;

create or replace function public.bootstrap_company_records()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  starter_plan public.plans%rowtype;
begin
  insert into public.company_settings (company_id) values (new.id);
  insert into public.landing_pages (company_id, title) values (new.id, new.name);
  insert into public.company_features (company_id, feature_key, enabled, source)
  values
    (new.id, 'landing_page', true, 'trial'),
    (new.id, 'appointments', true, 'trial'),
    (new.id, 'crm', true, 'trial'),
    (new.id, 'financial', true, 'trial');

  insert into public.financial_categories
    (company_id, name, transaction_type, color)
  values
    (new.id, 'Receitas gerais', 'income', '#16A34A'),
    (new.id, 'Despesas gerais', 'expense', '#DC2626');

  select * into starter_plan
  from public.plans
  where code = 'starter_monthly' and active and deleted_at is null
  limit 1;

  if starter_plan.id is not null then
    insert into public.subscriptions (
      company_id, plan_id, status, trial_ends_at, current_period_ends_at
    )
    values (
      new.id,
      starter_plan.id,
      'trial',
      now() + make_interval(days => starter_plan.trial_days),
      now() + make_interval(days => starter_plan.trial_days)
    );
  end if;

  return new;
end;
$$;

create or replace function public.create_company(
  company_name text,
  requested_slug text,
  business_type text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  actor uuid := auth.uid();
  company_uuid uuid;
  base_slug text := public.slugify(requested_slug);
  candidate_slug text;
  suffix integer := 0;
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if length(trim(company_name)) < 2 or base_slug = '' then
    raise exception 'invalid company name or slug' using errcode = '22023';
  end if;

  if length(base_slug) < 3 then
    base_slug := base_slug || '-co';
  end if;

  loop
    candidate_slug := case
      when suffix = 0 then left(base_slug, 63)
      else left(base_slug, 63 - length(suffix::text)) || suffix::text
    end;

    begin
      insert into public.companies (name, slug, business_type)
      values (trim(company_name), candidate_slug, business_type)
      returning id into company_uuid;
      exit;
    exception when unique_violation then
      suffix := suffix + 1;
      if suffix > 9999 then
        raise exception 'unable to generate a unique company slug'
          using errcode = '23505';
      end if;
    end;
  end loop;

  insert into public.company_memberships (company_id, user_id, role, accepted_at)
  values (company_uuid, actor, 'owner', now());

  return company_uuid;
end;
$$;

insert into public.financial_categories
  (company_id, name, transaction_type, color)
select company.id, defaults.name, defaults.transaction_type, defaults.color
from public.companies company
cross join (
  values
    ('Receitas gerais', 'income'::public.financial_type, '#16A34A'),
    ('Despesas gerais', 'expense'::public.financial_type, '#DC2626')
) defaults(name, transaction_type, color)
where company.deleted_at is null
on conflict (company_id, name, transaction_type) do nothing;

insert into public.subscriptions (
  company_id, plan_id, status, trial_ends_at, current_period_ends_at
)
select
  company.id,
  plan.id,
  'trial',
  now() + make_interval(days => plan.trial_days),
  now() + make_interval(days => plan.trial_days)
from public.companies company
join public.plans plan on plan.code = 'starter_monthly'
where company.deleted_at is null
  and not exists (
    select 1
    from public.subscriptions subscription
    where subscription.company_id = company.id
      and subscription.status in ('trial', 'active', 'pending', 'past_due', 'suspended')
  );
