"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, LayoutDashboard, LogOut, Package, Search, Store, Users, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AdminMonitoringData, AdminStoreSummary } from "@/lib/admin-service";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";

type StatusFilter = "semua" | "aktif" | "nonaktif";
type AdminSection = "monitoring" | "users";

interface AdminDashboardClientProps {
  initialData: AdminMonitoringData;
}

export function AdminDashboardClient({ initialData }: AdminDashboardClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [activeSection, setActiveSection] = useState<AdminSection>("monitoring");
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#0F2C23]">Platform Admin</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900">{activeSection === "monitoring" ? "Monitoring Seluruh Toko" : "Manajemen User"}</h1>
            <p className="mt-1 text-sm text-gray-500">{activeSection === "monitoring" ? "Ringkasan katalog dan status produk seluruh mitra UMKM." : "Kelola akses login dan role pengguna platform."}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => router.push("/")} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" /> Katalog
            </button>
            <button type="button" onClick={() => void handleSignOut()} disabled={isSigningOut} className="inline-flex items-center gap-2 rounded-xl bg-[#0F2C23] px-3.5 py-2.5 text-sm font-bold text-white hover:bg-[#184537] disabled:opacity-60">
              <LogOut className="h-4 w-4" /> {isSigningOut ? "Keluar..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:px-8">
        <nav className="flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm" aria-label="Menu admin">
          <button type="button" onClick={() => setActiveSection("monitoring")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeSection === "monitoring" ? "bg-[#0F2C23] text-white" : "text-gray-600 hover:bg-gray-50"}`}>
            <LayoutDashboard className="h-4 w-4" /> Monitoring toko
          </button>
          <button type="button" onClick={() => setActiveSection("users")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeSection === "users" ? "bg-[#0F2C23] text-white" : "text-gray-600 hover:bg-gray-50"}`}>
            <Users className="h-4 w-4" /> Manajemen user
          </button>
        </nav>

        {activeSection === "monitoring" ? <>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/70 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <tr><th className="px-5 py-4">Toko</th><th className="px-5 py-4">Kontak</th><th className="px-5 py-4">Produk</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Diperbarui</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStores.map((store) => <StoreRow key={store.id} store={store} />)}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </> : <AdminUserManagement />}
      </div>
    </main>
  );
}

function StoreRow({ store }: { store: AdminStoreSummary }) {
  return (
    <tr className="hover:bg-gray-50/70">
      <td className="px-5 py-4"><p className="font-bold text-gray-900">{store.name}</p><p className="mt-1 text-xs text-gray-500">{store.seller_name}</p></td>
      <td className="px-5 py-4 text-gray-700">{store.whatsapp_number ? `+${store.whatsapp_number}` : "Belum diisi"}</td>
      <td className="px-5 py-4"><div className="flex flex-wrap gap-1.5 text-xs font-semibold"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{store.product_count} total</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{store.visible_product_count} tampil</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{store.available_product_count} tersedia</span></div></td>
      <td className="px-5 py-4">{store.is_active ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Aktif</span> : <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600"><XCircle className="h-3.5 w-3.5" /> Nonaktif</span>}</td>
      <td className="px-5 py-4 text-xs text-gray-500">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(store.updated_at))}</td>
    </tr>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "green" | "blue" | "amber" | "purple" }) {
  const tones = { green: "bg-emerald-50 text-emerald-700", blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", purple: "bg-purple-50 text-purple-700" };
  return <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span></div><p className="mt-3 text-3xl font-black text-gray-900">{value}</p></div>;
}
