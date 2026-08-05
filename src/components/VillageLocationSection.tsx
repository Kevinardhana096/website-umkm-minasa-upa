'use client';

import React, { useState } from 'react';
import { ExternalLink, MapPin, Copy, Check, Compass } from 'lucide-react';

const villageQuery = 'Desa Minasa Upa, Bontoa, Maros, Sulawesi Selatan';
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(villageQuery)}`;
const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(villageQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(villageQuery)}`;

export const VillageLocationSection: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(villageQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Gagal menyalin alamat:', err);
    }
  };

  return (
    <section id="lokasi-desa" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 sm:mt-20">
      {/* Minimalist Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          Lokasi Desa Minasa Upa
        </h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Pusat kegiatan dan rumah produksi Kelompok UMKM Wanita Tangguh Minasa Upa, Kecamatan Bontoa, Kabupaten Maros.
        </p>
      </div>

      {/* Clean Map Container (No Floating Cards or Badges) */}
      <div className="relative w-full h-[420px] sm:h-[500px] rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-gray-100">
        <iframe
          title="Peta Lokasi Desa Minasa Upa"
          src={mapEmbedUrl}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full border-0"
        />
      </div>

      {/* Minimal Action & Address Bar */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
          <MapPin className="w-4 h-4 text-[#963E1B] shrink-0" />
          <span className="font-medium">{villageQuery}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-start sm:justify-end">
          <button
            onClick={handleCopyAddress}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Salin Alamat"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Salin Alamat</span>
              </>
            )}
          </button>

          <a
            href={routeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-gray-500" />
            <span>Petunjuk Rute</span>
          </a>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-white bg-[#0F2C23] hover:bg-[#184537] transition-colors"
          >
            <span>Buka Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
};
