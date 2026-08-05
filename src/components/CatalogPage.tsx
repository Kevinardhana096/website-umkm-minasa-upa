'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { ProductGrid } from './ProductGrid';
import { ProductDetailModal } from './ProductDetailModal';
import { Footer } from './Footer';
import { FloatingChatWidget, FloatingChatWidgetRef } from './FloatingChatWidget';
import { mockProducts } from '@/data/mockProducts';
import type { CatalogStore, CatalogStoreOption, ProductRow } from '@/lib/products';
import { deleteProduct, revalidatePublicCatalog, type NewProductInput } from '@/lib/store-service';
import { DEFAULT_MEMBER_STORE_NAME, getMemberCatalogData, mapMemberProduct, saveMemberProduct } from '@/lib/member-service';
import { Product } from '@/types/product';

const ProductFormModal = dynamic(() =>
  import('./dashboard/ProductFormModal').then((module) => module.ProductFormModal),
);

interface CatalogPageProps {
  initialProducts?: Product[];
  store?: CatalogStore | null;
  storeOptions?: CatalogStoreOption[];
  viewerRole?: 'toko' | 'admin' | 'anggota';
  viewerUserId?: string;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  initialProducts = mockProducts,
  store = null,
  storeOptions = [],
  viewerRole,
  viewerUserId,
}) => {
  const [products, setProducts] = useState(initialProducts);
  const [memberStores, setMemberStores] = useState(storeOptions);
  const [memberProductRows, setMemberProductRows] = useState<ProductRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [editingMemberProduct, setEditingMemberProduct] = useState<ProductRow | null>(null);
  const [isMemberSaving, setIsMemberSaving] = useState(false);
  const [memberMessage, setMemberMessage] = useState('');
  const [memberError, setMemberError] = useState('');

  const chatWidgetRef = useRef<FloatingChatWidgetRef>(null);

  useEffect(() => {
    if (viewerRole !== 'anggota') return;
    let cancelled = false;

    void getMemberCatalogData()
      .then((data) => {
        if (cancelled) return;
        const storesById = new Map(data.stores.map((storeRow) => [storeRow.id, storeRow]));
        const mappedProducts = data.products
          .map((product) => {
            const storeRow = storesById.get(product.store_id);
            return storeRow ? mapMemberProduct(product, storeRow) : null;
          })
          .filter((product): product is Product => product !== null);

        setMemberProductRows(data.products.map((product) => {
          const storeRow = storesById.get(product.store_id);
          return storeRow ? { ...product, store_name: storeRow.name } : product;
        }));
        setMemberStores(data.stores.map((storeRow) => ({
          id: storeRow.id,
          name: storeRow.name,
          sellerName: storeRow.seller_name,
          whatsappNumber: storeRow.whatsapp_number,
        })));
        setProducts((current) => {
          const byId = new Map(current.map((product) => [product.id, product]));
          mappedProducts.forEach((product) => byId.set(product.id, product));
          return Array.from(byId.values());
        });
      })
      .catch(() => {
        if (!cancelled) {
          setMemberError('Data anggota belum dapat dimuat. Pastikan migration supabase/member-products.sql sudah dijalankan.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [viewerRole]);

  // Filter products dynamically by search query.
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [products, searchQuery]);

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

  const openMemberAddForm = () => {
    setEditingMemberProduct(null);
    setMemberMessage('');
    setMemberError('');
    setIsMemberFormOpen(true);
  };

  const handleMemberSave = async (input: NewProductInput) => {
    setIsMemberSaving(true);
    setMemberError('');
    setMemberMessage('');
    try {
      const result = await saveMemberProduct(input);
      const mappedProduct = mapMemberProduct(result.product, result.store);
      setMemberProductRows((current) => {
        const exists = current.some((product) => product.id === result.product.id);
        const nextProduct = { ...result.product, store_name: result.store.name };
        return exists ? current.map((product) => product.id === nextProduct.id ? nextProduct : product) : [nextProduct, ...current];
      });
      setMemberStores((current) => current.some((storeOption) => storeOption.id === result.store.id)
        ? current
        : [...current, { id: result.store.id, name: result.store.name, sellerName: result.store.seller_name, whatsappNumber: result.store.whatsapp_number }]);
      setProducts((current) => {
        const exists = current.some((product) => product.id === mappedProduct.id);
        return exists ? current.map((product) => product.id === mappedProduct.id ? mappedProduct : product) : [mappedProduct, ...current];
      });
      await revalidatePublicCatalog();
      setMemberMessage(input.id ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan ke katalog.');
      setIsMemberFormOpen(false);
      setEditingMemberProduct(null);
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : 'Produk gagal disimpan.');
      throw error;
    } finally {
      setIsMemberSaving(false);
    }
  };

  const handleMemberEdit = (product: Product) => {
    const productRow = memberProductRows.find((item) => item.id === product.id);
    if (!productRow) {
      setMemberError('Data produk anggota belum siap dimuat. Silakan coba lagi.');
      return;
    }
    setMemberMessage('');
    setMemberError('');
    setEditingMemberProduct(productRow);
    setIsMemberFormOpen(true);
  };

  const handleMemberDelete = async (product: Product) => {
    if (!window.confirm(`Hapus produk "${product.name}"? Data tidak dapat dipulihkan.`)) return;
    setMemberError('');
    setMemberMessage('');
    try {
      await deleteProduct(product.id);
      await revalidatePublicCatalog();
      setMemberProductRows((current) => current.filter((item) => item.id !== product.id));
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setMemberMessage('Produk berhasil dihapus.');
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : 'Produk gagal dihapus.');
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
        {/* Hero Section Banner / Search Bar */}
        <HeroSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {viewerRole === 'anggota' && (
          <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-[#D9E8E1] bg-[#E8F3EF] p-4 sm:flex-row sm:items-center sm:p-5">
            <div>
              <p className="text-sm font-extrabold text-[#0F2C23]">Kelola produk Anda</p>
              <p className="mt-1 text-xs text-gray-600">Tambahkan produk langsung dari katalog tanpa membuka dashboard.</p>
            </div>
            <button type="button" onClick={openMemberAddForm} className="inline-flex items-center justify-center rounded-xl bg-[#0F2C23] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#184537]">
              + Tambah Produk
            </button>
          </div>
        )}

        {memberError && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{memberError}</p>}
        {memberMessage && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{memberMessage}</p>}

        {/* Product Catalog Section Anchor */}
        <div id="katalog-produk" className="scroll-mt-24 pt-4">
          {/* Product Cards Grid with Pagination */}
          <ProductGrid
            key={searchQuery}
            products={filteredProducts}
            onDetailClick={(product) => setSelectedProduct(product)}
            canManageProduct={(product) => viewerRole === 'anggota' && product.createdBy === viewerUserId}
            onEditProduct={handleMemberEdit}
            onDeleteProduct={(product) => void handleMemberDelete(product)}
          />
        </div>
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

      {viewerRole === 'anggota' && (
        <ProductFormModal
          key={`${editingMemberProduct?.id ?? 'new'}-${isMemberFormOpen ? 'open' : 'closed'}`}
          product={editingMemberProduct}
          isOpen={isMemberFormOpen}
          isSaving={isMemberSaving}
          showStoreName
          storeNameLocked
          defaultStoreName={editingMemberProduct?.store_name ?? DEFAULT_MEMBER_STORE_NAME}
          storeOptions={[]}
          onClose={() => { setIsMemberFormOpen(false); setEditingMemberProduct(null); }}
          onSave={handleMemberSave}
        />
      )}

      {/* Floating Chat Widget */}
      <FloatingChatWidget ref={chatWidgetRef} />
    </div>
  );
};
