"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Eye, LogOut, Package } from "lucide-react";
import { DashboardSidebar, type DashboardTab } from "@/components/dashboard/DashboardSidebar";
import { ProductFormModal } from "@/components/dashboard/ProductFormModal";
import { ProductTable } from "@/components/dashboard/ProductTable";
import { createCurrentStore, deleteProduct, getCurrentStoreData, isStoreProfileComplete, saveProduct, updateCurrentStore, type NewProductInput, type StoreData, type StoreProfileInput } from "@/lib/store-service";
import type { ProductRow } from "@/lib/products";
import { InstitutionalLogos } from "@/components/InstitutionalLogos";
import { StoreProfileForm } from "@/components/dashboard/StoreProfileForm";

interface StoreDashboardProps {
  onBackToCatalog?: () => void;
  onSignOut: () => Promise<void>;
}

export function StoreDashboard({ onBackToCatalog, onSignOut }: StoreDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("produk");
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingStore, setIsSavingStore] = useState(false);
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
    if (!storeData?.store) return;
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

  const handleSaveStore = async (input: StoreProfileInput) => {
    if (!storeData) return;
    setIsSavingStore(true);
    setError("");
    try {
      const store = storeData.store
        ? await updateCurrentStore(storeData.store.id, input)
        : await createCurrentStore(input);
      setStoreData((current) => current ? { ...current, store } : current);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Profil toko gagal diperbarui.");
      throw saveError;
    } finally {
      setIsSavingStore(false);
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

  if (!isStoreProfileComplete(storeData.store)) {
    return (
      <StoreOnboarding
        store={storeData.store}
        error={error}
        isSaving={isSavingStore}
        isSigningOut={isSigningOut}
        onBackToCatalog={onBackToCatalog}
        onSave={handleSaveStore}
        onSignOut={() => void handleSignOut()}
      />
    );
  }

  const { store, products } = storeData;

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] text-gray-900 md:flex-row font-sans selection:bg-[#F4EBD9]">
      <DashboardSidebar
        storeName={store.name}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddProduct={() => {
          setEditingProduct(null);
          setIsAddModalOpen(true);
        }}
        onBackToCatalog={onBackToCatalog}
        onSignOut={() => void handleSignOut()}
        isSigningOut={isSigningOut}
      />

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
        {/* Sleek Top Banner */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <span className="block text-[11px] font-bold uppercase leading-4 tracking-wider text-[#0F2C23] sm:text-xs">
              Dashboard Pengelolaan Toko UMKM
            </span>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Sistem Katalog Digital Resmi</p>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
            <span className="text-[11px] font-bold text-gray-400 hidden sm:inline uppercase tracking-wide">
              Mitra Program:
            </span>
            <InstitutionalLogos className="shrink-0" imageClassName="h-6 w-auto object-contain sm:h-7" />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-2xs">
            {error}
          </div>
        )}

        {/* Tab 1: Products */}
        {activeTab === "produk" && (
          <section className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Daftar Produk</h2>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 font-medium">
                  Kelola produk yang tampil di katalog publik usaha Anda.
                </p>
              </div>
              <div className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:w-auto sm:min-w-[200px]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F2C23] text-white shadow-2xs">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">Total Produk</p>
                  <p className="text-2xl font-black text-gray-900 leading-tight">{products.length}</p>
                </div>
              </div>
            </div>

            <ProductTable
              products={products}
              supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL}
              isLoading={isLoading}
              onEdit={(product) => {
                setEditingProduct(product);
                setIsAddModalOpen(true);
              }}
              onDelete={handleDeleteProduct}
            />
          </section>
        )}

        {/* Tab 2: Overview / Summary */}
        {activeTab === "ringkasan" && (
          <section className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Ringkasan Toko</h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 font-medium">
                Informasi singkat mengenai status katalog & produk Anda.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <Metric
                icon={<Package className="h-5 w-5 text-emerald-600" />}
                label="Total produk tersimpan"
                value={products.length.toString()}
                subtitle="Semua produk dalam sistem"
              />
              <Metric
                icon={<Eye className="h-5 w-5 text-blue-600" />}
                label="Produk Tampil di Katalog"
                value={products.filter((product) => product.is_visible).length.toString()}
                subtitle="Dapat dilihat calon pembeli"
              />
              <Metric
                icon={<CheckCircle2 className="h-5 w-5 text-amber-600" />}
                label="Stok Produk Tersedia"
                value={products.filter((product) => product.is_available).length.toString()}
                subtitle="Siap dipesan via WhatsApp"
              />
            </div>
          </section>
        )}

        {/* Tab 3: Settings */}
        {activeTab === "pengaturan" && (
          <section className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Pengaturan Toko</h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 font-medium">
                Informasi dasar profil usaha yang ditampilkan di katalog publik.
              </p>
            </div>

            <StoreProfileForm store={store} isSaving={isSavingStore} onSave={handleSaveStore} />
          </section>
        )}
      </main>

      <ProductFormModal
        key={`${editingProduct?.id ?? "new"}-${isAddModalOpen ? "open" : "closed"}`}
        product={editingProduct}
        isOpen={isAddModalOpen}
        isSaving={isSaving}
        onClose={closeProductModal}
        onSave={handleSaveProduct}
      />
    </div>
  );
}

function StoreOnboarding({
  store,
  error,
  isSaving,
  isSigningOut,
  onBackToCatalog,
  onSave,
  onSignOut,
}: {
  store: StoreData["store"];
  error: string;
  isSaving: boolean;
  isSigningOut: boolean;
  onBackToCatalog?: () => void;
  onSave: (input: StoreProfileInput) => Promise<void>;
  onSignOut: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#F8F9FA] px-4 py-6 text-gray-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-white p-1 shadow-2xs">
              <Image src="/logo_umkm.png" alt="Logo UMKM" width={40} height={40} className="h-full w-auto object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0F2C23]">Akun Toko</p>
              <p className="truncate text-sm font-semibold text-gray-500">Lengkapi data sebelum mulai mengelola produk</p>
            </div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            {onBackToCatalog && (
              <button type="button" onClick={onBackToCatalog} className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 sm:flex-none">
                <ArrowLeft className="h-3.5 w-3.5" /> Katalog
              </button>
            )}
            <button type="button" onClick={onSignOut} disabled={isSigningOut} className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none">
              <LogOut className="h-3.5 w-3.5" /> {isSigningOut ? "Keluar..." : "Keluar"}
            </button>
          </div>
        </div>

        <section className="mb-5 rounded-2xl border border-[#D9E8E1] bg-[#E8F3EF] p-5 sm:mb-6 sm:p-6">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#0F2C23]">Langkah pertama</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Lengkapi profil toko</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">Isi nama toko, nama pengelola, dan nomor WhatsApp terlebih dahulu. Setelah tersimpan, Anda dapat mulai menambahkan produk ke katalog.</p>
        </section>

        {error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
        <StoreProfileForm store={store} isSaving={isSaving} onSave={onSave} />
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-3xl font-black text-gray-900 tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-gray-400">{subtitle}</p>
    </div>
  );
}
