import { X, Check } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import type { ProductRow } from "@/lib/products";
import type { NewProductInput } from "@/lib/store-service";

interface ProductFormModalProps {
  isOpen: boolean;
  isSaving: boolean;
  product?: ProductRow | null;
  onClose: () => void;
  onSave: (input: NewProductInput) => Promise<void>;
}

function formFromProduct(product?: ProductRow | null) {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price === null || product?.price === undefined ? "" : String(product.price),
    imagePath: product?.image_path ?? "",
    imageFile: null as File | null,
    isAvailable: product?.is_available ?? true,
    isVisible: product?.is_visible ?? true,
  };
}

export function ProductFormModal({
  isOpen,
  isSaving,
  product,
  onClose,
  onSave,
}: ProductFormModalProps) {
  const [form, setForm] = useState(() => formFromProduct(product));
  if (!isOpen) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave({
      id: product?.id,
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price ? Number(form.price) : null,
      imagePath: form.imagePath.trim(),
      imageFile: form.imageFile,
      isAvailable: form.isAvailable,
      isVisible: form.isVisible,
    });
    setForm(formFromProduct(product));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4">
          <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
            {product ? "Edit Data Produk" : "Tambah Produk Baru"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-200/70 hover:text-gray-700 transition-colors"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={submit} className="space-y-4 p-6 text-xs sm:text-sm">
          <Field label="Nama Produk *">
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Contoh: Kerajinan Kain Tenun Minasa Upa"
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15"
            />
          </Field>

          <Field label="Deskripsi Produk *">
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Jelaskan bahan, keunggulan, dan detail produk..."
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15 resize-none"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Harga (Rp, opsional)">
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                placeholder="150000"
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15"
              />
            </Field>

            <Field label="URL Foto (opsional)">
              <input
                type="url"
                value={form.imagePath.startsWith("http") ? form.imagePath : ""}
                onChange={(event) => setForm({ ...form, imagePath: event.target.value })}
                placeholder="https://..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15"
              />
            </Field>
          </div>

          <Field label="Unggah Foto Produk">
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-3 text-center transition-colors hover:bg-gray-50">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setForm({ ...form, imageFile: event.target.files?.[0] ?? null })}
                className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0F2C23] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#184537] cursor-pointer"
              />
              {form.imageFile && (
                <p className="mt-1.5 text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1">
                  <Check className="h-3.5 w-3.5" /> {form.imageFile.name}
                </p>
              )}
            </div>
          </Field>

          {/* Visibility Controls */}
          <div className="flex flex-wrap gap-5 pt-1 text-xs font-semibold text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-[#0F2C23] focus:ring-[#0F2C23]"
              />
              Stok Tersedia
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(event) => setForm({ ...form, isVisible: event.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-[#0F2C23] focus:ring-[#0F2C23]"
              />
              Tampilkan di Katalog Publik
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#0F2C23] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#184537] transition-all disabled:opacity-60"
            >
              {isSaving ? "Menyimpan..." : product ? "Simpan Perubahan" : "Simpan Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{label}</label>
      {children}
    </div>
  );
}
