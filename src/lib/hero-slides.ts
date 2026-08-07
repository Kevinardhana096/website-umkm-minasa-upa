import { createClient } from "@supabase/supabase-js";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { FALLBACK_HERO_SLIDES, type HeroSlide } from "@/lib/hero-slide-types";

export const HERO_SLIDES_CACHE_TAG = "hero-slides";

interface HeroSlideRow {
  id: string;
  image_path: string;
  alt_text: string;
}

export function toHeroImageUrl(imagePath: string, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  if (/^(https?:\/\/|\/)/i.test(imagePath)) return imagePath;
  if (!supabaseUrl) return imagePath;
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/hero-images/${imagePath.split("/").map(encodeURIComponent).join("/")}`;
}

async function fetchPublicHeroSlides(): Promise<HeroSlide[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return FALLBACK_HERO_SLIDES;

  try {
    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await supabase
      .from("hero_slides")
      .select("id, image_path, alt_text")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<HeroSlideRow[]>();
    if (error) throw error;
    if (!data || data.length === 0) return FALLBACK_HERO_SLIDES;
    return data.map((slide) => ({ id: slide.id, src: toHeroImageUrl(slide.image_path, url), alt: slide.alt_text || "Foto kegiatan UMKM Wanita Tangguh Minasa Upa" }));
  } catch (error) {
    console.error("Gagal memuat carousel hero", error);
    return FALLBACK_HERO_SLIDES;
  }
}

export const getPublicHeroSlides = unstable_cache(fetchPublicHeroSlides, [HERO_SLIDES_CACHE_TAG], {
  revalidate: 60,
  tags: [HERO_SLIDES_CACHE_TAG],
});

export function revalidateHeroSlidesCache() {
  revalidateTag(HERO_SLIDES_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "page");
  revalidatePath("/profil", "page");
}
