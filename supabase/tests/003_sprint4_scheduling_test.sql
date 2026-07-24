-- Sprint 4 Etapa 2: scheduling concurrency, RLS and secure RPC tests.

begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(32);

select has_function('public', 'can_configure_scheduling', array['uuid'], 'scheduling configure helper exists');
select has_function('public', 'can_manage_appointments', array['uuid'], 'appointment manage helper exists');
select has_function('public', 'is_workspace_slot_available', array['uuid', 'uuid', 'timestamptz', 'uuid'], 'slot availability helper exists');
select has_function('public', 'create_workspace_appointment', array['uuid', 'uuid', 'timestamptz', 'text', 'text'], 'workspace booking RPC exists');
select has_function('public', 'update_appointment_status_secure', array['uuid', 'public.appointment_status', 'text'], 'secure status RPC exists');
select has_function('public', 'cancel_appointment_secure', array['uuid', 'text'], 'secure cancel RPC exists');
select has_function('public', 'reschedule_appointment_secure', array['uuid', 'timestamptz', 'text'], 'secure reschedule RPC exists');
select has_function('public', 'replace_business_hours', array['uuid', 'jsonb'], 'replace business hours RPC exists');

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'blocked_periods_no_overlap'
  ),
  'blocked periods overlap constraint exists'
);

insert into auth.users (id, email, aud, role, created_at, updated_at)
values
  ('a1000000-0000-0000-0000-000000000001', 'owner-sched@test.local', 'authenticated', 'authenticated', now(), now()),
  ('a1000000-0000-0000-0000-000000000002', 'manager-sched@test.local', 'authenticated', 'authenticated', now(), now()),
  ('a1000000-0000-0000-0000-000000000003', 'employee-sched@test.local', 'authenticated', 'authenticated', now(), now()),
  ('a1000000-0000-0000-0000-000000000004', 'viewer-sched@test.local', 'authenticated', 'authenticated', now(), now()),
  ('a1000000-0000-0000-0000-000000000005', 'owner-other@test.local', 'authenticated', 'authenticated', now(), now())
on conflict (id) do nothing;

insert into public.companies (id, slug, name, status)
values
  ('b1000000-0000-0000-0000-000000000001', 'sched-company-a', 'Scheduling Company A', 'active'),
  ('b1000000-0000-0000-0000-000000000002', 'sched-company-b', 'Scheduling Company B', 'active')
on conflict (id) do nothing;

insert into public.company_memberships (company_id, user_id, role, accepted_at)
values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'owner', now()),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'manager', now()),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'employee', now()),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'viewer', now()),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', 'owner', now())
on conflict (company_id, user_id) do nothing;

insert into public.customers (id, company_id, full_name, phone)
values
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Cliente A', '+5511555555551')
on conflict (id) do nothing;

insert into public.services (id, company_id, name, price, duration_minutes)
values
  ('d1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Consulta A', 100, 60)
on conflict (id) do nothing;

insert into public.business_hours (company_id, weekday, start_time, end_time)
select
  'b1000000-0000-0000-0000-000000000001',
  weekday,
  '00:00'::time,
  '23:59'::time
from generate_series(0, 6) as weekday
on conflict (company_id, weekday, start_time, end_time) do update set active = true;

insert into public.appointments (
  id, company_id, service_id, customer_id, starts_at, ends_at, status
)
values (
  'e1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  '2031-06-02 15:00:00+00',
  '2031-06-02 16:00:00+00',
  'confirmed'
)
on conflict (id) do nothing;

select ok(
  public.can_configure_scheduling('b1000000-0000-0000-0000-000000000001'),
  'owner context can configure scheduling'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  public.can_configure_scheduling('b1000000-0000-0000-0000-000000000001'),
  'manager can configure scheduling'
);

insert into public.business_hours (company_id, weekday, start_time, end_time)
values ('b1000000-0000-0000-0000-000000000001', 2, '10:00', '12:00')
on conflict (company_id, weekday, start_time, end_time) do update set active = true;

select ok(
  exists (
    select 1
    from public.business_hours
    where company_id = 'b1000000-0000-0000-0000-000000000001'
      and weekday = 2
      and start_time = '10:00'
      and end_time = '12:00'
  ),
  'manager can insert business hours'
);

select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000003', true);

update public.appointments
set internal_notes = 'Atualizado por employee'
where id = 'e1000000-0000-0000-0000-000000000001';

select is(
  (select internal_notes from public.appointments where id = 'e1000000-0000-0000-0000-000000000001'),
  'Atualizado por employee',
  'employee can update appointments'
);

select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000004', true);

