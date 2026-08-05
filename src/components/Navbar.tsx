'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, MessageSquare, Menu, X, User, ShoppingBag } from 'lucide-react';
import { InstitutionalLogos } from './InstitutionalLogos';
import { createClient } from '@/lib/supabase/client';

interface NavbarProps {
  onContactClick?: () => void;
  transparentAtTop?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onContactClick,
  transparentAtTop = false,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);
  const [dashboardLabel, setDashboardLabel] = useState('Login Pengelola');

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const loadDashboardDestination = async () => {
      // The navbar only needs a navigation hint. Reading the cookie-backed
      // session avoids an extra Auth server roundtrip; protected pages still
      // perform their own authoritative authorization checks.
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        if (!cancelled) {
          setDashboardHref(null);
          setDashboardLabel('Login Pengelola');
        }
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle<{ role: 'toko' | 'admin' | 'anggota' }>();
      if (cancelled) return;

      if (profile?.role === 'admin') {
        setDashboardHref('/admin');
        setDashboardLabel('Dashboard Admin');
      } else if (profile?.role === 'toko') {
        setDashboardHref('/dashboard');
        setDashboardLabel('Dashboard Toko');
      } else if (profile?.role === 'anggota') {
        setDashboardHref('/katalog');
        setDashboardLabel('Katalog Anggota');
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
    const handleScroll = () => {
      setIsAtTop(window.scrollY <= 8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    headerRef.current?.setAttribute('data-scroll-ready', 'true');
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isProfilActive = pathname === '/' || pathname === '/profil';
  const isKatalogActive = pathname === '/katalog';
  const isTransparentAtTop = transparentAtTop && isAtTop && !mobileMenuOpen;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      setDashboardHref(null);
      setDashboardLabel('Login Pengelola');
      setMobileMenuOpen(false);
      router.replace('/login');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header
      ref={headerRef}
      data-scroll-ready="false"
      data-scroll-visible="true"
      data-transparent-at-top={isTransparentAtTop ? 'true' : 'false'}
      className={`${transparentAtTop ? 'fixed inset-x-0 top-0' : 'sticky top-0'} z-40 translate-y-0 transition-transform duration-300`}
    >
      {/* Top Institutional Banner */}
      <div className="border-b border-gray-100 bg-gray-50 py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span className="hidden text-[11px] font-bold uppercase tracking-wide text-gray-600 sm:inline-block">
            Kemitraan & Program Pengabdian UMKM
          </span>
          <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
            <span className="hidden text-[11px] font-semibold text-gray-400 md:inline">Lembaga Pendukung:</span>
            <InstitutionalLogos imageClassName="h-5 sm:h-6 w-auto object-contain" />
          </div>
        </div>
      </div>

      {/* Main Navigation Surface */}
      <div
        className={`border-b transition-all duration-300 ${
          isTransparentAtTop
            ? 'border-white/20 bg-gradient-to-b from-black/35 via-black/15 to-transparent shadow-none backdrop-blur-sm'
            : 'border-gray-100 bg-white/95 shadow-xs backdrop-blur-md'
        }`}
      >
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
                <span
                  className={`text-xs font-bold leading-none tracking-tight sm:text-sm md:text-base ${
                    isTransparentAtTop
                      ? 'text-white drop-shadow-[0_1px_5px_rgba(0,0,0,0.45)]'
                      : 'text-gray-900'
                  }`}
                >
                  UMKM{' '}
                  <span className={isTransparentAtTop ? 'text-amber-100' : 'text-[#0F2C23]'}>
                    Wanita Tangguh Minasa Upa
                  </span>
                </span>
              </Link>
            </div>

            {/* Center Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                href="/"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                  isTransparentAtTop
                    ? isProfilActive
                      ? 'border border-white/35 bg-white/20 text-white shadow-sm backdrop-blur-sm'
                      : 'border border-transparent text-white/90 hover:border-white/25 hover:bg-white/15 hover:text-white'
                    : isProfilActive
                      ? 'bg-[#963E1B]/10 text-[#963E1B]'
                      : 'text-gray-700 hover:bg-gray-100/80 hover:text-[#963E1B]'
                }`}
              >
                <User className={`h-3.5 w-3.5 ${isTransparentAtTop ? 'text-white' : 'text-[#963E1B]'}`} />
                <span>Profil UMKM</span>
              </Link>

              <Link
                href="/katalog"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                  isTransparentAtTop
                    ? isKatalogActive
                      ? 'border border-white/35 bg-white/20 text-white shadow-sm backdrop-blur-sm'
                      : 'border border-transparent text-white/90 hover:border-white/25 hover:bg-white/15 hover:text-white'
                    : isKatalogActive
                      ? 'bg-[#0F2C23]/10 text-[#0F2C23]'
                      : 'text-gray-700 hover:bg-gray-100/80 hover:text-[#0F2C23]'
                }`}
              >
                <ShoppingBag className={`h-3.5 w-3.5 ${isTransparentAtTop ? 'text-white' : 'text-[#0F2C23]'}`} />
                <span>Katalog Produk</span>
              </Link>
            </nav>

            {/* Right Action Buttons */}
            <div className="hidden md:flex items-center space-x-2">
              <Link
                href={dashboardHref ?? '/login'}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                  isTransparentAtTop
                    ? 'border border-white/30 bg-black/10 text-white/90 backdrop-blur-sm hover:bg-white/15 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[#0F2C23]'
                }`}
              >
                {dashboardLabel}
              </Link>
              {dashboardHref && (
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={isSigningOut}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-wait disabled:opacity-60 sm:text-sm ${
                    isTransparentAtTop
                      ? 'border border-white/30 bg-black/10 text-white/90 backdrop-blur-sm hover:bg-white/15 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-[#0F2C23]'
                  }`}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{isSigningOut ? 'Keluar...' : 'Logout'}</span>
                </button>
              )}
              <button
                onClick={onContactClick}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold active:scale-95 transition-all shadow-xs sm:text-sm ${
                  isTransparentAtTop
                    ? 'border border-amber-200/70 bg-amber-300 text-[#0F2C23] shadow-md shadow-black/10 hover:bg-amber-200'
                    : 'bg-[#0F2C23] text-white hover:bg-[#184537]'
                }`}
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
                className={`rounded-md p-2 focus:outline-none ${
                  isTransparentAtTop
                    ? 'rounded-xl border border-white/30 bg-black/10 text-white shadow-sm backdrop-blur-sm hover:bg-white/15 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
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
                isProfilActive
                  ? 'bg-[#963E1B]/10 text-[#963E1B] border-[#963E1B]/20'
                  : 'text-gray-700 hover:bg-gray-50 border-gray-100'
              }`}
            >
              <User className="w-4 h-4 text-[#963E1B]" />
              <span>Profil UMKM</span>
            </Link>

            <Link
              href="/katalog"
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
              href={dashboardHref ?? '/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 mt-1"
            >
              {dashboardLabel}
            </Link>
            {dashboardHref && (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                <span>{isSigningOut ? 'Keluar...' : 'Logout'}</span>
              </button>
            )}
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
