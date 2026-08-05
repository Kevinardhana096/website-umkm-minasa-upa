-- Initial schema for the UMKM single-page product catalog.
-- Run this file in the Supabase SQL Editor after creating a project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'toko' check (role in ('toko', 'admin', 'anggota')),
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  seller_name text not null,
  description text,
  whatsapp_number text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  category text not null default 'Makanan Olahan Lainnya' check (category in ('Batik & Pakaian', 'Kerajinan Kayu', 'Tas & Anyaman', 'Kriya', 'Kue & Jajanan', 'Sambal & Bumbu', 'Keripik & Camilan', 'Makanan Olahan Lainnya')),
  description text not null default '',
  image_path text,
  price numeric(12, 2) check (price is null or price >= 0),
  is_available boolean not null default true,
  is_visible boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_store_id_idx on public.products(store_id);
create index if not exists products_visible_idx on public.products(is_visible, is_available);
create index if not exists products_featured_idx on public.products(is_featured, is_visible);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at
  before update on public.stores
  for each row execute procedure public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

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

drop policy if exists "Anyone can view active stores" on public.stores;
create policy "Anyone can view active stores"
  on public.stores for select
  using (is_active = true or owner_id = auth.uid());

drop policy if exists "Admins can view all stores" on public.stores;
create policy "Admins can view all stores"
  on public.stores for select to authenticated
  using (public.is_admin());

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
  );

drop policy if exists "Admins can view all products" on public.products;
create policy "Admins can view all products"
  on public.products for select to authenticated
  using (public.is_admin());

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view product images" on storage.objects;
create policy "Anyone can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

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
