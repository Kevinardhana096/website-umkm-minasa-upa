import { createClient } from "@/lib/supabase/client";
import { mapProductRow, normalizeProductRows, PRODUCT_SELECT, type ProductQueryRow, type ProductRow, type StoreRow } from "@/lib/products";
import { normalizeStoreName } from "@/lib/store-name";
import { validateWhatsappNumber } from "@/lib/whatsapp";
import { saveProduct, type NewProductInput } from "@/lib/store-service";

const STORE_SELECT = "id, owner_id, name, name_normalized, seller_name, description, whatsapp_number, is_active";

interface MemberSession {
  userId: string;
  fullName: string;
}

export interface MemberCatalogData {
  session: MemberSession;
  stores: StoreRow[];
  ownStore: StoreRow | null;
  products: ProductRow[];
}

async function requireMemberSession(): Promise<MemberSession> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Sesi login tidak ditemukan.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userData.user.id)
    .maybeSingle<{ role: "toko" | "admin" | "anggota"; full_name: string | null }>();
  if (profileError) throw profileError;
  if (profile?.role !== "anggota") throw new Error("Fitur ini hanya tersedia untuk akun anggota.");

  const fullName = profile.full_name?.trim() || userData.user.user_metadata?.full_name?.toString().trim() || "Anggota UMKM";
  return { userId: userData.user.id, fullName };
}

async function getActiveStores() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stores")
    .select(STORE_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .returns<StoreRow[]>();
  if (error) throw error;
  return data ?? [];
}

async function getOwnStore(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stores")
    .select(STORE_SELECT)
    .eq("owner_id", userId)
    .maybeSingle<StoreRow>();
  if (error) throw error;
  return data;
}

export async function getMemberCatalogData(): Promise<MemberCatalogData> {
  const session = await requireMemberSession();
  const supabase = createClient();
  const [activeStores, ownStore] = await Promise.all([
    getActiveStores(),
    getOwnStore(session.userId),
  ]);
  const stores = ownStore
    ? [ownStore, ...activeStores.filter((store) => store.id !== ownStore.id)]
    : activeStores;
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("created_by", session.userId)
    .order("created_at", { ascending: false })
    .returns<ProductQueryRow[]>();
  if (error) throw error;

  return {
    session,
    stores,
    ownStore,
    products: normalizeProductRows(data),
  };
}

export async function resolveMemberStore(storeId: string | undefined, storeName: string | undefined, whatsappNumber: string) {
  const session = await requireMemberSession();
  const supabase = createClient();
  const ownStore = await getOwnStore(session.userId);

  if (storeId) {
    const { data: selectedStore, error: selectedStoreError } = await supabase
      .from("stores")
      .select(STORE_SELECT)
      .eq("id", storeId)
      .eq("is_active", true)
      .maybeSingle<StoreRow>();
    if (selectedStoreError) throw selectedStoreError;
    if (!selectedStore) throw new Error("Toko tujuan tidak tersedia atau sedang nonaktif.");
    return selectedStore;
  }

  const name = storeName?.trim() ?? "";
  if (name.length < 2) throw new Error("Nama toko minimal 2 karakter.");
  const normalizedName = normalizeStoreName(name);
  const normalizedWhatsapp = validateWhatsappNumber(whatsappNumber);
  const { data: sameNameStores, error: sameNameError } = await supabase
    .from("stores")
    .select(STORE_SELECT)
    .eq("name_normalized", normalizedName)
    .returns<StoreRow[]>();
  if (sameNameError) throw sameNameError;

  const sameNameStore = (sameNameStores ?? [])[0];
  if (sameNameStore) {
    if (!sameNameStore.is_active) throw new Error("Toko dengan nama tersebut sedang nonaktif. Pilih toko lain.");
    return sameNameStore;
  }

  if (ownStore) {
    throw new Error("Anda sudah memiliki toko. Pilih toko yang tersedia atau gunakan toko Anda.");
  }

  const { data: createdStore, error: createError } = await supabase
    .from("stores")
    .insert({
      owner_id: session.userId,
      name,
      seller_name: session.fullName,
      description: "Toko anggota katalog UMKM.",
      whatsapp_number: normalizedWhatsapp,
      is_active: true,
    })
    .select(STORE_SELECT)
    .single<StoreRow>();
  if (!createError && createdStore) return createdStore;

  if (createError?.code === "23505") {
    const refreshedStores = await getActiveStores();
    const concurrentMatch = refreshedStores.find((store) => normalizeStoreName(store.name_normalized ?? store.name) === normalizedName);
    if (concurrentMatch) return concurrentMatch;
  }
  throw createError ?? new Error("Toko baru gagal dibuat.");
}

export async function saveMemberProduct(input: NewProductInput) {
  if (!input.storeId && !input.storeName) throw new Error("Pilih toko atau masukkan nama toko baru.");
  const session = await requireMemberSession();
  const supabase = createClient();
  let existingStoreId: string | undefined;

  if (input.id) {
    const { data: existingProduct, error } = await supabase
      .from("products")
      .select("id, store_id")
      .eq("id", input.id)
      .eq("created_by", session.userId)
      .maybeSingle<{ id: string; store_id: string }>();
    if (error) throw error;
    if (!existingProduct) throw new Error("Produk tidak ditemukan atau bukan milik akun ini.");
    existingStoreId = existingProduct.store_id;
  }

  const store = await resolveMemberStore(
    existingStoreId ?? input.storeId,
    input.storeName,
    input.whatsappNumber,
  );

  if (input.id) {
    const { data: existingProduct, error } = await supabase
      .from("products")
      .select("id, store_id")
      .eq("id", input.id)
      .eq("created_by", session.userId)
      .maybeSingle<{ id: string; store_id: string }>();
    if (error) throw error;
    if (!existingProduct || existingProduct.store_id !== store.id) throw new Error("Toko produk tidak dapat diubah.");
  }

  const product = await saveProduct(store.id, input);
  return { product, store };
}

export function mapMemberProduct(product: ProductRow, store: StoreRow) {
  return mapProductRow({ ...product, store_name: store.name }, store, process.env.NEXT_PUBLIC_SUPABASE_URL);
}
