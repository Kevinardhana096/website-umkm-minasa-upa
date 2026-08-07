'use client';

import React from 'react';
import { Phone, Mail, Clock } from 'lucide-react';
import type { CatalogStore } from '@/lib/products';
import { InstitutionalLogos } from './InstitutionalLogos';

interface FooterProps {
  store?: CatalogStore | null;
}

export const Footer: React.FC<FooterProps> = ({ store }) => {
  const groupName = 'UMKM Wanita Tangguh Minasa Upa';
  const groupDescription = 'Kelompok UMKM Wanita Tangguh Minasa Upa hadir sebagai wadah kolaborasi untuk meningkatkan kemandirian ekonomi keluarga di bidang makanan, minuman, dan kerajinan.';

  return (
    <footer className="bg-[#E7E7E7] text-gray-700 mt-8 sm:mt-12 border-t border-gray-300/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
          
          {/* Column 1: Store Bio */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              {groupName}
            </h3>
            <p className="mt-4 text-xs sm:text-sm text-gray-600 leading-relaxed max-w-sm">
              {groupDescription}
            </p>
          </div>

          {/* Column 2: Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              Kontak Kami
            </h3>
            <ul className="mt-4 space-y-3 text-xs sm:text-sm text-gray-600">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gray-700 shrink-0" />
                <span>{store?.whatsappNumber ? `+${store.whatsappNumber} (WhatsApp)` : 'Kontak tersedia pada detail produk'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gray-700 shrink-0" />
                <a href="mailto:umkmtangguhminasaupa@gmail.com" className="hover:text-gray-900 hover:underline">
                  umkmtangguhminasaupa@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-gray-700 shrink-0" />
                <span>Senin - Sabtu, 09:00 - 17:00 WITA</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Information & Disclaimer */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              Informasi
            </h3>
            <p className="mt-4 text-xs sm:text-sm text-gray-600 leading-relaxed italic">
              Harga dapat berubah sewaktu-waktu. Harap hubungi penjual untuk ketersediaan stok terbaru dan penawaran grosir.
            </p>
          </div>

        </div>

        {/* Institutional Partner Logos */}
        <div className="mt-10 pt-8 border-t border-gray-300/60 flex flex-col items-center text-center sm:items-start sm:text-left md:flex-row md:justify-between gap-6">
          <div>
            <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Lembaga & Mitra Pendukung</p>
            <p className="text-xs text-gray-500 mt-0.5">Program Digitalisasi & Pengabdian Masyarakat UMKM</p>
          </div>
          <div className="w-full md:w-auto flex justify-center md:justify-end overflow-hidden">
            <InstitutionalLogos imageClassName="h-8 sm:h-12 md:h-14 w-auto max-w-full object-contain" />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-300/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 Kelompok UMKM Wanita Tangguh Minasa Upa. Hak Cipta Dilindungi.</p>

          <div className="flex items-center space-x-6">
            <a href="#privacy" className="hover:text-gray-900 transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-gray-900 transition-colors">
              Terms of Service
            </a>
            <a href="#help" className="hover:text-gray-900 transition-colors">
              Help Center
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
