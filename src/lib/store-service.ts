import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { MAX_PRODUCT_IMAGES, normalizeProductRows, PRODUCT_SELECT, type ProductQueryRow, type ProductRow, type StoreRow } from "@/lib/products";
import type { ProductCategory } from "@/types/product";
import { validateWhatsappNumber } from "@/lib/whatsapp";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export interface ProductImageInput {
  id?: string;
  imagePath?: string;
  imageFile?: File;
  isPrimary?: boolean;
}

export interface NewProductInput {
  id?: string;
  storeName?: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number | null;
  whatsappNumber: string;
  images?: ProductImageInput[];
  // Kept temporarily for callers outside the current form.
  imagePath?: string;
  imageFile?: File | null;
  isAvailable: boolean;
  isVisible: boolean;
  isFeatured: boolean;
}

export interface StoreData {
  user: User;
  store: StoreRow | null;
  products: ProductRow[];
}

export interface StoreProfileInput {
  name: string;
  sellerName: string;
  description: string;
  whatsappNumber: string;
  isActive: boolean;
}

export async function revalidatePublicCatalog() {
  try {
    const response = await fetch("/api/catalog/revalidate", { method: "POST" });
    if (!response.ok) {
      console.warn("Katalog publik belum berhasil di-refresh setelah perubahan.");
    }
  } catch (error) {
    console.warn("Katalog publik belum berhasil di-refresh setelah perubahan.", error);
  }
}

export function isStoreProfileComplete(store: StoreRow | null | undefined): store is StoreRow {
  if (!store) return false;

  return store.name.trim().length >= 2
    && store.seller_name.trim().length >= 2
    && store.whatsapp_number.replace(/\D/g, "").length >= 8;
}

export async function getCurrentStoreData(): Promise<StoreData> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Sesi login tidak ditemukan.");

  const user = userData.user;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: "toko" | "admin" | "anggota" }>();

  if (profileError) throw profileError;
  if (!profile || profile.role !== "toko") {
    throw new Error("Dashboard toko hanya dapat diakses oleh akun dengan role Toko.");
  }

  const { data: existingStore, error: storeError } = await supabase
    .from("stores")
    .select("id, owner_id, name, seller_name, description, whatsapp_number, is_active")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (storeError) throw storeError;

  const store = existingStore as StoreRow | null;
  if (!store) return { user, store: null, products: [] };

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .returns<ProductQueryRow[]>();

  if (productsError) throw productsError;

  return { user, store, products: normalizeProductRows(products) };
}

function normalizeStoreProfileInput(input: StoreProfileInput) {
  const name = input.name.trim();
  const sellerName = input.sellerName.trim();
  const description = input.description.trim();
  const whatsappNumber = validateWhatsappNumber(input.whatsappNumber);

  if (name.length < 2) throw new Error("Nama toko minimal 2 karakter.");
  if (sellerName.length < 2) throw new Error("Nama penjual minimal 2 karakter.");
  if (whatsappNumber.length < 8) throw new Error("Nomor WhatsApp belum valid.");

  return { name, sellerName, description, whatsappNumber };
}

export async function createCurrentStore(input: StoreProfileInput) {
  const { name, sellerName, description, whatsappNumber } = normalizeStoreProfileInput(input);
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Sesi login tidak ditemukan.");

  const { data, error } = await supabase
    .from("stores")
    .insert({
      owner_id: userData.user.id,
      name,
      seller_name: sellerName,
      description: description || null,
      whatsapp_number: whatsappNumber,
      is_active: input.isActive,
    })
    .select("id, owner_id, name, seller_name, description, whatsapp_number, is_active")
    .single<StoreRow>();

  if (error) {
    if (error.code === "23505") throw new Error("Profil toko sudah dibuat. Silakan muat ulang halaman.");
    throw error;
  }

  return data;
}

export async function updateCurrentStore(storeId: string, input: StoreProfileInput) {
  const { name, sellerName, description, whatsappNumber } = normalizeStoreProfileInput(input);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("stores")
    .update({
      name,
      seller_name: sellerName,
      description: description || null,
      whatsapp_number: whatsappNumber,
      is_active: input.isActive,
    })
    .eq("id", storeId)
    .select("id, owner_id, name, seller_name, description, whatsapp_number, is_active")
    .single<StoreRow>();

  if (error) throw error;
  return data;
}

function getImageDrafts(input: NewProductInput) {
  if (input.images) return input.images;

  return [
    ...(input.imagePath ? [{ imagePath: input.imagePath, isPrimary: true }] : []),
    ...(input.imageFile ? [{ imageFile: input.imageFile, isPrimary: !input.imagePath }] : []),
  ];
}

function isInternalImagePath(imagePath: string) {
  return !/^https?:\/\//i.test(imagePath);
}

