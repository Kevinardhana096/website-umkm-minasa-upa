"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Edit, Eye, LayoutDashboard, LogOut, Menu, Package, PackageSearch, Search, Store, Trash2, Users, X, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AdminMonitoringData, AdminProductSummary, AdminStoreSummary } from "@/lib/admin-service";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { AdminProductMonitoring } from "@/components/admin/AdminProductMonitoring";
import { AdminStoreEditModal } from "@/components/admin/AdminStoreEditModal";
import { ProductFormModal } from "@/components/dashboard/ProductFormModal";
import type { NewProductInput, StoreProfileInput } from "@/lib/store-service";

type StatusFilter = "semua" | "aktif" | "nonaktif";
type AdminSection = "monitoring" | "products" | "users";

interface AdminDashboardClientProps {
  initialData: AdminMonitoringData;
}

export function AdminDashboardClient({ initialData }: AdminDashboardClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [activeSection, setActiveSection] = useState<AdminSection>("monitoring");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<AdminStoreSummary | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminProductSummary | null>(null);
  const [pendingCatalogAction, setPendingCatalogAction] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState("");

  const filteredStores = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return initialData.stores.filter((store) => {
      const matchesSearch = !query || [store.name, store.seller_name, store.whatsapp_number]
        .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "semua"
        || (statusFilter === "aktif" && store.is_active)
        || (statusFilter === "nonaktif" && !store.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [initialData.stores, searchQuery, statusFilter]);

  const totals = useMemo(() => initialData.stores.reduce((result, store) => ({
    stores: result.stores + 1,
    activeStores: result.activeStores + (store.is_active ? 1 : 0),
    products: result.products + store.product_count,
    visibleProducts: result.visibleProducts + store.visible_product_count,
  }), { stores: 0, activeStores: 0, products: 0, visibleProducts: 0 }), [initialData.stores]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setIsSigningOut(false);
      return;
    }
    router.replace("/login");
  };

  const handleSaveStore = async (input: StoreProfileInput) => {
    if (!editingStore) return;
    setPendingCatalogAction(`${editingStore.id}:save`);
    setCatalogError("");
    try {
      const response = await fetch("/api/admin/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: "store",
          id: editingStore.id,
          name: input.name,
          seller_name: input.sellerName,
          description: input.description,
          whatsapp_number: input.whatsappNumber,
          is_active: input.isActive,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Toko gagal diperbarui.");
      setEditingStore(null);
      router.refresh();
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Toko gagal diperbarui.");
      throw error;
    } finally {
      setPendingCatalogAction(null);
    }
  };

  const handleSaveProduct = async (input: NewProductInput) => {
    if (!editingProduct?.id) return;
    setPendingCatalogAction(`${editingProduct.id}:save`);
    setCatalogError("");
    try {
      const formData = new FormData();
      formData.append("resource", "product");
      formData.append("id", editingProduct.id);
      formData.append("name", input.name);
      formData.append("category", input.category);
      formData.append("description", input.description);
      formData.append("whatsapp_number", input.whatsappNumber);
      formData.append("price", input.price === null ? "" : String(input.price));
      formData.append("is_available", String(input.isAvailable));
      formData.append("is_visible", String(input.isVisible));
      formData.append("is_featured", String(input.isFeatured));
      formData.append("images", JSON.stringify((input.images ?? []).map((image) => ({
        id: image.id,
        image_path: image.imagePath,
        is_primary: image.isPrimary === true,
      }))));
      (input.images ?? []).forEach((image, index) => {
        if (image.imageFile) formData.append(`image_file_${index}`, image.imageFile);
      });

      const response = await fetch("/api/admin/catalog", { method: "PATCH", body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Produk gagal diperbarui.");
      setEditingProduct(null);
      router.refresh();
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Produk gagal diperbarui.");
      throw error;
    } finally {
      setPendingCatalogAction(null);
    }
  };

  const deleteCatalogData = async (resource: "store" | "product", id: string) => {
    setPendingCatalogAction(`${id}:delete`);
    setCatalogError("");
    try {
      const response = await fetch("/api/admin/catalog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource, id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Data gagal dihapus.");
      if (resource === "store" && editingStore?.id === id) setEditingStore(null);
      if (resource === "product" && editingProduct?.id === id) setEditingProduct(null);
      router.refresh();
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Data gagal dihapus.");
    } finally {
      setPendingCatalogAction(null);
    }
  };

  const handleDeleteStore = (store: AdminStoreSummary) => {
    const confirmed = window.confirm(`Hapus toko "${store.name}"? Semua ${store.product_count} produk milik toko ini juga akan dihapus dan tidak dapat dipulihkan.`);
    if (confirmed) void deleteCatalogData("store", store.id);
  };

  const handleDeleteProduct = (product: AdminProductSummary) => {
    const confirmed = window.confirm(`Hapus produk "${product.name}" dari toko ${product.store_name}? Data tidak dapat dipulihkan.`);
    if (confirmed) void deleteCatalogData("product", product.id);
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur-md shadow-xs transition-all">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#0F2C23]">Platform Admin</p>
              <h1 className="mt-0.5 text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
                {activeSection === "monitoring" ? "Monitoring Seluruh Toko" : activeSection === "products" ? "Monitoring Seluruh Produk" : "Manajemen User"}
              </h1>
              <p className="hidden text-xs text-gray-500 sm:block sm:text-sm">
                {activeSection === "monitoring" ? "Ringkasan katalog dan status produk seluruh mitra UMKM." : activeSection === "products" ? "Pantau produk, toko pemilik, dan status katalog seluruh mitra." : "Kelola akses login dan role pengguna platform."}
              </p>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex md:items-center md:gap-3">
              <button type="button" onClick={() => router.push("/")} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
                <ArrowLeft className="h-4 w-4" /> Katalog
              </button>
              <button type="button" onClick={() => void handleSignOut()} disabled={isSigningOut} className="inline-flex items-center gap-2 rounded-xl bg-[#0F2C23] px-3.5 py-2 text-sm font-bold text-white hover:bg-[#184537] disabled:opacity-60 transition">
                <LogOut className="h-4 w-4" /> {isSigningOut ? "Keluar..." : "Logout"}
              </button>
            </div>

            {/* Mobile Burger Toggle Button */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2.5 text-gray-700 shadow-xs hover:bg-gray-50 active:bg-gray-100"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5 text-gray-900" /> : <Menu className="h-5 w-5 text-gray-900" />}
              </button>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="mt-4 hidden md:flex md:flex-wrap md:gap-2 border-t border-gray-100 pt-3" aria-label="Menu admin">
            <button type="button" onClick={() => setActiveSection("monitoring")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${activeSection === "monitoring" ? "bg-[#0F2C23] text-white" : "text-gray-600 hover:bg-gray-100/80"}`}>
              <LayoutDashboard className="h-4 w-4" /> Monitoring toko
            </button>
            <button type="button" onClick={() => setActiveSection("products")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${activeSection === "products" ? "bg-[#0F2C23] text-white" : "text-gray-600 hover:bg-gray-100/80"}`}>
              <PackageSearch className="h-4 w-4" /> Monitoring produk
            </button>
            <button type="button" onClick={() => setActiveSection("users")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${activeSection === "users" ? "bg-[#0F2C23] text-white" : "text-gray-600 hover:bg-gray-100/80"}`}>
              <Users className="h-4 w-4" /> Manajemen user
            </button>
          </nav>
        </div>

        {/* Mobile Burger Menu Content */}
        {isMobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white px-4 py-4 shadow-lg md:hidden animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col space-y-2">
              <p className="px-2 text-[10px] font-black uppercase tracking-wider text-gray-400">Navigasi Admin</p>
              <button
                type="button"
                onClick={() => { setActiveSection("monitoring"); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${activeSection === "monitoring" ? "bg-[#0F2C23] text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
              >
                <LayoutDashboard className="h-4.5 w-4.5" /> Monitoring toko
              </button>
              <button
                type="button"
                onClick={() => { setActiveSection("products"); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${activeSection === "products" ? "bg-[#0F2C23] text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
              >
                <PackageSearch className="h-4.5 w-4.5" /> Monitoring produk
              </button>
              <button
                type="button"
                onClick={() => { setActiveSection("users"); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${activeSection === "users" ? "bg-[#0F2C23] text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
              >
                <Users className="h-4.5 w-4.5" /> Manajemen user
              </button>

              <hr className="my-2 border-gray-100" />
              <p className="px-2 text-[10px] font-black uppercase tracking-wider text-gray-400">Aksi</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); router.push("/"); }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                >
                  <ArrowLeft className="h-4 w-4" /> Katalog
                </button>
                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); void handleSignOut(); }}
                  disabled={isSigningOut}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#0F2C23] py-2.5 text-xs font-bold text-white hover:bg-[#184537] disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" /> {isSigningOut ? "Keluar..." : "Logout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">

        {catalogError && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{catalogError}</div>}

        {activeSection === "monitoring" ? <>
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Metric icon={<Store className="h-5 w-5" />} label="Total Toko" value={totals.stores} tone="green" />
          <Metric icon={<CheckCircle2 className="h-5 w-5" />} label="Toko Aktif" value={totals.activeStores} tone="blue" />
          <Metric icon={<Package className="h-5 w-5" />} label="Total Produk" value={totals.products} tone="amber" />
          <Metric icon={<Eye className="h-5 w-5" />} label="Produk Tampil" value={totals.visibleProducts} tone="purple" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Daftar Toko</h2>
              <p className="mt-1 text-xs text-gray-500">Menampilkan {filteredStores.length} dari {initialData.stores.length} toko.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative">
                <span className="sr-only">Cari toko</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari toko atau penjual..." className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0F2C23] sm:w-64" />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-[#0F2C23]">
                <option value="semua">Semua status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          {filteredStores.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">Tidak ada toko yang cocok dengan filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/70 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <tr><th className="px-5 py-4">Toko</th><th className="px-5 py-4">Kontak</th><th className="px-5 py-4">Produk</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Diperbarui</th><th className="px-5 py-4">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStores.map((store) => <StoreRow key={store.id} store={store} pendingAction={pendingCatalogAction} onEdit={setEditingStore} onDelete={handleDeleteStore} />)}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </> : activeSection === "products" ? <AdminProductMonitoring products={initialData.products} onEdit={setEditingProduct} onDelete={handleDeleteProduct} pendingAction={pendingCatalogAction} /> : <AdminUserManagement />}
      </div>

      <AdminStoreEditModal
        key={editingStore?.id ?? "closed"}
        store={editingStore}
        isSaving={Boolean(editingStore && pendingCatalogAction === `${editingStore.id}:save`)}
        onClose={() => setEditingStore(null)}
        onSave={handleSaveStore}
      />
      <ProductFormModal
        key={editingProduct?.id ?? "admin-closed"}
        product={editingProduct}
        isOpen={Boolean(editingProduct)}
        isSaving={Boolean(editingProduct && pendingCatalogAction === `${editingProduct.id}:save`)}
        allowFeatured
        onClose={() => setEditingProduct(null)}
        onSave={handleSaveProduct}
      />
    </main>
  );
}

function StoreRow({ store, pendingAction, onEdit, onDelete }: { store: AdminStoreSummary; pendingAction?: string | null; onEdit: (store: AdminStoreSummary) => void; onDelete: (store: AdminStoreSummary) => void }) {
  const isPending = pendingAction?.startsWith(`${store.id}:`);
  return (
    <tr className="hover:bg-gray-50/70">
      <td className="px-5 py-4"><p className="font-bold text-gray-900">{store.name}</p><p className="mt-1 text-xs text-gray-500">{store.seller_name}</p></td>
      <td className="px-5 py-4 text-gray-700">{store.whatsapp_number ? `+${store.whatsapp_number}` : "Belum diisi"}</td>
      <td className="px-5 py-4"><div className="flex flex-wrap gap-1.5 text-xs font-semibold"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{store.product_count} total</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{store.visible_product_count} tampil</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{store.available_product_count} tersedia</span></div></td>
      <td className="px-5 py-4">{store.is_active ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Aktif</span> : <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600"><XCircle className="h-3.5 w-3.5" /> Nonaktif</span>}</td>
      <td className="px-5 py-4 text-xs text-gray-500">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(store.updated_at))}</td>
      <td className="px-5 py-4"><div className="flex gap-2"><button type="button" onClick={() => onEdit(store)} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><Edit className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={() => onDelete(store)} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Hapus</button></div></td>
    </tr>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "green" | "blue" | "amber" | "purple" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100/80 bg-white p-3.5 sm:p-5 shadow-xs transition hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 leading-snug">{label}</p>
        <span className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border ${tones[tone]} [&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-5 sm:[&_svg]:w-5`}>
          {icon}
        </span>
      </div>
      <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-black text-gray-900 leading-none">{value}</p>
    </div>
  );
}
