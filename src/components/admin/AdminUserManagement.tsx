"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  Unlock,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

type Role = "toko" | "admin";

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  store_name: string | null;
  store_is_active: boolean | null;
  email_confirmed: boolean;
  banned_until: string | null;
  is_current_user: boolean;
  created_at: string;
}

interface UserFormState {
  email: string;
  full_name: string;
  password: string;
  role: Role;
}

type PendingAction = `${string}:${"role" | "ban" | "reset_password"}` | null;

const EMPTY_FORM: UserFormState = { email: "", full_name: "", password: "", role: "toko" };

function isBanned(user: AdminUser) {
  return Boolean(user.banned_until && new Date(user.banned_until).getTime() > Date.now());
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

export function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Daftar user gagal dimuat.");
      setUsers(payload.users ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Daftar user gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(), 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const adminCount = useMemo(() => users.filter((user) => user.role === "admin").length, [users]);
  const bannedCount = useMemo(() => users.filter(isBanned).length, [users]);

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "User gagal dibuat.");
      setForm(EMPTY_FORM);
      setSuccessMessage("User berhasil dibuat dan dapat langsung login.");
      await loadUsers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "User gagal dibuat.");
    } finally {
      setIsCreating(false);
    }
  };

  const updateUser = async (userId: string, action: "role" | "ban" | "reset_password", details: Record<string, unknown>) => {
    const key = `${userId}:${action}` as PendingAction;
    setPendingAction(key);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action, ...details }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Perubahan user gagal disimpan.");
      setSuccessMessage("Perubahan user berhasil disimpan.");
      await loadUsers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Perubahan user gagal disimpan.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleBanToggle = (user: AdminUser) => {
    const banned = isBanned(user);
    const message = banned
      ? `Aktifkan kembali akun ${user.email}?`
      : `Nonaktifkan akun ${user.email}? Akun tidak dapat login sampai diaktifkan kembali.`;
    if (window.confirm(message)) void updateUser(user.id, "ban", { banned: !banned });
  };

  const handleRoleChange = (user: AdminUser, role: Role) => {
    if (role !== user.role) void updateUser(user.id, "role", { role });
  };

  const handleResetPassword = (user: AdminUser) => {
    const password = window.prompt(`Masukkan password baru untuk ${user.email} (minimal 6 karakter):`);
    if (password === null) return;
    if (password.length < 6) {
      setErrorMessage("Password baru minimal 6 karakter.");
      return;
    }
    void updateUser(user.id, "reset_password", { password });
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#0F2C23]" />
            <h2 className="text-lg font-extrabold text-gray-900">Manajemen User</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">Buat akun, atur role, dan aktifkan atau nonaktifkan akses login.</p>
        </div>
        <button type="button" onClick={() => void loadUsers()} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Muat ulang
        </button>
      </div>

      {errorMessage && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{errorMessage}</span></div>}
      {successMessage && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> <span>{successMessage}</span></div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <UserMetric icon={<Users className="h-5 w-5" />} label="Total user" value={users.length} tone="green" />
        <UserMetric icon={<ShieldCheck className="h-5 w-5" />} label="Admin" value={adminCount} tone="blue" />
        <UserMetric icon={<Lock className="h-5 w-5" />} label="Dinonaktifkan" value={bannedCount} tone="amber" />
      </div>

      <form onSubmit={createUser} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-[#0F2C23]" /><h3 className="font-extrabold text-gray-900">Buat user baru</h3></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold text-gray-700">Nama lengkap<input value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} placeholder="Nama user" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-[#0F2C23]" /></label>
          <label className="text-sm font-semibold text-gray-700">Email<input type="email" required value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="user@email.com" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-[#0F2C23]" /></label>
          <label className="text-sm font-semibold text-gray-700">Password<input type="password" required minLength={6} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Minimal 6 karakter" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-[#0F2C23]" /></label>
          <label className="text-sm font-semibold text-gray-700">Role<select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#0F2C23]"><option value="toko">Toko</option><option value="admin">Admin</option></select></label>
        </div>
        <button type="submit" disabled={isCreating} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0F2C23] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#184537] disabled:opacity-60"><UserPlus className="h-4 w-4" />{isCreating ? "Membuat..." : "Buat user"}</button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5"><h3 className="font-extrabold text-gray-900">Daftar user</h3><p className="mt-1 text-xs text-gray-500">Password tidak pernah ditampilkan. Gunakan reset password bila diperlukan.</p></div>
        {isLoading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Memuat user...</div> : users.length === 0 ? <div className="p-12 text-center text-sm text-gray-500">Belum ada user.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/70 text-xs font-bold uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-4">User</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Toko</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Dibuat</th><th className="px-5 py-4">Aksi</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{users.map((user) => <UserRow key={user.id} user={user} pendingAction={pendingAction} onRoleChange={handleRoleChange} onBanToggle={handleBanToggle} onResetPassword={handleResetPassword} />)}</tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function UserRow({ user, pendingAction, onRoleChange, onBanToggle, onResetPassword }: { user: AdminUser; pendingAction: PendingAction; onRoleChange: (user: AdminUser, role: Role) => void; onBanToggle: (user: AdminUser) => void; onResetPassword: (user: AdminUser) => void }) {
  const banned = isBanned(user);
  const isPending = pendingAction?.startsWith(`${user.id}:`);
  return <tr className="hover:bg-gray-50/70">
    <td className="px-5 py-4"><p className="font-bold text-gray-900">{user.full_name || "Tanpa nama"}{user.is_current_user && <span className="ml-2 rounded-full bg-[#E8F3EF] px-2 py-0.5 text-[10px] font-bold text-[#0F2C23]">Anda</span>}</p><p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500"><MailCheck className="h-3.5 w-3.5" />{user.email}</p></td>
    <td className="px-5 py-4"><select value={user.role} disabled={Boolean(isPending) || user.is_current_user} onChange={(event) => onRoleChange(user, event.target.value as Role)} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#0F2C23] disabled:cursor-not-allowed disabled:opacity-60"><option value="toko">Toko</option><option value="admin">Admin</option></select></td>
    <td className="px-5 py-4"><p className="font-semibold text-gray-700">{user.store_name || "Belum memiliki toko"}</p>{user.store_is_active !== null && <p className={`mt-1 text-xs font-semibold ${user.store_is_active ? "text-emerald-600" : "text-gray-500"}`}>{user.store_is_active ? "Toko aktif" : "Toko nonaktif"}</p>}</td>
    <td className="px-5 py-4">{banned ? <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700"><XCircle className="h-3.5 w-3.5" /> Nonaktif</span> : <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Aktif</span>}<p className={`mt-1 text-xs ${user.email_confirmed ? "text-gray-500" : "text-amber-600"}`}>{user.email_confirmed ? "Email terkonfirmasi" : "Email belum terkonfirmasi"}</p></td>
    <td className="px-5 py-4 text-xs text-gray-500">{formatDate(user.created_at)}</td>
    <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => onBanToggle(user)} disabled={Boolean(isPending) || user.is_current_user} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">{banned ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}{banned ? "Aktifkan" : "Nonaktifkan"}</button><button type="button" onClick={() => onResetPassword(user)} disabled={Boolean(isPending)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><KeyRound className="h-3.5 w-3.5" /> Reset password</button></div></td>
  </tr>;
}

function UserMetric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "green" | "blue" | "amber" }) {
  const tones = { green: "bg-emerald-50 text-emerald-700", blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700" };
  return <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span></div><p className="mt-3 text-3xl font-black text-gray-900">{value}</p></div>;
}
