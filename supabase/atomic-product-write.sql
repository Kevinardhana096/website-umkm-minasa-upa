-- Atomic product and gallery writes.
-- Run after product-gallery.sql.

create or replace function public.save_product_with_gallery(
  p_product_id uuid,
  p_store_id uuid,
  p_name text,
  p_category text,
  p_description text,
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
      store_id, name, category, description, price, image_path, is_available, is_visible, is_featured
    ) values (
      p_store_id, trim(p_name), p_category, trim(p_description), p_price, v_primary_path, p_is_available, p_is_visible, p_is_featured
    ) returning id into v_product_id;
  else
    update public.products
    set
      name = trim(p_name),
      category = p_category,
      description = trim(p_description),
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

revoke all on function public.save_product_with_gallery(uuid, uuid, text, text, text, numeric, boolean, boolean, boolean, jsonb) from public;
grant execute on function public.save_product_with_gallery(uuid, uuid, text, text, text, numeric, boolean, boolean, boolean, jsonb) to authenticated, service_role;
