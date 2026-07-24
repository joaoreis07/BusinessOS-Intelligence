begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(23);

select has_table('public', 'companies', 'companies table exists');
select has_table('public', 'company_memberships', 'memberships table exists');
select has_table('public', 'appointments', 'appointments table exists');
select has_table('public', 'outbox_events', 'outbox table exists');
select has_type('public', 'appointment_status', 'appointment status enum exists');
select has_function('public', 'is_company_member', array['uuid'], 'membership helper exists');
select has_function(
  'public',
  'get_public_availability',
  array['text', 'uuid', 'date', 'date'],
  'availability RPC exists'
);
select has_function(
  'public',
  'create_public_appointment',
  array['text', 'uuid', 'timestamp with time zone', 'text', 'text', 'text', 'text', 'text', 'text'],
  'anonymous booking RPC exists'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.customers'::regclass),
  'RLS is enabled on tenant data'
);

select ok(
  (select count(*) >= 4 from pg_policies where schemaname = 'public' and tablename = 'customers'),
  'customers has complete CRUD policies'
);

select is(
  public.normalize_phone('(11) 99999-9999')::text,
  '+5511999999999',
  'Brazilian phone is normalized to E.164'
);

select throws_ok(
  $$select public.normalize_phone('123')$$,
  '23514',
  null,
  'invalid phone is rejected'
);

insert into auth.users (id, email, aud, role, created_at, updated_at)
values
  ('90000000-0000-0000-0000-000000000001', 'owner-a@test.local', 'authenticated', 'authenticated', now(), now()),
  ('90000000-0000-0000-0000-000000000002', 'viewer-a@test.local', 'authenticated', 'authenticated', now(), now()),
  ('90000000-0000-0000-0000-000000000003', 'owner-b@test.local', 'authenticated', 'authenticated', now(), now())
on conflict (id) do nothing;

insert into public.companies (id, slug, name, status)
values
  ('91000000-0000-0000-0000-000000000001', 'rls-company-a', 'RLS Company A', 'active'),
  ('91000000-0000-0000-0000-000000000002', 'rls-company-b', 'RLS Company B', 'active')
on conflict (id) do nothing;

insert into public.company_memberships (company_id, user_id, role, accepted_at)
values
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'owner', now()),
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002', 'viewer', now()),
  ('91000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000003', 'owner', now())
on conflict (company_id, user_id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::bigint from public.companies),
  1::bigint,
  'member sees own company'
);

select is(
  (select count(*)::bigint from public.companies where id = '91000000-0000-0000-0000-000000000002'),
  0::bigint,
  'member cannot see another company'
);

select throws_ok(
  $$insert into public.customers (company_id, full_name, phone)
    values ('91000000-0000-0000-0000-000000000002', 'Forbidden Customer', '+5511888888888')$$,
  '42501',
  null,
  'member cannot insert into another tenant'
);

select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$insert into public.customers (company_id, full_name, phone)
    values ('91000000-0000-0000-0000-000000000001', 'Viewer Customer', '+5511777777777')$$,
  '42501',
  null,
  'viewer is read-only'
);

reset role;

insert into public.customers (id, company_id, full_name, phone)
values (
  '92000000-0000-0000-0000-000000000001',
  '91000000-0000-0000-0000-000000000001',
  'Tenant A Customer',
  '+5511666666666'
);

insert into public.services (id, company_id, name, price, duration_minutes)
values
  ('93000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 'Service A', 100, 60),
  ('93000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000002', 'Service B', 100, 60);

select throws_ok(
  $$insert into public.appointments (
      company_id, service_id, customer_id, starts_at, ends_at
    ) values (
      '91000000-0000-0000-0000-000000000001',
      '93000000-0000-0000-0000-000000000002',
      '92000000-0000-0000-0000-000000000001',
      '2030-01-02 12:00:00+00',
      '2030-01-02 13:00:00+00'
    )$$,
  '23503',
  null,
  'composite foreign keys prevent cross-tenant references'
);

insert into public.appointments (
  company_id, service_id, customer_id, starts_at, ends_at
)
values (
  '91000000-0000-0000-0000-000000000001',
  '93000000-0000-0000-0000-000000000001',
  '92000000-0000-0000-0000-000000000001',
  '2030-01-02 12:00:00+00',
  '2030-01-02 13:00:00+00'
);

select throws_ok(
  $$insert into public.appointments (
      company_id, service_id, customer_id, starts_at, ends_at
    ) values (
      '91000000-0000-0000-0000-000000000001',
      '93000000-0000-0000-0000-000000000001',
      '92000000-0000-0000-0000-000000000001',
      '2030-01-02 12:30:00+00',
      '2030-01-02 13:30:00+00'
    )$$,
  '23P01',
  null,
  'overlapping active appointments are rejected'
);

insert into public.plans (id, code, name, price, billing_interval)
values ('94000000-0000-0000-0000-000000000001', 'test_monthly', 'Test', 10, 'month')
on conflict (id) do nothing;

insert into public.subscriptions (
  company_id, plan_id, status, trial_ends_at
)
values (
  '91000000-0000-0000-0000-000000000001',
  '94000000-0000-0000-0000-000000000001',
  'trial',
  now() + interval '7 days'
);

select throws_ok(
  $$insert into public.subscriptions (
      company_id, plan_id, status, current_period_ends_at
    ) values (
      '91000000-0000-0000-0000-000000000001',
      '94000000-0000-0000-0000-000000000001',
      'active',
      now() + interval '1 month'
    )$$,
  '23505',
  null,
  'a company can have only one current subscription'
);

select throws_ok(
  $$insert into public.financial_transactions (
      company_id, category_id, transaction_type, description, amount, due_date
    ) values (
      '91000000-0000-0000-0000-000000000001',
      extensions.gen_random_uuid(),
      'income',
      'Invalid amount',
      -1,
      current_date
    )$$,
  '23514',
  null,
  'financial amounts must be positive'
);

select ok(
  not has_table_privilege('anon', 'public.appointments', 'INSERT'),
  'anonymous users cannot insert appointments directly'
);

select ok(
  has_function_privilege(
    'anon',
    'public.create_public_appointment(text,uuid,timestamp with time zone,text,text,text,text,text,text)',
    'EXECUTE'
  ),
  'anonymous users can execute the transactional booking RPC'
);

select ok(
  not exists (
    select 1 from public.public_landing_pages where slug = 'rls-company-b'
  ),
  'unpublished companies are excluded from the public landing view'
);

select * from finish();
rollback;
