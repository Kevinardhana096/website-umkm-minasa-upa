"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Code2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { LoginForm, type LoginValues } from "@/components/auth/LoginForm";

interface AuthPageProps {
  onNavigateHome?: () => void;
  onSuccessAuth?: () => void;
}

const initialLogin: LoginValues = {
  email: "",
  password: "",
  rememberMe: true,
};

export function AuthPage({ onNavigateHome, onSuccessAuth }: AuthPageProps) {
  const router = useRouter();
  const [loginValues, setLoginValues] = useState(initialLogin);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDevAccessLoading, setIsDevAccessLoading] = useState(false);
  const isDevelopment = process.env.NODE_ENV === "development";

  const finishAuth = (destination: "admin" | "dashboard" | "katalog" = "dashboard") => {
    if (onSuccessAuth) return onSuccessAuth();
    router.replace(destination === "admin" ? "/admin" : destination === "katalog" ? "/katalog" : "/dashboard");
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginValues.email,
        password: loginValues.password,
      });

      if (authError) throw authError;
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle<{ role: "toko" | "admin" | "anggota" }>();
      if (profileError) throw profileError;
      finishAuth(profile?.role === "admin" ? "admin" : profile?.role === "anggota" ? "katalog" : "dashboard");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Login gagal. Periksa email dan kata sandi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginValues.email) {
      setError("Masukkan email terlebih dahulu untuk mengatur ulang kata sandi.");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(loginValues.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (resetError) throw resetError;
      setSuccess("Instruksi pengaturan ulang kata sandi telah dikirim ke email.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Email reset kata sandi gagal dikirim.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevAccess = async () => {
    setError("");
    setSuccess("");
    setIsDevAccessLoading(true);

    try {
      const response = await fetch("/api/dev-access", { method: "POST" });
      const result = await response.json() as { error?: string; role?: "toko" | "admin" | "anggota" };
      if (!response.ok) throw new Error(result.error || "Dev Access gagal.");
      finishAuth(result.role === "admin" ? "admin" : result.role === "anggota" ? "katalog" : "dashboard");
    } catch (devError) {
      setError(devError instanceof Error ? devError.message : "Dev Access gagal.");
    } finally {
      setIsDevAccessLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#FBFBF9] font-sans selection:bg-[#F4EBD9]">
      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" onClick={() => onNavigateHome?.()} className="flex items-center gap-2.5 sm:gap-3 font-bold text-sm sm:text-base md:text-lg tracking-tight text-gray-900">
          <Image src="/logo_umkm.png" alt="Logo UMKM" width={48} height={48} className="h-8 sm:h-9 md:h-10 w-auto object-contain shrink-0" />
          <span className="leading-none">UMKM <span className="text-[#0F2C23]">Wanita Tangguh Minasa Upa</span></span>
        </Link>
        <Link href="/" className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-xs hover:bg-gray-50 hover:text-gray-900 transition-all">
          Kembali ke Katalog
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="my-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-xl lg:flex-row">
          <AuthBrandPanel />
          <div className="flex flex-col justify-center bg-white p-8 sm:p-12 lg:w-[55%]">
            <LoginForm values={loginValues} onChange={setLoginValues} isLoading={isLoading} error={error} success={success} onSubmit={handleLogin} onForgotPassword={handleForgotPassword} />
            {isDevelopment && (
              <div className="mt-6 rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-amber-900">Dev Access</p>
                    <p className="mt-1 text-xs leading-5 text-amber-800">Shortcut ini hanya aktif di development lokal dan memakai kredensial dari environment server.</p>
                    <button type="button" onClick={() => void handleDevAccess()} disabled={isDevAccessLoading} className="mt-3 rounded-lg bg-amber-800 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-60">
                      {isDevAccessLoading ? "Membuka akses..." : "Buka Dev Access"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
