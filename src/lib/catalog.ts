import { createClient } from "@/lib/supabase/server";
import { mapProductRow, type CatalogStore, type ProductRow, type StoreRow } from "@/lib/products";
import type { Product } from "@/types/product";

export interface PublicCatalogData {
  products: Product[];
  store: CatalogStore | null;
}

export async function getPublicCatalog(): Promise<PublicCatalogData | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const supabase = await createClient();
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
      .select(
        "id, store_id, name, description, image_path, price, is_available, is_visible, created_at, updated_at",
      )
      .in("store_id", stores.map((store) => store.id))
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .returns<ProductRow[]>();

    if (productError) throw productError;

    return {
      products: (rows ?? []).flatMap((row) => {
        const store = stores.find((item) => item.id === row.store_id);
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
