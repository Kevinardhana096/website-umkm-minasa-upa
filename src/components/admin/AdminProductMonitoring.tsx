"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Edit, Eye, EyeOff, PackageSearch, Search, Star, Trash2, XCircle } from "lucide-react";
import type { AdminProductSummary } from "@/lib/admin-service";

type ProductStatusFilter = "semua" | "tampil" | "tersembunyi" | "tersedia" | "habis";

interface AdminProductMonitoringProps {
  products: AdminProductSummary[];
  onEdit: (product: AdminProductSummary) => void;
  onDelete: (product: AdminProductSummary) => void;
  pendingAction?: string | null;
}

export function AdminProductMonitoring({ products, onEdit, onDelete, pendingAction }: AdminProductMonitoringProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("semua");

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query || [product.name, product.description, product.store_name]
        .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "semua"
        || (statusFilter === "tampil" && product.is_visible)
        || (statusFilter === "tersembunyi" && !product.is_visible)
        || (statusFilter === "tersedia" && product.is_available)
        || (statusFilter === "habis" && !product.is_available);
      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, statusFilter]);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-[#0F2C23]" />
            <h2 className="text-lg font-extrabold text-gray-900">Seluruh Produk</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">Menampilkan {filteredProducts.length} dari {products.length} produk.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <span className="sr-only">Cari produk</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari produk atau toko..." className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0F2C23] sm:w-64" />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ProductStatusFilter)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-[#0F2C23]">
            <option value="semua">Semua status</option>
            <option value="tampil">Tampil</option>
            <option value="tersembunyi">Tersembunyi</option>
            <option value="tersedia">Tersedia</option>
            <option value="habis">Tidak tersedia</option>
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center text-sm text-gray-500">Tidak ada produk yang cocok dengan filter.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/70 text-xs font-bold uppercase tracking-wider text-gray-500">
              <tr><th className="px-5 py-4">Produk</th><th className="px-5 py-4">Toko</th><th className="px-5 py-4">Harga</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Diperbarui</th><th className="px-5 py-4">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => <ProductRow key={product.id} product={product} onEdit={onEdit} onDelete={onDelete} pendingAction={pendingAction} />)}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ProductRow({ product, onEdit, onDelete, pendingAction }: { product: AdminProductSummary; onEdit: (product: AdminProductSummary) => void; onDelete: (product: AdminProductSummary) => void; pendingAction?: string | null }) {
  const isPending = pendingAction?.startsWith(`${product.id}:`);
  return (
    <tr className="hover:bg-gray-50/70">
      <td className="max-w-[360px] px-5 py-4"><p className="font-bold text-gray-900">{product.name}</p><p className="mt-1 line-clamp-2 text-xs text-gray-500">{product.description || "Tanpa deskripsi"}</p>{product.product_images.length > 1 && <p className="mt-1 text-[11px] font-bold text-[#963E1B]">{product.product_images.length} foto galeri</p>}</td>
      <td className="px-5 py-4"><p className="font-semibold text-gray-700">{product.store_name}</p><p className={`mt-1 text-xs font-semibold ${product.store_is_active ? "text-emerald-600" : "text-gray-500"}`}>{product.store_is_active ? "Toko aktif" : "Toko nonaktif"}</p></td>
      <td className="px-5 py-4 whitespace-nowrap font-semibold text-gray-700">{formatPrice(product.price)}</td>
      <td className="px-5 py-4"><div className="flex flex-wrap gap-1.5">{product.is_featured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"><Star className="h-3.5 w-3.5 fill-current" /> Unggulan</span>}{product.is_visible ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><Eye className="h-3.5 w-3.5" /> Tampil</span> : <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600"><EyeOff className="h-3.5 w-3.5" /> Tersembunyi</span>}{product.is_available ? <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700"><CheckCircle2 className="h-3.5 w-3.5" /> Tersedia</span> : <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"><XCircle className="h-3.5 w-3.5" /> Tidak tersedia</span>}</div></td>
      <td className="px-5 py-4 text-xs text-gray-500">{formatDate(product.updated_at)}</td>
      <td className="px-5 py-4"><div className="flex gap-2"><button type="button" onClick={() => onEdit(product)} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><Edit className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={() => onDelete(product)} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Hapus</button></div></td>
    </tr>
  );
}

function formatPrice(price: number | string | null) {
  if (price === null || price === "") return "Hubungi penjual";
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice)) return "Hubungi penjual";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(numericPrice);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}
