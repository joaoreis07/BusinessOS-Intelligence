-- Local/demo data only. No auth user or password is created here.

set search_path = public, extensions;

insert into public.plans (
  id, code, name, description, price, billing_interval, trial_days, display_order
)
values
  ('10000000-0000-0000-0000-000000000001', 'starter_monthly', 'Starter', 'Landing, agenda, serviços e CRM.', 49.90, 'month', 7, 10),
  ('10000000-0000-0000-0000-000000000002', 'pro_monthly', 'Pro', 'Starter com financeiro e relatórios avançados.', 99.90, 'month', 7, 20),
  ('10000000-0000-0000-0000-000000000003', 'premium_monthly', 'Premium', 'Pro com IA, automações e integrações avançadas.', 179.90, 'month', 7, 30)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  billing_interval = excluded.billing_interval,
  trial_days = excluded.trial_days,
  display_order = excluded.display_order,
  active = true;

insert into public.plan_features (plan_id, feature_key, enabled)
values
  ('10000000-0000-0000-0000-000000000001', 'landing_page', true),
  ('10000000-0000-0000-0000-000000000001', 'appointments', true),
  ('10000000-0000-0000-0000-000000000001', 'crm', true),
  ('10000000-0000-0000-0000-000000000002', 'landing_page', true),
  ('10000000-0000-0000-0000-000000000002', 'appointments', true),
  ('10000000-0000-0000-0000-000000000002', 'crm', true),
  ('10000000-0000-0000-0000-000000000002', 'financial', true),
  ('10000000-0000-0000-0000-000000000002', 'advanced_reports', true),
  ('10000000-0000-0000-0000-000000000003', 'landing_page', true),
  ('10000000-0000-0000-0000-000000000003', 'appointments', true),
  ('10000000-0000-0000-0000-000000000003', 'crm', true),
  ('10000000-0000-0000-0000-000000000003', 'financial', true),
  ('10000000-0000-0000-0000-000000000003', 'advanced_reports', true),
  ('10000000-0000-0000-0000-000000000003', 'automations', true),
  ('10000000-0000-0000-0000-000000000003', 'advanced_integrations', true),
  ('10000000-0000-0000-0000-000000000003', 'ai', true)
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into public.companies (
  id, slug, name, professional_name, specialty, description, biography,
  email, phone, whatsapp, business_type, status
)
values (
  '20000000-0000-0000-0000-000000000001',
  'vitta-demo',
  'Vitta Nutrição Demo',
  'Mariana Silva',
  'Nutrição Clínica',
  'Consultas nutricionais personalizadas para quem busca mais energia, saúde e leveza no dia a dia.',
  'Nutricionista clínica com foco em reeducação alimentar prática. Atendo presencialmente e online, com planos individualizados, acolhimento e estratégias possíveis de manter na rotina.',
  'contato@vitta.demo',
  '+551140028922',
  '+5511999999999',
  'nutrition',
  'trial'
)
on conflict (id) do update set
  name = excluded.name,
  professional_name = excluded.professional_name,
  specialty = excluded.specialty,
  description = excluded.description,
  biography = excluded.biography,
  email = excluded.email,
  phone = excluded.phone,
  whatsapp = excluded.whatsapp,
  status = excluded.status,
  active = true,
  deleted_at = null;

update public.companies
set
  address = '{"city":"São Paulo","state":"SP","street":"Av. Paulista, 1000","zip":"01310-100"}'::jsonb,
  social_links = '{"instagram":"https://instagram.com/vitta.demo","website":"https://businessos-intelligence.vercel.app/vitta-demo"}'::jsonb
where id = '20000000-0000-0000-0000-000000000001';

update public.company_settings
set
  booking_flow = 'instant_confirmation',
  booking_min_notice_minutes = 120,
  booking_interval_minutes = 30,
  booking_horizon_days = 90,
  max_appointments_per_day = 12,
  primary_color = '#18392B',
  secondary_color = '#6B7F72',
  accent_color = '#B7E4C7',
  background_color = '#F8FBF9'
where company_id = '20000000-0000-0000-0000-000000000001';

update public.landing_pages
set
  title = 'Vitta Nutrição — Alimentação com leveza',
  meta_description = 'Consultas nutricionais personalizadas com a Dra. Mariana Silva. Atendimento online e presencial com planos práticos e acolhedores.',
  banner_path = '/landing/vitta-demo/hero.jpg',
  avatar_path = '/landing/vitta-demo/portrait.jpg',
  published = true,
  published_at = coalesce(published_at, now())
where company_id = '20000000-0000-0000-0000-000000000001';

insert into public.landing_sections (
  company_id, landing_page_id, section_type, title, content, display_order
)
select
  '20000000-0000-0000-0000-000000000001',
  page.id,
  seed.section_type,
  seed.title,
  seed.content,
  seed.display_order
