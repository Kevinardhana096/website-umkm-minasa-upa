-- Product gallery support.
-- Run after schema.sql, admin-dashboard.sql, and role-hardening.sql.

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_path text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx
  on public.product_images(product_id);

create unique index if not exists product_images_primary_idx
  on public.product_images(product_id)
  where is_primary = true;

create unique index if not exists product_images_order_idx
  on public.product_images(product_id, sort_order);

drop trigger if exists product_images_set_updated_at on public.product_images;
create trigger product_images_set_updated_at
  before update on public.product_images
  for each row execute procedure public.set_updated_at();

-- Backfill the existing single image into the new gallery table. The query is
-- idempotent, so it is safe to run this migration more than once.
insert into public.product_images (product_id, image_path, sort_order, is_primary)
select products.id, products.image_path, 0, true
from public.products as products
where products.image_path is not null
  and not exists (
    select 1
    from public.product_images as existing_image
    where existing_image.product_id = products.id
  );

alter table public.product_images enable row level security;

drop policy if exists "Anyone can view visible product images" on public.product_images;
create policy "Anyone can view visible product images"
  on public.product_images for select
  using (
    exists (
      select 1
      from public.products
      join public.stores on stores.id = products.store_id
      where products.id = product_images.product_id
        and products.is_visible = true
        and stores.is_active = true
    )
    or exists (
      select 1
      from public.products
      join public.stores on stores.id = products.store_id
      where products.id = product_images.product_id
        and stores.owner_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "Toko owners can create product images" on public.product_images;
create policy "Toko owners can create product images"
  on public.product_images for insert to authenticated
  with check (
    public.is_toko()
    and exists (
      select 1
      from public.products
      join public.stores on stores.id = products.store_id
      where products.id = product_images.product_id
        and stores.owner_id = auth.uid()
    )
  );

drop policy if exists "Toko owners can update product images" on public.product_images;
create policy "Toko owners can update product images"
  on public.product_images for update to authenticated
  using (
    public.is_toko()
    and exists (
      select 1
      from public.products
      join public.stores on stores.id = products.store_id
      where products.id = product_images.product_id
        and stores.owner_id = auth.uid()
    )
  )
  with check (
    public.is_toko()
    and exists (
      select 1
      from public.products
      join public.stores on stores.id = products.store_id
      where products.id = product_images.product_id
        and stores.owner_id = auth.uid()
    )
  );

drop policy if exists "Toko owners can delete product images" on public.product_images;
create policy "Toko owners can delete product images"
  on public.product_images for delete to authenticated
  using (
    public.is_toko()
    and exists (
      select 1
      from public.products
      join public.stores on stores.id = products.store_id
      where products.id = product_images.product_id
        and stores.owner_id = auth.uid()
    )
  );
