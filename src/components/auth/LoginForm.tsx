import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";

export interface LoginValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  isLoading: boolean;
  error: string;
  success: string;
  values: LoginValues;
  onChange: (values: LoginValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
}

export function LoginForm({
  isLoading,
  error,
  success,
  values,
  onChange,
  onSubmit,
  onForgotPassword,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h3 className="text-2xl font-extrabold tracking-tight text-gray-900">Selamat datang kembali!</h3>
        <p className="mt-1 text-xs text-gray-500">Masuk untuk mengelola produk toko Anda.</p>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">{error}</p>}
      {success && <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">{success}</p>}

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase text-gray-500">Email toko</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="nama@toko.id"
            value={values.email}
            onChange={(event) => onChange({ ...values, email: event.target.value })}
            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm transition-all focus:border-[#0F2C23] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-xs font-bold uppercase text-gray-500">Kata sandi</label>
          <button type="button" onClick={onForgotPassword} className="text-xs font-semibold text-[#963E1B] hover:underline">
            Lupa kata sandi?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={values.password}
            onChange={(event) => onChange({ ...values, password: event.target.value })}
            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-11 text-sm transition-all focus:border-[#0F2C23] focus:outline-none"
          />
          <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label="Tampilkan kata sandi">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 pt-1 text-xs font-medium text-gray-600">
        <input
          type="checkbox"
          checked={values.rememberMe}
          onChange={(event) => onChange({ ...values, rememberMe: event.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-[#0F2C23] focus:ring-[#0F2C23]"
        />
        Ingat sesi masuk saya
      </label>

      <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center rounded-xl bg-[#0F2C23] px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#184537] disabled:cursor-not-allowed disabled:opacity-70">
        {isLoading ? "Memproses masuk..." : "Login Pengelola"}
      </button>

    </form>
  );
}
