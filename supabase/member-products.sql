-- Role anggota, store name normalization, product ownership, and product contacts.
-- Run after schema.sql, admin-dashboard.sql, role-hardening.sql,
-- product-gallery.sql, and atomic-product-write.sql.

alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('toko', 'admin', 'anggota'));

alter table public.stores
  add column if not exists name_normalized text;

create or replace function public.normalize_store_name(value text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(trim(coalesce(value, '')), '[[:space:]]+', ' ', 'g'));
$$;

update public.stores
set name_normalized = public.normalize_store_name(name)
where name_normalized is null;

create unique index if not exists stores_name_normalized_unique_idx
  on public.stores(name_normalized)
  where name_normalized is not null;

create or replace function public.set_store_name_normalized()
returns trigger
language plpgsql
as $$
begin
  new.name_normalized = public.normalize_store_name(new.name);
  return new;
end;
$$;

drop trigger if exists stores_set_name_normalized on public.stores;
create trigger stores_set_name_normalized
  before insert or update of name on public.stores
  for each row execute procedure public.set_store_name_normalized();

alter table public.products
  add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.products
  add column if not exists whatsapp_number text;

update public.products as products
set created_by = stores.owner_id
from public.stores as stores
where stores.id = products.store_id
  and products.created_by is null;

update public.products as products
set whatsapp_number = stores.whatsapp_number
from public.stores as stores
where stores.id = products.store_id
  and products.whatsapp_number is null;

alter table public.products
  alter column whatsapp_number set not null;
alter table public.products
  drop constraint if exists products_whatsapp_number_check;
alter table public.products
  add constraint products_whatsapp_number_check
  check (length(regexp_replace(whatsapp_number, '[^0-9]', '', 'g')) >= 8);

create index if not exists products_created_by_idx on public.products(created_by);

create or replace function public.is_anggota()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'anggota'
  );
$$;

revoke all on function public.is_anggota() from public;
grant execute on function public.is_anggota() to authenticated;

drop policy if exists "Anggota can create their store" on public.stores;
create policy "Anggota can create their store"
  on public.stores for insert to authenticated
  with check (owner_id = auth.uid() and public.is_anggota());

drop policy if exists "Anyone can view visible products" on public.products;
create policy "Anyone can view visible products"
  on public.products for select
  using (
    (is_visible = true and exists (
      select 1 from public.stores
      where stores.id = products.store_id and stores.is_active = true
    ))
    or exists (
      select 1 from public.stores
      where stores.id = products.store_id and stores.owner_id = auth.uid()
    )
    or created_by = auth.uid()
  );

drop policy if exists "Anggota can create products" on public.products;
create policy "Anggota can create products"
  on public.products for insert to authenticated
  with check (
    public.is_anggota()
    and created_by = auth.uid()
    and exists (
      select 1 from public.stores
      where stores.id = products.store_id and stores.is_active = true
    )
  );

drop policy if exists "Anggota can update their products" on public.products;
create policy "Anggota can update their products"
  on public.products for update to authenticated
  using (public.is_anggota() and created_by = auth.uid())
  with check (public.is_anggota() and created_by = auth.uid());

drop policy if exists "Anggota can delete their products" on public.products;
create policy "Anggota can delete their products"
  on public.products for delete to authenticated
  using (public.is_anggota() and created_by = auth.uid());

create or replace function public.prevent_product_identity_change()
returns trigger
language plpgsql
as $$
begin
  -- Allow the FK's ON DELETE SET NULL cleanup. A transfer is permitted only
  -- for an authenticated admin via admin_transfer_products().
  if new.store_id <> old.store_id
    or (new.created_by is distinct from old.created_by and new.created_by is not null and not public.is_admin()) then
    raise exception 'Store dan pembuat produk tidak dapat diubah.';
  end if;
  return new;
end;
$$;

drop trigger if exists products_prevent_identity_change on public.products;
create trigger products_prevent_identity_change
  before update on public.products
  for each row execute procedure public.prevent_product_identity_change();

drop policy if exists "Product creators can view their images" on public.product_images;
create policy "Product creators can view their images"
  on public.product_images for select to authenticated
  using (exists (
    select 1 from public.products
    where products.id = product_images.product_id and products.created_by = auth.uid()
  ));

drop policy if exists "Anggota can create their product images" on public.product_images;
create policy "Anggota can create their product images"
  on public.product_images for insert to authenticated
  with check (public.is_anggota() and exists (
    select 1 from public.products
    where products.id = product_images.product_id and products.created_by = auth.uid()
  ));

drop policy if exists "Anggota can update their product images" on public.product_images;
create policy "Anggota can update their product images"
  on public.product_images for update to authenticated
  using (public.is_anggota() and exists (
    select 1 from public.products
    where products.id = product_images.product_id and products.created_by = auth.uid()
  ))
  with check (public.is_anggota() and exists (
    select 1 from public.products
    where products.id = product_images.product_id and products.created_by = auth.uid()
  ));

