'use client';

import React from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';
import { formatRupiah } from '@/lib/products';
import { MarkdownContent } from '@/components/MarkdownContent';
import { MapPin, Eye, Clock, CheckCircle2, Edit, Trash2, ChevronRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onDetailClick: (product: Product) => void;
  canManage?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onDetailClick, canManage = false, onEdit, onDelete }) => {
  const formattedPrice = formatRupiah(product.price);

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Lihat detail ${product.name}`}
      onClick={() => onDetailClick(product)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onDetailClick(product);
        }
      }}
      className="group bg-white rounded-xl sm:rounded-2xl border border-gray-200/70 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F2C23]"
    >
      {/* Image Container with Badge */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 p-2 text-center">
            Foto produk belum tersedia
          </div>
        )}

        {/* Category Overlay Tag */}
        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-black/50 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-medium text-white shadow-sm border border-white/20">
          {product.category ?? 'Produk'}
        </div>

      </div>

      {/* Card Content */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between bg-white">
        <div>
          {/* Title */}
          <h3 className="font-bold text-gray-900 text-xs sm:text-lg group-hover:text-[#0F2C23] transition-colors line-clamp-1 leading-snug">
            {product.name}
          </h3>

          {/* Merchant & Location */}
          <div className="mt-1 sm:mt-1.5 flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
            <span className="font-medium text-gray-700 truncate max-w-[90px] sm:max-w-none">{product.merchantName}</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-0.5 sm:gap-1 text-gray-500">
              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 shrink-0" />
              <span className="truncate max-w-[70px] sm:max-w-none">{product.location}</span>
            </span>
          </div>

          {/* Short Description */}
          {product.description && (
            <div className="mt-2.5 sm:mt-3">
              <MarkdownContent content={product.description} className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed" />
              {product.description.length > 50 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDetailClick(product);
                  }}
                  className="mt-1 text-[11px] sm:text-xs font-semibold text-[#963E1B] hover:text-[#0F2C23] hover:underline inline-flex items-center gap-0.5 transition-colors focus:outline-none"
                >
                  <span>Detail Selengkapnya</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Card Footer: Price, Stock & Detail CTA */}
        <div className="mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t border-gray-100 flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <div className="text-xs sm:text-lg font-extrabold text-[#963E1B] truncate">
              {formattedPrice}
            </div>
            <div className="text-[9px] sm:text-[11px] font-medium text-gray-500 mt-0.5 truncate">
              {product.isAvailable === false || product.stock === 0 ? (
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-gray-500 font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 shrink-0" /> Nonaktif
                </span>
              ) : product.isPreOrder ? (
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-amber-700 font-semibold">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600 shrink-0" /> Pre-order
                </span>
              ) : product.stock === undefined ? (
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 shrink-0" /> Tersedia
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 shrink-0" /> Stok: {product.stock}
                </span>
              )}
            </div>
          </div>

          <span
            aria-hidden="true"
            className="px-2 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl group-hover:bg-[#0F2C23] group-hover:text-white group-hover:border-[#0F2C23] transition-all duration-200 flex items-center gap-1 shrink-0"
          >
            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Detail</span>
          </span>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 px-3 pb-3 sm:px-5 sm:pb-5" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => onEdit?.(product)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-50 sm:text-xs"
              aria-label={`Edit produk ${product.name}`}
            >
              <Edit className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(product)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-2 py-1.5 text-[10px] font-bold text-rose-700 hover:bg-rose-50 sm:text-xs"
              aria-label={`Hapus produk ${product.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus
            </button>
          </div>
        )}
      </div>
    </article>
  );
};
