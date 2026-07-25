-- PostgreSQL cannot use newly added enum values in the same transaction.
-- Add extended roles in a dedicated migration before tables reference them.

set search_path = public, extensions;

alter type public.membership_role add value if not exists 'manager';
alter type public.membership_role add value if not exists 'employee';
