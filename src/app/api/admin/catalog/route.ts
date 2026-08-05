import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { revalidatePublicCatalogCache } from "@/lib/catalog";
import { MAX_FEATURED_PRODUCTS, MAX_PRODUCT_IMAGES, normalizeProductRow, normalizeProductRows, PRODUCT_SELECT, type ProductQueryRow } from "@/lib/products";
import { validateWhatsappNumber } from "@/lib/whatsapp";
import { PRODUCT_CATEGORIES } from "@/types/product";

export const dynamic = "force-dynamic";

type CatalogResource = "store" | "product";

interface StoreUpdateBody {
  resource?: CatalogResource;
  id?: string;
  name?: string;
  seller_name?: string;
  description?: string;
  whatsapp_number?: string;
  is_active?: boolean;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";
  if (!userId) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: "toko" | "admin" }>();
  if (error || profile?.role !== "admin") return null;

  return { userId };
}

function isInternalImagePath(imagePath: string | null | undefined) {
  return Boolean(imagePath && !/^https?:\/\//i.test(imagePath));
}

async function removeProductImage(
  serviceClient: NonNullable<ReturnType<typeof getServiceClient>>,
  imagePath: string | null | undefined,
) {
  if (!isInternalImagePath(imagePath)) return;
  const { error } = await serviceClient.storage.from("product-images").remove([imagePath as string]);
  if (error) throw error;
}

async function recordAdminAudit(
  serviceClient: NonNullable<ReturnType<typeof getServiceClient>>,
  adminId: string,
  action: "update" | "delete",
  resource: CatalogResource,
  resourceId: string,
  details: Record<string, unknown>,
) {
  const { error } = await serviceClient.from("admin_audit_logs").insert({
    admin_id: adminId,
    action,
    resource,
    resource_id: resourceId,
    details,
  });

  // The audit migration is deployed separately from the application. Keep a
  // successful catalog mutation from being reported as failed if it has not
  // been run yet, while leaving an actionable server-side error.
  if (error) console.error("Failed to write admin audit log", error);
}

function getString(value: FormDataEntryValue | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function getImageExtension(file: File) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return extensions[file.type] ?? "bin";
}

interface AdminImageDraft {
  id?: string;
  imagePath?: string;
  imageFile?: File;
  isPrimary?: boolean;
}

function parseImageDrafts(formData: FormData) {
  const imagesInput = getString(formData.get("images") ?? undefined);
  if (!imagesInput) {
    const legacyFile = formData.get("image_file");
    return [{
      imagePath: getString(formData.get("image_path") ?? undefined) || undefined,
      imageFile: legacyFile instanceof File && legacyFile.size > 0 ? legacyFile : undefined,
      isPrimary: true,
    } satisfies AdminImageDraft];
  }

  let imageMetadata: Array<{ id?: unknown; image_path?: unknown; is_primary?: unknown }>;
  try {
    imageMetadata = JSON.parse(imagesInput) as Array<{ id?: unknown; image_path?: unknown; is_primary?: unknown }>;
  } catch {
    throw new Error("Format galeri foto tidak valid.");
  }
  if (!Array.isArray(imageMetadata)) throw new Error("Format galeri foto tidak valid.");

  return imageMetadata.map((image, index) => {
    const file = formData.get(`image_file_${index}`);
    return {
      id: typeof image.id === "string" ? image.id : undefined,
      imagePath: typeof image.image_path === "string" ? image.image_path.trim() : undefined,
      imageFile: file instanceof File && file.size > 0 ? file : undefined,
      isPrimary: image.is_primary === true,
    } satisfies AdminImageDraft;
  });
}

async function resolveAdminImages(
  serviceClient: NonNullable<ReturnType<typeof getServiceClient>>,
  ownerId: string,
  drafts: AdminImageDraft[],
  existingProduct: ProductQueryRow,
) {
  if (drafts.length > MAX_PRODUCT_IMAGES) {
    throw new Error(`Maksimal ${MAX_PRODUCT_IMAGES} foto per produk.`);
  }

  const existing = normalizeProductRow(existingProduct);
  const existingById = new Map(existing.product_images.map((image) => [image.id, image]));
  const uploadedPaths: string[] = [];
  const resolved: Array<{ id?: string; imagePath: string; isPrimary: boolean; sortOrder: number }> = [];
  const seenPaths = new Set<string>();

  try {
    for (const [index, draft] of drafts.entries()) {
      let imagePath = draft.imagePath ?? "";
      if (draft.imageFile) {
        if (draft.id) throw new Error("Foto lama tidak dapat diganti langsung; hapus lalu tambahkan foto baru.");
        if (!["image/jpeg", "image/png", "image/webp"].includes(draft.imageFile.type)) {
          throw new Error("Format foto harus JPG, PNG, atau WebP.");
        }
        if (draft.imageFile.size > 5 * 1024 * 1024) throw new Error("Ukuran setiap foto maksimal 5 MB.");

        const path = `${ownerId}/${crypto.randomUUID()}.${getImageExtension(draft.imageFile)}`;
        const { error } = await serviceClient.storage.from("product-images").upload(path, draft.imageFile, {
          contentType: draft.imageFile.type,
          upsert: false,
        });
        if (error) throw new Error("Foto produk gagal diunggah.");
        imagePath = path;
        uploadedPaths.push(path);
      } else if (draft.id) {
        const existingImage = existingById.get(draft.id);
        if (!existingImage) throw new Error("Referensi foto produk tidak valid.");
        if (imagePath && imagePath !== existingImage.image_path) throw new Error("Path foto produk tidak valid.");
        imagePath = existingImage.image_path;
      } else if (imagePath && isInternalImagePath(imagePath)) {
        if (existing.image_path !== imagePath) throw new Error("Path Storage foto produk tidak valid.");
      }

      if (!imagePath) throw new Error("Setiap foto produk harus berupa URL atau file gambar.");
      if (seenPaths.has(imagePath)) throw new Error("Foto yang sama tidak boleh ditambahkan dua kali.");
      seenPaths.add(imagePath);
      resolved.push({ id: draft.id, imagePath, isPrimary: draft.isPrimary === true, sortOrder: index });
    }
  } catch (error) {
    if (uploadedPaths.length > 0) await serviceClient.storage.from("product-images").remove(uploadedPaths).catch(() => undefined);
    throw error;
  }

  if (resolved.length > 0 && !resolved.some((image) => image.isPrimary)) resolved[0].isPrimary = true;
  return { existing, resolved, uploadedPaths };
}

async function updateProduct(
  request: Request,
  serviceClient: NonNullable<ReturnType<typeof getServiceClient>>,
  adminId: string,
) {
  const formData = await request.formData();
  if (getString(formData.get("resource") ?? undefined) !== "product") {
    return jsonError("Resource tidak valid.", 400);
  }

  const productId = getString(formData.get("id") ?? undefined);
  const name = getString(formData.get("name") ?? undefined);
  const category = getString(formData.get("category") ?? undefined);
  const description = getString(formData.get("description") ?? undefined);
  let whatsappNumber = "";
  try {
    whatsappNumber = validateWhatsappNumber(getString(formData.get("whatsapp_number") ?? undefined));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Nomor WhatsApp belum valid.", 400);
  }
  const priceInput = getString(formData.get("price") ?? undefined);
  const isAvailableInput = getString(formData.get("is_available") ?? undefined);
  const isVisibleInput = getString(formData.get("is_visible") ?? undefined);
  const isFeaturedInput = getString(formData.get("is_featured") ?? undefined);

  if (!productId) return jsonError("Produk wajib dipilih.", 400);
  if (name.length < 1) return jsonError("Nama produk wajib diisi.", 400);
  if (!PRODUCT_CATEGORIES.includes(category as (typeof PRODUCT_CATEGORIES)[number])) return jsonError("Kategori produk tidak valid.", 400);
  if (description.length < 1) return jsonError("Deskripsi produk wajib diisi.", 400);
  if (!["true", "false"].includes(isAvailableInput) || !["true", "false"].includes(isVisibleInput) || !["true", "false"].includes(isFeaturedInput)) {
    return jsonError("Status produk tidak valid.", 400);
  }

  const isAvailable = isAvailableInput === "true";
  const isVisible = isVisibleInput === "true";
  const isFeatured = isFeaturedInput === "true";

  let price: number | null = null;
  if (priceInput) {
    price = Number(priceInput);
    if (!Number.isFinite(price) || price < 0) return jsonError("Harga produk tidak valid.", 400);
  }

  const { data: existingProduct, error: existingError } = await serviceClient
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .maybeSingle<ProductQueryRow>();
  if (existingError) return jsonError("Data produk gagal dimuat.", 500);
  if (!existingProduct) return jsonError("Produk tidak ditemukan.", 404);

  if (isFeatured && !existingProduct.is_featured) {
    const { count, error: featuredCountError } = await serviceClient
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_featured", true);
    if (featuredCountError) return jsonError("Jumlah produk unggulan gagal dimuat.", 500);
    if ((count ?? 0) >= MAX_FEATURED_PRODUCTS) {
      return jsonError(`Maksimal ${MAX_FEATURED_PRODUCTS} produk unggulan yang dapat ditampilkan di profil UMKM.`, 400);
    }
  }

  const { data: productOwner, error: ownerError } = await serviceClient
    .from("products")
    .select("store_id, stores(owner_id)")
    .eq("id", productId)
    .maybeSingle<{ store_id: string; stores: { owner_id: string } | null }>();
  if (ownerError || !productOwner?.stores?.owner_id) return jsonError("Pemilik toko produk tidak ditemukan.", 500);

  let databasePersisted = false;
  let uploadedPaths: string[] = [];
  try {
    const imageResult = await resolveAdminImages(serviceClient, productOwner.stores.owner_id, parseImageDrafts(formData), existingProduct);
    uploadedPaths = imageResult.uploadedPaths;
    const primaryPath = imageResult.resolved.find((image) => image.isPrimary)?.imagePath ?? null;
    const { error: saveError } = await serviceClient.rpc("save_product_with_gallery", {
      p_product_id: productId,
      p_store_id: existingProduct.store_id,
      p_name: name,
      p_category: category,
      p_description: description,
      p_whatsapp_number: whatsappNumber,
      p_price: price,
      p_is_available: isAvailable,
      p_is_visible: isVisible,
      p_is_featured: isFeatured,
      p_images: imageResult.resolved.map((image) => ({
        image_path: image.imagePath,
        is_primary: image.isPrimary,
      })),
    });
    if (saveError) throw saveError;
    databasePersisted = true;

    const retainedPaths = new Set(imageResult.resolved.map((image) => image.imagePath));
    const replacedPaths = [
      ...imageResult.existing.product_images.map((image) => image.image_path),
      ...(existingProduct.image_path ? [existingProduct.image_path] : []),
    ].filter((path) => !retainedPaths.has(path));
    await Promise.all(replacedPaths
      .filter((path, index, paths) => paths.indexOf(path) === index)
      .map((path) => removeProductImage(serviceClient, path).catch((cleanupError) => {
        console.error("Failed to remove replaced product image", cleanupError);
      })));

    const { data, error: updatedError } = await serviceClient
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("id", productId)
      .single<ProductQueryRow>();
    if (updatedError) return jsonError("Produk gagal dimuat setelah diperbarui.", 500);

    await recordAdminAudit(serviceClient, adminId, "update", "product", productId, {
      name,
      store_id: data.store_id,
      image_count: imageResult.resolved.length,
      image_changed: existingProduct.image_path !== primaryPath || imageResult.resolved.length !== imageResult.existing.product_images.length,
      is_available: isAvailable,
      is_visible: isVisible,
      is_featured: isFeatured,
    });
    revalidatePublicCatalogCache();

    return NextResponse.json({ product: normalizeProductRow(data) });
  } catch (error) {
    if (!databasePersisted && uploadedPaths.length > 0) {
      await serviceClient.storage.from("product-images").remove(uploadedPaths).catch(() => undefined);
    }
    throw error;
  }
}

async function updateStore(
  request: Request,
  serviceClient: NonNullable<ReturnType<typeof getServiceClient>>,
  adminId: string,
) {
  let body: StoreUpdateBody;
  try {
    body = await request.json() as StoreUpdateBody;
  } catch {
    return jsonError("Format request tidak valid.", 400);
  }

  if (body.resource !== "store") return jsonError("Resource tidak valid.", 400);
  const storeId = body.id?.trim();
  const name = body.name?.trim() ?? "";
  const sellerName = body.seller_name?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const whatsappNumber = body.whatsapp_number?.replace(/\D/g, "") ?? "";

  if (!storeId) return jsonError("Toko wajib dipilih.", 400);
  if (name.length < 2) return jsonError("Nama toko minimal 2 karakter.", 400);
  if (sellerName.length < 2) return jsonError("Nama penjual minimal 2 karakter.", 400);
  if (whatsappNumber.length < 8) return jsonError("Nomor WhatsApp belum valid.", 400);
  if (typeof body.is_active !== "boolean") return jsonError("Status toko tidak valid.", 400);

  const { data, error } = await serviceClient
    .from("stores")
    .update({
      name,
      seller_name: sellerName,
      description: description || null,
      whatsapp_number: whatsappNumber,
      is_active: body.is_active,
    })
    .eq("id", storeId)
    .select("id, owner_id, name, seller_name, description, whatsapp_number, is_active")
    .maybeSingle();

  if (error) return jsonError("Toko gagal diperbarui.", 500);
  if (!data) return jsonError("Toko tidak ditemukan.", 404);
  await recordAdminAudit(serviceClient, adminId, "update", "store", storeId, {
    name,
    is_active: body.is_active,
  });
  revalidatePublicCatalogCache();
  return NextResponse.json({ store: data });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Akses admin diperlukan.", 403);

  const serviceClient = getServiceClient();
  if (!serviceClient) return jsonError("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.", 503);

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      return await updateProduct(request, serviceClient, admin.userId);
    }
    return await updateStore(request, serviceClient, admin.userId);
  } catch (error) {
    console.error("Failed to update admin catalog data", error);
    return jsonError("Data katalog gagal diperbarui.", 500);
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Akses admin diperlukan.", 403);

  const serviceClient = getServiceClient();
  if (!serviceClient) return jsonError("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.", 503);

  let body: { resource?: CatalogResource; id?: string };
  try {
    body = await request.json() as { resource?: CatalogResource; id?: string };
  } catch {
    return jsonError("Format request tidak valid.", 400);
  }

  const resource = body.resource;
  const id = body.id?.trim();
  if ((resource !== "store" && resource !== "product") || !id) {
    return jsonError("Resource dan ID wajib diisi.", 400);
  }

  try {
    if (resource === "product") {
      const { data: productData, error: productError } = await serviceClient
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("id", id)
        .maybeSingle<ProductQueryRow>();
      if (productError) return jsonError("Data produk gagal dimuat.", 500);
      if (!productData) return jsonError("Produk tidak ditemukan.", 404);
      const product = normalizeProductRow(productData);

      const { error } = await serviceClient.from("products").delete().eq("id", id);
      if (error) return jsonError("Produk gagal dihapus.", 500);
      await Promise.all([
        ...product.product_images.map((image) => removeProductImage(serviceClient, image.image_path)),
        ...(product.image_path ? [removeProductImage(serviceClient, product.image_path)] : []),
      ].map((cleanupTask) => cleanupTask.catch((cleanupError) => {
        console.error("Failed to remove deleted product image", cleanupError);
      })));
      await recordAdminAudit(serviceClient, admin.userId, "delete", "product", id, {});
      revalidatePublicCatalogCache();
      return NextResponse.json({ ok: true });
    }

    const { data: store, error: storeError } = await serviceClient
      .from("stores")
      .select("id")
      .eq("id", id)
      .maybeSingle<{ id: string }>();
    if (storeError) return jsonError("Data toko gagal dimuat.", 500);
    if (!store) return jsonError("Toko tidak ditemukan.", 404);

    const { data: productsData, error: productsError } = await serviceClient
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("store_id", id)
      .returns<ProductQueryRow[]>();
    if (productsError) return jsonError("Produk toko gagal dimuat.", 500);
    const products = normalizeProductRows(productsData);

    const { error } = await serviceClient.from("stores").delete().eq("id", id);
    if (error) return jsonError("Toko gagal dihapus.", 500);

    await Promise.all((products ?? []).flatMap((product) => [
      ...product.product_images.map((image) => removeProductImage(serviceClient, image.image_path)),
      ...(product.image_path ? [removeProductImage(serviceClient, product.image_path)] : []),
    ]).map((cleanupTask) => cleanupTask.catch((cleanupError) => {
      console.error("Failed to remove deleted store product image", cleanupError);
    })));
    await recordAdminAudit(serviceClient, admin.userId, "delete", "store", id, {
      deleted_product_count: products?.length ?? 0,
    });
    revalidatePublicCatalogCache();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete admin catalog data", error);
    return jsonError("Data katalog gagal dihapus.", 500);
  }
}
