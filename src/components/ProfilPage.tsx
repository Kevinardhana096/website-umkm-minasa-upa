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
import { mockProducts } from '@/data/mockProducts';
import type { CatalogStore } from '@/lib/products';

interface ProfilPageProps {
  store?: CatalogStore | null;
}

export const ProfilPage: React.FC<ProfilPageProps> = ({ store = null }) => {
  const chatWidgetRef = useRef<FloatingChatWidgetRef>(null);

  const heroSlides = [
    {
      src: '/hero_umkm_bg.jpg',
      alt: 'Lokakarya & Perajin Minasa Upa',
    },
    {
      src: '/umkm_wanita_tangguh.jpg',
      alt: 'Perempuan Kreatif Minasa Upa',
    },
    {
      src: '/food_umkm.jpg',
      alt: 'Kuliner Tangguh Minasa Upa',
    },
    {
      src: '/craft_umkm.jpg',
      alt: 'Kriya & Kerajinan Minasa Upa',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

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

  const featuredProducts = mockProducts.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-gray-900 font-sans selection:bg-[#F4EBD9]">
      {/* Sticky Navbar */}
      <Navbar onContactClick={handleContactSellerClick} />

      {/* Main Body */}
      <main className="flex-1 pb-20">
        
        {/* =========================================================================
            HERO HEADER WITH HORIZONTAL AUTO-SLIDING CAROUSEL
           ========================================================================= */}
        <section className="relative w-full min-h-[420px] sm:min-h-[480px] flex items-center justify-center overflow-hidden mb-12 sm:mb-16 group">
          
          {/* Horizontal Sliding Images Track */}
          <div 
            className="absolute inset-0 flex transition-transform duration-700 ease-in-out w-full h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {heroSlides.map((slide, index) => (
              <div key={index} className="relative w-full h-full shrink-0">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  quality={95}
                  sizes="100vw"
                  className="object-cover object-center"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
          
          {/* Dark Gradient Overlay for High Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/70 backdrop-blur-[1px]" />

          {/* Hero Content Text */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center text-white py-16">
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Kelompok UMKM Wanita Tangguh Minasa Upa
            </h1>

            {/* Subtitle */}
            <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-gray-200 leading-relaxed font-normal max-w-2xl mx-auto">
              Kolektif perajin dan perempuan kreatif lokal di wilayah Minasa Upa yang berdedikasi melestarikan karya berkualitas tinggi, menjembatani tradisi dengan pasar modern.
            </p>
          </div>

          {/* Manual Control Buttons */}
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
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
                <span>TENTANG KAMI</span>
              </div>

              {/* Main Heading */}
              <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                Kelompok UMKM Wanita Tangguh Minasa Upa
              </h2>

              {/* Paragraphs with Exact Prompt Text */}
              <div className="space-y-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                <p>
                  Kelompok UMKM Wanita Tangguh Minasa Upa terbentuk dari semangat para ibu rumah tangga dan perempuan kreatif di wilayah Minasa Upa yang ingin meningkatkan kemandirian ekonomi keluarga.
                </p>
                <p>
                  Melalui keterampilan di bidang makanan, Minuman , Dan Kerajinan kelompok ini hadir sebagai wadah kolaborasi untuk mengembangkan usaha kecil secara bersama-sama.
                </p>
                <p>
                  Selain untuk memperkuat ekonomi, terbentuknya kelompok ini juga bertujuan membangun solidaritas, saling mendukung, dan memberdayakan perempuan agar lebih berdaya saing.
                </p>
              </div>

              {/* Checkmark Pills */}
              <div className="flex flex-wrap gap-2.5 pt-3">
                <span className="px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200/80 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />
                  Pemberdayaan Lokal
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200/80 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />
                  Makanan, Minuman & Kerajinan
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200/80 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-700" />
                  Solidaritas & Saling Dukung
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
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Produk Unggulan
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Koleksi pilihan dari anggota kelompok UMKM kami.
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div 
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col group"
              >
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <Image
                    src={product.imageUrl || '/food_umkm.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.isVerified && (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded bg-[#0F2C23]/90 text-white text-[10px] font-bold tracking-wide flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Verified UMKM
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400">
                      {product.merchantName}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 mt-1 line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-gray-900">
                      Rp {(product.price ?? 0).toLocaleString('id-ID')}
                    </span>
                    <Link
                      href="/katalog"
                      className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-[#0F2C23] hover:text-white transition-colors"
                      title="Lihat di Katalog"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

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

      </main>

      {/* Footer */}
      <Footer store={store} />

      {/* Floating Chat Widget */}
      <FloatingChatWidget ref={chatWidgetRef} store={store} />
    </div>
  );
};
