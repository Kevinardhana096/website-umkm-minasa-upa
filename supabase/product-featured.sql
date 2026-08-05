-- Admin-controlled featured products.
-- Run this migration before rerunning atomic-product-write.sql and member-products.sql.

alter table public.products
  add column if not exists is_featured boolean not null default false;

create index if not exists products_featured_idx
  on public.products(is_featured, is_visible);
