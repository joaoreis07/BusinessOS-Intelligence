begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(15);

select has_table('public', 'landing_preview_tokens', 'preview tokens table exists');
select has_table('public', 'landing_gallery_items', 'gallery items table exists');
select has_function('public', 'can_manage_landing', array['uuid'], 'can_manage_landing helper exists');
select has_function('public', 'is_reserved_slug', array['text'], 'reserved slug helper exists');
select has_function(
  'public',
  'create_landing_preview_token',
  array['uuid', 'integer'],
  'create preview token RPC exists'
);
select has_function(
  'public',
  'validate_landing_preview_token',
  array['text', 'text'],
  'validate preview token RPC exists'
);
select has_function(
  'public',
  'revoke_landing_preview_token',
  array['text'],
  'revoke preview token RPC exists'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.landing_preview_tokens'::regclass),
  'RLS enabled on landing_preview_tokens'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.landing_gallery_items'::regclass),
  'RLS enabled on landing_gallery_items'
);

select is(
  public.is_reserved_slug('dashboard')::text,
  'true',
  'dashboard slug is reserved'
);

select is(
  public.is_reserved_slug('empresa-demo')::text,
  'false',
  'tenant slug is not reserved'
);

select has_view('public', 'public_landing_gallery', 'public gallery view exists');

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'landing_pages'
      and column_name = 'template_key'
  ),
  'landing_pages has template_key column'
);

select has_function(
  'public',
  'get_preview_landing_payload',
  array['text', 'text'],
  'preview payload RPC exists'
);

select has_function(
  'public',
  'get_public_slug_status',
  array['text'],
  'public slug status RPC exists'
);

select is(
  public.get_preview_landing_payload('invalid-token', 'empresa-demo')::text,
  null,
  'invalid preview token returns null payload'
);

select * from finish();
rollback;
