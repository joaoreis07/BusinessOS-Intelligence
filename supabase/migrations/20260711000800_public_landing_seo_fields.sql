-- Sprint 3 Etapa 6: expose SEO fields on public landing surface.

set search_path = public, extensions;

drop view if exists public.public_landing_pages;

create view public.public_landing_pages
with (security_barrier = true)
as
select
  company.id as company_id,
  company.slug::text as slug,
  company.name,
  company.professional_name,
  company.specialty,
  company.description,
  company.biography,
  company.email::text as email,
  company.phone,
  company.whatsapp,
  company.address,
  company.social_links,
  page.title,
  page.meta_description,
  page.logo_path,
  page.avatar_path,
  page.banner_path,
  page.seo,
  page.custom_domain::text as custom_domain,
  page.published_at,
  settings.primary_color,
  settings.secondary_color,
  settings.accent_color,
  settings.background_color,
  settings.theme
from public.companies company
join public.landing_pages page on page.company_id = company.id
join public.company_settings settings on settings.company_id = company.id
where company.active
  and company.status in ('trial', 'active')
  and company.deleted_at is null
  and page.published
  and page.deleted_at is null;

grant select on public.public_landing_pages to anon, authenticated;
