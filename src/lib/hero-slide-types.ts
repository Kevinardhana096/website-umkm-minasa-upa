export interface HeroSlide {
  id: string;
  src: string;
  alt: string;
}

export const FALLBACK_HERO_SLIDES: HeroSlide[] = [
  { id: "fallback-craft-group", src: "/carousel/pexels-craft-group.jpeg", alt: "Perempuan mengerjakan kerajinan tangan di ruang produksi" },
  { id: "fallback-craft-studio", src: "/carousel/pexels-craft-studio.jpeg", alt: "Dua perajin perempuan membuat produk kerajinan tangan" },
  { id: "fallback-food-stand", src: "/carousel/pexels-food-stand.jpeg", alt: "Perempuan menyiapkan makanan di stan kuliner" },
  { id: "fallback-food-market", src: "/carousel/pexels-food-market.jpeg", alt: "Aktivitas kuliner di pasar makanan" },
];
