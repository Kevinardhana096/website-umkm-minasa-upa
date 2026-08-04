"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Save, Store as StoreIcon } from "lucide-react";
import type { StoreRow } from "@/lib/products";
import type { StoreProfileInput } from "@/lib/store-service";

interface StoreProfileFormProps {
  store: StoreRow | null;
  isSaving: boolean;
  onSave: (input: StoreProfileInput) => Promise<void>;
}

export function StoreProfileForm({ store, isSaving, onSave }: StoreProfileFormProps) {
  const [form, setForm] = useState<StoreProfileInput>({
    name: store?.name ?? "",
    sellerName: store?.seller_name ?? "",
    description: store?.description ?? "",
    whatsappNumber: store?.whatsapp_number ?? "",
    isActive: store?.is_active ?? true,
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    try {
      await onSave(form);
      setSuccessMessage("Profil toko berhasil disimpan.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Profil toko gagal diperbarui.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:p-8">
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F3EF] text-[#0F2C23]"><StoreIcon className="h-5 w-5" /></div>
        <div><h3 className="font-extrabold text-gray-900">Profil publik toko</h3><p className="mt-1 text-xs leading-5 text-gray-500">Data ini ditampilkan pada katalog dan digunakan pembeli untuk menghubungi toko.</p></div>
      </div>

      {errorMessage && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm font-semibold text-red-700">{errorMessage}</p>}
      {successMessage && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />{successMessage}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama Toko / Usaha" required><input required minLength={2} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="dashboard-input" /></Field>
        <Field label="Nama Penjual / Pengelola" required><input required minLength={2} value={form.sellerName} onChange={(event) => setForm((current) => ({ ...current, sellerName: event.target.value }))} className="dashboard-input" /></Field>
      </div>
      <Field label="Nomor WhatsApp" required><input required minLength={8} inputMode="tel" value={form.whatsappNumber} onChange={(event) => setForm((current) => ({ ...current, whatsappNumber: event.target.value }))} placeholder="628xxxxxxxxxx" className="dashboard-input" /><span className="mt-1 block text-[11px] font-medium text-gray-400">Gunakan format internasional, contoh: 628123456789.</span></Field>
      <Field label="Deskripsi Singkat"><textarea rows={4} maxLength={1000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Ceritakan singkat tentang usaha Anda..." className="dashboard-input resize-none" /></Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[#0F2C23] focus:ring-[#0F2C23]" /><span className="min-w-0"><span className="block text-sm font-bold text-gray-800">Tampilkan toko di katalog publik</span><span className="mt-0.5 block text-xs text-gray-500">Matikan sementara jika toko sedang tidak menerima pesanan.</span></span></label>

      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end"><button type="submit" disabled={isSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F2C23] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#184537] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isSaving ? "Menyimpan..." : "Simpan perubahan"}</button></div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-gray-700">{label}{required && <span className="ml-1 text-red-500">*</span>}<span className="mt-1.5 block">{children}</span></label>;
}
