'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';
import { formatRupiah } from '@/lib/products';
import { 
  X, 
  CheckCircle2, 
  MessageSquare, 
  Bot, 
  Shapes, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Maximize2,
  Layers,
  Ruler,
  Check,
  MapPin,
  Heart
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAskBot?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAskBot,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomed) setIsZoomed(false);
        else onClose();
      }
    };
    if (product) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [product, onClose, isZoomed]);

  if (!product) return null;

  const formattedPrice = formatRupiah(product.price);

  const waMessage = encodeURIComponent(
    `Halo ${product.merchantName}, saya tertarik untuk memesan produk "${product.name}" (${product.price === null ? 'harga belum tercantum' : `Rp ${product.price.toLocaleString('id-ID')}`}) yang ada di UMKM Wanita Tangguh Minasa Upa. Bisakah berikan informasi ketersediaan produk ini?`
  );
  const waUrl = `https://wa.me/${product.whatsappNumber}?text=${waMessage}`;

  const galleryImages = [
    product.imageUrl ?? '/logo_umkm.png',
    product.imageUrl ?? '/logo_umkm.png',
    product.imageUrl ?? '/logo_umkm.png',
  ];

  return (
    <>
      {/* Fullscreen Lightbox Zoom */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <Image
              src={galleryImages[activeImageIndex]}
              alt={product.name}
              width={1200}
              height={1200}
              unoptimized
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
            />
            <button 
              onClick={() => setIsZoomed(false)} 
              className="absolute -top-12 right-0 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
              title="Tutup Zoom"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Main Modal Overlay */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      >
        {/* Modal Container */}
        <div 
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[28px] shadow-2xl border border-gray-100 overflow-y-auto flex flex-col md:flex-row items-start scrollbar-thin scrollbar-thumb-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Floating Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-900 shadow-md border border-gray-100 transition-all duration-200 cursor-pointer hover:rotate-90"
            aria-label="Tutup Detail Modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ── LEFT COLUMN: Image Gallery Showcase ── */}
          <div className="w-full md:w-[48%] md:sticky md:top-0 self-start shrink-0 p-5 sm:p-6 bg-gradient-to-b from-amber-50/40 via-white to-gray-50/50 rounded-t-[28px] md:rounded-tr-none md:rounded-l-[28px] border-b md:border-b-0 md:border-r border-gray-100">
            {/* Main Stage Image */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 group">
              <Image
                src={galleryImages[activeImageIndex]}
                alt={product.name}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 48vw"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out cursor-zoom-in"
                onClick={() => setIsZoomed(true)}
              />

              {/* Category Pill Tag */}
              <div className="absolute top-3.5 left-3.5 z-10 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-gray-100 flex items-center gap-1.5">
                <Shapes className="w-3.5 h-3.5 text-[#963E1B]" />
                <span className="text-xs font-bold text-gray-800 tracking-wide">{product.category ?? 'Produk'}</span>
              </div>

              {/* Action Buttons Top Right of Image */}
              <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-2 rounded-full backdrop-blur-md shadow-sm border transition-all cursor-pointer ${
                    isLiked 
                      ? 'bg-rose-50 border-rose-200 text-rose-500' 
                      : 'bg-white/90 border-gray-100 text-gray-600 hover:text-rose-500'
                  }`}
                  title="Simpan Favorit"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                </button>
                <button
                  onClick={() => setIsZoomed(true)}
                  className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 backdrop-blur-md shadow-sm border border-gray-100 transition-all cursor-pointer"
                  title="Perbesar Gambar"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Subtle Overlay */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

              {/* Click to Zoom Hint */}
              <div className="absolute bottom-3 right-3 text-[10px] text-white/90 font-medium bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-none">
                Klik untuk Zoom
              </div>
            </div>

            {/* Thumbnail Selector Strip */}
            <div className="mt-4 flex items-center justify-center gap-2.5">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#963E1B] ring-2 ring-[#963E1B]/20 scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'
                  }`}
                >
                  <Image src={img} alt={`Sudut ${idx + 1}`} fill unoptimized sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Product & Merchant Details ── */}
          <div className="w-full md:w-[52%] p-6 sm:p-8 flex flex-col justify-between bg-white">
            <div className="space-y-5">
              
              {/* Merchant Profile Banner */}
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100/80">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-amber-100 flex items-center justify-center shrink-0 shadow-sm">
                    {product.merchantAvatar ? (
                      <Image src={product.merchantAvatar} alt={product.merchantName} fill unoptimized sizes="40px" className="object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-amber-900">{product.merchantName.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-gray-900 leading-tight">{product.merchantName}</p>
                      {product.isVerified && (
                        <span title="Terverifikasi UMKM">
                          <ShieldCheck className="w-4 h-4 text-[#963E1B] shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{product.location}</span>
                    </div>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-full bg-white border border-amber-200/60 text-[11px] font-semibold text-amber-800 shadow-2xs">
                  Pengrajin Lokal
                </div>
              </div>

              {/* Product Title */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug tracking-tight">
                  {product.name}
                </h2>
              </div>

              {/* Price & Availability Badges */}
              <div className="flex items-center justify-between flex-wrap gap-3 py-1">
                <div>
                  <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">Harga Resmi</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#963E1B]">
                    {formattedPrice}
                  </span>
                </div>

                <div>
                  {product.isPreOrder ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      Pre-order ({product.preOrderDays} Hari)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {product.isAvailable === false || product.stock === 0
                        ? 'Tidak tersedia'
                        : product.stock === undefined
                          ? 'Tersedia'
                          : `Stok Ready (${product.stock} unit)`}
                    </span>
                  )}
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Product Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#963E1B]" />
                  Tentang Produk Ini
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {product.fullDescription || product.description}
                </p>
              </div>

              {/* Specifications */}
              {product.specifications && product.specifications.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-amber-900" />
                    Spesifikasi & Keunggulan
                  </h3>
                  <div className="grid grid-cols-1 gap-2 bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100">
                    {product.specifications.map((spec, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                        <div className="w-4 h-4 rounded-full bg-[#963E1B]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3] text-[#963E1B]" />
                        </div>
                        <span className="font-medium leading-relaxed">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guarantee Box */}
              {product.guaranteeText && (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
                  <div className="p-1.5 bg-amber-100/80 rounded-xl shrink-0 text-[#963E1B]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-900 text-xs mb-0.5">Jaminan Kualitas UMKM</p>
                    <p className="leading-relaxed text-amber-800 text-[11px] font-medium">{product.guaranteeText}</p>
                  </div>
                </div>
              )}

            </div>

            {/* CTAs Footer */}
            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center gap-3">
              <button
                onClick={() => { if (onAskBot) onAskBot(product); onClose(); }}
                className="flex-1 py-3.5 px-4 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 font-semibold text-gray-800 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-sm cursor-pointer"
              >
                <Bot className="w-4 h-4 text-[#963E1B]" />
                <span>Tanya AI Assistant</span>
              </button>
              
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-[1.2] py-3.5 px-4 rounded-2xl bg-[#06281E] hover:bg-[#0b3d2f] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Pesan via WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
