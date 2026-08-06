import { formatRupiah } from "@/lib/products";
import {
  hasContactSignal,
  hasProductFollowUpSignal,
  hasPurchaseSignal,
  hasRelevantScopeSignal as detectRelevantScopeSignal,
  hasVillageScopeSignal,
  isObviousOffTopicRequest,
  isConversationFollowUp,
} from "@/lib/chat-policy";
import type { KnowledgeProvenance } from "@/lib/knowledge-types";

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
  sources?: ChatSource[];
  knowledgeMeta?: KnowledgeProvenance;
  whatsappNumber?: string;
  whatsappMessage?: string;
  source: "catalog" | "knowledge" | "website" | "ai" | "web" | "fallback" | "scope";
  provider?: string;
  cached?: boolean;
  cachedAt?: string;
}

const PRODUCT_LIST_REQUEST_PATTERN = /(?:\bapa\s+saja\b[\s\S]{0,40}\bproduk\b|\bproduk(?:-produk)?\s+(?:apa\s+saja|yang\s+(?:tersedia|ada))\b|\bdaftar\s+produk\b|\b(?:tampilkan|sebutkan|list)\b[\s\S]{0,40}\bproduk\b|\bada\s+(?:produk|barang)\s+apa\b)/i;

const RESTRICTED_INTERNAL_PATTERN = /api\s*key|service[-\s]?role|secret|password|kata\s+sandi|bypass|lewati\s+(login|autentikasi)|environment|\.env|database|basis\s+data|source\s+code|kode\s+sumber|detail\s+internal/i;
const PUBLIC_ACCOUNT_HELP_PATTERN = /(?:lupa|reset|ubah|ganti|mengganti|tidak\s+bisa|tidak\s+dapat)[\s\S]{0,60}(?:password|kata\s+sandi)|(?:password|kata\s+sandi)[\s\S]{0,60}(?:lupa|reset|ubah|ganti|login|masuk)/i;

export function isRestrictedChatRequest(message: string) {
  if (PUBLIC_ACCOUNT_HELP_PATTERN.test(message) && !/api\s*key|service[-\s]?role|secret|environment|\.env|database|basis\s+data/i.test(message)) return false;
  return RESTRICTED_INTERNAL_PATTERN.test(message);
}

export function hasRelevantScopeSignal(message: string, hasProduct = false) {
  return detectRelevantScopeSignal(message, hasProduct);
}

export function isProductListRequest(message: string) {
  return PRODUCT_LIST_REQUEST_PATTERN.test(message);
}

export function buildProductListReply(products: ChatProductContext[]): ChatReply {
  if (products.length === 0) {
    return {
      reply: "Belum ada produk yang tersedia di katalog saat ini.",
      source: "catalog",
    };
  }

  const productLines = products.slice(0, 40).map((product, index) => {
    const price = product.price === null ? "hubungi penjual" : formatRupiah(product.price);
    const status = product.isAvailable ? "tersedia" : "belum tersedia";
    return `${index + 1}. ${product.name} — ${price} (${status}), dari ${product.merchantName}.`;
  });
  const suffix = products.length > 40 ? `\n\nMenampilkan 40 dari ${products.length} produk.` : "";

  return {
    reply: `Berikut produk yang tersedia di katalog UMKM:\n\n${productLines.join("\n")}\n\nPilih produk di katalog untuk melihat detail lengkap atau menghubungi penjual melalui WhatsApp.${suffix}`,
    source: "catalog",
  };
}

export function buildOffTopicChatReply(): ChatReply {
  return {
    reply: "Maaf, saya hanya dapat membantu terkait katalog UMKM, Desa Minasa Upa, Kelompok Wanita Tangguh, dan penggunaan website ini.",
    source: "scope",
  };
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("id-ID");
}

function asksForContact(message: string) {
  return hasContactSignal(message);
}

function asksForPurchase(message: string) {
  return hasPurchaseSignal(message);
}

function asksForPrice(message: string) {
  return /harga|berapa|biaya|tarif|diskon/i.test(message);
}

function asksForAvailability(message: string) {
  if (/\b(?:varian|variasi|rasa|ukuran|warna|pilihan)\b/i.test(message)) return false;
  return /stok|tersedia|ready|ketersediaan|habis/i.test(message);
}

function asksForProductExplanation(message: string) {
  return /jelaskan|detail|deskripsi|tentang|spesifikasi|keunggulan|informasi|tanya\s+ai/i.test(message);
}

export function shouldUseWebSearch(message: string, product?: ChatProductContext) {
  if (product) return false;

  return /desa\s+minasa\s+upa|minasa\s+upa|kelompok\s+umkm|umkm\s+minasa|profil\s+(desa|umkm|kelompok)|sejarah\s+(desa|umkm|kelompok)|visi\s+misi|lokasi\s+(desa|umkm|kelompok)|berita\s+(desa|umkm|kelompok)|informasi\s+(desa|umkm|kelompok)/i.test(message);
}

function getWhatsAppMessage(product?: ChatProductContext, store?: ChatStoreContext) {
  if (product) return `Halo, saya ingin bertanya tentang produk ${product.name}.`;
  return `Halo ${store?.name ?? "penjual"}, saya ingin bertanya tentang produk Anda.`;
}

export function buildProductExplanationReply(
  message: string,
  product?: ChatProductContext,
): ChatReply | null {
  if (!product || !asksForProductExplanation(message)) return null;

  const description = product.description.trim() || "Deskripsi produk belum tersedia.";
  const availability = product.isAvailable
    ? "Produk ini ditandai tersedia di katalog."
    : "Produk ini ditandai belum tersedia di katalog.";

  return {
    reply: `"${product.name}" dari ${product.merchantName}: ${description} Harga saat ini ${formatRupiah(product.price)}. ${availability} Untuk membeli atau memesan, buka detail produk lalu gunakan tombol WhatsApp untuk menghubungi penjual.`,
    whatsappNumber: product.whatsappNumber?.trim() || undefined,
    whatsappMessage: getWhatsAppMessage(product),
    source: "catalog",
  };
}

