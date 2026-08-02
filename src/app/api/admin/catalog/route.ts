import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

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

async function updateProduct(
  request: Request,
  serviceClient: NonNullable<ReturnType<typeof getServiceClient>>,
) {
  const formData = await request.formData();
  if (getString(formData.get("resource") ?? undefined) !== "product") {
    return jsonError("Resource tidak valid.", 400);
  }

  const productId = getString(formData.get("id") ?? undefined);
  const name = getString(formData.get("name") ?? undefined);
  const description = getString(formData.get("description") ?? undefined);
  const imagePathInput = getString(formData.get("image_path") ?? undefined);
  const priceInput = getString(formData.get("price") ?? undefined);
  const isAvailableInput = getString(formData.get("is_available") ?? undefined);
  const isVisibleInput = getString(formData.get("is_visible") ?? undefined);

  if (!productId) return jsonError("Produk wajib dipilih.", 400);
  if (name.length < 1) return jsonError("Nama produk wajib diisi.", 400);
  if (description.length < 1) return jsonError("Deskripsi produk wajib diisi.", 400);
  if (!["true", "false"].includes(isAvailableInput) || !["true", "false"].includes(isVisibleInput)) {
    return jsonError("Status produk tidak valid.", 400);
  }

  const isAvailable = isAvailableInput === "true";
  const isVisible = isVisibleInput === "true";

  let price: number | null = null;
  if (priceInput) {
    price = Number(priceInput);
    if (!Number.isFinite(price) || price < 0) return jsonError("Harga produk tidak valid.", 400);
  }

  const { data: existingProduct, error: existingError } = await serviceClient
    .from("products")
    .select("id, image_path")
    .eq("id", productId)
    .maybeSingle<{ id: string; image_path: string | null }>();
  if (existingError) return jsonError("Data produk gagal dimuat.", 500);
  if (!existingProduct) return jsonError("Produk tidak ditemukan.", 404);

  let imagePath = imagePathInput || null;
  let uploadedImagePath: string | null = null;
  const imageFile = formData.get("image_file");
  if (imageFile instanceof File && imageFile.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) {
      return jsonError("Format foto harus JPG, PNG, atau WebP.", 400);
    }
    if (imageFile.size > 5 * 1024 * 1024) {
      return jsonError("Ukuran foto maksimal 5 MB.", 400);
    }

    const { data: productOwner, error: ownerError } = await serviceClient
      .from("products")
      .select("store_id, stores(owner_id)")
      .eq("id", productId)
      .maybeSingle<{ store_id: string; stores: { owner_id: string } | null }>();
    if (ownerError || !productOwner?.stores?.owner_id) {
      return jsonError("Pemilik toko produk tidak ditemukan.", 500);
    }

    uploadedImagePath = `${productOwner.stores.owner_id}/${crypto.randomUUID()}.${getImageExtension(imageFile)}`;
    const { error: uploadError } = await serviceClient.storage.from("product-images").upload(uploadedImagePath, imageFile, {
      contentType: imageFile.type,
      upsert: false,
    });
    if (uploadError) return jsonError("Foto produk gagal diunggah.", 500);
    imagePath = uploadedImagePath;
  }

  const { data, error } = await serviceClient
    .from("products")
    .update({
      name,
      description,
      price,
      image_path: imagePath,
      is_available: isAvailable,
      is_visible: isVisible,
    })
    .eq("id", productId)
    .select("id, store_id, name, description, image_path, price, is_available, is_visible, created_at, updated_at")
    .single();

  if (error) {
    if (uploadedImagePath) await removeProductImage(serviceClient, uploadedImagePath).catch(() => undefined);
    return jsonError("Produk gagal diperbarui.", 500);
  }

  if (existingProduct.image_path && existingProduct.image_path !== imagePath) {
    await removeProductImage(serviceClient, existingProduct.image_path).catch((cleanupError) => {
      console.error("Failed to remove replaced product image", cleanupError);
    });
  }

  return NextResponse.json({ product: data });
}

async function updateStore(
  request: Request,
  serviceClient: NonNullable<ReturnType<typeof getServiceClient>>,
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
      return await updateProduct(request, serviceClient);
    }
    return await updateStore(request, serviceClient);
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
      const { data: product, error: productError } = await serviceClient
        .from("products")
        .select("id, image_path")
        .eq("id", id)
        .maybeSingle<{ id: string; image_path: string | null }>();
      if (productError) return jsonError("Data produk gagal dimuat.", 500);
      if (!product) return jsonError("Produk tidak ditemukan.", 404);

      const { error } = await serviceClient.from("products").delete().eq("id", id);
      if (error) return jsonError("Produk gagal dihapus.", 500);
      await removeProductImage(serviceClient, product.image_path).catch((cleanupError) => {
        console.error("Failed to remove deleted product image", cleanupError);
      });
      return NextResponse.json({ ok: true });
    }

    const { data: store, error: storeError } = await serviceClient
      .from("stores")
      .select("id")
      .eq("id", id)
      .maybeSingle<{ id: string }>();
    if (storeError) return jsonError("Data toko gagal dimuat.", 500);
    if (!store) return jsonError("Toko tidak ditemukan.", 404);

    const { data: products, error: productsError } = await serviceClient
      .from("products")
      .select("image_path")
      .eq("store_id", id)
      .returns<{ image_path: string | null }[]>();
    if (productsError) return jsonError("Produk toko gagal dimuat.", 500);

    const { error } = await serviceClient.from("stores").delete().eq("id", id);
    if (error) return jsonError("Toko gagal dihapus.", 500);

    await Promise.all((products ?? []).map((product) => removeProductImage(serviceClient, product.image_path).catch((cleanupError) => {
      console.error("Failed to remove deleted store product image", cleanupError);
    })));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete admin catalog data", error);
    return jsonError("Data katalog gagal dihapus.", 500);
  }
}
