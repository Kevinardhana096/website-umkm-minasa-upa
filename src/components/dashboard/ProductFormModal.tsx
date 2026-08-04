import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2, X } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { MAX_PRODUCT_IMAGES, toPublicImageUrl, type ProductRow } from "@/lib/products";
import type { NewProductInput, ProductImageInput } from "@/lib/store-service";

interface ProductFormModalProps {
  isOpen: boolean;
  isSaving: boolean;
  product?: ProductRow | null;
  onClose: () => void;
  onSave: (input: NewProductInput) => Promise<void>;
}

interface FormImage extends ProductImageInput {
  previewUrl: string;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  images: FormImage[];
  imageUrlInput: string;
  isAvailable: boolean;
  isVisible: boolean;
}

function previewForPath(imagePath: string) {
  return toPublicImageUrl(imagePath, process.env.NEXT_PUBLIC_SUPABASE_URL) ?? imagePath;
}

function formFromProduct(product?: ProductRow | null): FormState {
  const productImages = product?.product_images?.length
    ? product.product_images
    : product?.image_path
      ? [{ id: undefined, image_path: product.image_path, is_primary: true }]
      : [];

  const images = productImages.map((image) => ({
    id: image.id,
    imagePath: image.image_path,
    isPrimary: image.is_primary,
    previewUrl: previewForPath(image.image_path),
  }));

  if (images.length > 0 && !images.some((image) => image.isPrimary)) images[0].isPrimary = true;

  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price === null || product?.price === undefined ? "" : String(product.price),
    images,
    imageUrlInput: "",
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
  const [imageError, setImageError] = useState("");
  if (!isOpen) return null;

  const addImages = (files: File[]) => {
    setImageError("");
    const availableSlots = MAX_PRODUCT_IMAGES - form.images.length;
    if (availableSlots <= 0) {
      setImageError(`Maksimal ${MAX_PRODUCT_IMAGES} foto per produk.`);
      return;
    }

    const selectedFiles = files.slice(0, availableSlots);
    if (selectedFiles.length < files.length) {
      setImageError(`Maksimal ${MAX_PRODUCT_IMAGES} foto per produk.`);
    }

    const newImages = selectedFiles.map((file, index) => ({
      imageFile: file,
      isPrimary: form.images.length === 0 && index === 0,
      previewUrl: URL.createObjectURL(file),
    }));
    setForm((current) => ({ ...current, images: [...current.images, ...newImages] }));
  };

  const addImageUrl = () => {
    const imagePath = form.imageUrlInput.trim();
    if (!/^https?:\/\//i.test(imagePath)) {
      setImageError("URL foto harus diawali http:// atau https://.");
      return;
    }
    if (form.images.length >= MAX_PRODUCT_IMAGES) {
      setImageError(`Maksimal ${MAX_PRODUCT_IMAGES} foto per produk.`);
      return;
    }
    if (form.images.some((image) => image.imagePath === imagePath)) {
      setImageError("URL foto tersebut sudah ditambahkan.");
      return;
    }

    setImageError("");
    setForm((current) => ({
      ...current,
      imageUrlInput: "",
      images: [...current.images, {
        imagePath,
        isPrimary: current.images.length === 0,
        previewUrl: imagePath,
      }],
    }));
  };

  const removeImage = (index: number) => {
    setForm((current) => {
      const removed = current.images[index];
      if (removed?.imageFile) URL.revokeObjectURL(removed.previewUrl);
      const images = current.images.filter((_, imageIndex) => imageIndex !== index);
      if (removed?.isPrimary && images[0]) images[0].isPrimary = true;
      return { ...current, images };
    });
  };

  const setPrimary = (index: number) => {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) => ({ ...image, isPrimary: imageIndex === index })),
    }));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= form.images.length) return;
    setForm((current) => {
      const images = [...current.images];
      [images[index], images[nextIndex]] = [images[nextIndex], images[index]];
      return { ...current, images };
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave({
      id: product?.id,
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price ? Number(form.price) : null,
      images: form.images.map((image) => ({
        id: image.id,
        imagePath: image.imagePath,
        imageFile: image.imageFile,
        isPrimary: image.isPrimary,
      })),
      isAvailable: form.isAvailable,
      isVisible: form.isVisible,
    });
    setForm(formFromProduct(product));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4">
      <div className="my-3 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl sm:my-4 sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-4 sm:px-6">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 sm:text-lg">
              {product ? "Edit Data Produk" : "Tambah Produk Baru"}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">Kelola hingga {MAX_PRODUCT_IMAGES} foto produk.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-200/70 hover:text-gray-700 transition-colors" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-4 text-xs sm:p-6 sm:text-sm">
          <Field label="Nama Produk *">
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Contoh: Kerajinan Kain Tenun Minasa Upa" className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15" />
          </Field>

          <Field label="Deskripsi Produk *">
            <textarea required rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Jelaskan bahan, keunggulan, dan detail produk..." className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15" />
          </Field>

          <Field label="Harga (Rp, opsional)">
            <input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="150000" className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15" />
          </Field>

          <Field label={`Galeri Foto (${form.images.length}/${MAX_PRODUCT_IMAGES})`}>
            <div className="space-y-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-3">
              {form.images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {form.images.map((image, index) => (
                    <div key={image.id ?? image.previewUrl} className={`relative overflow-hidden rounded-xl border-2 bg-white ${image.isPrimary ? "border-[#963E1B]" : "border-gray-200"}`}>
                      <div className="relative aspect-square">
                        <Image src={image.previewUrl} alt={`Foto ${index + 1}`} fill unoptimized className="object-cover" />
                      </div>
                      {image.isPrimary && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#963E1B] px-2 py-1 text-[10px] font-bold text-white"><Star className="h-3 w-3 fill-current" /> Utama</span>}
                      <div className="absolute inset-x-2 bottom-2 flex flex-col items-stretch gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <button type="button" onClick={() => setPrimary(index)} className="w-full rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-gray-700 shadow-sm hover:bg-white sm:w-auto">Jadikan utama</button>
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label="Geser foto ke kiri" className="rounded-lg bg-white/90 p-1.5 text-gray-700 shadow-sm disabled:opacity-40"><ArrowUp className="h-3.5 w-3.5 -rotate-90" /></button>
                          <button type="button" onClick={() => moveImage(index, 1)} disabled={index === form.images.length - 1} aria-label="Geser foto ke kanan" className="rounded-lg bg-white/90 p-1.5 text-gray-700 shadow-sm disabled:opacity-40"><ArrowDown className="h-3.5 w-3.5 -rotate-90" /></button>
                          <button type="button" onClick={() => removeImage(index)} aria-label={`Hapus foto ${index + 1}`} className="rounded-lg bg-white/90 p-1.5 text-rose-600 shadow-sm hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input type="url" value={form.imageUrlInput} onChange={(event) => setForm({ ...form, imageUrlInput: event.target.value })} placeholder="https://... URL foto eksternal" className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15" />
                <button type="button" onClick={addImageUrl} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"><ImagePlus className="h-4 w-4" /> Tambah URL</button>
              </div>

              <input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={(event) => { addImages(Array.from(event.target.files ?? [])); event.currentTarget.value = ""; }} disabled={form.images.length >= MAX_PRODUCT_IMAGES} className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0F2C23] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#184537] disabled:opacity-50" />
              <p className="text-[11px] text-gray-500">JPG, PNG, atau WebP. Maksimal 5 MB per file. Foto pertama menjadi foto utama secara default.</p>
              {imageError && <p className="font-semibold text-rose-600">{imageError}</p>}
            </div>
          </Field>

          <div className="flex flex-wrap gap-5 pt-1 text-xs font-semibold text-gray-700">
            <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })} className="h-4 w-4 rounded border-gray-300 text-[#0F2C23] focus:ring-[#0F2C23]" /> Stok Tersedia</label>
            <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={form.isVisible} onChange={(event) => setForm({ ...form, isVisible: event.target.checked })} className="h-4 w-4 rounded border-gray-300 text-[#0F2C23] focus:ring-[#0F2C23]" /> Tampilkan di Katalog Publik</label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button type="button" onClick={onClose} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 sm:w-auto sm:text-sm">Batal</button>
            <button type="submit" disabled={isSaving} className="w-full rounded-xl bg-[#0F2C23] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#184537] disabled:opacity-60 sm:w-auto sm:text-sm">{isSaving ? "Menyimpan..." : product ? "Simpan Perubahan" : "Simpan Produk"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{label}</label>{children}</div>;
}
