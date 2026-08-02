-- Admin audit trail for cross-store catalog mutations.
-- Run after schema.sql and admin-dashboard.sql.

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('update', 'delete')),
  resource text not null check (resource in ('store', 'product')),
  resource_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs(created_at desc);

create index if not exists admin_audit_logs_resource_idx
  on public.admin_audit_logs(resource, resource_id);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins can view audit logs" on public.admin_audit_logs;
create policy "Admins can view audit logs"
  on public.admin_audit_logs for select to authenticated
  using (public.is_admin());