export function findRelevantProduct(
  message: string,
  products: ChatProductContext[],
  contextProduct?: ChatProductContext | null,
  historyMessages: string[] = [],
) {
  const normalizedMessage = normalizeText(message);
  const exactMatch = products.find((product) => normalizedMessage.includes(normalizeText(product.name)));
  if (exactMatch) return exactMatch;

  const contextualProduct = contextProduct && !hasVillageScopeSignal(message) && (hasProductFollowUpSignal(message) || isConversationFollowUp(message))
    ? contextProduct
    : undefined;
  let historyProduct: ChatProductContext | undefined;
  if (isConversationFollowUp(message)) {
    for (const historyMessage of [...historyMessages].reverse()) {
      historyProduct = products.find((product) => normalizeText(historyMessage).includes(normalizeText(product.name)));
      if (historyProduct) break;
    }
  }

  const stopWords = new Set([
    "yang", "dan", "atau", "dari", "untuk", "dengan", "berapa", "apa", "bisa", "tolong", "ingin", "mau", "saya",
    "produk", "barang", "harga", "stok", "pesan", "pesanan", "beli", "membeli", "memesan", "order",
  ]);
  const words = normalizedMessage.split(/\s+/).filter((word) => word.length >= 3 && !stopWords.has(word));
  if (words.length === 0) return contextualProduct || historyProduct;

  const scored = products
    .map((product) => ({
      product,
      score: words.filter((word) => normalizeText(product.name).includes(word)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored[0]?.product) return scored[0].product;

  return contextualProduct || historyProduct;
}

export function buildDirectChatReply(
  message: string,
  product?: ChatProductContext,
  store?: ChatStoreContext,
): ChatReply | null {
  const whatsappNumber = product?.whatsappNumber?.trim() || store?.whatsappNumber?.trim() || undefined;
  const whatsappMessage = getWhatsAppMessage(product, store);

  const asksContact = asksForContact(message);
  const asksPurchase = asksForPurchase(message);
  const asksPrice = asksForPrice(message);
  const asksAvailability = asksForAvailability(message);
  const sections: string[] = [];

  if (asksPrice && product) {
    sections.push(`Harga "${product.name}" saat ini ${formatRupiah(product.price)}.`);
  }

  if (asksAvailability && product) {
    sections.push(product.isAvailable
      ? `Produk "${product.name}" saat ini ditandai tersedia di katalog.`
      : `Produk "${product.name}" saat ini ditandai belum tersedia di katalog.`);
  }

  if (asksPurchase && product) {
    sections.push(`Untuk membeli atau memesan "${product.name}", buka detail produk lalu gunakan tombol WhatsApp untuk menghubungi penjual. Konfirmasi stok, harga akhir, jumlah pesanan, dan pengiriman dilakukan langsung dengan penjual.`);
  }

  if (asksContact && !asksPurchase) {
    sections.push(whatsappNumber
      ? `Nomor WhatsApp penjual${product ? ` untuk produk "${product.name}"` : ""} adalah +${whatsappNumber}.`
      : "Nomor WhatsApp penjual belum tersedia pada katalog ini.");
  }

  if (sections.length === 0) return null;

  return {
    reply: sections.join(" "),
    whatsappNumber,
    whatsappMessage,
    source: "catalog",
  };
}

export function buildFallbackChatReply(
  message: string,
  product?: ChatProductContext,
  store?: ChatStoreContext,
): ChatReply {
  const directReply = buildDirectChatReply(message, product, store);
  if (directReply) return { ...directReply, source: "fallback" };

  const productExplanationReply = buildProductExplanationReply(message, product);
  if (productExplanationReply) return { ...productExplanationReply, source: "fallback" };

  const productQuestion = Boolean(
    product
    && !isObviousOffTopicRequest(message)
    && (asksForContact(message)
      || asksForPurchase(message)
      || asksForPrice(message)
      || asksForAvailability(message)
      || hasProductFollowUpSignal(message)),
  );
  const shouldAttachWhatsapp = productQuestion || asksForContact(message) || asksForPurchase(message);

  return {
    reply: product
      ? `Maaf, informasi yang Anda tanyakan tentang "${product.name}" belum dapat disiapkan saat ini. Silakan coba lagi atau hubungi penjual untuk memastikan detail tersebut.`
      : "Silakan pilih produk untuk melihat detailnya, atau tanyakan informasi umum tentang katalog UMKM Wanita Tangguh Minasa Upa.",
    whatsappNumber: shouldAttachWhatsapp
      ? product?.whatsappNumber?.trim() || store?.whatsappNumber?.trim() || undefined
      : undefined,
    whatsappMessage: shouldAttachWhatsapp ? getWhatsAppMessage(product, store) : undefined,
    source: "fallback",
  };
}

export function buildWebSearchUnavailableReply(): ChatReply {
  return {
    reply: "Maaf, saya belum dapat mengakses sumber web saat ini. Silakan coba lagi beberapa saat.",
    source: "fallback",
  };
}

export function buildCatalogUnavailableReply(): ChatReply {
  return {
    reply: "Maaf, katalog sedang tidak dapat dimuat. Silakan coba lagi beberapa saat untuk melihat harga, stok, dan kontak penjual.",
    source: "fallback",
  };
}
