"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

  const finishAuth = () => {
    if (onSuccessAuth) return onSuccessAuth();
    router.push("/dashboard");
    router.refresh();
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginValues.email,
        password: loginValues.password,
      });

      if (authError) throw authError;
      finishAuth();
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
          </div>
        </div>
      </main>
    </div>
  );
}
