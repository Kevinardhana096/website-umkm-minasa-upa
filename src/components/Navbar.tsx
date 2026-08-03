'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Menu, X, User, ShoppingBag } from 'lucide-react';
import { InstitutionalLogos } from './InstitutionalLogos';
import { createClient } from '@/lib/supabase/client';

interface NavbarProps {
  onContactClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onContactClick,
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);
  const [dashboardLabel, setDashboardLabel] = useState('Login Pengelola');

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const loadDashboardDestination = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (!cancelled) {
          setDashboardHref(null);
          setDashboardLabel('Login Pengelola');
        }
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .maybeSingle<{ role: 'toko' | 'admin' }>();
      if (cancelled) return;

      if (profile?.role === 'admin') {
        setDashboardHref('/admin');
        setDashboardLabel('Dashboard Admin');
      } else if (profile?.role === 'toko') {
        setDashboardHref('/dashboard');
        setDashboardLabel('Dashboard Toko');
      } else {
        setDashboardHref(null);
        setDashboardLabel('Login Pengelola');
      }
    };

    void loadDashboardDestination();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setDashboardHref(null);
        setDashboardLabel('Login Pengelola');
        return;
      }
      void loadDashboardDestination();
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const previousScrollY = lastScrollYRef.current;
      const delta = currentScrollY - previousScrollY;

      // Selama berada di area teratas (<= 90px), jaga navbar tetap terlihat alami
      if (currentScrollY <= 90) {
        setIsVisible(true);
      } else if (delta > 6) {
        // Scroll ke bawah melampaui 90px: sembunyikan navbar
        setIsVisible(false);
      } else if (delta < -6) {
        // Scroll ke atas: tampilkan navbar
        setIsVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isProfilActive = pathname === '/profil';
  const isKatalogActive = pathname === '/' || pathname === '/katalog';

  return (
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs transition-transform duration-300 ${isVisible || mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
      {/* Top Institutional Banner */}
      <div className="bg-gray-50/90 border-b border-gray-100/80 py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold tracking-wide text-gray-600 uppercase hidden sm:inline-block">
            Kemitraan & Program Pengabdian UMKM
          </span>
          <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
            <span className="text-[11px] font-semibold text-gray-400 hidden md:inline">Lembaga Pendukung:</span>
            <InstitutionalLogos imageClassName="h-5 sm:h-6 w-auto object-contain" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 sm:h-15">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <Image
                src="/logo_umkm.png"
                alt="Logo UMKM"
                width={36}
                height={36}
                className="h-7 sm:h-8 w-auto object-contain shrink-0 transition-transform group-hover:scale-105"
              />
              <span className="font-bold text-xs sm:text-sm md:text-base tracking-tight text-gray-900 leading-none">
                UMKM <span className="text-[#0F2C23]">Wanita Tangguh Minasa Upa</span>
              </span>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                isKatalogActive
                  ? 'bg-[#0F2C23]/10 text-[#0F2C23]'
                  : 'text-gray-700 hover:text-[#0F2C23] hover:bg-gray-100/80'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#0F2C23]" />
              <span>Katalog Produk</span>
            </Link>

            <Link
              href="/profil"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                isProfilActive
                  ? 'bg-[#963E1B]/10 text-[#963E1B]'
                  : 'text-gray-700 hover:text-[#963E1B] hover:bg-gray-100/80'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#963E1B]" />
              <span>Profil UMKM</span>
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            <a
              href={dashboardHref ?? '/login'}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#0F2C23] hover:bg-gray-100 transition-all"
            >
              {dashboardLabel}
            </a>
            <button
              onClick={onContactClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F2C23] text-white text-xs sm:text-sm font-semibold hover:bg-[#184537] active:scale-95 transition-all shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
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

      {/* Mobile Navigation Menu (Floating Absolute Solid Overlay) */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-xl px-4 pt-3 pb-5 space-y-3">
          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 py-2.5 px-3.5 rounded-lg text-sm font-semibold border ${
                isKatalogActive
                  ? 'bg-[#0F2C23]/10 text-[#0F2C23] border-[#0F2C23]/20'
                  : 'text-gray-700 hover:bg-gray-50 border-gray-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#0F2C23]" />
              <span>Katalog Produk</span>
            </Link>

            <Link
              href="/profil"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 py-2.5 px-3.5 rounded-lg text-sm font-semibold border ${
                isProfilActive
                  ? 'bg-[#963E1B]/10 text-[#963E1B] border-[#963E1B]/20'
                  : 'text-gray-700 hover:bg-gray-50 border-gray-100'
              }`}
            >
              <User className="w-4 h-4 text-[#963E1B]" />
              <span>Profil UMKM</span>
            </Link>

            <a
              href={dashboardHref ?? '/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 mt-1"
            >
              {dashboardLabel}
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
