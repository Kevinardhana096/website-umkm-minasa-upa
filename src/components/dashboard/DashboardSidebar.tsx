import { ArrowLeft, LayoutGrid, LogOut, Package, Plus, Settings, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { InstitutionalLogos } from "@/components/InstitutionalLogos";

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

export function DashboardSidebar({ storeName, activeTab, onTabChange, onAddProduct, onBackToCatalog, onSignOut, isSigningOut }: DashboardSidebarProps) {
  const tabs: Array<{ key: DashboardTab; label: string; icon: typeof LayoutGrid }> = [
    { key: "ringkasan", label: "Ringkasan", icon: LayoutGrid },
    { key: "produk", label: "Produk", icon: Package },
    { key: "pengaturan", label: "Pengaturan", icon: Settings },
  ];

  return (
    <aside className="flex w-full shrink-0 flex-col justify-between border-r border-gray-200 bg-[#F3F4F6] p-6 md:w-64">
      <div>
        {onBackToCatalog && (
          <button onClick={onBackToCatalog} className="mb-6 flex items-center gap-2 rounded-lg border border-gray-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-white hover:text-gray-900">
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Katalog
          </button>
        )}

        <div className="mb-8 flex items-center gap-3">
          <Image src="/logo_umkm.png" alt="Logo UMKM" width={44} height={44} className="h-9 w-auto object-contain shrink-0" />
          <div>
            <h1 className="text-base font-bold tracking-tight text-gray-900 leading-tight">{storeName}</h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-amber-900">
              <ShieldCheck className="h-3.5 w-3.5 text-[#8B4513]" /> Toko aktif
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => onTabChange(key)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all ${activeTab === key ? "bg-[#183B2E] font-semibold text-white shadow-xs" : "font-medium text-gray-700 hover:bg-gray-200/70"}`}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6 space-y-4">
        <button onClick={onAddProduct} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#183B2E] px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0F2C23]">
          <Plus className="h-4 w-4" /> Tambah Produk
        </button>

        <button type="button" onClick={onSignOut} disabled={isSigningOut} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70">
          <LogOut className="h-4 w-4" /> {isSigningOut ? "Keluar..." : "Logout"}
        </button>

        <div className="border-t border-gray-200/80 pt-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">Didukung oleh</p>
          <InstitutionalLogos imageClassName="h-7 sm:h-9 w-auto object-contain" className="justify-center" />
        </div>
      </div>
    </aside>
  );
}

export type { DashboardTab };
