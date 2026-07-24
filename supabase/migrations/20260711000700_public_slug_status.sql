-- Public slug resolution for landing routing (minimal, security definer).

set search_path = public, extensions;

create or replace function public.get_public_slug_status(company_slug text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not exists (
      select 1
      from public.companies company
      where company.slug = company_slug
        and company.deleted_at is null
    ) then 'not_found'
    when exists (
      select 1
      from public.companies company
      where company.slug = company_slug
        and company.deleted_at is null
        and (
          not company.active
          or company.status not in ('trial', 'active')
        )
    ) then 'inactive'
    when exists (
      select 1
      from public.companies company
      join public.landing_pages page on page.company_id = company.id
      where company.slug = company_slug
        and company.deleted_at is null
        and company.active
        and company.status in ('trial', 'active')
        and page.deleted_at is null
        and not page.published
    ) then 'unpublished'
    else 'published'
  end;
$$;

revoke all on function public.get_public_slug_status(text) from public;
grant execute on function public.get_public_slug_status(text) to anon, authenticated;
