export function normalizeWhatsappNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function validateWhatsappNumber(value: string) {
  const normalized = normalizeWhatsappNumber(value);
  if (normalized.length < 8) throw new Error("Nomor WhatsApp belum valid.");
  return normalized;
}
