'use client';

import React from 'react';
import { Search, ShieldCheck, MessageCircle } from 'lucide-react';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) onSearchSubmit(e);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FAF7F0] via-[#F4EFE6] to-[#EFE8DA] border border-[#E5DEC9] shadow-xs my-6">
      {/* Background Decorative Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-right-center opacity-25 mix-blend-multiply pointer-events-none md:opacity-35 transition-opacity"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1584589167171-541ce45f1eea?auto=format&fit=crop&w=1200&q=80')`,
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)'
        }}
      />

      <div className="relative z-10 p-6 sm:p-10 md:p-14 lg:p-16 max-w-3xl">

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          Temukan Produk <br className="hidden sm:inline" />
          <span className="text-[#963E1B]">UMKM Lokal</span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed max-w-xl">
          Jelajahi koleksi kerajinan tangan autentik dan produk premium dari pengrajin lokal. 
          Hubungi penjual secara langsung untuk pesanan khusus atau pembelian grosir.
        </p>

        {/* Search Bar Input Container */}
        <form 
          onSubmit={handleSubmit}
          className="mt-8 flex items-center bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-lg border border-gray-200/90 max-w-md focus-within:ring-2 focus-within:ring-[#0F2C23]/40 transition-all"
        >
          <div className="pl-3.5 pr-2 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari batik, kerajinan kayu, tas rotan..."
            className="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none py-2 font-medium"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#0F2C23] hover:bg-[#184537] active:scale-95 text-white text-sm font-semibold transition-all shadow-md shrink-0 cursor-pointer"
          >
            Cari
          </button>
        </form>

        {/* Feature Trust Badges */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600 pt-2 border-t border-[#E0D8C3]/60">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#963E1B]" />
            <span>100% Produk Autentik</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-[#0F2C23]" />
            <span>Pesan Direct via WhatsApp</span>
          </div>
        </div>
      </div>
    </section>
  );
};
