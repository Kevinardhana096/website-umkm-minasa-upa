import { X } from "lucide-react";
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

export function ProductFormModal({ isOpen, isSaving, product, onClose, onSave }: ProductFormModalProps) {
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

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4"><h3 className="text-lg font-bold text-gray-900">{product ? "Edit Produk" : "Tambah Produk Baru"}</h3><button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700" aria-label="Tutup"><X className="h-5 w-5" /></button></div>
      <form onSubmit={submit} className="space-y-4 p-6">
        <Field label="Nama Produk"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nama produk" className="dashboard-input" /></Field>
        <Field label="Deskripsi"><textarea required rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Jelaskan produk Anda" className="dashboard-input resize-none" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Harga (opsional)"><input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="150000" className="dashboard-input" /></Field><Field label="URL foto (opsional)"><input type="url" value={form.imagePath.startsWith("http") ? form.imagePath : ""} onChange={(event) => setForm({ ...form, imagePath: event.target.value })} placeholder="https://..." className="dashboard-input" /></Field></div>
        <Field label="Atau unggah foto baru"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setForm({ ...form, imageFile: event.target.files?.[0] ?? null })} className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#E7EFEA] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#183B2E]" />{form.imageFile && <p className="mt-1 text-xs text-gray-500">{form.imageFile.name}</p>}</Field>
        <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-600"><label className="flex items-center gap-2"><input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })} className="h-4 w-4 rounded border-gray-300 text-[#183B2E]" /> Tersedia</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.isVisible} onChange={(event) => setForm({ ...form, isVisible: event.target.checked })} className="h-4 w-4 rounded border-gray-300 text-[#183B2E]" /> Tampilkan di katalog</label></div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4"><button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">Batal</button><button type="submit" disabled={isSaving} className="rounded-xl bg-[#183B2E] px-5 py-2 text-sm font-bold text-white hover:bg-[#0F2C23] disabled:opacity-60">{isSaving ? "Menyimpan..." : product ? "Simpan Perubahan" : "Simpan Produk"}</button></div>
      </form>
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className="mb-1 block text-xs font-bold uppercase text-gray-500">{label}</label>{children}</div>;
}
