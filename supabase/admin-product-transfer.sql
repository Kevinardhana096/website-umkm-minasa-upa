-- Run after member-products.sql and admin-audit.sql.
-- Transfers product management to an existing Anggota account without moving
-- the product out of its current store.

-- Fresh installations get this definition from member-products.sql. Repeating
-- it here makes the migration safe for projects that already ran that file.
create or replace function public.prevent_product_identity_change()
returns trigger
language plpgsql
as $$
begin
  if new.store_id <> old.store_id
    or (new.created_by is distinct from old.created_by and new.created_by is not null and not public.is_admin()) then
    raise exception 'Store dan pembuat produk tidak dapat diubah.';
  end if;
  return new;
end;
$$;

create or replace function public.admin_transfer_products(
  p_product_ids uuid[],
  p_target_user_id uuid,
  p_image_transfers jsonb default '[]'::jsonb
)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_role text;
  v_requested_count integer;
  v_found_count integer;
  v_image_transfer_count integer;
  v_matched_image_count integer;
begin
  if not public.is_admin() then
    raise exception 'Akses admin diperlukan.';
  end if;

  if coalesce(array_length(p_product_ids, 1), 0) = 0 then
    raise exception 'Minimal satu produk harus dipilih.';
  end if;

  select count(*) into v_requested_count
  from (select distinct unnest(p_product_ids) as id) as requested;
  if v_requested_count <> array_length(p_product_ids, 1) then
    raise exception 'Daftar produk tidak valid.';
  end if;

  select role into v_target_role from public.profiles where id = p_target_user_id;
  if v_target_role is null then
    raise exception 'Akun tujuan tidak ditemukan.';
  end if;
  if v_target_role <> 'anggota' then
    raise exception 'Akun tujuan harus memiliki role Anggota.';
  end if;

  select count(*) into v_found_count from public.products where id = any(p_product_ids);
  if v_found_count <> v_requested_count then
    raise exception 'Satu atau lebih produk tidak ditemukan.';
  end if;
  perform 1 from public.products where id = any(p_product_ids) for update;

  if jsonb_typeof(coalesce(p_image_transfers, '[]'::jsonb)) <> 'array' then
    raise exception 'Format perpindahan foto tidak valid.';
  end if;
  v_image_transfer_count := jsonb_array_length(coalesce(p_image_transfers, '[]'::jsonb));

  if exists (
    select 1 from jsonb_array_elements(coalesce(p_image_transfers, '[]'::jsonb)) as entry
    where nullif(trim(entry ->> 'product_id'), '') is null
      or nullif(trim(entry ->> 'from_path'), '') is null
      or nullif(trim(entry ->> 'to_path'), '') is null
  ) then
    raise exception 'Referensi foto produk tidak valid.';
  end if;

  with mappings as (
    select (entry ->> 'product_id')::uuid as product_id, entry ->> 'from_path' as from_path, entry ->> 'to_path' as to_path
    from jsonb_array_elements(coalesce(p_image_transfers, '[]'::jsonb)) as entry
  )
  select count(*) into v_matched_image_count
  from mappings as mapping
  where mapping.product_id = any(p_product_ids)
    and (exists (select 1 from public.products where id = mapping.product_id and image_path = mapping.from_path)
      or exists (select 1 from public.product_images where product_id = mapping.product_id and image_path = mapping.from_path));
  if v_matched_image_count <> v_image_transfer_count then
    raise exception 'Referensi foto produk tidak cocok.';
  end if;

  with mappings as (
    select (entry ->> 'product_id')::uuid as product_id, entry ->> 'from_path' as from_path, entry ->> 'to_path' as to_path
    from jsonb_array_elements(coalesce(p_image_transfers, '[]'::jsonb)) as entry
  )
  update public.products as product set image_path = mapping.to_path
  from mappings as mapping where product.id = mapping.product_id and product.image_path = mapping.from_path;

  with mappings as (
    select (entry ->> 'product_id')::uuid as product_id, entry ->> 'from_path' as from_path, entry ->> 'to_path' as to_path
    from jsonb_array_elements(coalesce(p_image_transfers, '[]'::jsonb)) as entry
  )
  update public.product_images as image set image_path = mapping.to_path
  from mappings as mapping where image.product_id = mapping.product_id and image.image_path = mapping.from_path;

  update public.products set created_by = p_target_user_id where id = any(p_product_ids);
  return p_product_ids;
end;
$$;

revoke all on function public.admin_transfer_products(uuid[], uuid, jsonb) from public;
grant execute on function public.admin_transfer_products(uuid[], uuid, jsonb) to authenticated;
