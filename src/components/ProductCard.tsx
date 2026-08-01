'use client';

import React from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';
import { formatRupiah } from '@/lib/products';
import { ShieldCheck, MapPin, Eye, Clock, CheckCircle2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onDetailClick: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onDetailClick }) => {
  const formattedPrice = formatRupiah(product.price);

  return (
    <div 
      onClick={() => onDetailClick(product)}
      className="group bg-white rounded-2xl border border-gray-200/70 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Image Container with Badge */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
            Foto produk belum tersedia
          </div>
        )}

        {/* Category Overlay Tag */}
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium text-white shadow-sm border border-white/20">
          {product.category ?? 'Produk'}
        </div>

        {/* Verified SME Badge */}
        {product.isVerified && (
          <div className="absolute top-3 left-3 bg-amber-50/95 backdrop-blur-md border border-amber-200/90 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] font-bold text-amber-900 tracking-tight">Verified SME</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-white">
        <div>
          {/* Title */}
          <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-[#0F2C23] transition-colors line-clamp-1 leading-snug">
            {product.name}
          </h3>

          {/* Merchant & Location */}
          <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
            <span className="font-medium text-gray-700">{product.merchantName}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-gray-500">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              {product.location}
            </span>
          </div>

          {/* Short Description */}
          <p className="mt-3 text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Card Footer: Price, Stock & Detail CTA */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-end justify-between gap-3">
          <div>
            <div className="text-base sm:text-lg font-extrabold text-[#963E1B]">
              {formattedPrice}
            </div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5">
              {product.isAvailable === false || product.stock === 0 ? (
                <span className="inline-flex items-center gap-1 text-gray-500 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-gray-400" /> Tidak tersedia
                </span>
              ) : product.isPreOrder ? (
                <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                  <Clock className="w-3 h-3 text-amber-600" /> Pre-order ({product.preOrderDays}d)
                </span>
              ) : product.stock === undefined ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tersedia
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Stok: {product.stock}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDetailClick(product);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl group-hover:bg-[#0F2C23] group-hover:text-white group-hover:border-[#0F2C23] transition-all duration-200 flex items-center gap-1.5 shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Lihat Detail</span>
          </button>
        </div>
      </div>
    </div>
  );
};
