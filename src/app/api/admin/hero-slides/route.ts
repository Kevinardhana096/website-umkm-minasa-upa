import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { revalidateHeroSlidesCache, toHeroImageUrl } from "@/lib/hero-slides";

export const dynamic = "force-dynamic";
const MAX_HERO_SLIDES = 6;

interface HeroSlideRow { id: string; image_path: string; alt_text: string; sort_order: number; is_active: boolean; created_at: string; updated_at: string; }

function jsonError(message: string, status: number) { return NextResponse.json({ error: message }, { status }); }

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && serviceRoleKey ? createSupabaseClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } }) : null;
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";
  if (!userId) return null;
  const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle<{ role: "toko" | "admin" | "anggota" }>();
  return !error && profile?.role === "admin" ? { userId } : null;
}

function isInternalPath(path: string) { return !/^(https?:\/\/|\/)/i.test(path); }
function extensionFor(file: File) { return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<string, string>)[file.type] ?? "bin"; }
function mapSlide(slide: HeroSlideRow) { return { ...slide, image_url: toHeroImageUrl(slide.image_path) }; }

async function recordAudit(serviceClient: NonNullable<ReturnType<typeof getServiceClient>>, adminId: string, action: "create" | "update" | "delete", slideId: string, details: Record<string, unknown>) {
  const { error } = await serviceClient.from("admin_audit_logs").insert({ admin_id: adminId, action, resource: "hero_slide", resource_id: slideId, details });
  if (error) console.error("Failed to record hero slide audit", error);
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Akses admin diperlukan.", 403);
  const serviceClient = getServiceClient();
  if (!serviceClient) return jsonError("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.", 503);
  const { data, error } = await serviceClient.from("hero_slides").select("id, image_path, alt_text, sort_order, is_active, created_at, updated_at").order("sort_order").order("created_at").returns<HeroSlideRow[]>();
  if (error) return jsonError("Data carousel Hero gagal dimuat. Jalankan migration hero-carousel.sql terlebih dahulu.", 500);
  return NextResponse.json({ slides: (data ?? []).map(mapSlide), max_slides: MAX_HERO_SLIDES });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Akses admin diperlukan.", 403);
  const serviceClient = getServiceClient();
  if (!serviceClient) return jsonError("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.", 503);
  try {
    const formData = await request.formData();
    const file = formData.get("image_file");
    const altText = typeof formData.get("alt_text") === "string" ? String(formData.get("alt_text")).trim() : "";
    if (!(file instanceof File) || file.size === 0) return jsonError("Foto carousel wajib dipilih.", 400);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return jsonError("Format foto harus JPG, PNG, atau WebP.", 400);
    if (file.size > 5 * 1024 * 1024) return jsonError("Ukuran foto maksimal 5 MB.", 400);
    const { count, error: countError } = await serviceClient.from("hero_slides").select("id", { count: "exact", head: true });
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_HERO_SLIDES) return jsonError(`Maksimal ${MAX_HERO_SLIDES} foto Hero dapat disimpan.`, 400);
    const { data: latest, error: latestError } = await serviceClient.from("hero_slides").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle<{ sort_order: number }>();
    if (latestError) throw latestError;
    const imagePath = `${admin.userId}/${crypto.randomUUID()}.${extensionFor(file)}`;
    const { error: uploadError } = await serviceClient.storage.from("hero-images").upload(imagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error("Foto carousel gagal diunggah.");
    const { data: slide, error: insertError } = await serviceClient.from("hero_slides").insert({ image_path: imagePath, alt_text: altText, sort_order: (latest?.sort_order ?? -1) + 1, is_active: true, created_by: admin.userId }).select("id, image_path, alt_text, sort_order, is_active, created_at, updated_at").single<HeroSlideRow>();
    if (insertError || !slide) { await serviceClient.storage.from("hero-images").remove([imagePath]); throw insertError ?? new Error("Foto carousel gagal disimpan."); }
    await recordAudit(serviceClient, admin.userId, "create", slide.id, { image_path: imagePath });
    revalidateHeroSlidesCache();
    return NextResponse.json({ slide: mapSlide(slide) }, { status: 201 });
  } catch (error) {
    console.error("Failed to create hero slide", error);
    return jsonError(error instanceof Error ? error.message : "Foto carousel gagal ditambahkan.", 500);
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Akses admin diperlukan.", 403);
  const serviceClient = getServiceClient();
  if (!serviceClient) return jsonError("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.", 503);
  let body: { action?: "update" | "reorder"; id?: string; alt_text?: string; is_active?: boolean; slide_ids?: unknown };
  try { body = await request.json(); } catch { return jsonError("Format request tidak valid.", 400); }
  try {
    if (body.action === "update") {
      const id = body.id?.trim();
      if (!id || typeof body.alt_text !== "string" || typeof body.is_active !== "boolean") return jsonError("Data slide tidak valid.", 400);
      const { data, error } = await serviceClient.from("hero_slides").update({ alt_text: body.alt_text.trim(), is_active: body.is_active }).eq("id", id).select("id, image_path, alt_text, sort_order, is_active, created_at, updated_at").maybeSingle<HeroSlideRow>();
      if (error) throw error;
      if (!data) return jsonError("Slide tidak ditemukan.", 404);
      await recordAudit(serviceClient, admin.userId, "update", id, { is_active: body.is_active });
      revalidateHeroSlidesCache();
      return NextResponse.json({ slide: mapSlide(data) });
    }
    if (body.action === "reorder") {
      const slideIds = Array.isArray(body.slide_ids) ? body.slide_ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0).map((id) => id.trim()) : [];
      if (slideIds.length === 0 || slideIds.length > MAX_HERO_SLIDES || new Set(slideIds).size !== slideIds.length) return jsonError("Urutan slide tidak valid.", 400);
      const { data: slides, error: slidesError } = await serviceClient.from("hero_slides").select("id").in("id", slideIds);
      if (slidesError) throw slidesError;
      if ((slides ?? []).length !== slideIds.length) return jsonError("Satu atau lebih slide tidak ditemukan.", 404);
      await Promise.all(slideIds.map((id, index) => serviceClient.from("hero_slides").update({ sort_order: index }).eq("id", id)));
      await recordAudit(serviceClient, admin.userId, "update", slideIds[0], { action: "reorder", slide_ids: slideIds });
      revalidateHeroSlidesCache();
      return NextResponse.json({ ok: true });
    }
    return jsonError("Aksi tidak didukung.", 400);
  } catch (error) {
    console.error("Failed to update hero slide", error);
    return jsonError("Pengaturan carousel Hero gagal disimpan.", 500);
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Akses admin diperlukan.", 403);
  const serviceClient = getServiceClient();
  if (!serviceClient) return jsonError("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.", 503);
  let body: { id?: string };
  try { body = await request.json(); } catch { return jsonError("Format request tidak valid.", 400); }
  const id = body.id?.trim();
  if (!id) return jsonError("Slide wajib dipilih.", 400);
  try {
    const { data: slide, error: loadError } = await serviceClient.from("hero_slides").select("id, image_path").eq("id", id).maybeSingle<{ id: string; image_path: string }>();
    if (loadError) throw loadError;
    if (!slide) return jsonError("Slide tidak ditemukan.", 404);
    const { error: deleteError } = await serviceClient.from("hero_slides").delete().eq("id", id);
    if (deleteError) throw deleteError;
    if (isInternalPath(slide.image_path)) await serviceClient.storage.from("hero-images").remove([slide.image_path]).catch(() => undefined);
    await recordAudit(serviceClient, admin.userId, "delete", id, { image_path: slide.image_path });
    revalidateHeroSlidesCache();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete hero slide", error);
    return jsonError("Slide Hero gagal dihapus.", 500);
  }
}
