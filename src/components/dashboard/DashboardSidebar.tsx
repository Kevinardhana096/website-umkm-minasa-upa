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
    <aside className="flex w-full shrink-0 flex-col border-b border-gray-200/80 bg-white p-4 sm:p-6 md:min-h-screen md:w-72 md:justify-between md:border-b-0 md:border-r">
      <div className="space-y-4 md:space-y-6">
        {onBackToCatalog && (
          <button
            onClick={onBackToCatalog}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900 md:w-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Lihat Katalog Publik
          </button>
        )}

        <div className="flex items-center gap-3.5 border-b border-gray-100 pb-3 pt-1 md:pb-4 md:pt-2">
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

        <nav className="space-y-2 md:space-y-1.5">
          <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 md:px-3 md:text-[11px]">Navigasi Utama</p>
          <div className="grid grid-cols-3 gap-2 md:block md:space-y-1.5">
            {tabs.map(({ key, label, icon: Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => onTabChange(key)}
                  className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-center text-[11px] font-semibold leading-tight transition-all md:min-h-0 md:flex-row md:justify-start md:gap-3 md:px-3.5 md:py-2.5 md:text-left md:text-sm ${
                    isActive
                      ? "bg-[#0F2C23] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-400" : "text-gray-400"}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4 md:mt-8 md:block md:space-y-4">
        <button
          onClick={onAddProduct}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F2C23] px-2.5 py-3 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-[#184537] active:scale-98 sm:px-4 sm:text-sm md:w-full md:flex-none"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className="sm:hidden">Tambah Produk</span>
          <span className="hidden sm:inline">Tambah Produk Baru</span>
        </button>

        <button
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-2.5 text-[11px] font-bold text-gray-700 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:text-sm md:w-full md:flex-none"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="sm:hidden">{isSigningOut ? "Keluar..." : "Keluar"}</span>
          <span className="hidden sm:inline">{isSigningOut ? "Keluar..." : "Keluar Sesi (Logout)"}</span>
        </button>
      </div>
    </aside>
  );
}

export type { DashboardTab };
