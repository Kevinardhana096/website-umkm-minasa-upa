import type { ChatIntentRoute } from "@/lib/chat-intent";

export const PURCHASE_ACTION_PATTERN = /\b(?:beli(?:nya)?|membeli(?:nya)?|pembelian|pesan(?:nya)?|memesan(?:nya)?|pesanan|pemesanan|order(?:nya)?)\b/i;

const COMMERCE_TRANSACTION_PATTERN = /\b(?:cod|ongkir|pengiriman|dikirim|retur|refund|komplain|pesanan|pemesanan|beli(?:nya)?|membeli(?:nya)?|pesan(?:nya)?|memesan(?:nya)?|order(?:nya)?)\b/i;
const GENERIC_PAYMENT_PATTERN = /\b(?:transfer|bayar|pembayaran)\b/i;
const VILLAGE_SCOPE_PATTERN = /desa|minasa\s+upa|maros|bontoa|dusun|penduduk|wilayah\s+desa|alamat\s+desa|lokasi\s+desa|kantor\s+desa|kepala\s+desa|peta\s+desa|rute\s+ke\s+desa/i;
const GROUP_SCOPE_PATTERN = /wanita\s+tangguh|kelompok\s+umkm|umkm\s+minasa|kelompok\s+usaha/i;
const BUSINESS_SCOPE_PATTERN = /pemasaran|marketing|promosi|branding|kemasan|konten(?:\s+(?:promosi|produk))?|pembukuan|digital(?:isasi)?|strategi\s+usaha|kendala\s+usaha|tantangan\s+usaha|masalah\s+usaha/i;
const WEBSITE_SCOPE_PATTERN = /website|situs|katalog|halaman|fitur|login|masuk|daftar|register|akun|dashboard|chat\s+(?:ini|ai|bot|katalog|website)|asisten|chatbot/i;
const WEBSITE_ACTION_PATTERN = /\b(?:pakai|gunakan|menggunakan|mencari|melihat|lihat|menemukan|menghubungi)\b/i;
const CATALOG_SCOPE_PATTERN = /katalog|produk|toko|penjual|umkm|wanita\s+tangguh|harga|stok|tersedia|whatsapp|\bwa\b|rekomendasi\s+(?:produk|toko)|bandingkan\s+(?:produk|toko)|termurah|termahal/i;
const CONTACT_PATTERN = /whatsapp|\bwa\b|(?:nomor|kontak|hubung)[\s\S]{0,40}(?:penjual|toko|produk|katalog|umkm)|(?:penjual|toko)[\s\S]{0,40}(?:nomor|kontak|whatsapp|hubung)/i;
const PRODUCT_FOLLOW_UP_PATTERN = /\b(?:produk|barang|ini|itu|tadi|tersebut|harganya|stoknya|nomornya|pesannya|memesannya|membelinya|harga|stok|tersedia|beli(?:nya)?|membeli(?:nya)?|pesan(?:nya)?|memesan(?:nya)?|order(?:nya)?|whatsapp|penjual)\b/i;
const CONVERSATION_FOLLOW_UP_PATTERN = /\b(?:yang\s+(?:tadi|ini|itu)|sebelumnya|tersebut|harganya|stoknya|nomornya|pesannya|yang\s+(?:paling|lain))\b/i;
const OBVIOUS_OFF_TOPIC_PATTERN = /\b(?:politik|presiden|pemilu|coding|programming|javascript|typescript|python|dokter|obat|penyakit|film|musik|lagu|game|saham|bitcoin|crypto|sepak\s+bola|bola)\b/i;
const DOMAIN_ANCHOR_PATTERN = /desa|minasa\s+upa|maros|bontoa|umkm|wanita\s+tangguh|katalog|website|situs|produk\s+umkm|toko|penjual|whatsapp|\bwa\b/i;

export function hasVillageScopeSignal(message: string) {
  return VILLAGE_SCOPE_PATTERN.test(message);
}

export function hasGroupScopeSignal(message: string) {
  return GROUP_SCOPE_PATTERN.test(message);
}

export function hasBusinessScopeSignal(message: string) {
  return BUSINESS_SCOPE_PATTERN.test(message);
}

export function hasWebsiteScopeSignal(message: string) {
  return WEBSITE_SCOPE_PATTERN.test(message)
    || (/(?:cara|bagaimana|gimana)/i.test(message) && (WEBSITE_ACTION_PATTERN.test(message) || PURCHASE_ACTION_PATTERN.test(message)))
    || PURCHASE_ACTION_PATTERN.test(message)
    || hasTransactionSignal(message);
}

export function hasCatalogScopeSignal(message: string) {
  return CATALOG_SCOPE_PATTERN.test(message) && !isObviousOffTopicRequest(message);
}

export function hasPurchaseSignal(message: string) {
  return PURCHASE_ACTION_PATTERN.test(message);
}

export function hasTransactionSignal(message: string) {
  return COMMERCE_TRANSACTION_PATTERN.test(message)
    || GENERIC_PAYMENT_PATTERN.test(message) && /produk|pesan|toko|penjual|katalog|umkm|website|order/i.test(message);
}

export function hasContactSignal(message: string) {
  return CONTACT_PATTERN.test(message);
}

export function hasProductFollowUpSignal(message: string) {
  if (!PRODUCT_FOLLOW_UP_PATTERN.test(message)) return false;
  if (hasVillageScopeSignal(message) && !/produk|barang|penjual|toko|whatsapp|\bwa\b/i.test(message)) return false;
  if (/\b(?:login|masuk|website|situs|akun|dashboard)\b/i.test(message) && !/produk|barang|harga|stok|pesan|beli/i.test(message)) return false;
  return true;
}

export function isConversationFollowUp(message: string) {
  return CONVERSATION_FOLLOW_UP_PATTERN.test(message);
}

export function isObviousOffTopicRequest(message: string) {
  return OBVIOUS_OFF_TOPIC_PATTERN.test(message) && !DOMAIN_ANCHOR_PATTERN.test(message);
}

export function hasRelevantScopeSignal(message: string, hasProduct = false) {
  if (isObviousOffTopicRequest(message)) return false;

  return hasProduct
    || hasVillageScopeSignal(message)
    || hasGroupScopeSignal(message)
    || hasBusinessScopeSignal(message)
    || hasWebsiteScopeSignal(message)
    || hasCatalogScopeSignal(message);
}

export function isIntentScopeAllowed(
  route: ChatIntentRoute,
  message: string,
  hasProduct = false,
) {
  if (route === "off_topic") return true;
  if (isObviousOffTopicRequest(message)) return false;

  if (route === "knowledge_village") return hasVillageScopeSignal(message);
  if (route === "knowledge_group") return hasGroupScopeSignal(message);
  if (route === "knowledge_business") return hasBusinessScopeSignal(message) || hasGroupScopeSignal(message) && /kondisi|masalah|kendala|tantangan|pemasaran|branding|kemasan|konten|pembukuan|digital/i.test(message);
  if (route === "website_help") return hasWebsiteScopeSignal(message) || hasProduct;
  if (route === "catalog_ai") return hasCatalogScopeSignal(message) || hasProduct;
  if (route === "web") return hasRelevantScopeSignal(message, hasProduct);

  return false;
}
