'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { ShoppingBag, ChevronRight, ChevronLeft, Sparkles, Star, ArrowRight } from 'lucide-react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { ProductGrid } from './ProductGrid';
import { ProductDetailModal } from './ProductDetailModal';
import { Footer } from './Footer';
import { FloatingChatWidget, FloatingChatWidgetRef } from './FloatingChatWidget';
import { MarkdownContent } from './MarkdownContent';
import { mockProducts } from '@/data/mockProducts';
import { formatRupiah, type CatalogStore, type CatalogStoreOption, type ProductRow } from '@/lib/products';
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
  adminProductRows?: ProductRow[];
  viewerRole?: 'toko' | 'admin' | 'anggota';
  viewerUserId?: string;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  initialProducts = mockProducts,
  store = null,
  storeOptions = [],
  adminProductRows: initialAdminProductRows = [],
  viewerRole,
  viewerUserId,
}) => {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [, setMemberStores] = useState(storeOptions);
  const [memberProductRows, setMemberProductRows] = useState<ProductRow[]>([]);
  const [adminProductRows, setAdminProductRows] = useState<ProductRow[]>(initialAdminProductRows);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [editingMemberProduct, setEditingMemberProduct] = useState<ProductRow | null>(null);
  const [isMemberSaving, setIsMemberSaving] = useState(false);
  const [memberMessage, setMemberMessage] = useState('');
  const [memberError, setMemberError] = useState('');
  const [isAdminFormOpen, setIsAdminFormOpen] = useState(false);
  const [editingAdminProduct, setEditingAdminProduct] = useState<ProductRow | null>(null);
  const [isAdminSaving, setIsAdminSaving] = useState(false);

  const chatWidgetRef = useRef<FloatingChatWidgetRef>(null);
  const featuredScrollRef = useRef<HTMLDivElement>(null);

  // Featured products (max 4 products marked with isFeatured)
  const featuredProducts = useMemo(() => {
    return products.filter((product) => product.isFeatured === true).slice(0, 4);
  }, [products]);
  const featuredProductCount = useMemo(() => products.filter((product) => product.isFeatured === true).length, [products]);

  // Auto-scroll carousel for featured products in Catalog Page
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const container = featuredScrollRef.current;
    if (!container || featuredProducts.length <= 1) return;

    let isPaused = false;
    const handlePause = () => { isPaused = true; };
    const handleResume = () => { isPaused = false; };

    container.addEventListener('mouseenter', handlePause);
    container.addEventListener('mouseleave', handleResume);
    container.addEventListener('touchstart', handlePause, { passive: true });
    container.addEventListener('touchend', handleResume, { passive: true });

    const timer = setInterval(() => {
      if (isPaused) return;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 5) return;

      if (container.scrollLeft >= maxScroll - 15) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: 220, behavior: 'smooth' });
      }
    }, 3800);

    return () => {
      clearInterval(timer);
      container.removeEventListener('mouseenter', handlePause);
      container.removeEventListener('mouseleave', handleResume);
      container.removeEventListener('touchstart', handlePause);
      container.removeEventListener('touchend', handleResume);
    };
  }, [featuredProducts.length]);

  const scrollFeaturedLeft = () => {
    if (featuredScrollRef.current) {
      featuredScrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const scrollFeaturedRight = () => {
    if (featuredScrollRef.current) {
      featuredScrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

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

  const openAdminAddForm = () => {
    setEditingAdminProduct(null);
    setMemberMessage('');
    setMemberError('');
    setIsAdminFormOpen(true);
  };

  const handleAdminSave = async (input: NewProductInput) => {
    const store = storeOptions.find((option) => option.name === input.storeName);
    if (!store) throw new Error('Pilih toko tujuan yang tersedia.');

    setIsAdminSaving(true);
    setMemberError('');
    setMemberMessage('');
    try {
      const formData = new FormData();
      formData.append('resource', 'product');
      formData.append('store_id', editingAdminProduct?.store_id ?? store.id);
      if (editingAdminProduct) formData.append('id', editingAdminProduct.id);
      formData.append('name', input.name);
      formData.append('category', input.category);
      formData.append('description', input.description);
      formData.append('whatsapp_number', input.whatsappNumber);
      formData.append('price', input.price === null ? '' : String(input.price));
      formData.append('is_available', String(input.isAvailable));
      formData.append('is_visible', String(input.isVisible));
      formData.append('is_featured', String(input.isFeatured));
      formData.append('images', JSON.stringify((input.images ?? []).map((image) => ({ id: image.id, image_path: image.imagePath, is_primary: image.isPrimary === true }))));
      (input.images ?? []).forEach((image, index) => {
        if (image.imageFile) formData.append(`image_file_${index}`, image.imageFile);
      });

      const response = await fetch('/api/admin/catalog', { method: editingAdminProduct ? 'PATCH' : 'POST', body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Produk gagal disimpan.');
      setMemberMessage(editingAdminProduct ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan ke katalog.');
      setIsAdminFormOpen(false);
      setEditingAdminProduct(null);
      router.refresh();
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : 'Produk gagal disimpan.');
      throw error;
    } finally {
      setIsAdminSaving(false);
    }
  };

  const handleAdminEdit = (product: Product) => {
    const productRow = adminProductRows.find((item) => item.id === product.id);
    if (!productRow) return setMemberError('Data produk admin belum siap dimuat. Silakan coba lagi.');
    setMemberMessage('');
    setMemberError('');
    setEditingAdminProduct(productRow);
    setIsAdminFormOpen(true);
  };

  const handleAdminDelete = async (product: Product) => {
    if (!window.confirm(`Hapus produk "${product.name}"? Data tidak dapat dipulihkan.`)) return;
    setMemberError('');
    setMemberMessage('');
    try {
      const response = await fetch('/api/admin/catalog', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resource: 'product', id: product.id }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Produk gagal dihapus.');
      setAdminProductRows((current) => current.filter((item) => item.id !== product.id));
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setMemberMessage('Produk berhasil dihapus.');
      router.refresh();
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

        {/* Produk Unggulan Section (Shown when search is empty and featured products exist) */}
        {!searchQuery.trim() && featuredProducts.length > 0 && (
          <section className="mt-8 mb-12 p-4 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0F2C23]/[0.04] via-[#F4EBD9]/50 to-[#963E1B]/[0.04] border border-[#0F2C23]/10 shadow-xs relative overflow-hidden">
            {/* Background Accent Blur Decorative Orbs */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-200/30 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[#0F2C23]/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 text-center max-w-2xl mx-auto mb-7">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F2C23] text-amber-300 text-[11px] font-bold tracking-wide shadow-xs mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                REKOMENDASI PILIHAN
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2C23] tracking-tight">
                Produk Unggulan UMKM
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">
                Pilihan olahan khas terbaik buatan ibu-ibu Kelompok UMKM Wanita Tangguh.
              </p>
            </div>

            {/* Featured Product Cards Carousel / Grid Container */}
            <div className="relative z-10 w-full">
              {/* Mobile-Only Outward Side Floating Arrow Buttons (Frosted Glass Transparent BG & Border) */}
              <button
                type="button"
                onClick={scrollFeaturedLeft}
                aria-label="Scroll Kiri Produk Unggulan"
                className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 cursor-pointer rounded-full bg-white/40 border border-white/50 backdrop-blur-md p-2 text-[#0F2C23] shadow-md hover:bg-white/70 active:scale-90 transition-all sm:hidden"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={scrollFeaturedRight}
                aria-label="Scroll Kanan Produk Unggulan"
                className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 cursor-pointer rounded-full bg-white/40 border border-white/50 backdrop-blur-md p-2 text-[#0F2C23] shadow-md hover:bg-white/70 active:scale-90 transition-all sm:hidden"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div
                ref={featuredScrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory pb-3 gap-3 sm:gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible scrollbar-none"
              >
                {featuredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="w-[calc(50%-0.375rem)] min-w-[calc(50%-0.375rem)] shrink-0 snap-start sm:w-auto sm:min-w-0 sm:shrink bg-white/90 backdrop-blur-xs rounded-2xl overflow-hidden border border-amber-200/70 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col group cursor-pointer"
                  >
                    {/* Card Image Area with Custom Badges */}
                    <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-gray-100">
                      <Image
                        src={product.imageUrl || '/food_umkm.jpg'}
                        alt={product.name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Featured Star Badge */}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] sm:text-[10px] font-extrabold tracking-wide flex items-center gap-1 shadow-md">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white" />
                        Unggulan
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between bg-gradient-to-b from-white to-[#FAF9F6]">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate max-w-[120px] text-[10px] sm:text-[11px] font-medium text-gray-500">
                            {product.merchantName}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#0F2C23] transition-colors mt-1 line-clamp-1 sm:line-clamp-2">
                          {product.name}
                        </h3>
                        {product.description && (
                          <div className="mt-1">
                            <MarkdownContent content={product.description} className="text-[11px] sm:text-xs text-gray-600 line-clamp-2 leading-relaxed" />
                          </div>
                        )}
                      </div>

                      {/* Footer Price & Action CTA */}
                      <div className="mt-3 pt-2.5 border-t border-gray-100/80 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-1">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Harga</span>
                          <span className="text-xs sm:text-sm font-black text-[#963E1B] truncate">
                            {formatRupiah(product.price)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                          className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-[#0F2C23] text-white hover:bg-[#963E1B] active:scale-[0.98] text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all group-hover:shadow-md cursor-pointer shrink-0"
                          title="Lihat Detail Produk"
                        >
                          <span>Detail</span>
                          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {(viewerRole === 'anggota' || viewerRole === 'admin') && (
          <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-[#D9E8E1] bg-[#E8F3EF] p-4 sm:flex-row sm:items-center sm:p-5">
            <div>
              <p className="text-sm font-extrabold text-[#0F2C23]">{viewerRole === 'admin' ? 'Mode Admin: Kelola seluruh produk' : 'Kelola produk Anda'}</p>
              <p className="mt-1 text-xs text-gray-600">{viewerRole === 'admin' ? 'Tambahkan produk untuk toko mana pun serta edit atau hapus seluruh produk katalog.' : 'Tambahkan produk langsung dari katalog tanpa membuka dashboard.'}</p>
            </div>
            <button type="button" onClick={viewerRole === 'admin' ? openAdminAddForm : openMemberAddForm} className="inline-flex items-center justify-center rounded-xl bg-[#0F2C23] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#184537]">
              + Tambah Produk
            </button>
          </div>
        )}

        {memberError && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{memberError}</p>}
        {memberMessage && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{memberMessage}</p>}

        {/* Product Catalog Section Anchor */}
        <div id="katalog-produk" className="scroll-mt-24 pt-6 border-t border-gray-200/70 mt-6">
          {/* Section Title Header for All Products */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 text-[#963E1B] text-xs font-bold uppercase tracking-wider">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>KATALOG LENGKAP</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
                {searchQuery.trim() ? `Hasil Pencarian ("${searchQuery}")` : 'Semua Produk UMKM'}
              </h2>
            </div>
            <span className="text-xs font-semibold text-gray-600 bg-gray-100/90 border border-gray-200/80 px-3 py-1.5 rounded-full self-start sm:self-auto">
              Menampilkan {filteredProducts.length} produk
            </span>
          </div>

          {/* Product Cards Grid with Pagination */}
          <ProductGrid
            key={searchQuery}
            products={filteredProducts}
            onDetailClick={(product) => setSelectedProduct(product)}
            canManageProduct={(product) => viewerRole === 'admin' || (viewerRole === 'anggota' && product.createdBy === viewerUserId)}
            onEditProduct={viewerRole === 'admin' ? handleAdminEdit : handleMemberEdit}
            onDeleteProduct={(product) => viewerRole === 'admin' ? void handleAdminDelete(product) : void handleMemberDelete(product)}
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

      {viewerRole === 'admin' && (
        <ProductFormModal
          key={`${editingAdminProduct?.id ?? 'new'}-${isAdminFormOpen ? 'open' : 'closed'}`}
          product={editingAdminProduct}
          isOpen={isAdminFormOpen}
          isSaving={isAdminSaving}
          showStoreName
          storeNameLocked={Boolean(editingAdminProduct)}
          defaultStoreName={editingAdminProduct?.store_name ?? storeOptions[0]?.name ?? ''}
          storeOptions={storeOptions}
          allowFeatured
          featuredProductCount={featuredProductCount}
          maxFeaturedProducts={4}
          onClose={() => { setIsAdminFormOpen(false); setEditingAdminProduct(null); }}
          onSave={handleAdminSave}
        />
      )}

      {/* Floating Chat Widget */}
      <FloatingChatWidget ref={chatWidgetRef} store={store} pageContext="catalog" />
    </div>
  );
};
