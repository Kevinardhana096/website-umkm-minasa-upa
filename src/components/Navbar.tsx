'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MessageSquare, Menu, X } from 'lucide-react';
import { InstitutionalLogos } from './InstitutionalLogos';

interface NavbarProps {
  onContactClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onContactClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scroll ke bawah: hilang/sembunyi
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scroll ke atas: muncul/tampil
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs transition-transform duration-300 ${isVisible || mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
      {/* Top Institutional Banner */}
      <div className="bg-gray-50/90 border-b border-gray-100/80 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold tracking-wide text-gray-600 uppercase hidden sm:inline-block">
            Kemitraan & Program Pengabdian UMKM
          </span>
          <div className="flex items-center gap-3 ml-auto sm:ml-0">
            <span className="text-xs font-semibold text-gray-400 hidden md:inline">Lembaga Pendukung:</span>
            <InstitutionalLogos imageClassName="h-6 sm:h-8 w-auto object-contain" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-2.5 sm:gap-3 group">
              <Image
                src="/logo_umkm.png"
                alt="Logo UMKM"
                width={48}
                height={48}
                className="h-8 sm:h-9 md:h-10 w-auto object-contain shrink-0 transition-transform group-hover:scale-105"
              />
              <span className="font-bold text-sm sm:text-base md:text-lg tracking-tight text-gray-900 leading-none">
                UMKM <span className="text-[#0F2C23]">Wanita Tangguh Minasa Upa</span>
              </span>
            </a>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <a 
              href="/login" 
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:text-[#0F2C23] hover:bg-gray-100 transition-all"
            >
              Login Pengelola
            </a>
            <button
              onClick={onContactClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F2C23] text-white text-sm font-semibold hover:bg-[#184537] active:scale-95 transition-all shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Hubungi Penjual</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-2 pb-4 space-y-3">
          <div className="flex flex-col gap-2 pt-1">
            <a
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Login Pengelola
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onContactClick) onContactClick();
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[#0F2C23] text-white text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Hubungi Penjual</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
