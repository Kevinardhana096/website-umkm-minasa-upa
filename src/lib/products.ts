import type { Product, ProductCategory } from "@/types/product";

export const MAX_PRODUCT_IMAGES = 5;
export const MAX_FEATURED_PRODUCTS = 4;

export interface ProductRow {
  id: string;
  store_id: string;
  created_by: string | null;
  name: string;
  category: ProductCategory | null;
  description: string;
  image_path: string | null;
  product_images: ProductImageRow[];
  whatsapp_number: string | null;
  price: number | string | null;
  is_available: boolean;
  is_visible: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  store_name?: string;
}

export interface ProductImageRow {
  id: string;
  product_id: string;
  image_path: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductQueryRow extends Omit<ProductRow, "product_images"> {
  product_images: ProductImageRow[] | null;
}

export const PRODUCT_SELECT = "id, store_id, created_by, name, category, description, image_path, whatsapp_number, price, is_available, is_visible, is_featured, created_at, updated_at, product_images(id, product_id, image_path, sort_order, is_primary, created_at, updated_at)";

export function normalizeProductRow(row: ProductQueryRow): ProductRow {
  const images = [...(row.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const primaryImage = images.find((image) => image.is_primary) ?? images[0];

  return {
    ...row,
    image_path: primaryImage?.image_path ?? row.image_path,
    product_images: images,
  };
}

export function normalizeProductRows(rows: ProductQueryRow[] | null | undefined) {
  return (rows ?? []).map(normalizeProductRow);
}

export interface StoreRow {
  id: string;
  owner_id: string;
  name: string;
  name_normalized?: string | null;
  seller_name: string;
  description: string | null;
  whatsapp_number: string;
  is_active: boolean;
}

export interface CatalogStoreOption {
  id: string;
  name: string;
  sellerName?: string;
  whatsappNumber?: string;
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
  options?: { includeOwnership?: boolean },
): Product {
  const imagePaths = row.product_images.length > 0
    ? row.product_images.map((image) => image.image_path)
    : row.image_path ? [row.image_path] : [];
  const imageUrls = imagePaths
    .map((imagePath) => toPublicImageUrl(imagePath, supabaseUrl))
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl));

  return {
    id: row.id,
    storeId: row.store_id,
    createdBy: options?.includeOwnership === false ? undefined : row.created_by,
    name: row.name,
    merchantName: store.name || store.seller_name,
    merchantAvatar: undefined,
    location: "Indonesia",
    category: row.category ?? "Makanan Olahan Lainnya",
    description: row.description,
    fullDescription: row.description,
    price: row.price === null ? null : Number(row.price),
    stock: row.is_available ? undefined : 0,
    isVerified: store.is_active,
    imageUrl: imageUrls[0],
    imageUrls,
    whatsappNumber: row.whatsapp_number || store.whatsapp_number,
    isAvailable: row.is_available,
    isVisible: row.is_visible,
    isFeatured: row.is_featured,
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
