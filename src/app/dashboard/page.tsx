import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeProductRows, PRODUCT_SELECT, type ProductQueryRow, type StoreRow } from "@/lib/products";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const userId = typeof data.claims.sub === "string" ? data.claims.sub : "";
  if (!userId) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: "toko" | "admin" | "anggota" }>();

  if (profileError || !profile || (profile.role !== "toko" && profile.role !== "admin" && profile.role !== "anggota")) {
    redirect("/login");
  }
  if (profile.role === "admin") redirect("/admin");
  if (profile.role === "anggota") redirect("/katalog");

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, owner_id, name, seller_name, description, whatsapp_number, is_active")
    .eq("owner_id", userId)
    .maybeSingle<StoreRow>();
  if (storeError) throw storeError;

  let products: ProductQueryRow[] = [];
  if (store) {
    const { data: productRows, error: productsError } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .returns<ProductQueryRow[]>();
    if (productsError) throw productsError;
    products = productRows ?? [];
  }

  return (
    <DashboardClient
      initialData={{ user: { id: userId }, store: store ?? null, products: normalizeProductRows(products) }}
    />
  );
}
