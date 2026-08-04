"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getPasswordValidationError, MIN_PASSWORD_LENGTH } from "@/lib/password-validation";

interface ResetPasswordFormProps {
  initialError: string;
}

export function ResetPasswordForm({ initialError }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const passwordError = getPasswordValidationError(password, "Kata sandi");
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmation) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess("Kata sandi berhasil diperbarui. Anda akan diarahkan ke halaman login.");
      window.setTimeout(() => router.push("/login"), 1200);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Kata sandi gagal diperbarui.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FBFBF9] px-4 py-10">
      <section className="w-full max-w-md rounded-[28px] border border-gray-100 bg-white p-8 shadow-xl sm:p-10">
        <Link href="/" className="mb-8 inline-flex items-center gap-2.5 text-base font-bold text-[#0F2C23]">
          <Image src="/logo_umkm.png" alt="Logo UMKM" width={40} height={40} className="h-8 w-auto object-contain" />
          UMKM Wanita Tangguh Minasa Upa
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Atur ulang kata sandi</h1>
        <p className="mt-2 text-sm text-gray-500">Buat kata sandi baru untuk mengakses dashboard toko Anda.</p>

        {error && <p className="mt-5 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">{error}</p>}
        {success && <p className="mt-5 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">{success}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block text-xs font-bold uppercase text-gray-500">
            Kata sandi baru
            <div className="relative mt-1.5">
              <input type={showPassword ? "text" : "password"} required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="auth-input pr-11" />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-pressed={showPassword}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <span className="mt-1 block text-[11px] font-medium normal-case text-gray-400">Minimal 6 karakter, format bebas.</span>
          </label>
          <label className="block text-xs font-bold uppercase text-gray-500">
            Konfirmasi kata sandi
            <div className="relative mt-1.5">
              <input type={showConfirmation ? "text" : "password"} required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="auth-input pr-11" />
              <button type="button" onClick={() => setShowConfirmation((current) => !current)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label={showConfirmation ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"} aria-pressed={showConfirmation}>
                {showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <button type="submit" disabled={isSaving} className="w-full rounded-xl bg-[#0F2C23] px-4 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#184537] disabled:cursor-not-allowed disabled:opacity-70">
            {isSaving ? "Menyimpan..." : "Simpan kata sandi"}
          </button>
        </form>
      </section>
    </main>
  );
}
