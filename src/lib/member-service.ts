import { createClient } from "@/lib/supabase/client";
import { mapProductRow, normalizeProductRows, PRODUCT_SELECT, type ProductQueryRow, type ProductRow, type StoreRow } from "@/lib/products";
import { normalizeStoreName } from "@/lib/store-name";
import { validateWhatsappNumber } from "@/lib/whatsapp";
import { saveProduct, type NewProductInput } from "@/lib/store-service";

const STORE_SELECT = "id, owner_id, name, name_normalized, seller_name, description, whatsapp_number, is_active";
export const DEFAULT_MEMBER_STORE_NAME = "UMKM Desa Minasa Upa Maros";

interface MemberSession {
  userId: string;
  fullName: string;
}

export interface MemberCatalogData {
  session: MemberSession;
  stores: StoreRow[];
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

export async function getMemberCatalogData(): Promise<MemberCatalogData> {
  const session = await requireMemberSession();
  const supabase = createClient();
  const stores = await getActiveStores();
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
    products: normalizeProductRows(data),
  };
}

export async function resolveMemberStore(storeName: string, whatsappNumber: string, allowLegacyStore = false) {
  const session = await requireMemberSession();
  // Anggota menggunakan identitas katalog bersama. Nilai dari client sengaja
  // diabaikan agar nama ini tidak dapat diubah melalui request langsung.
  const name = allowLegacyStore ? storeName.trim() : DEFAULT_MEMBER_STORE_NAME;
  if (name.length < 2) throw new Error("Nama toko minimal 2 karakter.");
  const normalizedName = normalizeStoreName(name);
  const normalizedWhatsapp = validateWhatsappNumber(whatsappNumber);
  const stores = await getActiveStores();
  const matches = stores.filter((store) => normalizeStoreName(store.name_normalized ?? store.name) === normalizedName);

  if (matches.length > 1) {
    throw new Error("Nama toko cocok dengan lebih dari satu data. Pilih nama toko yang tersedia.");
  }
  if (matches[0]) return matches[0];

  const supabase = createClient();
  const { data: ownStore, error: ownStoreError } = await supabase
    .from("stores")
    .select(STORE_SELECT)
    .eq("owner_id", session.userId)
    .maybeSingle<StoreRow>();
  if (ownStoreError) throw ownStoreError;
  if (ownStore) {
    // Pertahankan kompatibilitas dengan data anggota lama yang sudah memiliki
    // toko sendiri. Anggota baru tetap akan memakai toko default bersama.
    return ownStore;
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
  if (!input.storeName) throw new Error("Nama toko wajib diisi.");
  const session = await requireMemberSession();
  const supabase = createClient();
  let legacyStoreName: string | undefined;

  if (input.id) {
    const { data: existingProduct, error } = await supabase
      .from("products")
      .select("id, store_id")
      .eq("id", input.id)
      .eq("created_by", session.userId)
      .maybeSingle<{ id: string; store_id: string }>();
    if (error) throw error;
    if (!existingProduct) throw new Error("Produk tidak ditemukan atau bukan milik akun ini.");
    const { data: existingStore, error: existingStoreError } = await supabase
      .from("stores")
      .select("name")
      .eq("id", existingProduct.store_id)
      .maybeSingle<{ name: string }>();
    if (existingStoreError) throw existingStoreError;
    legacyStoreName = existingStore?.name;
  }

  const store = await resolveMemberStore(
    legacyStoreName ?? input.storeName,
    input.whatsappNumber,
    Boolean(legacyStoreName),
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
