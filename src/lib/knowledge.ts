export interface PublicKnowledgeReply {
  reply: string;
  source: "knowledge";
}

export type PublicKnowledgeIntent = "village" | "group" | "business";

const VILLAGE_PROFILE = [
  "Desa Minasa Upa berada di Kecamatan Bontoa, Kabupaten Maros, Provinsi Sulawesi Selatan.",
  "Desa ini memiliki potensi ekonomi lokal pada industri rumah tangga, kerajinan, dan kegiatan UMKM yang banyak melibatkan kelompok perempuan.",
  "Wilayah desa memiliki luas sekitar 8,5 km², sekitar 3.200 penduduk, dan 4 dusun. Angka tersebut dapat berubah dan perlu dikonfirmasi jika digunakan untuk keputusan resmi.",
].join(" ");

const GROUP_PROFILE = [
  "Kelompok UMKM Wanita Tangguh Minasa Upa adalah kelompok usaha bersama yang berdiri sejak 2020 dan terdiri dari 13 perempuan usia produktif.",
  "Produk kelompok meliputi kue coklat balok, kue kering, onde-onde, sambal kemasan berbagai varian, dan keripik pisang.",
  "Produksi dilakukan secara rumahan oleh anggota kelompok dengan bahan baku yang diperoleh dari pasar lokal Maros dan petani setempat.",
].join(" ");

const BUSINESS_CONTEXT = [
  "Pemasaran kelompok masih berfokus pada pasar tradisional, warung lokal, pesanan kenalan, Facebook, dan WhatsApp pribadi.",
  "Tantangan usaha meliputi identitas merek dan kemasan yang belum konsisten, pembuatan konten promosi yang masih terbatas, serta pembukuan dan pengelolaan stok yang belum terdigitalisasi secara terstruktur.",
].join(" ");

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
    && /masalah|kendala|tantangan|kondisi|pemasaran|branding|kemasan|konten|pembukuan|digital/i.test(message);
}

export function buildPublicKnowledgeReply(
  message: string,
  intent?: PublicKnowledgeIntent,
): PublicKnowledgeReply | null {
  if (hasLatestIntent(message)) return null;

  const village = intent === "village" || asksAboutVillage(message);
  const group = intent === "group" || asksAboutGroup(message);
  const business = intent === "business" || asksAboutBusinessContext(message);
  if (!village && !group && !business) return null;

  const sections: string[] = [];
  if (village) sections.push(`Tentang desa: ${VILLAGE_PROFILE}`);
  if (group || business) sections.push(`Tentang kelompok: ${GROUP_PROFILE}`);
  if (business) sections.push(`Kondisi usaha: ${BUSINESS_CONTEXT}`);

  return {
    reply: sections.join(" "),
    source: "knowledge",
  };
}

export function getPublicKnowledgeContext() {
  return [
    "<public_project_knowledge>",
    `- Desa: ${VILLAGE_PROFILE}`,
    `- Kelompok: ${GROUP_PROFILE}`,
    `- Kondisi usaha: ${BUSINESS_CONTEXT}`,
    "Gunakan ini sebagai profil statis proyek. Angka dan kondisi dapat berubah; jangan menganggapnya sebagai data real-time atau mengarang harga, stok, legalitas, dan kontak.",
    "</public_project_knowledge>",
  ].join("\n");
}
