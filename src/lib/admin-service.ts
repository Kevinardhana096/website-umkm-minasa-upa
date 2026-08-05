import { createClient } from "@/lib/supabase/server";
import { normalizeProductRows, PRODUCT_SELECT, type ProductImageRow, type ProductQueryRow } from "@/lib/products";
import type { ProductCategory } from "@/types/product";

export interface AdminStoreRow {
  id: string;
  owner_id: string;
  name: string;
  seller_name: string;
  description: string | null;
  whatsapp_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type AdminProductRow = ProductQueryRow;

export interface AdminStoreSummary extends AdminStoreRow {
  product_count: number;
  visible_product_count: number;
  available_product_count: number;
}

export interface AdminMonitoringData {
  stores: AdminStoreSummary[];
  products: AdminProductSummary[];
}

export interface AdminProductSummary {
  id: string;
  store_id: string;
  created_by: string | null;
  store_name: string;
  store_is_active: boolean;
  name: string;
  category: ProductCategory | null;
  description: string;
  image_path: string | null;
  product_images: ProductImageRow[];
  whatsapp_number: string | null;
  price: number | string | null;
  is_available: boolean;
  is_visible: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAdminMonitoringData(): Promise<AdminMonitoringData> {
  const supabase = await createClient();
  const [storesResult, productsResult] = await Promise.all([
    supabase
      .from("stores")
      .select("id, owner_id, name, seller_name, description, whatsapp_number, is_active, created_at, updated_at")
      .order("created_at", { ascending: false })
      .returns<AdminStoreRow[]>(),
    supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .returns<AdminProductRow[]>(),
  ]);

  if (storesResult.error || productsResult.error) {
    throw new Error("Admin monitoring belum tersedia. Jalankan migration supabase/admin-dashboard.sql di Supabase SQL Editor.");
  }

  const stores = storesResult.data ?? [];
  const storeById = new Map(stores.map((store) => [store.id, store]));
  const counts = new Map<string, { total: number; visible: number; available: number }>();
  for (const product of productsResult.data ?? []) {
    const current = counts.get(product.store_id) ?? { total: 0, visible: 0, available: 0 };
    current.total += 1;
    if (product.is_visible) current.visible += 1;
    if (product.is_available) current.available += 1;
    counts.set(product.store_id, current);
  }

  return {
    stores: stores.map((store) => {
      const storeCounts = counts.get(store.id) ?? { total: 0, visible: 0, available: 0 };
      return {
        ...store,
        product_count: storeCounts.total,
        visible_product_count: storeCounts.visible,
        available_product_count: storeCounts.available,
      };
    }),
    products: normalizeProductRows(productsResult.data)
      .map((product) => {
        const store = storeById.get(product.store_id);
        if (!store) return null;
        return {
          ...product,
          store_name: store.name,
          store_is_active: store.is_active,
        };
      })
      .filter((product): product is AdminProductSummary => product !== null)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
  };
}