async function uploadProductImage(userId: string, file: File) {
  if (!IMAGE_TYPES.has(file.type)) throw new Error("Format foto harus JPG, PNG, atau WebP.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("Ukuran setiap foto maksimal 5 MB.");

  const supabase = createClient();
  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;
  return path;
}

async function removeProductImages(imagePaths: string[]) {
  const supabase = createClient();
  const paths = [...new Set(imagePaths.filter(isInternalImagePath))];
  if (paths.length === 0) return;
  await supabase.storage.from("product-images").remove(paths);
}

async function getProductForStore(productId: string, storeId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .eq("store_id", storeId)
    .maybeSingle<ProductQueryRow>();

  if (error) throw error;
  if (!data) throw new Error("Produk tidak ditemukan atau bukan milik toko ini.");
  return normalizeProductRows([data])[0];
}

async function resolveProductImages(
  userId: string,
  drafts: ProductImageInput[],
  existingProduct?: ProductRow,
) {
  if (drafts.length > MAX_PRODUCT_IMAGES) {
    throw new Error(`Maksimal ${MAX_PRODUCT_IMAGES} foto per produk.`);
  }

  const existingById = new Map((existingProduct?.product_images ?? []).map((image) => [image.id, image]));
  const uploadedPaths: string[] = [];
  const resolved: Array<{ id?: string; imagePath: string; isPrimary: boolean; sortOrder: number }> = [];
  const seenPaths = new Set<string>();

  try {
    for (const [index, draft] of drafts.entries()) {
      let imagePath = draft.imagePath?.trim() ?? "";
      const imageId = draft.id;

      if (draft.imageFile) {
        if (draft.id) throw new Error("Foto lama tidak dapat diganti langsung; hapus lalu tambahkan foto baru.");
        imagePath = await uploadProductImage(userId, draft.imageFile);
        uploadedPaths.push(imagePath);
      } else if (draft.id) {
        const existingImage = existingById.get(draft.id);
        if (!existingImage) throw new Error("Referensi foto produk tidak valid.");
        if (imagePath && imagePath !== existingImage.image_path) {
          throw new Error("Path foto produk tidak valid.");
        }
        imagePath = existingImage.image_path;
      } else if (imagePath && isInternalImagePath(imagePath)) {
        // Allow a legacy products.image_path to be adopted into the gallery
        // when the migration has not created its product_images row yet.
        if (!existingProduct || existingProduct.image_path !== imagePath) {
          throw new Error("Path Storage foto produk tidak valid.");
        }
      }

      if (!imagePath || (!/^https?:\/\//i.test(imagePath) && !isInternalImagePath(imagePath))) {
        throw new Error("Setiap foto produk harus berupa URL atau file gambar.");
      }
      if (seenPaths.has(imagePath)) throw new Error("Foto yang sama tidak boleh ditambahkan dua kali.");
      seenPaths.add(imagePath);
      resolved.push({
        id: imageId,
        imagePath,
        isPrimary: draft.isPrimary === true,
        sortOrder: index,
      });
    }
  } catch (error) {
    await removeProductImages(uploadedPaths).catch(() => undefined);
    throw error;
  }

  if (resolved.length > 0 && !resolved.some((image) => image.isPrimary)) {
    resolved[0].isPrimary = true;
  }

  return { resolved, uploadedPaths };
}

export async function saveProduct(storeId: string, input: NewProductInput) {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Sesi login tidak ditemukan.");

  const name = input.name.trim();
  const category = input.category;
  const description = input.description.trim();
  if (!name) throw new Error("Nama produk wajib diisi.");
  if (!description) throw new Error("Deskripsi produk wajib diisi.");
  if (!category) throw new Error("Kategori produk wajib dipilih.");
  const whatsappNumber = validateWhatsappNumber(input.whatsappNumber);

  const existingProduct = input.id ? await getProductForStore(input.id, storeId) : undefined;
  const { resolved, uploadedPaths } = await resolveProductImages(userData.user.id, getImageDrafts(input), existingProduct);
  const { data: productId, error: saveError } = await supabase.rpc("save_product_with_gallery", {
    p_product_id: input.id ?? null,
    p_store_id: storeId,
    p_name: name,
    p_category: category,
    p_description: description,
    p_whatsapp_number: whatsappNumber,
    p_price: input.price,
    p_is_available: input.isAvailable,
    p_is_visible: input.isVisible,
    p_is_featured: input.isFeatured,
    p_images: resolved.map((image) => ({
      image_path: image.imagePath,
      is_primary: image.isPrimary,
    })),
  });
  if (saveError || typeof productId !== "string") {
    await removeProductImages(uploadedPaths).catch(() => undefined);
    throw saveError ?? new Error("Produk gagal disimpan.");
  }

  const retainedPaths = new Set(resolved.map((image) => image.imagePath));
  const replacedPaths = [
    ...(existingProduct?.product_images ?? []).map((image) => image.image_path),
    ...(existingProduct?.image_path ? [existingProduct.image_path] : []),
  ].filter((path) => !retainedPaths.has(path));
  await removeProductImages(replacedPaths).catch(() => undefined);

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .single<ProductQueryRow>();
  if (error) throw error;
  return normalizeProductRows([data])[0];
}

export async function deleteProduct(productId: string) {
  const supabase = createClient();
  const { data, error: loadError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .maybeSingle<ProductQueryRow>();
  if (loadError) throw loadError;

  const product = data ? normalizeProductRows([data])[0] : null;
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw error;

  await removeProductImages([
    ...(product?.product_images ?? []).map((image) => image.image_path),
    ...(product?.image_path ? [product.image_path] : []),
  ]);
}
