import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePublicCatalogCache } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const REVALIDATE_WINDOW_MS = 60_000;
const REVALIDATE_MAX_REQUESTS = 30;
const revalidateRequests = new Map<string, { count: number; resetAt: number }>();

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
  return { userId, role: profile.role };
}

export async function POST() {
  const current = await getCurrentRole();
  if (!current) return NextResponse.json({ error: "Sesi login diperlukan." }, { status: 401 });
  if (current.role !== "toko" && current.role !== "admin" && current.role !== "anggota") {
    return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 });
  }

  const now = Date.now();
  for (const [key, entry] of revalidateRequests) {
    if (entry.resetAt <= now) revalidateRequests.delete(key);
  }
  const entry = revalidateRequests.get(current.userId);
  if (entry && entry.count >= REVALIDATE_MAX_REQUESTS && entry.resetAt > now) {
    return NextResponse.json({ error: "Terlalu banyak permintaan refresh." }, { status: 429 });
  }
  if (!entry || entry.resetAt <= now) {
    revalidateRequests.set(current.userId, { count: 1, resetAt: now + REVALIDATE_WINDOW_MS });
  } else {
    entry.count += 1;
  }

  revalidatePublicCatalogCache();
  return NextResponse.json({ ok: true });
}
