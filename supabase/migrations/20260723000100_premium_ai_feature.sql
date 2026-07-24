-- Premium plan AI feature for Sprint 10.

set search_path = public, extensions;

insert into public.plan_features (plan_id, feature_key, enabled)
select plans.id, 'ai', true
from public.plans
where plans.code = 'premium_monthly'
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;