select throws_ok(
  $$update public.appointments
    set internal_notes = 'Viewer blocked'
    where id = 'e1000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'viewer cannot update appointments'
);

select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000005', true);

select throws_ok(
  $$insert into public.business_hours (company_id, weekday, start_time, end_time)
    values ('b1000000-0000-0000-0000-000000000001', 3, '08:00', '10:00')$$,
  '42501',
  null,
  'foreign tenant cannot configure another company schedule'
);

reset role;

insert into public.blocked_periods (company_id, starts_at, ends_at, reason)
values (
  'b1000000-0000-0000-0000-000000000001',
  '2031-07-01 10:00:00+00',
  '2031-07-01 12:00:00+00',
  'Feriado'
);

select throws_ok(
  $$insert into public.blocked_periods (company_id, starts_at, ends_at, reason)
    values (
      'b1000000-0000-0000-0000-000000000001',
      '2031-07-01 11:00:00+00',
      '2031-07-01 13:00:00+00',
      'Sobreposição'
    )$$,
  '23P01',
  null,
  'overlapping blocked periods are rejected'
);

select ok(
  not public.is_workspace_slot_available(
    'b1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    '2031-07-01 11:00:00+00'
  ),
  'blocked periods make workspace slots unavailable'
);

select ok(
  not public.is_workspace_slot_available(
    'b1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    '2031-06-02 15:30:00+00'
  ),
  'existing appointments make workspace slots unavailable'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (
    select appointment_status::text
    from public.update_appointment_status_secure(
      'e1000000-0000-0000-0000-000000000001',
      'confirmed',
      'status-idem-key-00000001'
    )
  ),
  'confirmed',
  'status update is idempotent when status is unchanged'
);

select is(
  (
    select appointment_status::text
    from public.cancel_appointment_secure(
      'e1000000-0000-0000-0000-000000000001',
      'cancel-idem-key-00000001'
    )
  ),
  'cancelled',
  'cancel appointment secure RPC works'
);

select is(
  (
    select appointment_status::text
    from public.cancel_appointment_secure(
      'e1000000-0000-0000-0000-000000000001',
      'cancel-idem-key-00000001'
    )
  ),
  'cancelled',
  'duplicate cancel request remains idempotent'
);

select throws_ok(
  $$select appointment_status::text
    from public.reschedule_appointment_secure(
      'e1000000-0000-0000-0000-000000000001',
      '2031-06-02 15:30:00+00',
      'reschedule-idem-key-00001'
    )$$,
  '22023',
  null,
  'cancelled appointments cannot be rescheduled'
);

insert into public.appointments (
  id, company_id, service_id, customer_id, starts_at, ends_at, status
)
values (
  'e1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  '2031-06-03 15:00:00+00',
  '2031-06-03 16:00:00+00',
  'pending'
)
on conflict (id) do nothing;

select is(
  (
    select starts_at::text
    from public.reschedule_appointment_secure(
      'e1000000-0000-0000-0000-000000000002',
      '2031-06-03 16:00:00+00',
      'reschedule-idem-key-00002'
    )
  ),
  '2031-06-03 16:00:00+00',
  'reschedule appointment secure RPC works'
);

select is(
  (
    select count(*)::bigint
    from public.replace_business_hours(
      'b1000000-0000-0000-0000-000000000001',
      jsonb_build_array(
        jsonb_build_object('weekday', 1, 'startTime', '08:00', 'endTime', '17:00', 'enabled', true)
      )
    )
  ),
  1::bigint,
  'replace business hours RPC replaces rules atomically'
);

select is(
  (
    select appointment_id::text
    from public.create_workspace_appointment(
      'd1000000-0000-0000-0000-000000000001',
      'c1000000-0000-0000-0000-000000000001',
      '2031-06-04 15:00:00+00',
      null,
      'workspace-idem-key-000001'
    )
  ),
  (
    select appointment_id::text
    from public.create_workspace_appointment(
      'd1000000-0000-0000-0000-000000000001',
      'c1000000-0000-0000-0000-000000000001',
      '2031-06-04 15:00:00+00',
      null,
      'workspace-idem-key-000001'
    )
  ),
  'workspace appointment creation is idempotent'
);

select throws_ok(
  $$select appointment_id::text
    from public.create_workspace_appointment(
      'd1000000-0000-0000-0000-000000000001',
      'c1000000-0000-0000-0000-000000000001',
      '2031-06-02 15:30:00+00',
      null,
      'workspace-overlap-key-01'
    )$$,
  '23P01',
  null,
  'workspace appointment rejects overlapping slots'
);

reset role;

select * from finish();
rollback;
