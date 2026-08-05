-- Product categories for the mixed food-processing and craft UMKM catalog.
-- Run after supabase/schema.sql and supabase/member-products.sql.

alter table public.products
  add column if not exists category text;

update public.products
set category = 'Makanan Olahan Lainnya'
where category is null;

alter table public.products
  alter column category set default 'Makanan Olahan Lainnya',
  alter column category set not null;

alter table public.products
  drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check
  check (category in ('Batik & Pakaian', 'Kerajinan Kayu', 'Tas & Anyaman', 'Kriya', 'Kue & Jajanan', 'Sambal & Bumbu', 'Keripik & Camilan', 'Makanan Olahan Lainnya'));
