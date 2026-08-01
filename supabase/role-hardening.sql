-- Role hardening for existing Supabase projects.
-- Run this after schema.sql and admin-dashboard.sql.
-- It prevents admin accounts from creating or modifying toko data.

create or replace function public.is_toko()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'toko'
  );
$$;

revoke all on function public.is_toko() from public;
grant execute on function public.is_toko() to authenticated;

drop policy if exists "Toko owners can create their store" on public.stores;
create policy "Toko owners can create their store"
  on public.stores for insert to authenticated
  with check (owner_id = auth.uid() and public.is_toko());

drop policy if exists "Toko owners can update their store" on public.stores;
create policy "Toko owners can update their store"
  on public.stores for update to authenticated
  using (owner_id = auth.uid() and public.is_toko())
  with check (owner_id = auth.uid() and public.is_toko());

drop policy if exists "Toko owners can delete their store" on public.stores;
create policy "Toko owners can delete their store"
  on public.stores for delete to authenticated
  using (owner_id = auth.uid() and public.is_toko());

drop policy if exists "Toko owners can create products" on public.products;
create policy "Toko owners can create products"
  on public.products for insert to authenticated
  with check (public.is_toko() and exists (
    select 1 from public.stores
    where stores.id = products.store_id and stores.owner_id = auth.uid()
  ));

drop policy if exists "Toko owners can update products" on public.products;
create policy "Toko owners can update products"
  on public.products for update to authenticated
  using (public.is_toko() and exists (
    select 1 from public.stores
    where stores.id = products.store_id and stores.owner_id = auth.uid()
  ))
  with check (public.is_toko() and exists (
    select 1 from public.stores
    where stores.id = products.store_id and stores.owner_id = auth.uid()
  ));

drop policy if exists "Toko owners can delete products" on public.products;
create policy "Toko owners can delete products"
  on public.products for delete to authenticated
  using (public.is_toko() and exists (
    select 1 from public.stores
    where stores.id = products.store_id and stores.owner_id = auth.uid()
  ));

drop policy if exists "Toko owners can upload product images" on storage.objects;
create policy "Toko owners can upload product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and public.is_toko()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Toko owners can update product images" on storage.objects;
create policy "Toko owners can update product images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_toko()
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'product-images'
    and public.is_toko()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Toko owners can delete product images" on storage.objects;
create policy "Toko owners can delete product images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_toko()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
