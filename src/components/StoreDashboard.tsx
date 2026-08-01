"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { DashboardSidebar, type DashboardTab } from "@/components/dashboard/DashboardSidebar";
import { ProductFormModal } from "@/components/dashboard/ProductFormModal";
import { ProductTable } from "@/components/dashboard/ProductTable";
import { deleteProduct, getCurrentStoreData, saveProduct, type NewProductInput, type StoreData } from "@/lib/store-service";
import type { ProductRow } from "@/lib/products";
import { InstitutionalLogos } from "@/components/InstitutionalLogos";

interface StoreDashboardProps {
  onBackToCatalog?: () => void;
  onSignOut: () => Promise<void>;
}

export function StoreDashboard({ onBackToCatalog, onSignOut }: StoreDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("produk");
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [error, setError] = useState("");

  const loadStore = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError("");
    try {
      setStoreData(await getCurrentStoreData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Data toko gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchStore = async () => {
      try {
        const data = await getCurrentStoreData();
        if (!cancelled) setStoreData(data);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Data toko gagal dimuat.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchStore();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveProduct = async (input: NewProductInput) => {
    if (!storeData) return;
    setIsSaving(true);
    setError("");
    try {
      const product = await saveProduct(storeData.store.id, input);
      setStoreData((current) => {
        if (!current) return current;
        const exists = Boolean(input.id);
        return {
          ...current,
          products: exists
            ? current.products.map((item) => item.id === product.id ? product : item)
            : [product, ...current.products],
        };
      });
      setIsAddModalOpen(false);
      setEditingProduct(null);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Produk gagal disimpan.");
      throw createError;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (product: ProductRow) => {
    if (!window.confirm(`Hapus produk "${product.name}"?`)) return;
    setError("");
    try {
      await deleteProduct(product.id);
      setStoreData((current) => current ? { ...current, products: current.products.filter((item) => item.id !== product.id) } : current);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Produk gagal dihapus.");
    }
  };

  const closeProductModal = () => {
    setIsAddModalOpen(false);
    setEditingProduct(null);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setError("");
    try {
      await onSignOut();
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Logout gagal. Silakan coba lagi.");
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] text-sm text-gray-500">Memuat dashboard toko...</div>;
  }

  if (!storeData) {
    return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8F9FA] px-6 text-center"><h1 className="text-xl font-bold text-gray-900">Dashboard belum dapat dimuat</h1><p className="max-w-md text-sm text-gray-500">{error || "Sesi login atau konfigurasi Supabase belum tersedia."}</p><button onClick={() => void loadStore()} className="rounded-xl bg-[#183B2E] px-4 py-2 text-sm font-bold text-white">Coba lagi</button></div>;
  }

  const { store, products } = storeData;

  return <div className="flex min-h-screen flex-col bg-[#F8F9FA] text-gray-900 md:flex-row">
    <DashboardSidebar storeName={store.name} activeTab={activeTab} onTabChange={setActiveTab} onAddProduct={() => { setEditingProduct(null); setIsAddModalOpen(true); }} onBackToCatalog={onBackToCatalog} onSignOut={() => void handleSignOut()} isSigningOut={isSigningOut} />

    <main className="min-w-0 flex-1 p-6 sm:p-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Dashboard Pengelolaan Toko UMKM</span>
          <p className="text-xs text-gray-500 mt-0.5">Sistem Katalog Publik Digital Resmi</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400 hidden sm:inline uppercase tracking-wide">Mitra & Lembaga:</span>
          <InstitutionalLogos imageClassName="h-10 sm:h-14 w-auto object-contain" />
        </div>
      </div>

      {error && <div className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      {activeTab === "produk" && <section className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">Daftar Produk</h2><p className="mt-1 text-sm text-gray-500">Kelola produk yang tampil di katalog publik.</p></div><div className="flex min-w-[200px] items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#183B2E] text-white"><Package className="h-6 w-6" /></div><div><p className="text-xs font-medium text-gray-500">Total Produk</p><p className="text-2xl font-extrabold text-gray-900">{products.length}</p></div></div></div>
        <ProductTable products={products} supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL} isLoading={isLoading} onEdit={(product) => { setEditingProduct(product); setIsAddModalOpen(true); }} onDelete={handleDeleteProduct} />
      </section>}

      {activeTab === "ringkasan" && <section className="mx-auto max-w-6xl space-y-6"><div><h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">Ringkasan Toko</h2><p className="mt-1 text-sm text-gray-500">Informasi singkat mengenai katalog Anda.</p></div><div className="grid gap-4 sm:grid-cols-3"><Metric label="Total produk" value={products.length.toString()} /><Metric label="Produk tampil" value={products.filter((product) => product.is_visible).length.toString()} /><Metric label="Produk tersedia" value={products.filter((product) => product.is_available).length.toString()} /></div></section>}

      {activeTab === "pengaturan" && <section className="mx-auto max-w-2xl space-y-6"><div><h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">Pengaturan Toko</h2><p className="mt-1 text-sm text-gray-500">Informasi ini digunakan pada katalog publik.</p></div><div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><Info label="Nama toko" value={store.name} /><Info label="Nama penjual" value={store.seller_name} /><Info label="WhatsApp" value={store.whatsapp_number || "Belum diisi"} /><Info label="Deskripsi" value={store.description || "Belum diisi"} /></div></section>}
    </main>

    <ProductFormModal key={editingProduct?.id ?? "new"} product={editingProduct} isOpen={isAddModalOpen} isSaving={isSaving} onClose={closeProductModal} onSave={handleSaveProduct} />
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><p className="text-xs font-medium text-gray-500">{label}</p><p className="mt-2 text-3xl font-extrabold text-gray-900">{value}</p></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"><p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 text-sm text-gray-800">{value}</p></div>;
}