drop policy if exists "Anggota can delete their product images" on public.product_images;
create policy "Anggota can delete their product images"
  on public.product_images for delete to authenticated
  using (public.is_anggota() and exists (
    select 1 from public.products
    where products.id = product_images.product_id and products.created_by = auth.uid()
  ));

drop policy if exists "Anggota can upload product images" on storage.objects;
create policy "Anggota can upload product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and public.is_anggota()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anggota can update product images" on storage.objects;
create policy "Anggota can update product images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_anggota()
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'product-images'
    and public.is_anggota()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anggota can delete product images" on storage.objects;
create policy "Anggota can delete product images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_anggota()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop function if exists public.save_product_with_gallery(uuid, uuid, text, text, numeric, boolean, boolean, jsonb);

create or replace function public.save_product_with_gallery(
  p_product_id uuid,
  p_store_id uuid,
  p_name text,
  p_category text,
  p_description text,
  p_whatsapp_number text,
  p_price numeric,
  p_is_available boolean,
  p_is_visible boolean,
  p_is_featured boolean,
  p_images jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_product_id uuid;
  v_image_count integer;
  v_primary_count integer;
  v_primary_path text;
  v_existing_store_id uuid;
  v_normalized_whatsapp text;
begin
  if nullif(trim(p_name), '') is null or nullif(trim(p_description), '') is null then
    raise exception 'Nama dan deskripsi produk wajib diisi.';
  end if;
  if p_category not in ('Batik & Pakaian', 'Kerajinan Kayu', 'Tas & Anyaman', 'Kriya', 'Kue & Jajanan', 'Sambal & Bumbu', 'Keripik & Camilan', 'Makanan Olahan Lainnya') then
    raise exception 'Kategori produk tidak valid.';
  end if;
  if p_price is not null and p_price < 0 then
    raise exception 'Harga produk tidak valid.';
  end if;

  v_normalized_whatsapp := regexp_replace(coalesce(p_whatsapp_number, ''), '[^0-9]', '', 'g');
  if length(v_normalized_whatsapp) < 8 then
    raise exception 'Nomor WhatsApp belum valid.';
  end if;

  if jsonb_typeof(coalesce(p_images, '[]'::jsonb)) <> 'array' then
    raise exception 'Format galeri produk tidak valid.';
  end if;

  v_image_count := jsonb_array_length(coalesce(p_images, '[]'::jsonb));
  if v_image_count > 5 then
    raise exception 'Maksimal 5 foto per produk.';
  end if;

  select count(*)::integer
  into v_primary_count
  from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) as image
  where coalesce((image ->> 'is_primary')::boolean, false);

  if (v_image_count > 0 and v_primary_count <> 1) or (v_image_count = 0 and v_primary_count <> 0) then
    raise exception 'Galeri harus memiliki tepat satu foto utama.';
  end if;

  select image ->> 'image_path'
  into v_primary_path
  from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) as image
  where coalesce((image ->> 'is_primary')::boolean, false)
  limit 1;

  if p_product_id is null then
    insert into public.products (
      store_id, created_by, name, category, description, whatsapp_number, price, image_path, is_available, is_visible, is_featured
    ) values (
      p_store_id, auth.uid(), trim(p_name), p_category, trim(p_description), v_normalized_whatsapp, p_price, v_primary_path, p_is_available, p_is_visible, p_is_featured
    ) returning id into v_product_id;
  else
    select store_id into v_existing_store_id
    from public.products
    where id = p_product_id;

    if v_existing_store_id is null then
      raise exception 'Produk tidak ditemukan atau akses ditolak.';
    end if;
    if v_existing_store_id <> p_store_id then
      raise exception 'Toko produk tidak dapat diubah.';
    end if;

    update public.products
    set
      name = trim(p_name),
      category = p_category,
      description = trim(p_description),
      whatsapp_number = v_normalized_whatsapp,
      price = p_price,
      image_path = v_primary_path,
      is_available = p_is_available,
      is_visible = p_is_visible
      ,is_featured = p_is_featured
    where id = p_product_id and store_id = p_store_id
    returning id into v_product_id;

    if v_product_id is null then
      raise exception 'Produk tidak ditemukan atau akses ditolak.';
    end if;
  end if;

  delete from public.product_images where product_id = v_product_id;

  insert into public.product_images (product_id, image_path, sort_order, is_primary)
  select
    v_product_id,
    image ->> 'image_path',
    (ordinality - 1)::integer,
    coalesce((image ->> 'is_primary')::boolean, false)
  from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) with ordinality as entries(image, ordinality)
  where nullif(trim(image ->> 'image_path'), '') is not null;

  if (select count(*) from public.product_images where product_id = v_product_id) <> v_image_count then
    raise exception 'Path foto produk tidak valid.';
  end if;

  return v_product_id;
end;
$$;

revoke all on function public.save_product_with_gallery(uuid, uuid, text, text, text, text, numeric, boolean, boolean, boolean, jsonb) from public;
grant execute on function public.save_product_with_gallery(uuid, uuid, text, text, text, text, numeric, boolean, boolean, boolean, jsonb) to authenticated, service_role;
