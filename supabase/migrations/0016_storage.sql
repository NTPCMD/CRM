-- 0016_storage.sql
-- Volume 2 §22-§23 — private Storage buckets and workspace-scoped object
-- policies. Objects are addressed as `<workspace_id>/...`; access is never via
-- public URLs (use signed URLs). Guarded so local validation (no `storage`
-- schema) is a no-op; runs fully on Supabase.

-- Safely parse a uuid (returns NULL instead of raising on bad input).
create or replace function app.safe_uuid(p text)
returns uuid language plpgsql immutable as $$
begin
  return p::uuid;
exception when others then
  return null;
end;
$$;

do $$
begin
  if to_regclass('storage.objects') is null then
    raise notice 'storage schema not present; skipping bucket setup (local validation)';
    return;
  end if;

  -- Create private buckets (idempotent).
  insert into storage.buckets (id, name, public)
  select b, b, false from unnest(array[
    'avatars','project-files','contracts','invoices',
    'meeting-recordings','temp','exports'
  ]) as b
  on conflict (id) do nothing;

  -- One workspace-scoped policy set covering all AgencyOS buckets. Objects must
  -- live under a workspace the caller belongs to: `<workspace_id>/...`.
  execute $p$
    drop policy if exists agencyos_objects_select on storage.objects;
    create policy agencyos_objects_select on storage.objects for select to authenticated
      using (
        bucket_id in ('avatars','project-files','contracts','invoices','meeting-recordings','temp','exports')
        and app.is_member(app.safe_uuid((storage.foldername(name))[1]))
      );
  $p$;
  execute $p$
    drop policy if exists agencyos_objects_insert on storage.objects;
    create policy agencyos_objects_insert on storage.objects for insert to authenticated
      with check (
        bucket_id in ('avatars','project-files','contracts','invoices','meeting-recordings','temp','exports')
        and app.is_member(app.safe_uuid((storage.foldername(name))[1]))
      );
  $p$;
  execute $p$
    drop policy if exists agencyos_objects_update on storage.objects;
    create policy agencyos_objects_update on storage.objects for update to authenticated
      using (
        bucket_id in ('avatars','project-files','contracts','invoices','meeting-recordings','temp','exports')
        and app.is_member(app.safe_uuid((storage.foldername(name))[1]))
      );
  $p$;
  execute $p$
    drop policy if exists agencyos_objects_delete on storage.objects;
    create policy agencyos_objects_delete on storage.objects for delete to authenticated
      using (
        bucket_id in ('avatars','project-files','contracts','invoices','meeting-recordings','temp','exports')
        and app.is_member(app.safe_uuid((storage.foldername(name))[1]))
      );
  $p$;
end $$;