from public.landing_pages page
cross join (
  values
    ('hero'::public.section_type, 'Nutrição que cabe na vida real', '{"cta":"Agendar consulta","subtitle":"Consultas personalizadas para transformar sua relação com a alimentação — com leveza, ciência e acolhimento."}'::jsonb, 10),
    ('about'::public.section_type, 'Conheça a Dra. Mariana Silva', '{"text":"Com mais de 10 anos de experiência, ajudo pessoas a alcançarem seus objetivos com planos alimentares possíveis, estratégias práticas e acompanhamento próximo em cada etapa da jornada."}'::jsonb, 20),
    ('services'::public.section_type, 'Como posso te ajudar', '{}'::jsonb, 30),
    ('differentials'::public.section_type, 'Por que escolher a Vitta?', '{"items":[{"title":"Plano personalizado","description":"Estratégias alinhadas à sua rotina, preferências e objetivos de saúde."},{"title":"Acompanhamento próximo","description":"Retornos programados para ajustes, evolução e motivação contínua."},{"title":"Atendimento online","description":"Consultas por videochamada com a mesma qualidade do presencial."}]}'::jsonb, 35),
    ('testimonials'::public.section_type, 'O que dizem as pacientes', '{}'::jsonb, 40),
    ('contact'::public.section_type, 'Vamos conversar?', '{}'::jsonb, 50)
) seed(section_type, title, content, display_order)
where page.company_id = '20000000-0000-0000-0000-000000000001'
on conflict (landing_page_id, section_type) do update set
  title = excluded.title,
  content = excluded.content,
  display_order = excluded.display_order,
  enabled = true,
  deleted_at = null;

insert into public.services (
  id, company_id, name, description, category, price, duration_minutes, display_order
)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Consulta Inicial', 'Avaliação completa, anamnese detalhada e plano alimentar personalizado para iniciar sua jornada.', 'Consultas', 180.00, 60, 10),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Consulta de Retorno', 'Acompanhamento de evolução, ajustes do plano e estratégias para manter os resultados.', 'Consultas', 140.00, 45, 20)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  duration_minutes = excluded.duration_minutes,
  active = true,
  publicly_visible = true,
  deleted_at = null;

insert into public.business_hours (company_id, weekday, start_time, end_time)
select
  '20000000-0000-0000-0000-000000000001',
  weekday,
  start_time,
  end_time
from (
  values
    (1::smallint, '09:00'::time, '12:00'::time),
    (1::smallint, '14:00'::time, '18:00'::time),
    (2::smallint, '09:00'::time, '12:00'::time),
    (2::smallint, '14:00'::time, '18:00'::time),
    (3::smallint, '09:00'::time, '12:00'::time),
    (3::smallint, '14:00'::time, '18:00'::time),
    (4::smallint, '09:00'::time, '12:00'::time),
    (4::smallint, '14:00'::time, '18:00'::time),
    (5::smallint, '09:00'::time, '12:00'::time),
    (5::smallint, '14:00'::time, '17:00'::time)
) hours(weekday, start_time, end_time)
on conflict (company_id, weekday, start_time, end_time) do update set active = true;

insert into public.testimonials (
  company_id, customer_name, quote, rating, published, display_order
)
select '20000000-0000-0000-0000-000000000001', 'Ana Paula', 'Perdi 8kg sem radicalismo e aprendi a comer melhor no dia a dia. O acompanhamento fez toda diferença.', 5, true, 10
where not exists (
  select 1 from public.testimonials
  where company_id = '20000000-0000-0000-0000-000000000001' and customer_name = 'Ana Paula'
);

insert into public.testimonials (
  company_id, customer_name, quote, rating, published, display_order
)
select '20000000-0000-0000-0000-000000000001', 'Juliana M.', 'Planos práticos, acolhedora e sempre disponível para tirar dúvidas. Recomendo demais!', 5, true, 20
where not exists (
  select 1 from public.testimonials
  where company_id = '20000000-0000-0000-0000-000000000001' and customer_name = 'Juliana M.'
);

insert into public.testimonials (
  company_id, customer_name, quote, rating, published, display_order
)
select '20000000-0000-0000-0000-000000000001', 'Carla R.', 'Consegui controlar minha ansiedade com comida e hoje me sinto muito mais confiante.', 5, true, 30
where not exists (
  select 1 from public.testimonials
  where company_id = '20000000-0000-0000-0000-000000000001' and customer_name = 'Carla R.'
);

update public.testimonials
set published = false
where company_id = '20000000-0000-0000-0000-000000000001'
  and customer_name = 'Cliente Demo';

insert into public.financial_categories (
  company_id, name, transaction_type, color
)
values
  ('20000000-0000-0000-0000-000000000001', 'Consultas', 'income', '#16A34A'),
  ('20000000-0000-0000-0000-000000000001', 'Serviços extras', 'income', '#2563EB'),
  ('20000000-0000-0000-0000-000000000001', 'Marketing', 'expense', '#F97316'),
  ('20000000-0000-0000-0000-000000000001', 'Softwares', 'expense', '#7C3AED')
on conflict (company_id, name, transaction_type) do update set
  color = excluded.color,
  active = true,
  deleted_at = null;

insert into public.subscriptions (
  company_id, plan_id, status, trial_ends_at, current_period_ends_at
)
select
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000003',
  'trial',
  now() + interval '7 days',
  now() + interval '7 days'
where not exists (
  select 1 from public.subscriptions
  where company_id = '20000000-0000-0000-0000-000000000001'
    and status in ('trial', 'active', 'pending', 'past_due', 'suspended')
);

update public.subscriptions
set plan_id = '10000000-0000-0000-0000-000000000003'
where company_id = '20000000-0000-0000-0000-000000000001'
  and status in ('trial', 'active', 'pending', 'past_due', 'suspended');
