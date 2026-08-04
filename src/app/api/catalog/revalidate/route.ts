import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePublicCatalogCache } from "@/lib/catalog";

export const dynamic = "force-dynamic";

async function getCurrentRole() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";
  if (!userId) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: "toko" | "admin" | "anggota" }>();

  if (error || !profile) return null;
  return profile.role;
}

export async function POST() {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "Sesi login diperlukan." }, { status: 401 });
  if (role !== "toko" && role !== "admin" && role !== "anggota") {
    return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 });
  }

  revalidatePublicCatalogCache();
  return NextResponse.json({ ok: true });
}
