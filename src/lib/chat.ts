import { formatRupiah } from "@/lib/products";

export interface ChatProductContext {
  id: string;
  name: string;
  merchantName: string;
  description: string;
  price: number | null;
  isAvailable: boolean;
  whatsappNumber: string;
}

export interface ChatStoreContext {
  name: string;
  sellerName?: string;
  description?: string;
  whatsappNumber: string;
}

export interface ChatSource {
  title: string;
  url: string;
}

export interface ChatReply {
  reply: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
  source: "catalog" | "knowledge" | "ai" | "web" | "fallback";
  provider?: string;
  sources?: ChatSource[];
  cached?: boolean;
  cachedAt?: string;
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("id-ID");
}

function asksForContact(message: string) {
  return /whatsapp|\bwa\b|nomor|kontak|hubung|pesan|beli/i.test(message);
}

function asksForPrice(message: string) {
  return /harga|berapa|biaya|tarif|diskon/i.test(message);
}

function asksForAvailability(message: string) {
  return /stok|tersedia|ready|ketersediaan|habis/i.test(message);
}

export function shouldUseWebSearch(message: string, product?: ChatProductContext) {
  if (product) return false;

  return /desa\s+minasa\s+upa|minasa\s+upa|kelompok\s+umkm|umkm\s+minasa|profil\s+(desa|umkm|kelompok)|sejarah\s+(desa|umkm|kelompok)|visi\s+misi|lokasi\s+(desa|umkm|kelompok)|berita\s+(desa|umkm|kelompok)|informasi\s+(desa|umkm|kelompok)/i.test(message);
}

function getWhatsAppMessage(product?: ChatProductContext, store?: ChatStoreContext) {
  if (product) return `Halo, saya ingin bertanya tentang produk ${product.name}.`;
  return `Halo ${store?.name ?? "penjual"}, saya ingin bertanya tentang produk Anda.`;
}

export function findRelevantProduct(
  message: string,
  products: ChatProductContext[],
  contextProduct?: ChatProductContext | null,
) {
  if (contextProduct) return contextProduct;

  const normalizedMessage = normalizeText(message);
  const exactMatch = products.find((product) => normalizedMessage.includes(normalizeText(product.name)));
  if (exactMatch) return exactMatch;

  const words = normalizedMessage.split(/\s+/).filter((word) => word.length >= 3);
  if (words.length === 0) return undefined;

  const scored = products
    .map((product) => ({
      product,
      score: words.filter((word) => normalizeText(product.name).includes(word)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.product;
}

export function buildDirectChatReply(
  message: string,
  product?: ChatProductContext,
  store?: ChatStoreContext,
): ChatReply | null {
  const whatsappNumber = product?.whatsappNumber?.trim() || store?.whatsappNumber?.trim() || undefined;
  const whatsappMessage = getWhatsAppMessage(product, store);

  if (asksForContact(message)) {
    return {
      reply: whatsappNumber
        ? `Nomor WhatsApp penjual${product ? ` untuk produk "${product.name}"` : ""} adalah +${whatsappNumber}.`
        : "Nomor WhatsApp penjual belum tersedia pada katalog ini.",
      whatsappNumber,
      whatsappMessage,
      source: "catalog",
    };
  }

  if (asksForPrice(message) && product) {
    return {
      reply: `Harga "${product.name}" saat ini ${formatRupiah(product.price)}. Untuk diskon atau pembelian jumlah banyak, silakan hubungi penjual.`,
      whatsappNumber,
      whatsappMessage,
      source: "catalog",
    };
  }

  if (asksForAvailability(message) && product) {
    return {
      reply: product.isAvailable
        ? `Produk "${product.name}" saat ini ditandai tersedia di katalog.`
        : `Produk "${product.name}" saat ini ditandai belum tersedia di katalog.`,
      whatsappNumber,
      whatsappMessage,
      source: "catalog",
    };
  }

  return null;
}

export function buildFallbackChatReply(
  message: string,
  product?: ChatProductContext,
  store?: ChatStoreContext,
): ChatReply {
  const directReply = buildDirectChatReply(message, product, store);
  if (directReply) return { ...directReply, source: "fallback" };

  return {
    reply: product
      ? `Produk "${product.name}" dari ${product.merchantName} memiliki harga ${formatRupiah(product.price)}. Untuk informasi stok terbaru, detail pesanan, atau negosiasi harga, silakan hubungi penjual langsung melalui WhatsApp.`
      : "Silakan pilih produk untuk melihat detailnya, atau tanyakan informasi umum tentang katalog UMKM Wanita Tangguh Minasa Upa.",
    whatsappNumber: product?.whatsappNumber?.trim() || store?.whatsappNumber?.trim() || undefined,
    whatsappMessage: getWhatsAppMessage(product, store),
    source: "fallback",
  };
}

export function buildWebSearchUnavailableReply(): ChatReply {
  return {
    reply: "Maaf, saya belum dapat mengakses sumber web saat ini. Silakan coba lagi beberapa saat.",
    source: "fallback",
  };
}
