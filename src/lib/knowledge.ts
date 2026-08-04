import type { KnowledgeProvenance } from "@/lib/knowledge-types";

export interface PublicKnowledgeReply {
  reply: string;
  source: "knowledge";
  knowledgeMeta: KnowledgeProvenance;
}

export type PublicKnowledgeIntent = "village" | "group" | "business";

export const PUBLIC_KNOWLEDGE_METADATA: KnowledgeProvenance = {
  documentId: "minasa-upa-umkm-profile",
  title: "Profil publik Desa Minasa Upa dan Kelompok UMKM Wanita Tangguh",
  sourceType: "internal_draft",
  sourceLabel: "Snapshot profil proyek; belum diverifikasi dengan dokumen resmi",
  verifiedAt: null,
  version: "2026-08-04.2",
  status: "draft",
};

interface PublicKnowledgeEntry {
  id: string;
  intent: PublicKnowledgeIntent;
  text: string;
}

const PRIVATE_BUSINESS_DATA_PATTERN = /masalah|kendala|tantangan|kondisi|pemasaran|branding|kemasan|konten|pembukuan|digital|omzet|penjualan|pendapatan|kapasitas\s+produksi|sertifikasi|pirt|jangkauan\s+pasar|radius\s+pasar|kanal\s+penjualan|usia\s+anggota|umur\s+anggota/i;

const PUBLIC_KNOWLEDGE_ENTRIES: PublicKnowledgeEntry[] = [
  {
    id: "village-location-and-potential",
    intent: "village",
    text: "Desa Minasa Upa berada di Kecamatan Bontoa, Kabupaten Maros, Provinsi Sulawesi Selatan. Desa ini memiliki potensi ekonomi lokal pada industri rumah tangga, kerajinan, dan kegiatan UMKM yang banyak melibatkan kelompok perempuan.",
  },
  {
    id: "village-size-population-and-hamlets",
    intent: "village",
    text: "Wilayah desa memiliki luas sekitar 8,5 km², sekitar 3.200 penduduk, dan 4 dusun. Angka tersebut dapat berubah dan perlu dikonfirmasi jika digunakan untuk keputusan resmi.",
  },
  {
    id: "group-profile",
    intent: "group",
    text: "Kelompok UMKM Wanita Tangguh Minasa Upa adalah kelompok usaha bersama yang berdiri sejak 2020 dan terdiri dari 13 perempuan usia produktif.",
  },
  {
    id: "group-products-and-production",
    intent: "group",
    text: "Produk kelompok meliputi kue coklat balok, kue kering, onde-onde, sambal kemasan berbagai varian, dan keripik pisang. Produksi dilakukan secara rumahan oleh anggota kelompok dengan bahan baku yang diperoleh dari pasar lokal Maros dan petani setempat.",
  },
];

function hasLatestIntent(message: string) {
  return /terbaru|terkini|hari\s+ini|sekarang|update|berita|riwayat|jadwal|harga|stok|tersedia|kontak|whatsapp|nomor/i.test(message);
}

function asksAboutVillage(message: string) {
  return /desa\s+minasa\s+upa|minasa\s+upa/i.test(message)
    && /apa\s+itu|profil|tentang|jelaskan|lokasi|di\s+mana|dimana|letak|terletak|berada|alamat|wilayah|penduduk|dusun|potensi|kondisi/i.test(message);
}

function asksAboutGroup(message: string) {
  return /(kelompok\s+umkm|umkm\s+minasa|wanita\s+tangguh|kelompok\s+usaha)/i.test(message)
    && /apa\s+itu|profil|tentang|jelaskan|produk|usaha|anggota|berdiri|kondisi|pemasaran|buat|jual/i.test(message);
}

function asksAboutBusinessContext(message: string) {
  return /(kelompok\s+umkm|umkm\s+minasa|wanita\s+tangguh|pemasaran\s+umkm)/i.test(message)
    && PRIVATE_BUSINESS_DATA_PATTERN.test(message);
}

function asksAboutPrivateBusinessData(message: string) {
  return PRIVATE_BUSINESS_DATA_PATTERN.test(message)
    && /(kelompok|umkm|minasa\s+upa|wanita\s+tangguh|produk|usaha)/i.test(message);
}

function getEntriesForIntent(intent: PublicKnowledgeIntent) {
  return PUBLIC_KNOWLEDGE_ENTRIES
    .filter((entry) => entry.intent === intent)
    .map((entry) => entry.text);
}

function getKnowledgeDisclaimer() {
  return PUBLIC_KNOWLEDGE_METADATA.status === "verified"
    ? ""
    : " Catatan: ini snapshot profil proyek yang belum diverifikasi dengan dokumen resmi, bukan data real-time.";
}

function buildPrivateBusinessDataReply(): PublicKnowledgeReply {
  return {
    reply: "Informasi operasional internal kelompok tidak ditampilkan dalam profil publik. Untuk informasi lebih lanjut, silakan hubungi pengelola atau penjual melalui kontak resmi yang tersedia di website.",
    source: "knowledge",
    knowledgeMeta: getPublicKnowledgeMetadata(),
  };
}

export function getPublicKnowledgeMetadata() {
  return { ...PUBLIC_KNOWLEDGE_METADATA };
}

export function buildPublicKnowledgeReply(
  message: string,
  intent?: PublicKnowledgeIntent,
): PublicKnowledgeReply | null {
  if (hasLatestIntent(message)) return null;

  const village = intent === "village" || asksAboutVillage(message);
  const group = intent === "group" || asksAboutGroup(message);
  const business = intent === "business" || asksAboutBusinessContext(message) || asksAboutPrivateBusinessData(message);
  if (!village && !group && !business) return null;

  if (business) return buildPrivateBusinessDataReply();

  const sections: string[] = [];
  if (village) sections.push(`Tentang desa: ${getEntriesForIntent("village").join(" ")}`);
  if (group || business) sections.push(`Tentang kelompok: ${getEntriesForIntent("group").join(" ")}`);
  return {
    reply: `${sections.join(" ")}${getKnowledgeDisclaimer()}`,
    source: "knowledge",
    knowledgeMeta: getPublicKnowledgeMetadata(),
  };
}

export function getPublicKnowledgeContext() {
  const metadata = PUBLIC_KNOWLEDGE_METADATA;
  const entries = PUBLIC_KNOWLEDGE_ENTRIES
    .map((entry) => `- [${entry.id}] ${entry.text}`)
    .join("\n");

  return [
    "<public_project_knowledge>",
    `<knowledge_provenance>Dokumen: ${metadata.title}; ID: ${metadata.documentId}; versi: ${metadata.version}; status: ${metadata.status}; sumber: ${metadata.sourceLabel}; terverifikasi: ${metadata.verifiedAt ?? "belum"}.</knowledge_provenance>`,
    entries,
    "Gunakan ini sebagai snapshot profil publik proyek. Karena statusnya draft, jangan menyebutnya sebagai data resmi atau real-time.",
    "Data pribadi anggota dan rincian operasional internal seperti penjualan, produksi, sertifikasi, dan jangkauan pasar tidak termasuk dalam knowledge publik. Jika ditanya, katakan bahwa informasi tersebut tidak tersedia untuk publik.",
    "Jangan mengarang sumber resmi, tanggal verifikasi, harga, stok, legalitas, atau kontak yang tidak tercantum.",
    "</public_project_knowledge>",
  ].join("\n");
}
