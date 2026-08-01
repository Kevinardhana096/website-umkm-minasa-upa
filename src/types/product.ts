export interface Product {
  id: string;
  name: string;
  merchantName: string;
  merchantAvatar?: string;
  location: string;
  category?: 'Batik & Pakaian' | 'Kerajinan Kayu' | 'Tas & Anyaman' | 'Kriya';
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
  whatsappNumber: string;
  isAvailable?: boolean;
  isVisible?: boolean;
}

export type CategoryOption = 'Semua' | 'Batik & Pakaian' | 'Kerajinan Kayu' | 'Tas & Anyaman' | 'Kriya';
