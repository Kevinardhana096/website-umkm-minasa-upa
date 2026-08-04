"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  MailCheck,
  RefreshCw,
  Trash2,
  Unlock,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { getPasswordValidationError, MIN_PASSWORD_LENGTH } from "@/lib/password-validation";

type Role = "toko" | "admin" | "anggota";

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  store_name: string | null;
  store_is_active: boolean | null;
  email_confirmed: boolean;
  banned_until: string | null;
  created_at: string;
  is_current_user?: boolean;
}

type PendingAction = string | null;

interface UserFormState {
  full_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: Role;
}

const EMPTY_FORM: UserFormState = {
  full_name: "",
  email: "",
  password: "",
  password_confirmation: "",
  role: "toko",
};

function isBanned(user: AdminUser) {
  if (!user.banned_until) return false;
  const time = new Date(user.banned_until).getTime();
  return !Number.isNaN(time) && time > Date.now();
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirmation, setShowCreateConfirmation] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

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
  const memberCount = useMemo(() => users.filter((user) => user.role === "anggota").length, [users]);
  const bannedCount = useMemo(() => users.filter(isBanned).length, [users]);

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const passwordError = getPasswordValidationError(form.password);
    if (passwordError) {
      setErrorMessage(passwordError);
      setSuccessMessage("");
      return;
    }
    if (form.password !== form.password_confirmation) {
      setErrorMessage("Konfirmasi password tidak cocok.");
      setSuccessMessage("");
      return;
    }

    setIsCreating(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          password_confirmation: form.password_confirmation,
          role: form.role,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "User gagal dibuat.");
      setForm(EMPTY_FORM);
      setSuccessMessage("User berhasil dibuat dan dapat langsung login.");
      setIsFormOpen(false);
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
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Perubahan user gagal disimpan.");
      return false;
    } finally {
      setPendingAction(null);
    }
  };

  const deleteUser = async (user: AdminUser) => {
    const key = `${user.id}:delete` as PendingAction;
    setPendingAction(key);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Akun gagal dihapus.");
      setSuccessMessage(`Akun ${user.email} berhasil dihapus permanen.`);
      await loadUsers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Akun gagal dihapus.");
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

  const handleDelete = (user: AdminUser) => {
    if (user.is_current_user) return;
    const message = `Hapus permanen akun ${user.email}? Data profile, toko, produk, dan sesi login akun ini akan dihapus dan tidak dapat dipulihkan.`;
    if (window.confirm(message)) void deleteUser(user);
  };

  const handleRoleChange = (user: AdminUser, role: Role) => {
    if (role !== user.role) void updateUser(user.id, "role", { role });
  };

  const handleResetPassword = (user: AdminUser) => {
    setResetTarget(user);
    setResetPassword("");
    setShowResetPassword(false);
    setErrorMessage("");
  };

  const submitResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resetTarget) return;

    const passwordError = getPasswordValidationError(resetPassword);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }
    const updated = await updateUser(resetTarget.id, "reset_password", { password: resetPassword });
    if (updated) {
      setResetTarget(null);
      setResetPassword("");
      setShowResetPassword(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#0F2C23]" />
            <h2 className="text-lg font-extrabold text-gray-900">Manajemen User</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">Buat akun, atur role, kelola akses login, atau hapus akun secara permanen.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2C23] px-3.5 py-2.5 text-sm font-bold text-white hover:bg-[#184537] transition shadow-xs"
          >
            <UserPlus className="h-4 w-4" /> Tambah User
          </button>
          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Muat ulang
          </button>
        </div>
      </div>

      {errorMessage && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{errorMessage}</span></div>}
      {successMessage && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> <span>{successMessage}</span></div>}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
        <UserMetric label="Total user" value={users.length} tone="green" />
        <UserMetric label="Admin" value={adminCount} tone="blue" />
        <UserMetric label="Anggota" value={memberCount} tone="blue" />
        <UserMetric label="Dinonaktifkan" value={bannedCount} tone="amber" />
      </div>

      {/* Modal Popup Buat User */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsFormOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F2C23]/10 text-[#0F2C23]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Buat User Baru</h3>
                  <p className="text-xs text-gray-500">Tambahkan akun baru ke platform UMKM.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                aria-label="Tutup modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={createUser} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Nama Lengkap</label>
                <input
                  value={form.full_name}
                  onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                  placeholder="Contoh: Budi Santoso"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-[#0F2C23] focus:ring-1 focus:ring-[#0F2C23]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Email Login <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="user@email.com"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-[#0F2C23] focus:ring-1 focus:ring-[#0F2C23]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Password <span className="text-red-500">*</span></label>
                  <div className="relative mt-1.5">
                    <input
                      type={showCreatePassword ? "text" : "password"}
                      required
                      minLength={MIN_PASSWORD_LENGTH}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Minimal 6 karakter, format bebas"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pr-11 text-sm font-normal outline-none focus:border-[#0F2C23] focus:ring-1 focus:ring-[#0F2C23]"
                    />
                    <button type="button" onClick={() => setShowCreatePassword((current) => !current)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label={showCreatePassword ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={showCreatePassword}>
                      {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">Boleh menggunakan huruf, angka, simbol, atau spasi.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Konfirmasi Password <span className="text-red-500">*</span></label>
                  <div className="relative mt-1.5">
                    <input
                      type={showCreateConfirmation ? "text" : "password"}
                      required
                      minLength={MIN_PASSWORD_LENGTH}
                      autoComplete="new-password"
                      value={form.password_confirmation}
                      onChange={(event) => setForm((current) => ({ ...current, password_confirmation: event.target.value }))}
                      placeholder="Ulangi password"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pr-11 text-sm font-normal outline-none focus:border-[#0F2C23] focus:ring-1 focus:ring-[#0F2C23]"
                    />
                    <button type="button" onClick={() => setShowCreateConfirmation((current) => !current)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label={showCreateConfirmation ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"} aria-pressed={showCreateConfirmation}>
                      {showCreateConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Role Pengguna</label>
                <select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-[#0F2C23] focus:ring-1 focus:ring-[#0F2C23]"
                >
                  <option value="toko">Toko</option>
                  <option value="admin">Admin</option>
                  <option value="anggota">Anggota</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0F2C23] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#184537] disabled:opacity-60 transition shadow-sm"
                >
                  <UserPlus className="h-4 w-4" /> {isCreating ? "Membuat..." : "Buat User Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="reset-password-title">
          <div className="fixed inset-0" onClick={() => setResetTarget(null)} aria-hidden="true" />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F2C23]/10 text-[#0F2C23]"><KeyRound className="h-5 w-5" /></div>
                <div>
                  <h3 id="reset-password-title" className="text-lg font-extrabold text-gray-900">Reset Password</h3>
                  <p className="text-xs text-gray-500">Untuk {resetTarget.email}</p>
                </div>
              </div>
              <button type="button" onClick={() => setResetTarget(null)} className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600" aria-label="Tutup modal reset password">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitResetPassword} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Password baru <span className="text-red-500">*</span></label>
                <div className="relative mt-1.5">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    placeholder="Minimal 6 karakter, format bebas"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pr-11 text-sm outline-none focus:border-[#0F2C23] focus:ring-1 focus:ring-[#0F2C23]"
                  />
                  <button type="button" onClick={() => setShowResetPassword((current) => !current)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label={showResetPassword ? "Sembunyikan password baru" : "Tampilkan password baru"} aria-pressed={showResetPassword}>
                    {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">Minimal 6 karakter, format bebas.</p>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setResetTarget(null)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50" disabled={pendingAction === `${resetTarget.id}:reset_password`}>Batal</button>
                <button type="submit" disabled={pendingAction === `${resetTarget.id}:reset_password`} className="inline-flex items-center gap-2 rounded-xl bg-[#0F2C23] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#184537] disabled:opacity-60">
                  <KeyRound className="h-4 w-4" /> {pendingAction === `${resetTarget.id}:reset_password` ? "Menyimpan..." : "Simpan Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5"><h3 className="font-extrabold text-gray-900">Daftar user</h3><p className="mt-1 text-xs text-gray-500">Password tidak pernah ditampilkan. Gunakan reset password bila diperlukan.</p></div>
        {isLoading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Memuat user...</div> : users.length === 0 ? <div className="p-12 text-center text-sm text-gray-500">Belum ada user.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/70 text-xs font-bold uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-4">User</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Toko</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Dibuat</th><th className="px-5 py-4">Aksi</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{users.map((user) => <UserRow key={user.id} user={user} pendingAction={pendingAction} onRoleChange={handleRoleChange} onBanToggle={handleBanToggle} onResetPassword={handleResetPassword} onDelete={handleDelete} />)}</tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function UserRow({ user, pendingAction, onRoleChange, onBanToggle, onResetPassword, onDelete }: { user: AdminUser; pendingAction: PendingAction; onRoleChange: (user: AdminUser, role: Role) => void; onBanToggle: (user: AdminUser) => void; onResetPassword: (user: AdminUser) => void; onDelete: (user: AdminUser) => void }) {
  const banned = isBanned(user);
  const isPending = pendingAction?.startsWith(`${user.id}:`);
  return <tr className="hover:bg-gray-50/70">
    <td className="px-5 py-4"><p className="font-bold text-gray-900">{user.full_name || "Tanpa nama"}{user.is_current_user && <span className="ml-2 rounded-full bg-[#E8F3EF] px-2 py-0.5 text-[10px] font-bold text-[#0F2C23]">Anda</span>}</p><p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500"><MailCheck className="h-3.5 w-3.5" />{user.email}</p></td>
    <td className="px-5 py-4"><select value={user.role} disabled={Boolean(isPending) || user.is_current_user} onChange={(event) => onRoleChange(user, event.target.value as Role)} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#0F2C23] disabled:cursor-not-allowed disabled:opacity-60"><option value="toko">Toko</option><option value="admin">Admin</option><option value="anggota">Anggota</option></select></td>
    <td className="px-5 py-4"><p className="font-semibold text-gray-700">{user.store_name || "Belum memiliki toko"}</p>{user.store_is_active !== null && <p className={`mt-1 text-xs font-semibold ${user.store_is_active ? "text-emerald-600" : "text-gray-500"}`}>{user.store_is_active ? "Toko aktif" : "Toko nonaktif"}</p>}</td>
    <td className="px-5 py-4">{banned ? <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700"><XCircle className="h-3.5 w-3.5" /> Nonaktif</span> : <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Aktif</span>}<p className={`mt-1 text-xs ${user.email_confirmed ? "text-gray-500" : "text-amber-600"}`}>{user.email_confirmed ? "Email terkonfirmasi" : "Email belum terkonfirmasi"}</p></td>
    <td className="px-5 py-4 text-xs text-gray-500">{formatDate(user.created_at)}</td>
    <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => onBanToggle(user)} disabled={Boolean(isPending) || user.is_current_user} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">{banned ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}{banned ? "Aktifkan" : "Nonaktifkan"}</button><button type="button" onClick={() => onResetPassword(user)} disabled={Boolean(isPending)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><KeyRound className="h-3.5 w-3.5" /> Reset password</button><button type="button" onClick={() => onDelete(user)} disabled={Boolean(isPending) || user.is_current_user} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Hapus akun</button></div></td>
  </tr>;
}

function UserMetric({ label, value, tone }: { label: string; value: number; tone: "green" | "blue" | "amber" }) {
  const tones = {
    green: "border-l-4 border-l-emerald-500",
    blue: "border-l-4 border-l-blue-500",
    amber: "border-l-4 border-l-amber-500",
  };
  return (
    <div className={`flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-xs transition hover:shadow-sm ${tones[tone]}`}>
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 leading-tight">{label}</p>
      <p className="mt-2 sm:mt-3 text-xl sm:text-3xl font-black text-gray-900 leading-none">{value}</p>
    </div>
  );
}
