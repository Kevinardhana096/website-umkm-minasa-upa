'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Compass, 
  CheckCircle2, 
  ArrowRight,
  ShoppingBag,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { FloatingChatWidget, FloatingChatWidgetRef } from './FloatingChatWidget';
import { VillageLocationSection } from './VillageLocationSection';
import { ProductDetailModal } from './ProductDetailModal';
import { formatRupiah, type CatalogStore } from '@/lib/products';
import type { Product } from '@/types/product';
import { MarkdownContent } from './MarkdownContent';

interface ProfilPageProps {
  store?: CatalogStore | null;
  products?: Product[];
}

export const ProfilPage: React.FC<ProfilPageProps> = ({ store = null, products = [] }) => {
  const chatWidgetRef = useRef<FloatingChatWidgetRef>(null);
  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const heroSlides = [
    {
      src: '/carousel/pexels-craft-group.jpeg',
      alt: 'Perempuan mengerjakan kerajinan tangan di ruang produksi',
    },
    {
      src: '/carousel/pexels-craft-studio.jpeg',
      alt: 'Dua perajin perempuan membuat produk kerajinan tangan',
    },
    {
      src: '/carousel/pexels-food-stand.jpeg',
      alt: 'Perempuan menyiapkan makanan di stan kuliner',
    },
    {
      src: '/carousel/pexels-food-market.jpeg',
      alt: 'Aktivitas kuliner di pasar makanan',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const featuredProducts = products.filter((product) => product.isFeatured === true).slice(0, 6);

  // Auto-scroll carousel for featured products (especially on mobile)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const container = featuredScrollRef.current;
    if (!container || featuredProducts.length <= 1) return;

    let isPaused = false;
    const handlePause = () => { isPaused = true; };
    const handleResume = () => { isPaused = false; };

    container.addEventListener('mouseenter', handlePause);
    container.addEventListener('mouseleave', handleResume);
    container.addEventListener('touchstart', handlePause, { passive: true });
    container.addEventListener('touchend', handleResume, { passive: true });

    const timer = setInterval(() => {
      if (isPaused) return;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 5) return;

      if (container.scrollLeft >= maxScroll - 15) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: 220, behavior: 'smooth' });
      }
    }, 3800);

    return () => {
      clearInterval(timer);
      container.removeEventListener('mouseenter', handlePause);
      container.removeEventListener('mouseleave', handleResume);
      container.removeEventListener('touchstart', handlePause);
      container.removeEventListener('touchend', handleResume);
    };
  }, [featuredProducts.length]);

  const scrollFeaturedLeft = () => {
    if (featuredScrollRef.current) {
      featuredScrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const scrollFeaturedRight = () => {
    if (featuredScrollRef.current) {
      featuredScrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleContactSellerClick = () => {
    if (!store?.whatsappNumber) {
      chatWidgetRef.current?.openChat();
      return;
    }

    const waUrl = `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(
      `Halo ${store?.name ?? 'Penjual'}, saya mengunjungi Halaman Profil UMKM Wanita Tangguh Minasa Upa dan ingin bertanya lebih lanjut.`,
    )}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-gray-900 font-sans selection:bg-[#F4EBD9]">
      {/* Sticky Navbar */}
      <Navbar transparentAtTop onContactClick={handleContactSellerClick} />

      {/* Main Body */}
      <main className="flex-1 pb-4 sm:pb-6">
        
        {/* =========================================================================
            HERO HEADER WITH HORIZONTAL AUTO-SLIDING CAROUSEL
           ========================================================================= */}
        <section className="group relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden mb-12 sm:mb-16">
          
          {/* Horizontal Sliding Images Track */}
          <div 
            className="absolute inset-0 flex transition-transform duration-700 ease-in-out w-full h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {heroSlides.map((slide, index) => (
              <div key={index} className="relative w-full h-full shrink-0 bg-[#202522]">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="100vw"
                  unoptimized
                  className="object-cover object-center"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
          
          {/* Dark Gradient Overlay for High Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/10" />

          {/* Hero Content Text */}
          <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 text-center text-white sm:px-6 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-6xl">
              {/* Main Headline */}
              <h1 className="mx-auto max-w-6xl font-serif text-[clamp(1.75rem,5vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.45)]">
                <span className="block xl:whitespace-nowrap">
                  Kelompok UMKM{' '}
                  <span className="text-amber-200 italic">Wanita Tangguh</span>
                </span>
                <span className="mt-1 block text-white sm:mt-2">Minasa Upa</span>
              </h1>

              {/* Subtitle */}
              <p className="mx-auto mt-5 max-w-2xl font-serif text-[clamp(0.875rem,2.2vw,1.25rem)] font-medium leading-6 tracking-[0.01em] text-white/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] sm:mt-6 sm:leading-9 lg:mt-7 lg:max-w-3xl">
                Kelompok usaha bersama 13 perempuan Minasa Upa yang mengembangkan pangan olahan khas daerah melalui penguatan pemasaran digital dan identitas merek.
              </p>
            </div>
          </div>

          {/* Manual Control Buttons */}
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 cursor-pointer rounded-full bg-black/30 p-2.5 text-white opacity-100 backdrop-blur-sm transition-all hover:bg-black/60 sm:left-6 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 cursor-pointer rounded-full bg-black/30 p-2.5 text-white opacity-100 backdrop-blur-sm transition-all hover:bg-black/60 sm:right-6 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Pagination Indicators / Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlide === index ? 'w-8 bg-amber-400' : 'w-2 bg-white/50 hover:bg-white'
                }`}
              />
            ))}
          </div>

        </section>

        {/* =========================================================================
            TENTANG KAMI (2 COLUMNS SIDE-BY-SIDE)
           ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Image Showcase (5 cols) */}
            <div className="lg:col-span-5 relative">
              <div className="relative h-[360px] sm:h-[440px] w-full rounded-3xl overflow-hidden shadow-xl border border-gray-200/80 bg-gradient-to-br from-white via-[#FAF7F0] to-[#F4EFE6] p-8 sm:p-12 flex items-center justify-center">
                <div className="relative w-full h-full max-w-[280px] max-h-[280px]">
                  <Image
                    src="/logo_umkm.png"
                    alt="Logo UMKM Wanita Tangguh Minasa Upa"
                    fill
                    sizes="(max-width: 640px) 280px, 280px"
                    className="object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Right Narrative Content (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Tag Line */}
              <div className="flex items-center gap-2 text-[#963E1B] text-xs font-bold uppercase tracking-wider">
                <Compass className="w-4 h-4" />
                <span>TENTANG KELOMPOK</span>
              </div>

              {/* Main Heading */}
              <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                Menguatkan kemandirian ekonomi perempuan Minasa Upa
              </h2>

              <div className="space-y-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                <p>
                  Kelompok UMKM Wanita Tangguh Minasa Upa merupakan kelompok usaha bersama yang berdiri sejak 2020 dan beranggotakan 13 perempuan usia produktif. Kelompok ini tumbuh dari semangat kolaborasi untuk memperkuat kemandirian ekonomi keluarga.
                </p>
                <p>
                  Berbasis di Desa Minasa Upa, Kecamatan Bontoa, Kabupaten Maros, para anggota mengembangkan produk pangan olahan seperti kue coklat balok, kue kering, onde-onde, sambal kemasan, dan keripik pisang dengan bahan baku lokal.
                </p>
                <p>
                  Program pemberdayaan diarahkan pada penguatan konten promosi visual, identitas merek, dan layanan pelanggan digital berbasis AI agar produk lebih dikenal, mudah diakses, dan mampu menjangkau pasar yang lebih luas.
                </p>
              </div>

              {/* Checkmark Pills */}
              <div className="flex flex-wrap gap-2.5 pt-3">
                <span className="px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200/80 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />
                  13 Anggota Perempuan
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200/80 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />
                  Berdiri Sejak 2020
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200/80 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />
                  Pangan Olahan Khas Daerah
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200/80 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />
                  Pemasaran Digital Berbasis AI
                </span>
              </div>

            </div>

          </div>
        </section>

        {/* =========================================================================
            PRODUK UNGGULAN
           ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Produk Unggulan
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Produk olahan yang dikembangkan oleh anggota Kelompok UMKM Wanita Tangguh Minasa Upa.
            </p>
          </div>

          {/* Product Grid / Horizontal Carousel Container */}
          {featuredProducts.length > 0 ? (
            <div className="relative group">
              {/* Mobile-Only Side Navigation Arrow Buttons */}
              <button
                type="button"
                onClick={scrollFeaturedLeft}
                aria-label="Scroll Produk Unggulan ke Kiri"
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 cursor-pointer rounded-full bg-white/95 border border-gray-200/90 p-2 text-[#0F2C23] shadow-md backdrop-blur-xs transition-all active:scale-90 sm:hidden"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={scrollFeaturedRight}
                aria-label="Scroll Produk Unggulan ke Kanan"
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 cursor-pointer rounded-full bg-white/95 border border-gray-200/90 p-2 text-[#0F2C23] shadow-md backdrop-blur-xs transition-all active:scale-90 sm:hidden"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div
                ref={featuredScrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory pb-4 gap-3 sm:gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible scrollbar-none"
              >
              {featuredProducts.map((product) => (
              <div 
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="w-[calc(50%-0.375rem)] min-w-[calc(50%-0.375rem)] shrink-0 snap-start sm:w-auto sm:min-w-0 sm:shrink bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col group cursor-pointer"
              >
                <div className="relative h-36 sm:h-48 w-full overflow-hidden bg-gray-100">
                  <Image
                    src={product.imageUrl || '/food_umkm.jpg'}
                    alt={product.name}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.isVerified && (
                    <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#0F2C23]/90 text-white text-[9px] sm:text-[10px] font-bold tracking-wide flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400">
                      {product.merchantName}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 sm:mt-1 line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                    {product.description && (
                      <div className="mt-1.5 sm:mt-2">
                        <MarkdownContent content={product.description} className="text-[11px] sm:text-xs text-gray-600 line-clamp-2 leading-relaxed" />
                        {product.description.length > 50 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                            }}
                            className="mt-1 text-[10px] sm:text-[11px] font-semibold text-[#963E1B] hover:text-[#0F2C23] hover:underline inline-flex items-center gap-0.5 transition-colors focus:outline-none"
                          >
                            <span>Detail Selengkapnya</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                      {formatRupiah(product.price)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                      }}
                      className="p-1.5 sm:p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-[#0F2C23] hover:text-white transition-colors"
                      title="Lihat Detail Produk"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 px-6 py-12 text-center text-sm text-gray-500">
              Produk unggulan belum tersedia.
            </div>
          )}

          {/* View All CTA */}
          <div className="text-center mt-12">
            <Link
              href="/katalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F2C23] text-white text-sm font-semibold hover:bg-[#184537] active:scale-95 transition-all shadow-md"
            >
              <span>Buka Katalog Lengkap</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </section>

        {/* =========================================================================
            PETA LOKASI DESA MINASA UPA
           ========================================================================= */}
        <VillageLocationSection />

      </main>

      {/* Footer */}
      <Footer store={store} />

      {/* Product Detail Modal */}
      <ProductDetailModal
        key={selectedProduct?.id ?? "closed"}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAskBot={(prod) => chatWidgetRef.current?.askAboutProduct(prod)}
      />

      {/* Floating Chat Widget */}
      <FloatingChatWidget ref={chatWidgetRef} />
    </div>
  );
};
