import type { Product } from "@/types/product";

export interface ProductRow {
  id: string;
  store_id: string;
  name: string;
  description: string;
  image_path: string | null;
  price: number | string | null;
  is_available: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreRow {
  id: string;
  owner_id: string;
  name: string;
  seller_name: string;
  description: string | null;
  whatsapp_number: string;
  is_active: boolean;
}

export interface CatalogStore {
  name: string;
  sellerName: string;
  description: string;
  whatsappNumber: string;
}

export function toPublicImageUrl(
  imagePath: string | null | undefined,
  supabaseUrl?: string,
) {
  if (!imagePath) return undefined;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  if (!supabaseUrl) return undefined;

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/product-images/${imagePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export function mapProductRow(
  row: ProductRow,
  store: StoreRow,
  supabaseUrl?: string,
): Product {
  return {
    id: row.id,
    name: row.name,
    merchantName: store.name || store.seller_name,
    merchantAvatar: undefined,
    location: "Indonesia",
    category: undefined,
    description: row.description,
    fullDescription: row.description,
    price: row.price === null ? null : Number(row.price),
    stock: row.is_available ? undefined : 0,
    isVerified: store.is_active,
    imageUrl: toPublicImageUrl(row.image_path, supabaseUrl),
    whatsappNumber: store.whatsapp_number,
    isAvailable: row.is_available,
    isVisible: row.is_visible,
  };
}

export function formatRupiah(value: number | null) {
  if (value === null || Number.isNaN(value)) return "Hubungi penjual";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
