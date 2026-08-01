-- Admin Dashboard read-only policies.
-- Run this migration in Supabase SQL Editor after schema.sql.

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

drop policy if exists "Admins can view all stores" on public.stores;
create policy "Admins can view all stores"
  on public.stores for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins can view all products" on public.products;
create policy "Admins can view all products"
  on public.products for select to authenticated
  using (public.is_admin());
