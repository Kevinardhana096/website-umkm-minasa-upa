'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { CategoryFilter } from './CategoryFilter';
import { ProductGrid } from './ProductGrid';
import { ProductDetailModal } from './ProductDetailModal';
import { Footer } from './Footer';
import { FloatingChatWidget, FloatingChatWidgetRef } from './FloatingChatWidget';
import { mockProducts } from '@/data/mockProducts';
import type { CatalogStore } from '@/lib/products';
import { Product, CategoryOption } from '@/types/product';

const categories: CategoryOption[] = [
  'Semua',
  'Batik & Pakaian',
  'Kerajinan Kayu',
  'Tas & Anyaman',
  'Kriya',
];

interface CatalogPageProps {
  initialProducts?: Product[];
  store?: CatalogStore | null;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  initialProducts = mockProducts,
  store = null,
}) => {
  const products = initialProducts;
  const hasCategories = products.some((product) => product.category);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption>('Semua');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const chatWidgetRef = useRef<FloatingChatWidgetRef>(null);

  // Calculate counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Semua: products.length,
    };
    categories.slice(1).forEach((cat) => {
      counts[cat] = products.filter((p) => p.category === cat).length;
    });
    return counts;
  }, [products]);

  // Filter products dynamically by search query and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'Semua' || product.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleContactSellerClick = () => {
    if (!store?.whatsappNumber) {
      chatWidgetRef.current?.openChat();
      return;
    }

    const waUrl = `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(
      `Halo ${store?.name ?? 'Penjual'}, saya mengunjungi katalog UMKM Wanita Tangguh Minasa Upa dan ingin bertanya mengenai produk Anda.`,
    )}`;
    window.open(waUrl, '_blank');
  };

  const handleAskBot = (product: Product) => {
    if (chatWidgetRef.current) {
      chatWidgetRef.current.askAboutProduct(product);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] text-gray-900 font-sans selection:bg-[#F4EBD9]">
      {/* Sticky Navbar */}
      <Navbar
        onContactClick={handleContactSellerClick}
      />

      {/* Main Catalog Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-12">
        {/* Hero Section Banner */}
        <HeroSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Category Pills Filter */}
        {hasCategories && (
          <div className="mt-8 mb-4">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryCounts={categoryCounts}
            />
          </div>
        )}

        {/* Product Cards Grid with Pagination */}
        <ProductGrid
          key={`${searchQuery}:${selectedCategory}`}
          products={filteredProducts}
          onDetailClick={(product) => setSelectedProduct(product)}
        />
      </main>

      {/* Footer */}
      <Footer store={store} />

      {/* Product Detail Modal */}
      <ProductDetailModal
        key={selectedProduct?.id ?? "closed"}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAskBot={handleAskBot}
      />

      {/* Floating Chat Widget */}
      <FloatingChatWidget ref={chatWidgetRef} store={store} />
    </div>
  );
};
