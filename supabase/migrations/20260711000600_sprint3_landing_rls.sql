-- Sprint 3: Landing Page — RLS, manager write access and storage alignment.

set search_path = public, extensions;

alter table public.landing_preview_tokens enable row level security;
alter table public.landing_gallery_items enable row level security;

-- Preview tokens: managers can create/revoke; members can read own company tokens.
create policy landing_preview_tokens_select
on public.landing_preview_tokens
for select to authenticated
using (public.is_company_member(company_id));

create policy landing_preview_tokens_insert
on public.landing_preview_tokens
for insert to authenticated
with check (
  public.can_manage_landing(company_id)
  and created_by = auth.uid()
);

create policy landing_preview_tokens_update
on public.landing_preview_tokens
for update to authenticated
using (public.can_manage_landing(company_id))
with check (public.can_manage_landing(company_id));

create policy landing_preview_tokens_delete
on public.landing_preview_tokens
for delete to authenticated
using (public.can_manage_landing(company_id));

-- Gallery items inherit landing management permissions.
create policy landing_gallery_items_select
on public.landing_gallery_items
for select to authenticated
using (public.is_company_member(company_id));

create policy landing_gallery_items_insert
on public.landing_gallery_items
for insert to authenticated
with check (public.can_manage_landing(company_id));

create policy landing_gallery_items_update
on public.landing_gallery_items
for update to authenticated
using (public.can_manage_landing(company_id))
with check (public.can_manage_landing(company_id));

create policy landing_gallery_items_delete
on public.landing_gallery_items
for delete to authenticated
using (public.can_manage_landing(company_id));

-- Extend landing write access to manager role (owner/admin already covered).
create policy landing_pages_write_manager
on public.landing_pages
for insert to authenticated
with check (public.has_company_role(company_id, array['manager']::public.membership_role[]));

create policy landing_pages_update_manager
on public.landing_pages
for update to authenticated
using (public.has_company_role(company_id, array['manager']::public.membership_role[]))
with check (public.has_company_role(company_id, array['manager']::public.membership_role[]));

create policy landing_pages_delete_manager
on public.landing_pages
for delete to authenticated
using (public.has_company_role(company_id, array['manager']::public.membership_role[]));

create policy landing_sections_write_manager
on public.landing_sections
for insert to authenticated
with check (public.has_company_role(company_id, array['manager']::public.membership_role[]));

create policy landing_sections_update_manager
on public.landing_sections
for update to authenticated
using (public.has_company_role(company_id, array['manager']::public.membership_role[]))
with check (public.has_company_role(company_id, array['manager']::public.membership_role[]));

create policy landing_sections_delete_manager
on public.landing_sections
for delete to authenticated
using (public.has_company_role(company_id, array['manager']::public.membership_role[]));

create policy testimonials_write_manager
on public.testimonials
for insert to authenticated
with check (public.has_company_role(company_id, array['manager']::public.membership_role[]));

create policy testimonials_update_manager
on public.testimonials
for update to authenticated
using (public.has_company_role(company_id, array['manager']::public.membership_role[]))
with check (public.has_company_role(company_id, array['manager']::public.membership_role[]));

create policy testimonials_delete_manager
on public.testimonials
for delete to authenticated
using (public.has_company_role(company_id, array['manager']::public.membership_role[]));

create policy media_assets_write_manager
on public.media_assets
for insert to authenticated
with check (public.has_company_role(company_id, array['manager']::public.membership_role[]));

create policy media_assets_update_manager
on public.media_assets
for update to authenticated
using (public.has_company_role(company_id, array['manager']::public.membership_role[]))
with check (public.has_company_role(company_id, array['manager']::public.membership_role[]));

create policy media_assets_delete_manager
on public.media_assets
for delete to authenticated
using (public.has_company_role(company_id, array['manager']::public.membership_role[]));

-- Storage: allow manager uploads for landing media.
drop policy if exists company_public_media_insert on storage.objects;
drop policy if exists company_public_media_update on storage.objects;
drop policy if exists company_public_media_delete on storage.objects;

create policy company_public_media_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'company-public-media'
  and public.has_company_role(
    (storage.foldername(name))[1]::uuid,
    array['owner', 'admin', 'manager']::public.membership_role[]
  )
);

create policy company_public_media_update
on storage.objects for update to authenticated
using (
  bucket_id = 'company-public-media'
  and public.has_company_role(
    (storage.foldername(name))[1]::uuid,
    array['owner', 'admin', 'manager']::public.membership_role[]
  )
)
with check (
  bucket_id = 'company-public-media'
  and public.has_company_role(
    (storage.foldername(name))[1]::uuid,
    array['owner', 'admin', 'manager']::public.membership_role[]
  )
);

create policy company_public_media_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'company-public-media'
  and public.has_company_role(
    (storage.foldername(name))[1]::uuid,
    array['owner', 'admin', 'manager']::public.membership_role[]
  )
);
