-- Limit the UMKM profile to four featured products, including direct database writes.
-- Run after member-products.sql.

create or replace function public.enforce_max_featured_products()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_featured_count integer;
begin
  if not new.is_featured or (tg_op = 'UPDATE' and old.is_featured) then
    return new;
  end if;

  -- Serialize promotions so two concurrent requests cannot both take the last slot.
  perform pg_advisory_xact_lock(hashtext('public.products.featured.limit'));

  select count(*)::integer
  into v_featured_count
  from public.products
  where is_featured
    and (tg_op = 'INSERT' or id <> new.id);

  if v_featured_count >= 4 then
    raise exception 'Maksimal 4 produk unggulan yang dapat ditampilkan di profil UMKM.';
  end if;

  return new;
end;
$$;

drop trigger if exists products_max_featured_products on public.products;
create trigger products_max_featured_products
  before insert or update of is_featured on public.products
  for each row
  execute function public.enforce_max_featured_products();
