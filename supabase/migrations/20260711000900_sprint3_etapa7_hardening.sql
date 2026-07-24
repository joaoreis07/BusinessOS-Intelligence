-- Sprint 3 Etapa 7: security hardening — preview payload RPC and reserved slug enforcement.

set search_path = public, extensions;

-- Reject reserved slugs at company creation.
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

    if public.is_reserved_slug(candidate_slug) then
      raise exception 'reserved slug is not allowed' using errcode = '22023';
    end if;

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

revoke all on function public.create_company(text, text, text) from public;
grant execute on function public.create_company(text, text, text) to authenticated;

-- Anonymous-safe preview payload: validates token and returns draft bundle without RLS bypass on client queries.
create or replace function public.get_preview_landing_payload(
  preview_token text,
  company_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_company_id uuid;
  v_landing_page_id uuid;
  v_token_id uuid;
  v_expires_at timestamptz;
  v_payload jsonb;
begin
  select access.company_id, access.landing_page_id, access.token_id
  into v_company_id, v_landing_page_id, v_token_id
  from public.validate_landing_preview_token(preview_token, company_slug) access
  limit 1;

  if v_company_id is null then
    return null;
  end if;

  select token.expires_at
  into v_expires_at
  from public.landing_preview_tokens token
  where token.id = v_token_id;

  select jsonb_build_object(
    'expires_at', v_expires_at,
    'is_published', page.published,
    'slug', company.slug::text,
    'company', jsonb_build_object(
      'name', company.name,
      'professional_name', company.professional_name,
      'specialty', company.specialty,
      'description', company.description,
      'biography', company.biography,
      'email', company.email::text,
      'phone', company.phone,
      'whatsapp', company.whatsapp,
      'address', company.address,
      'social_links', company.social_links
    ),
    'page', jsonb_build_object(
      'title', page.title,
      'meta_description', page.meta_description,
      'logo_path', page.logo_path,
      'avatar_path', page.avatar_path,
      'banner_path', page.banner_path,
      'seo', page.seo,
      'published', page.published,
      'custom_domain', page.custom_domain::text,
      'published_at', page.published_at
    ),
    'settings', jsonb_build_object(
      'primary_color', settings.primary_color,
      'secondary_color', settings.secondary_color,
      'accent_color', settings.accent_color,
      'background_color', settings.background_color,
      'theme', settings.theme
    ),
    'sections', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'section_type', section.section_type,
          'title', section.title,
          'content', section.content,
          'display_order', section.display_order,
          'enabled', section.enabled
        )
        order by section.display_order
      )
      from public.landing_sections section
      where section.company_id = v_company_id
        and section.landing_page_id = v_landing_page_id
        and section.deleted_at is null
    ), '[]'::jsonb),
    'services', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', service.id,
          'name', service.name,
          'description', service.description,
          'price', service.price,
          'duration_minutes', service.duration_minutes,
          'image_path', service.image_path,
          'display_order', service.display_order
        )
        order by service.display_order
      )
      from public.services service
      where service.company_id = v_company_id
        and service.active
        and service.publicly_visible
        and service.deleted_at is null
    ), '[]'::jsonb),
    'testimonials', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'customer_name', testimonial.customer_name,
          'quote', testimonial.quote,
          'rating', testimonial.rating,
          'photo_path', testimonial.photo_path,
          'display_order', testimonial.display_order
        )
        order by testimonial.display_order
      )
      from public.testimonials testimonial
      where testimonial.company_id = v_company_id
        and testimonial.published
        and testimonial.deleted_at is null
    ), '[]'::jsonb),
    'gallery', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', item.id,
          'object_path', asset.object_path,
          'caption', item.caption,
          'alt_text', item.alt_text,
          'display_order', item.display_order
        )
        order by item.display_order
      )
      from public.landing_gallery_items item
      join public.media_assets asset
        on asset.company_id = item.company_id
       and asset.id = item.media_asset_id
      where item.company_id = v_company_id
        and item.landing_page_id = v_landing_page_id
        and item.enabled
        and item.deleted_at is null
        and asset.deleted_at is null
    ), '[]'::jsonb)
  )
  into v_payload
  from public.companies company
  join public.landing_pages page on page.company_id = company.id
  join public.company_settings settings on settings.company_id = company.id
  where company.id = v_company_id
    and page.id = v_landing_page_id
    and company.deleted_at is null
    and page.deleted_at is null;

  return v_payload;
end;
$$;

revoke all on function public.get_preview_landing_payload(text, text) from public;
grant execute on function public.get_preview_landing_payload(text, text) to anon, authenticated, service_role;
