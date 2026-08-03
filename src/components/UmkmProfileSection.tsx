'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Users, 
  HeartHandshake, 
  UtensilsCrossed, 
  Sparkles, 
  MapPin, 
  Award, 
  Smile, 
  ShoppingBag,
  Quote,
  CheckCircle2
} from 'lucide-react';

export const UmkmProfileSection: React.FC = () => {
  return (
    <section id="profil-umkm" className="my-4 sm:my-6 relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#FAF7F0] via-[#FDFBF7] to-[#F4EFE6] border border-[#E5DEC9] text-gray-900 shadow-xs">
      {/* Soft Background Accent Glows */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 bg-[#963E1B]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-72 h-72 bg-[#0F2C23]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-8 lg:p-10">
        {/* Top Header Tag Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#E5DEC9]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F2C23] text-white text-xs font-bold uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Profil Kelompok UMKM
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E0D8C3] text-gray-700 text-xs font-semibold shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-[#0F2C23]" />
              Minasa Upa, Makassar
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
            <Award className="w-4 h-4 text-[#963E1B] shrink-0" />
            <span>Wadah Kolaborasi & Pemberdayaan Perempuan</span>
          </div>
        </div>

        {/* Main Grid Layout: 12 Columns */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Left Column: Narrative Profile (7 cols) */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                Kelompok UMKM <br className="hidden sm:inline" />
                <span className="text-[#963E1B]">Wanita Tangguh Minasa Upa</span>
              </h1>
            </div>

            {/* Profile Content Narrative Box */}
            <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-[#E8E2D2] shadow-xs">
              <Quote className="absolute top-3 right-4 w-7 h-7 text-[#0F2C23]/10 pointer-events-none" />
              
              <div className="space-y-3 text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed font-normal">
                <p>
                  <strong className="text-gray-900 font-bold">Kelompok UMKM Wanita Tangguh Minasa Upa</strong> terbentuk dari semangat para ibu rumah tangga dan perempuan kreatif di wilayah Minasa Upa yang ingin meningkatkan kemandirian ekonomi keluarga.
                </p>
                <p>
                  Melalui keterampilan di bidang <span className="text-[#963E1B] font-semibold">makanan</span>, <span className="text-[#963E1B] font-semibold">Minuman</span> , Dan <span className="text-[#963E1B] font-semibold">Kerajinan</span> kelompok ini hadir sebagai wadah kolaborasi untuk mengembangkan usaha kecil secara bersama-sama.
                </p>
                <p>
                  Selain untuk memperkuat ekonomi, terbentuknya kelompok ini juga bertujuan membangun solidaritas, saling mendukung, dan memberdayakan perempuan agar lebih berdaya saing.
                </p>
              </div>
            </div>

            {/* Feature Tag Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-lg bg-white border border-[#E0D8C3] text-[#0F2C23] text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#963E1B]" />
                Makanan & Minuman
              </span>
              <span className="px-3 py-1 rounded-lg bg-white border border-[#E0D8C3] text-[#0F2C23] text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                <ShoppingBag className="w-3.5 h-3.5 text-[#963E1B]" />
                Kerajinan Tangan
              </span>
              <span className="px-3 py-1 rounded-lg bg-white border border-[#E0D8C3] text-[#0F2C23] text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                <Users className="w-3.5 h-3.5 text-[#963E1B]" />
                Pemberdayaan Wanita
              </span>
            </div>
          </div>

          {/* Right Column: Featured Image Showcase & 3 Pillars (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Image Showcase Card */}
            <div className="relative group rounded-2xl overflow-hidden border border-[#E0D8C3] shadow-md bg-white">
              <div className="relative h-48 sm:h-56 lg:h-60 w-full">
                <Image
                  src="/umkm_wanita_tangguh.jpg"
                  alt="Kelompok UMKM Wanita Tangguh Minasa Upa"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                />
                {/* Gradient overlay on image */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              </div>

              {/* Floating Caption on Image */}
              <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-gray-200 text-gray-900 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0F2C23] shrink-0" />
                  <span className="text-xs font-bold">Produk Autentik Minasa Upa</span>
                </div>
                <span className="text-[10px] uppercase tracking-wide font-bold bg-[#963E1B] px-2 py-0.5 rounded text-white">
                  Kolaborasi
                </span>
              </div>
            </div>

            {/* 3 Quick Pillars List */}
            <div className="grid grid-cols-1 gap-2.5">
              
              <div className="p-3 rounded-xl bg-white border border-[#E8E2D2] shadow-2xs flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#963E1B]/10 text-[#963E1B] shrink-0">
                  <Smile className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Kemandirian Ekonomi</h3>
                  <p className="text-[11px] text-gray-600">Ibu rumah tangga & perempuan kreatif Minasa Upa</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E8E2D2] shadow-2xs flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0F2C23]/10 text-[#0F2C23] shrink-0">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Makanan, Minuman & Kerajinan</h3>
                  <p className="text-[11px] text-gray-600">Wadah pengembangan usaha kecil bersama</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E8E2D2] shadow-2xs flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#963E1B]/10 text-[#963E1B] shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Solidaritas & Daya Saing</h3>
                  <p className="text-[11px] text-gray-600">Saling mendukung & memperkuat daya saing</p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
