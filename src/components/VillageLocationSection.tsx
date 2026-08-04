'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, MapPin, Navigation, Sparkles, Copy, Check, Compass, Store } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const villageQuery = 'Desa Minasa Upa, Bontoa, Maros, Sulawesi Selatan';
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(villageQuery)}`;
const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(villageQuery)}&t=&z=15&ie=UTF8&iwloc=B&output=embed`;
const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(villageQuery)}`;

export const VillageLocationSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(villageQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Gagal menyalin alamat:', err);
    }
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      // 1. Entrance timeline using GSAP ScrollTrigger
      const revealTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          once: true,
        },
      });

      revealTl
        .from('[data-gsap="header"]', {
          autoAlpha: 0,
          y: -24,
          duration: 0.7,
          ease: 'power3.out',
        })
        .from('[data-gsap="map-frame"]', {
          autoAlpha: 0,
          scale: 0.97,
          y: 25,
          duration: 0.85,
          ease: 'power3.out',
        }, '-=0.4')
        .from('[data-gsap="info-bar"]', {
          autoAlpha: 0,
          y: 20,
          duration: 0.6,
          ease: 'power3.out',
        }, '-=0.3')
        .from('[data-gsap="feature-pill"]', {
          autoAlpha: 0,
          y: 15,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power3.out',
        }, '-=0.3');

      // 2. Continuous floating animation on Location Pin Badge
      gsap.to('[data-gsap="pin-float"]', {
        y: -7,
        duration: 1.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // 3. Multi-ring Radar Ripple Animation
      gsap.to('[data-gsap="radar-ring-1"]', {
        scale: 2.3,
        opacity: 0,
        duration: 2.2,
        repeat: -1,
        ease: 'power2.out',
      });

      gsap.to('[data-gsap="radar-ring-2"]', {
        scale: 3.3,
        opacity: 0,
        duration: 2.2,
        delay: 0.5,
        repeat: -1,
        ease: 'power2.out',
      });

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="lokasi-desa"
      className="mx-auto my-16 max-w-7xl px-4 sm:my-24 sm:px-6 lg:px-8 scroll-mt-24"
    >
      {/* Outer Container matching website design system */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-[#E5DEC9] bg-gradient-to-br from-[#FAF7F0] via-[#FDFBF7] to-[#F4EFE6] p-6 text-gray-900 shadow-xl sm:p-10 lg:p-12">

        {/* Ambient Background Soft Glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#963E1B]/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#0F2C23]/5 blur-3xl" />

        <div className="relative z-10 space-y-6 sm:space-y-8">

          {/* Header Section */}
          <div data-gsap="header" className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E5DEC9]">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F2C23] text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Pusat Kegiatan & Navigasi</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Lokasi Pusat UMKM{' '}
                <span className="text-[#963E1B] font-serif italic font-bold">
                  Desa Minasa Upa
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Pusat kegiatan, galeri pameran, dan rumah produksi Kelompok UMKM Wanita Tangguh berlokasi di Desa Minasa Upa, Kecamatan Bontoa, Kabupaten Maros, Sulawesi Selatan.
              </p>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={handleCopyAddress}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-gray-800 shadow-xs border border-[#E0D8C3] hover:bg-[#FAF7F0] active:scale-95 transition-all"
                title="Salin Alamat Lengkap"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Alamat Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-[#963E1B]" />
                    <span>Salin Alamat</span>
                  </>
                )}
              </button>

              <a
                href={routeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#E0D8C3] px-4 py-2.5 text-xs font-bold text-gray-800 shadow-2xs hover:bg-[#FAF7F0] active:scale-95 transition-all"
              >
                <Compass className="h-4 w-4 text-[#963E1B]" />
                <span>Petunjuk Rute</span>
              </a>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F2C23] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#184537] active:scale-95 transition-all"
              >
                <span>Buka Google Maps</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* FULL MAP CONTAINER WITH FLOATING ANIMATED PIN BADGE */}
          <div
            data-gsap="map-frame"
            className="relative h-[420px] sm:h-[500px] lg:h-[540px] w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E0D8C3] shadow-md bg-[#EAE6DF]"
          >
            {/* Embedded Google Maps with Pin Marker */}
            <iframe
              title="Peta Lokasi Desa Minasa Upa"
              src={mapEmbedUrl}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0 filter contrast-[1.02] brightness-[0.99]"
            />

            {/* Animated Pin Badge on top of Map */}
            <div className="pointer-events-none absolute top-4 left-4 z-20">
              <div
                data-gsap="pin-float"
                className="inline-flex items-center gap-2.5 rounded-full border border-white/40 bg-[#0F2C23]/90 px-4 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md"
              >
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span data-gsap="radar-ring-1" className="absolute h-3 w-3 rounded-full bg-amber-400/80" />
                  <span data-gsap="radar-ring-2" className="absolute h-3 w-3 rounded-full bg-amber-400/50" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-amber-400" />
                </span>
                <span>Titik Galeri & Rumah Produksi UMKM</span>
              </div>
            </div>
          </div>

          {/* Info Details Bar Below Map */}
          <div
            data-gsap="info-bar"
            className="rounded-2xl border border-[#E0D8C3] bg-white/95 p-4 sm:p-5 shadow-xs backdrop-blur-md text-gray-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#963E1B]/10 text-[#963E1B] shrink-0 mt-0.5 sm:mt-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Alamat Resmi & Lokasi Utama
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-0.5">
                  {villageQuery}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Berjarak ±15 km dari pusat Kota Maros via Jalan Poros Maros - Pangkep.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
              <span className="px-3 py-1.5 rounded-lg bg-[#0F2C23]/5 text-[#0F2C23] text-xs font-bold border border-[#0F2C23]/10">
                Kecamatan Bontoa
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-[#963E1B]/5 text-[#963E1B] text-xs font-bold border border-[#963E1B]/10">
                Kabupaten Maros
              </span>
            </div>
          </div>

          {/* Feature Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div data-gsap="feature-pill" className="p-3.5 rounded-xl bg-white border border-[#E8E2D2] shadow-2xs flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#963E1B]/10 text-[#963E1B] shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Alamat Resmi</h4>
                <p className="text-[11px] text-gray-600">Desa Minasa Upa, Bontoa, Maros</p>
              </div>
            </div>

            <div data-gsap="feature-pill" className="p-3.5 rounded-xl bg-white border border-[#E8E2D2] shadow-2xs flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#0F2C23]/10 text-[#0F2C23] shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Akses Transportasi</h4>
                <p className="text-[11px] text-gray-600">Poros Maros - Pangkep (Mudah Dijangkau)</p>
              </div>
            </div>

            <div data-gsap="feature-pill" className="p-3.5 rounded-xl bg-white border border-[#E8E2D2] shadow-2xs flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#963E1B]/10 text-[#963E1B] shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Galeri & Rumah Produksi</h4>
                <p className="text-[11px] text-gray-600">Pusat Olahan & Kerajinan UMKM</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
