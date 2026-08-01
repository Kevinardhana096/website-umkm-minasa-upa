import { Edit, Image as ImageIcon, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { formatRupiah, toPublicImageUrl, type ProductRow } from "@/lib/products";

interface ProductTableProps {
  products: ProductRow[];
  supabaseUrl?: string;
  isLoading?: boolean;
  onEdit: (product: ProductRow) => void;
  onDelete: (product: ProductRow) => void;
}

export function ProductTable({ products, supabaseUrl, isLoading = false, onEdit, onDelete }: ProductTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query));
  }, [products, searchQuery]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50/50 p-4 sm:p-5">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari produk..." className="w-full rounded-xl border border-transparent bg-gray-100 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-gray-300 focus:bg-white" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead><tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-500"><th className="px-6 py-4">Produk</th><th className="px-6 py-4">Harga</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {isLoading ? <tr><td colSpan={4} className="py-10 text-center text-gray-400">Memuat produk...</td></tr> : filteredProducts.length === 0 ? <tr><td colSpan={4} className="py-10 text-center text-gray-400">Belum ada produk.</td></tr> : filteredProducts.map((product) => {
              const imageUrl = toPublicImageUrl(product.image_path, supabaseUrl);
              return <tr key={product.id} className="hover:bg-gray-50/80">
                <td className="px-6 py-4"><div className="flex items-center gap-4"><div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">{imageUrl ? <Image src={imageUrl} alt={product.name} fill unoptimized sizes="48px" className="object-cover" /> : <ImageIcon className="h-5 w-5 text-gray-400" />}</div><div><p className="font-bold text-gray-900">{product.name}</p><p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{product.description || "Tanpa deskripsi"}</p></div></div></td>
                <td className="px-6 py-4 font-semibold text-gray-800">{formatRupiah(product.price === null ? null : Number(product.price))}</td>
                <td className="px-6 py-4">{product.is_visible && product.is_available ? <span className="inline-flex rounded-full bg-[#E6F4EA] px-3 py-1 text-xs font-semibold text-[#1E7E34]">Aktif</span> : <span className="inline-flex rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">Disembunyikan</span>}</td>
                <td className="px-6 py-4 text-right"><div className="flex justify-end gap-1"><button onClick={() => onEdit(product)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-800" title="Edit produk"><Edit className="h-4 w-4" /></button><button onClick={() => onDelete(product)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600" title="Hapus produk"><Trash2 className="h-4 w-4" /></button></div></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-100 px-4 py-4 text-xs font-medium text-gray-500">Menampilkan {filteredProducts.length} dari {products.length} produk</div>
    </div>
  );
}
