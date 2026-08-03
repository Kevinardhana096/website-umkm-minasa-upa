import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { mapProductRow, normalizeProductRows, PRODUCT_SELECT, type CatalogStore, type ProductQueryRow, type StoreRow } from "@/lib/products";
import type { Product } from "@/types/product";

export interface PublicCatalogData {
  products: Product[];
  store: CatalogStore | null;
}

async function fetchPublicCatalog(): Promise<PublicCatalogData | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: stores, error: storeError } = await supabase
      .from("stores")
      .select("id, owner_id, name, seller_name, description, whatsapp_number, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .returns<StoreRow[]>();

    if (storeError) throw storeError;
    if (!stores || stores.length === 0) return { products: [], store: null };

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
        return store ? [mapProductRow(row, store, supabaseUrl)] : [];
      }),
      store: stores.length === 1
        ? {
            name: stores[0].name,
            sellerName: stores[0].seller_name,
            description: stores[0].description ?? "Katalog produk UMKM lokal.",
            whatsappNumber: stores[0].whatsapp_number,
          }
        : null,
    };
  } catch (error) {
    console.error("Gagal memuat katalog Supabase", error);
    // A configured backend error must not silently show demo data.
    return { products: [], store: null };
  }
}

export const getPublicCatalog = unstable_cache(fetchPublicCatalog, ["public-catalog"], {
  revalidate: 60,
});
