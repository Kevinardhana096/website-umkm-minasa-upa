import { ArrowLeft, LayoutGrid, LogOut, Package, Plus, Settings, ShieldCheck } from "lucide-react";
import Image from "next/image";

type DashboardTab = "ringkasan" | "produk" | "pengaturan";

interface DashboardSidebarProps {
  storeName: string;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onAddProduct: () => void;
  onBackToCatalog?: () => void;
  onSignOut: () => void;
  isSigningOut: boolean;
}

export function DashboardSidebar({
  storeName,
  activeTab,
  onTabChange,
  onAddProduct,
  onBackToCatalog,
  onSignOut,
  isSigningOut,
}: DashboardSidebarProps) {
  const tabs: Array<{ key: DashboardTab; label: string; icon: typeof LayoutGrid }> = [
    { key: "ringkasan", label: "Ringkasan Toko", icon: LayoutGrid },
    { key: "produk", label: "Kelola Produk", icon: Package },
    { key: "pengaturan", label: "Pengaturan Toko", icon: Settings },
  ];

  return (
    <aside className="flex w-full shrink-0 flex-col justify-between border-r border-gray-200/80 bg-white p-6 md:w-72">
      <div className="space-y-6">
        {onBackToCatalog && (
          <button
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Lihat Katalog Publik
          </button>
        )}

        <div className="flex items-center gap-3.5 pt-2 pb-4 border-b border-gray-100">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-50 p-1 border border-gray-100 shadow-2xs">
            <Image src="/logo_umkm.png" alt="Logo UMKM" width={40} height={40} className="h-full w-auto object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold tracking-tight text-gray-900 truncate leading-tight">{storeName}</h1>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
              <ShieldCheck className="h-3 w-3 text-emerald-600" /> Toko Aktif
            </div>
          </div>
        </div>

        <nav className="space-y-1.5">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Navigasi Utama</p>
          {tabs.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#0F2C23] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-gray-400"}`} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-8 space-y-4 pt-4 border-t border-gray-100">
        <button
          onClick={onAddProduct}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F2C23] px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#184537] active:scale-98"
        >
          <Plus className="h-4 w-4" /> Tambah Produk Baru
        </button>

        <button
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-700 transition-all hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <LogOut className="h-4 w-4" /> {isSigningOut ? "Keluar..." : "Keluar Sesi (Logout)"}
        </button>
      </div>
    </aside>
  );
}

export type { DashboardTab };
