import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { ProductRow, StoreRow } from "@/lib/products";

export interface NewProductInput {
  id?: string;
  name: string;
  description: string;
  price: number | null;
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
  if (!profile || !["toko", "admin"].includes(profile.role)) {
    throw new Error("Akun tidak memiliki role Toko yang valid.");
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

    if (createError) throw createError;
    store = createdStore as StoreRow;
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, store_id, name, description, image_path, price, is_available, is_visible, created_at, updated_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .returns<ProductRow[]>();

  if (productsError) throw productsError;

  return { user, store, products: products ?? [] };
}

async function uploadProductImage(userId: string, file: File) {
  const supabase = createClient();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });

  if (error) throw error;
  return path;
}

export async function saveProduct(storeId: string, input: NewProductInput) {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Sesi login tidak ditemukan.");

  let imagePath = input.imagePath || null;
  if (input.imageFile) imagePath = await uploadProductImage(userData.user.id, input.imageFile);

  const payload = {
    store_id: storeId,
    name: input.name,
    description: input.description,
    price: input.price,
    image_path: imagePath,
    is_available: input.isAvailable,
    is_visible: input.isVisible,
  };

  const query = input.id
    ? supabase.from("products").update(payload).eq("id", input.id).eq("store_id", storeId)
    : supabase.from("products").insert(payload);
  const { data, error } = await query
    .select("id, store_id, name, description, image_path, price, is_available, is_visible, created_at, updated_at")
    .single();

  if (error) throw error;
  return data as ProductRow;
}

export async function deleteProduct(productId: string) {
  const supabase = createClient();
  const { data: product } = await supabase.from("products").select("image_path").eq("id", productId).maybeSingle<{ image_path: string | null }>();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw error;

  if (product?.image_path && !/^https?:\/\//i.test(product.image_path)) {
    await supabase.storage.from("product-images").remove([product.image_path]);
  }
}
