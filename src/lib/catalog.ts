import { createClient as createPublicClient } from "@supabase/supabase-js";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { mapProductRow, normalizeProductRows, PRODUCT_SELECT, type CatalogStore, type CatalogStoreOption, type ProductQueryRow, type StoreRow } from "@/lib/products";
import type { Product } from "@/types/product";
import { createClient as createServerClient } from "@/lib/supabase/server";

export interface PublicCatalogData {
  products: Product[];
  store: CatalogStore | null;
  stores: CatalogStoreOption[];
  status: "available" | "unavailable";
}

export interface AdminCatalogData extends PublicCatalogData {
  productRows: ReturnType<typeof normalizeProductRows>;
}

export const PUBLIC_CATALOG_CACHE_TAG = "public-catalog";

export function revalidatePublicCatalogCache() {
  revalidateTag(PUBLIC_CATALOG_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "page");
  revalidatePath("/katalog", "page");
  revalidatePath("/profil", "page");
}

async function fetchPublicCatalog(): Promise<PublicCatalogData | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const supabase = createPublicClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: stores, error: storeError } = await supabase
      .from("stores")
      .select("id, owner_id, name, seller_name, description, whatsapp_number, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .returns<StoreRow[]>();

    if (storeError) throw storeError;
    if (!stores || stores.length === 0) return { products: [], store: null, stores: [], status: "available" };

    const { data: rows, error: productError } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .in("store_id", stores.map((store) => store.id))
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .limit(500)
      .returns<ProductQueryRow[]>();

    if (productError) throw productError;

    const storesById = new Map(stores.map((store) => [store.id, store]));
    return {
      products: normalizeProductRows(rows).flatMap((row) => {
        const store = storesById.get(row.store_id);
        return store ? [mapProductRow(row, store, supabaseUrl, { includeOwnership: false })] : [];
      }),
      store: stores.length === 1
        ? {
            name: stores[0].name,
            sellerName: stores[0].seller_name,
            description: stores[0].description ?? "Katalog produk UMKM lokal.",
            whatsappNumber: stores[0].whatsapp_number,
          }
        : null,
      stores: stores.map((store) => ({
        id: store.id,
        name: store.name,
        sellerName: store.seller_name,
        whatsappNumber: store.whatsapp_number,
      })),
      status: "available",
    };
  } catch (error) {
    console.error("Gagal memuat katalog Supabase", error);
    // A configured backend error must not silently show demo data.
    return { products: [], store: null, stores: [], status: "unavailable" };
  }
}

export const getPublicCatalog = unstable_cache(fetchPublicCatalog, [PUBLIC_CATALOG_CACHE_TAG], {
  revalidate: 60,
  tags: [PUBLIC_CATALOG_CACHE_TAG],
});

export async function getAdminCatalog(): Promise<AdminCatalogData | null> {
  try {
    const supabase = await createServerClient();
    const [storesResult, productsResult] = await Promise.all([
      supabase
        .from("stores")
        .select("id, owner_id, name, seller_name, description, whatsapp_number, is_active")
        .order("created_at", { ascending: true })
        .returns<StoreRow[]>(),
      supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .order("created_at", { ascending: false })
        .limit(500)
        .returns<ProductQueryRow[]>(),
    ]);
    if (storesResult.error || productsResult.error) throw storesResult.error ?? productsResult.error;

    const stores = storesResult.data ?? [];
    const storeById = new Map(stores.map((store) => [store.id, store]));
    const productRows = normalizeProductRows(productsResult.data).flatMap((row) => {
      const store = storeById.get(row.store_id);
      return store ? [{ ...row, store_name: store.name }] : [];
    });

    return {
      products: productRows.flatMap((row) => {
        const store = storeById.get(row.store_id);
        return store ? [mapProductRow(row, store, process.env.NEXT_PUBLIC_SUPABASE_URL)] : [];
      }),
      productRows,
      store: stores.length === 1
        ? { name: stores[0].name, sellerName: stores[0].seller_name, description: stores[0].description ?? "Katalog produk UMKM lokal.", whatsappNumber: stores[0].whatsapp_number }
        : null,
      stores: stores.map((store) => ({ id: store.id, name: store.name, sellerName: store.seller_name, whatsappNumber: store.whatsapp_number })),
      status: "available",
    };
  } catch (error) {
    console.error("Gagal memuat katalog admin Supabase", error);
    return null;
  }
}
