"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Kata sandi minimal terdiri dari 6 karakter.");
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
            <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="auth-input mt-1.5" />
          </label>
          <label className="block text-xs font-bold uppercase text-gray-500">
            Konfirmasi kata sandi
            <input type="password" required minLength={6} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="auth-input mt-1.5" />
          </label>
          <button type="submit" disabled={isSaving} className="w-full rounded-xl bg-[#0F2C23] px-4 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#184537] disabled:cursor-not-allowed disabled:opacity-70">
            {isSaving ? "Menyimpan..." : "Simpan kata sandi"}
          </button>
        </form>
      </section>
    </main>
  );
}
