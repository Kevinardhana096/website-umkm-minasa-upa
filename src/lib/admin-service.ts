import { createClient } from "@/lib/supabase/server";

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

interface AdminProductRow {
  id: string;
  store_id: string;
  is_available: boolean;
  is_visible: boolean;
}

export interface AdminStoreSummary extends AdminStoreRow {
  product_count: number;
  visible_product_count: number;
  available_product_count: number;
}

export interface AdminMonitoringData {
  stores: AdminStoreSummary[];
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
      .select("id, store_id, is_available, is_visible")
      .returns<AdminProductRow[]>(),
  ]);

  if (storesResult.error || productsResult.error) {
    throw new Error("Admin monitoring belum tersedia. Jalankan migration supabase/admin-dashboard.sql di Supabase SQL Editor.");
  }

  const counts = new Map<string, { total: number; visible: number; available: number }>();
  for (const product of productsResult.data ?? []) {
    const current = counts.get(product.store_id) ?? { total: 0, visible: 0, available: 0 };
    current.total += 1;
    if (product.is_visible) current.visible += 1;
    if (product.is_available) current.available += 1;
    counts.set(product.store_id, current);
  }

  return {
    stores: (storesResult.data ?? []).map((store) => {
      const storeCounts = counts.get(store.id) ?? { total: 0, visible: 0, available: 0 };
      return {
        ...store,
        product_count: storeCounts.total,
        visible_product_count: storeCounts.visible,
        available_product_count: storeCounts.available,
      };
    }),
  };
}
