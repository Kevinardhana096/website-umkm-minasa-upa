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

export function ProductTable({
  products,
  supabaseUrl,
  isLoading = false,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
      {/* Search Header Bar */}
      <div className="border-b border-gray-100 bg-gray-50/50 p-4 sm:p-5">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama atau deskripsi produk..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F2C23] focus:ring-2 focus:ring-[#0F2C23]/15 shadow-2xs"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/30 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-6 py-3.5">Detail Produk</th>
              <th className="px-6 py-3.5">Harga</th>
              <th className="px-6 py-3.5">Status Tampil</th>
              <th className="px-6 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">
                  Memuat data produk...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">
                  {searchQuery ? "Tidak ada produk yang cocok dengan pencarian." : "Belum ada produk tersimpan."}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const imageUrl = toPublicImageUrl(product.image_path, supabaseUrl);
                return (
                  <tr key={product.id} className="group hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200/80 bg-gray-50 shadow-2xs">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={product.name}
                              fill
                              unoptimized
                              sizes="48px"
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{product.name}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 font-medium">
                            {product.description || "Tanpa deskripsi"}
                          </p>
                          {product.product_images.length > 1 && (
                            <p className="mt-1 text-[11px] font-bold text-[#963E1B]">{product.product_images.length} foto galeri</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                      {formatRupiah(product.price === null ? null : Number(product.price))}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.is_visible && product.is_available ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Aktif & Tampil
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 border border-gray-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> Disembunyikan
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(product)}
                          className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 shadow-2xs"
                          title="Edit produk"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(product)}
                          className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 shadow-2xs"
                          title="Hapus produk"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="border-t border-gray-100 bg-gray-50/40 px-6 py-3.5 text-xs font-semibold text-gray-500">
        Menampilkan {filteredProducts.length} dari {products.length} produk
      </div>
    </div>
  );
}
