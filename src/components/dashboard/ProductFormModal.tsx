import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2, X } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { MAX_PRODUCT_IMAGES, toPublicImageUrl, type CatalogStoreOption, type ProductRow } from "@/lib/products";
import type { NewProductInput, ProductImageInput } from "@/lib/store-service";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@/types/product";

interface ProductFormModalProps {
  isOpen: boolean;
  isSaving: boolean;
  product?: ProductRow | null;
  showStoreName?: boolean;
  storeNameLocked?: boolean;
  defaultStoreId?: string;
  defaultStoreName?: string;
  storeOptions?: CatalogStoreOption[];
  allowStoreCreation?: boolean;
  defaultWhatsappNumber?: string;
  allowFeatured?: boolean;
  featuredProductCount?: number;
  maxFeaturedProducts?: number;
  onClose: () => void;
  onSave: (input: NewProductInput) => Promise<void>;
}

interface FormImage extends ProductImageInput {
  previewUrl: string;
}

interface FormState {
  storeId?: string;
  storeName: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: string;
  whatsappNumber: string;
  images: FormImage[];
  imageUrlInput: string;
  isAvailable: boolean;
  isVisible: boolean;
  isFeatured: boolean;
}

function previewForPath(imagePath: string) {
  return toPublicImageUrl(imagePath, process.env.NEXT_PUBLIC_SUPABASE_URL) ?? imagePath;
}

function formFromProduct(product?: ProductRow | null, defaultStoreId = "", defaultStoreName = "", defaultWhatsappNumber = ""): FormState {
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
    storeId: (product?.store_id ?? defaultStoreId) || undefined,
    storeName: product?.store_name ?? defaultStoreName,
    name: product?.name ?? "",
    category: product?.category ?? "Makanan Olahan Lainnya",
    description: product?.description ?? "",
    price: product?.price === null || product?.price === undefined ? "" : String(product.price),
    whatsappNumber: product?.whatsapp_number ?? defaultWhatsappNumber,
    images,
    imageUrlInput: "",
    isAvailable: product?.is_available ?? true,
    isVisible: product?.is_visible ?? true,
    isFeatured: product?.is_featured ?? false,
  };
}

export function ProductFormModal({
  isOpen,
  isSaving,
  product,
  showStoreName = false,
  storeNameLocked = false,
  defaultStoreId = "",
  defaultStoreName = "",
  storeOptions = [],
  allowStoreCreation = false,
  defaultWhatsappNumber = "",
  allowFeatured = false,
  featuredProductCount = 0,
  maxFeaturedProducts = 4,
  onClose,
  onSave,
}: ProductFormModalProps) {
  const [form, setForm] = useState(() => formFromProduct(product, defaultStoreId, defaultStoreName, defaultWhatsappNumber));
  const [imageError, setImageError] = useState("");
  const featuredLimitReached = allowFeatured && !product?.is_featured && featuredProductCount >= maxFeaturedProducts;
  if (!isOpen) return null;

  const selectStoreFromName = (storeName: string) => {
    const normalizedName = storeName.trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");
    const selectedStore = storeOptions.find((store) => store.name.trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID") === normalizedName);
    setForm((current) => ({ ...current, storeName, storeId: selectedStore?.id }));
  };

  const isNewStoreName = showStoreName && !storeNameLocked && form.storeName.trim().length >= 2 && !form.storeId;

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
      storeId: form.storeId,
      storeName: form.storeName.trim() || undefined,
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      price: form.price ? Number(form.price) : null,
      whatsappNumber: form.whatsappNumber.trim(),
      images: form.images.map((image) => ({
        id: image.id,
        imagePath: image.imagePath,
        imageFile: image.imageFile,
        isPrimary: image.isPrimary,
      })),
      isAvailable: form.isAvailable,
      isVisible: form.isVisible,
      isFeatured: allowFeatured ? form.isFeatured : false,
    });
    setForm(formFromProduct(product, defaultStoreId, defaultStoreName, defaultWhatsappNumber));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/60 p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl">
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

        <form onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 text-xs sm:p-6 sm:text-sm">
          {showStoreName && (
            <Field label="Nama Toko *">
              <input
                required
                list="member-store-options"
                value={form.storeName}
                readOnly={storeNameLocked}
                onChange={(event) => selectStoreFromName(event.target.value)}
                placeholder={allowStoreCreation ? "Pilih toko atau ketik toko baru..." : "Ketik nama toko atau pilih saran..."}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15 read-only:bg-gray-50 read-only:text-gray-500"
              />
              <datalist id="member-store-options">
                {storeOptions.map((store) => <option key={store.id} value={store.name} />)}
              </datalist>
              {isNewStoreName && allowStoreCreation
                ? <p className="mt-1 text-[11px] font-medium text-emerald-700">Toko baru “{form.storeName.trim()}” akan dibuat saat produk disimpan.</p>
                : <p className="mt-1 text-[11px] text-gray-400">Pilih toko aktif dari saran. Nama yang belum tersedia dapat dibuat sebagai toko Anda.</p>}
            </Field>
          )}

          <Field label="Nama Produk *">
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Contoh: Kerajinan Kain Tenun Minasa Upa" className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15" />
          </Field>

          <Field label="Kategori Produk *">
            <select required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ProductCategory })} className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none transition-all focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15">
              {PRODUCT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </Field>

          <Field label="Deskripsi Produk *">
            <textarea required rows={6} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={'Contoh:\n## Keunggulan\n\n- Bahan lokal\n- Tanpa pengawet'} className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 font-mono text-xs outline-none transition-all placeholder:font-sans placeholder:text-gray-400 focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15" />
            <p className="mt-1 text-[11px] text-gray-400">Mendukung Markdown: heading, **tebal**, *miring*, daftar, tautan, dan kode.</p>
          </Field>

          <Field label="Harga (Rp, opsional)">
            <input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="150000" className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15" />
          </Field>

          <Field label="Nomor WhatsApp Produk *">
            <input required minLength={8} inputMode="tel" value={form.whatsappNumber} onChange={(event) => setForm({ ...form, whatsappNumber: event.target.value })} placeholder="628123456789" className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15" />
            <p className="mt-1 text-[11px] text-gray-400">Nomor ini digunakan pada tombol Pesan via WhatsApp produk.</p>
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
            {allowFeatured && (
              <div>
                <label className={`flex items-center gap-2 ${featuredLimitReached ? "cursor-not-allowed text-gray-400" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    disabled={featuredLimitReached}
                    onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-[#0F2C23] focus:ring-[#0F2C23] disabled:cursor-not-allowed"
                  />
                  Tampilkan sebagai Produk Unggulan ({featuredProductCount}/{maxFeaturedProducts})
                </label>
                {featuredLimitReached && <p className="mt-1 text-[11px] font-medium text-amber-700">Maksimal {maxFeaturedProducts} produk unggulan. Hapus status unggulan pada produk lain terlebih dahulu.</p>}
              </div>
            )}
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
