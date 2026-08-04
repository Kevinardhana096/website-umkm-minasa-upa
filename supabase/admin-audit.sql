-- Admin audit trail for cross-store catalog mutations.
-- Run after schema.sql and admin-dashboard.sql.

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('create', 'update', 'delete', 'role', 'ban', 'unban', 'reset_password')),
  resource text not null check (resource in ('store', 'product', 'user')),
  resource_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Akun admin yang dihapus tidak boleh memblokir penghapusan karena riwayat audit.
-- Jejaknya tetap dipertahankan, tetapi admin_id menjadi NULL.
alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_admin_id_fkey;
alter table public.admin_audit_logs
  alter column admin_id drop not null;
alter table public.admin_audit_logs
  add constraint admin_audit_logs_admin_id_fkey
  foreign key (admin_id) references auth.users(id) on delete set null;

-- Perbarui constraint pada project yang sudah menjalankan versi awal migration ini.
alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_action_check;
alter table public.admin_audit_logs
  add constraint admin_audit_logs_action_check
  check (action in ('create', 'update', 'delete', 'role', 'ban', 'unban', 'reset_password'));

alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_resource_check;
alter table public.admin_audit_logs
  add constraint admin_audit_logs_resource_check
  check (resource in ('store', 'product', 'user'));

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs(created_at desc);

create index if not exists admin_audit_logs_resource_idx
  on public.admin_audit_logs(resource, resource_id);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins can view audit logs" on public.admin_audit_logs;
create policy "Admins can view audit logs"
  on public.admin_audit_logs for select to authenticated
  using (public.is_admin());
