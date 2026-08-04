import type { ChatReply } from "@/lib/chat";
import { hasPurchaseSignal, hasTransactionSignal, PURCHASE_ACTION_PATTERN } from "@/lib/chat-policy";

const WEBSITE_ACTION_PATTERN = /\b(?:pakai|gunakan|menggunakan|mencari|melihat|lihat|menemukan|menghubungi)\b/i;
const PASSWORD_HELP_PATTERN = /(?:lupa|reset|ubah|ganti|mengganti|tidak\s+bisa|tidak\s+dapat)[\s\S]{0,60}(?:password|kata\s+sandi)|(?:password|kata\s+sandi)[\s\S]{0,60}(?:lupa|reset|ubah|ganti|login|masuk)/i;

function isWebsiteHelpQuestion(message: string) {
  return /website|situs|katalog|halaman|fitur|login|masuk|daftar|register|akun|dashboard|chat\s+(ini|ai|bot|katalog|website)|asisten|chatbot/i.test(message)
    || (/\b(?:cara|bagaimana|gimana)\b/i.test(message)
      && (WEBSITE_ACTION_PATTERN.test(message) || PURCHASE_ACTION_PATTERN.test(message)))
    || hasPurchaseSignal(message)
    || hasTransactionSignal(message);
}

export function buildWebsiteHelpReply(message: string, force = false): ChatReply | null {
  if (!force && !isWebsiteHelpQuestion(message)) return null;

  if (PASSWORD_HELP_PATTERN.test(message)) {
    return {
      reply: "Jika lupa atau ingin mengganti password akun, gunakan opsi reset password pada halaman Login. Tautan reset akan dikirim melalui email akun yang terdaftar.",
      source: "website",
    };
  }

  if (/login|masuk|daftar|register|akun|dashboard|admin|akun\s+toko|dashboard\s+toko|kelola\s+toko/i.test(message)) {
    return {
      reply: "Akun toko dan admin digunakan untuk mengakses dashboard, sedangkan akun anggota langsung menuju katalog dan dapat menambahkan produk miliknya. Pendaftaran akun publik tidak dibuka; akun dibuat oleh pengelola website. Jika sudah memiliki akun, gunakan halaman Login.",
      source: "website",
    };
  }

  if (/chat|asisten|chatbot|tanya ai/i.test(message)) {
    return {
      reply: "Chat AI dapat membantu menjelaskan produk, mencari informasi katalog, menjawab pertanyaan tentang Desa Minasa Upa dan UMKM, serta mengarahkan pengguna untuk menghubungi penjual.",
      source: "website",
    };
  }

  if (PURCHASE_ACTION_PATTERN.test(message) || /whatsapp|\bwa\b|hubung|kontak/i.test(message)) {
    return {
      reply: "Untuk membeli produk, buka detail produk lalu gunakan tombol WhatsApp untuk menghubungi penjual. Konfirmasi stok, harga akhir, jumlah pesanan, dan pengiriman dilakukan langsung dengan penjual.",
      source: "website",
    };
  }

  if (hasTransactionSignal(message)) {
    return {
      reply: "Katalog belum menetapkan kebijakan pembayaran, COD, pengiriman, retur, atau komplain. Silakan konfirmasi ketentuan tersebut langsung kepada penjual melalui WhatsApp.",
      source: "website",
    };
  }

  if (/lokasi|alamat|peta|rute/i.test(message)) {
    return {
      reply: "Gunakan bagian Lokasi Desa pada website untuk melihat alamat, peta, petunjuk rute, dan lokasi pusat kegiatan UMKM Desa Minasa Upa.",
      source: "website",
    };
  }

  return {
    reply: "Website ini menyediakan katalog produk UMKM, detail produk, kontak WhatsApp penjual, informasi Desa Minasa Upa, lokasi UMKM, dan chat AI. Pilih produk untuk melihat detail atau tanyakan kebutuhan Anda melalui chat.",
    source: "website",
  };
}

export function getWebsiteKnowledgeContext() {
  return [
    "<public_website_knowledge>",
    "Website ini menyediakan katalog produk UMKM, detail produk, kontak WhatsApp penjual, informasi Desa Minasa Upa, lokasi UMKM, dan chat AI.",
    "Pengguna umum dapat melihat katalog dan menghubungi penjual. Akun toko/admin dibuat oleh pengelola; anggota langsung menuju katalog dan dapat menambahkan serta mengelola produk miliknya sendiri. Pendaftaran publik tidak dibuka.",
    "Konfirmasi stok, harga akhir, jumlah pesanan, dan pengiriman dilakukan langsung dengan penjual melalui WhatsApp.",
    "Jangan mengungkap API key, password, service-role key, isi environment, bypass login, atau detail database internal.",
    "</public_website_knowledge>",
  ].join("\n");
}
