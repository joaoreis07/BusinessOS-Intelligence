-- Sprint 2 RLS updates for invitations and workspace preferences.

set search_path = public, extensions;

alter table public.company_invitations enable row level security;
alter table public.workspace_preferences enable row level security;

create policy company_invitations_select
  on public.company_invitations
  for select
  to authenticated
  using (
    public.is_company_member(company_id)
    or lower(email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy company_invitations_insert
  on public.company_invitations
  for insert
  to authenticated
  with check (
    public.has_company_role(company_id, array['owner', 'admin', 'manager']::public.membership_role[])
    and status = 'pending'
  );

create policy company_invitations_update
  on public.company_invitations
  for update
  to authenticated
  using (
    public.has_company_role(company_id, array['owner', 'admin', 'manager']::public.membership_role[])
  )
  with check (
    public.has_company_role(company_id, array['owner', 'admin', 'manager']::public.membership_role[])
  );

create policy company_invitations_delete
  on public.company_invitations
  for delete
  to authenticated
  using (
    public.has_company_role(company_id, array['owner', 'admin']::public.membership_role[])
  );

create policy workspace_preferences_select
  on public.workspace_preferences
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.has_company_role(company_id, array['owner', 'admin', 'manager']::public.membership_role[])
  );

create policy workspace_preferences_insert
  on public.workspace_preferences
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or public.has_company_role(company_id, array['owner', 'admin', 'manager']::public.membership_role[])
  );

create policy workspace_preferences_update
  on public.workspace_preferences
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or public.has_company_role(company_id, array['owner', 'admin', 'manager']::public.membership_role[])
  )
  with check (
    user_id = auth.uid()
    or public.has_company_role(company_id, array['owner', 'admin', 'manager']::public.membership_role[])
  );

create policy workspace_preferences_delete
  on public.workspace_preferences
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.has_company_role(company_id, array['owner', 'admin']::public.membership_role[])
  );
