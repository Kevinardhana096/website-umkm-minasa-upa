import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { MAX_PRODUCT_IMAGES, normalizeProductRows, PRODUCT_SELECT, type ProductImageRow, type ProductQueryRow, type ProductRow, type StoreRow } from "@/lib/products";

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
  name: string;
  description: string;
  price: number | null;
  images?: ProductImageInput[];
  // Kept temporarily for callers outside the current form.
  imagePath?: string;
  imageFile?: File | null;
  isAvailable: boolean;
  isVisible: boolean;
}

export interface StoreData {
  user: User;
  store: StoreRow;
  products: ProductRow[];
}

export interface StoreProfileInput {
  name: string;
  sellerName: string;
  description: string;
  whatsappNumber: string;
  isActive: boolean;
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
    .maybeSingle<{ role: "toko" | "admin" }>();

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

  let store = existingStore as StoreRow | null;
  if (!store) {
    const metadata = user.user_metadata ?? {};
    const storeName = typeof metadata.store_name === "string" ? metadata.store_name : "Toko UMKM";
    const sellerName = typeof metadata.seller_name === "string"
      ? metadata.seller_name
      : typeof metadata.full_name === "string"
        ? metadata.full_name
        : "Pemilik Toko";
    const whatsappNumber = typeof metadata.whatsapp_number === "string" ? metadata.whatsapp_number : "";

    const { data: createdStore, error: createError } = await supabase
      .from("stores")
      .insert({
        owner_id: user.id,
        name: storeName,
        seller_name: sellerName,
        whatsapp_number: whatsappNumber,
      })
      .select("id, owner_id, name, seller_name, description, whatsapp_number, is_active")
      .single();

    if (createError) {
      // The dashboard can request the store data more than once during the
      // initial render. If another request created the row first, reuse it
      // instead of surfacing the unique-constraint error to the user.
      const { data: concurrentStore, error: concurrentStoreError } = await supabase
        .from("stores")
        .select("id, owner_id, name, seller_name, description, whatsapp_number, is_active")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (concurrentStoreError || !concurrentStore) throw createError;
      store = concurrentStore as StoreRow;
    } else {
      store = createdStore as StoreRow;
    }
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .returns<ProductQueryRow[]>();

  if (productsError) throw productsError;

  return { user, store, products: normalizeProductRows(products) };
}

export async function updateCurrentStore(storeId: string, input: StoreProfileInput) {
  const name = input.name.trim();
  const sellerName = input.sellerName.trim();
  const description = input.description.trim();
  const whatsappNumber = input.whatsappNumber.replace(/\D/g, "");

  if (name.length < 2) throw new Error("Nama toko minimal 2 karakter.");
  if (sellerName.length < 2) throw new Error("Nama penjual minimal 2 karakter.");
  if (whatsappNumber.length < 8) throw new Error("Nomor WhatsApp belum valid.");

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

async function persistProductImages(
  productId: string,
  existingProduct: ProductRow | undefined,
  images: Array<{ id?: string; imagePath: string; isPrimary: boolean; sortOrder: number }>,
) {
  const supabase = createClient();
  const existingImages = existingProduct?.product_images ?? [];
  const desiredIds = new Set(images.map((image) => image.id).filter((id): id is string => Boolean(id)));
  const removedImages = existingImages.filter((image) => !desiredIds.has(image.id));

  if (removedImages.length > 0) {
    const { error } = await supabase
      .from("product_images")
      .delete()
      .in("id", removedImages.map((image) => image.id));
    if (error) throw error;
  }

  // Clear primary flags before changing order/primary selection so the
  // partial unique index never sees two primary images.
  if (existingImages.length > 0) {
    const { error } = await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", productId);
    if (error) throw error;
  }

  const retainedImages = images.filter((image) => image.id);
  for (const [index, image] of retainedImages.entries()) {
    const { error } = await supabase
      .from("product_images")
      .update({ image_path: image.imagePath, sort_order: 10000 + index, is_primary: false })
      .eq("id", image.id)
      .eq("product_id", productId);
    if (error) throw error;
  }

  const newImages = images.filter((image) => !image.id);
  let insertedImages: ProductImageRow[] = [];
  if (newImages.length > 0) {
    const { data, error } = await supabase
      .from("product_images")
      .insert(newImages.map((image) => ({
        product_id: productId,
        image_path: image.imagePath,
        sort_order: 1000 + image.sortOrder,
        is_primary: false,
      })))
      .select("id, product_id, image_path, sort_order, is_primary, created_at, updated_at")
      .returns<ProductImageRow[]>();
    if (error) throw error;
    insertedImages = data ?? [];
  }

  const imageIdsByPath = new Map<string, string>([
    ...retainedImages.map((image) => [image.imagePath, image.id as string] as const),
    ...insertedImages.map((image) => [image.image_path, image.id] as const),
  ]);

  for (const image of images) {
    const imageId = imageIdsByPath.get(image.imagePath);
    if (!imageId) throw new Error("Foto produk gagal disimpan.");
    const { error } = await supabase
      .from("product_images")
      .update({ sort_order: image.sortOrder, is_primary: false })
      .eq("id", imageId)
      .eq("product_id", productId);
    if (error) throw error;
  }

  const primaryImage = images.find((image) => image.isPrimary);
  if (primaryImage) {
    const primaryId = imageIdsByPath.get(primaryImage.imagePath);
    if (!primaryId) throw new Error("Foto utama produk gagal ditentukan.");
    const { error } = await supabase
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", primaryId)
      .eq("product_id", productId);
    if (error) throw error;
  }

  return {
    removedPaths: removedImages.map((image) => image.image_path),
    primaryPath: primaryImage?.imagePath ?? null,
  };
}

export async function saveProduct(storeId: string, input: NewProductInput) {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Sesi login tidak ditemukan.");

  const name = input.name.trim();
  const description = input.description.trim();
  if (!name) throw new Error("Nama produk wajib diisi.");
  if (!description) throw new Error("Deskripsi produk wajib diisi.");

  const existingProduct = input.id ? await getProductForStore(input.id, storeId) : undefined;
  const { resolved, uploadedPaths } = await resolveProductImages(userData.user.id, getImageDrafts(input), existingProduct);
  const primaryPath = resolved.find((image) => image.isPrimary)?.imagePath ?? null;
  const payload = {
    store_id: storeId,
    name,
    description,
    price: input.price,
    image_path: primaryPath,
    is_available: input.isAvailable,
    is_visible: input.isVisible,
  };

  let productId = input.id ?? null;
  let galleryPersisted = false;
  try {
    if (!productId) {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single<{ id: string }>();
      if (error) throw error;
      productId = data.id;
    }

    const { removedPaths } = await persistProductImages(productId, existingProduct, resolved);
    galleryPersisted = true;
    if (input.id) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", productId)
        .eq("store_id", storeId);
      if (error) throw error;
    }
    const retainedPaths = new Set(resolved.map((image) => image.imagePath));
    const removedLegacyPath = existingProduct?.image_path && !retainedPaths.has(existingProduct.image_path)
      ? [existingProduct.image_path]
      : [];
    await removeProductImages([...removedPaths, ...removedLegacyPath]).catch(() => undefined);

    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("id", productId)
      .single<ProductQueryRow>();
    if (error) throw error;
    return normalizeProductRows([data])[0];
  } catch (error) {
    if (!input.id && productId) {
      // A failed gallery insert must not leave an orphan product behind.
      await supabase.from("products").delete().eq("id", productId).then(() => undefined);
    }
    if (!galleryPersisted) await removeProductImages(uploadedPaths).catch(() => undefined);
    throw error;
  }
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
