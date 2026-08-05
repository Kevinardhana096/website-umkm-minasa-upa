export const PRODUCT_CATEGORIES = [
  'Batik & Pakaian',
  'Kerajinan Kayu',
  'Tas & Anyaman',
  'Kriya',
  'Kue & Jajanan',
  'Sambal & Bumbu',
  'Keripik & Camilan',
  'Makanan Olahan Lainnya',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  id: string;
  storeId?: string;
  createdBy?: string | null;
  name: string;
  merchantName: string;
  merchantAvatar?: string;
  location: string;
  category?: ProductCategory;
  description: string;
  fullDescription?: string;
  specifications?: string[];
  guaranteeText?: string;
  price: number | null;
  stock?: number;
  isPreOrder?: boolean;
  preOrderDays?: number;
  isVerified?: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  whatsappNumber: string;
  isAvailable?: boolean;
  isVisible?: boolean;
  isFeatured?: boolean;
}

export type CategoryOption = 'Semua' | ProductCategory;
