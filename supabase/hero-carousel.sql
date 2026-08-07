-- Hero carousel management for the home and profile pages.
-- Run after schema.sql, admin-dashboard.sql, and admin-audit.sql.

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop index if exists public.hero_slides_sort_order_unique_idx;
create index if not exists hero_slides_sort_order_idx
  on public.hero_slides(sort_order, is_active);

drop trigger if exists hero_slides_set_updated_at on public.hero_slides;
create trigger hero_slides_set_updated_at
  before update on public.hero_slides
  for each row execute procedure public.set_updated_at();

alter table public.hero_slides enable row level security;

drop policy if exists "Anyone can view active hero slides" on public.hero_slides;
create policy "Anyone can view active hero slides"
  on public.hero_slides for select
  using (is_active = true);

drop policy if exists "Admins can view all hero slides" on public.hero_slides;
create policy "Admins can view all hero slides"
  on public.hero_slides for select to authenticated
  using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hero-images',
  'hero-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view hero images" on storage.objects;
create policy "Anyone can view hero images"
  on storage.objects for select
  using (bucket_id = 'hero-images');

-- Seed the current local images. They remain valid local paths until an admin
-- replaces them with files in the hero-images Storage bucket.
insert into public.hero_slides (image_path, alt_text, sort_order, is_active)
select * from (values
  ('/carousel/pexels-craft-group.jpeg', 'Perempuan mengerjakan kerajinan tangan di ruang produksi', 0, true),
  ('/carousel/pexels-craft-studio.jpeg', 'Dua perajin perempuan membuat produk kerajinan tangan', 1, true),
  ('/carousel/pexels-food-stand.jpeg', 'Perempuan menyiapkan makanan di stan kuliner', 2, true),
  ('/carousel/pexels-food-market.jpeg', 'Aktivitas kuliner di pasar makanan', 3, true)
) as seeds(image_path, alt_text, sort_order, is_active)
where not exists (select 1 from public.hero_slides);

alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_resource_check;
alter table public.admin_audit_logs
  add constraint admin_audit_logs_resource_check
  check (resource in ('store', 'product', 'user', 'hero_slide'));
