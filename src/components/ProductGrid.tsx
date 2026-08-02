'use client';

import React, { useState } from 'react';
import { Product } from '@/types/product';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight, PackageX } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  onDetailClick: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onDetailClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const element = document.getElementById('catalog');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (products.length === 0) {
    return (
      <div className="my-12 py-16 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
        <PackageX className="w-12 h-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-base font-semibold text-gray-800">Tidak ada produk ditemukan</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
          Coba ubah kata kunci pencarian atau pilih kategori produk yang lain.
        </p>
      </div>
    );
  }

  return (
    <div id="catalog" className="my-8">
      {/* Responsive Grid: 2-Column Mobile, 3-Column Tablet, 4-Column Laptop/Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
        {currentProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onDetailClick={onDetailClick}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="mt-10 flex items-center justify-center gap-2">
        {/* Prev Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-9 h-9 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                isActive
                  ? 'bg-[#0F2C23] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
