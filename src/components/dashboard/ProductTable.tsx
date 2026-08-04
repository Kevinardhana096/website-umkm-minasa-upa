import { Edit, Image as ImageIcon, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
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

      {/* Mobile product cards */}
      <div className="space-y-3 p-3 md:hidden">
        {isLoading ? (
          <div className="py-10 text-center text-sm font-medium text-gray-400">Memuat data produk...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-10 text-center text-sm font-medium text-gray-400">
            {searchQuery ? "Tidak ada produk yang cocok dengan pencarian." : "Belum ada produk tersimpan."}
          </div>
        ) : (
          filteredProducts.map((product) => {
            const imageUrl = toPublicImageUrl(product.image_path, supabaseUrl);
            return (
              <article key={product.id} className="rounded-xl border border-gray-100 bg-white p-3 shadow-2xs">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200/80 bg-gray-50">
                    {imageUrl ? (
                      <Image src={imageUrl} alt={product.name} fill unoptimized sizes="56px" className="object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold leading-5 text-gray-900">{product.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-4 text-gray-500">
                      {product.description || "Tanpa deskripsi"}
                    </p>
                    {product.product_images.length > 1 && (
                      <p className="mt-1 text-[11px] font-bold text-[#963E1B]">{product.product_images.length} foto galeri</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Harga</p>
                    <p className="truncate text-sm font-bold text-gray-900">
                      {formatRupiah(product.price === null ? null : Number(product.price))}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <ProductActionButton label="Edit produk" onClick={() => onEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </ProductActionButton>
                    <ProductActionButton label="Hapus produk" onClick={() => onDelete(product)} danger>
                      <Trash2 className="h-4 w-4" />
                    </ProductActionButton>
                  </div>
                </div>

                <div className="mt-3">
                  <ProductStatus product={product} />
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Table Container */}
      <div className="hidden overflow-x-auto md:block">
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

                    <td className="px-6 py-4 whitespace-nowrap"><ProductStatus product={product} /></td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <ProductActionButton label="Edit produk" onClick={() => onEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </ProductActionButton>
                        <ProductActionButton label="Hapus produk" onClick={() => onDelete(product)} danger>
                          <Trash2 className="h-4 w-4" />
                        </ProductActionButton>
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
      <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-3.5 text-xs font-semibold text-gray-500 sm:px-6">
        Menampilkan {filteredProducts.length} dari {products.length} produk
      </div>
    </div>
  );
}

function ProductStatus({ product }: { product: ProductRow }) {
  return product.is_visible && product.is_available ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Aktif & Tampil
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> Disembunyikan
    </span>
  );
}

function ProductActionButton({
  children,
  label,
  onClick,
  danger = false,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-xl border bg-white p-2 shadow-2xs transition-all ${
        danger
          ? "border-gray-200 text-gray-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}
