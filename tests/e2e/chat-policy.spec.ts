import { expect, test, type APIRequestContext } from "@playwright/test";

async function ask(request: APIRequestContext, message: string, extra: Record<string, unknown> = {}) {
  const response = await request.post("/api/chat", {
    data: { message, ...extra },
    headers: { "x-forwarded-for": `e2e-${Date.now()}-${Math.random()}` },
  });
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<{ reply?: string; source?: string; whatsappNumber?: string }>;
}

test.describe("chat policy", () => {
  test("memesan dan membeli memakai jawaban pembelian yang sama", async ({ request }) => {
    const [buying, ordering] = await Promise.all([
      ask(request, "Bagaimana cara membeli produk?"),
      ask(request, "Bagaimana cara memesan produk?"),
    ]);

    expect(ordering.reply).toBe(buying.reply);
    expect(ordering.reply).toContain("WhatsApp");
  });

  test("reset password akun publik tidak dianggap permintaan rahasia", async ({ request }) => {
    const response = await ask(request, "Saya lupa password akun, bagaimana cara reset?");

    expect(response.reply).toContain("reset password");
    expect(response.source).toBe("website");
  });

  test("pertanyaan transaksi yang belum didukung diarahkan ke penjual", async ({ request }) => {
    const response = await ask(request, "Apakah produk ini bisa COD?");

    expect(response.reply).toContain("kebijakan pembayaran");
    expect(response.reply).toContain("penjual");
  });

  test("pertanyaan umum yang jelas di luar scope tidak diteruskan ke provider", async ({ request }) => {
    const response = await ask(request, "Berapa harga saham hari ini?");

    expect(response.source).toBe("scope");
    expect(response.reply).toContain("hanya dapat membantu");
  });

  test("konteks produk dipakai untuk multi-intent tetapi tidak mengalahkan pertanyaan desa", async ({ request }) => {
    const catalogPage = await request.get("/katalog");
    expect(catalogPage.ok()).toBeTruthy();
    const catalogHtml = await catalogPage.text();
    const label = catalogHtml.match(/aria-label="Lihat detail ([^"]+)"/i)?.[1];
    const productName = label
      ?.replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .trim();
    if (!productName) {
      test.skip(true, "Tidak ada produk publik untuk pengujian konteks produk.");
      return;
    }

    const productContext = {
      id: "e2e-context-product",
      name: productName,
      merchantName: "Penjual pengujian",
      description: "Produk pengujian untuk chat.",
      price: 15000,
      isAvailable: true,
      whatsappNumber: "628123456789",
    };

    const productReply = await ask(
      request,
      `Berapa harga dan stok ${productName}, serta bagaimana cara memesannya?`,
      { product_id: productContext.id, product: productContext },
    );
    expect(productReply.reply).toContain(`Harga "${productName}"`);
    expect(productReply.reply).toContain(`Produk "${productName}"`);
    expect(productReply.reply).toContain("Untuk membeli atau memesan");

    const explanationReply = await ask(
      request,
      `Tolong jelaskan produk "${productName}".`,
      { product_id: productContext.id, product: productContext },
    );
    expect(explanationReply.source).toBe("catalog");
    expect(explanationReply.reply).toContain(`"${productName}"`);
    expect(explanationReply.reply).toContain("Harga saat ini");
    expect(explanationReply.reply).toContain("Untuk membeli atau memesan");
    expect(explanationReply.reply).toMatch(/Rp\s+15\.000/);
    expect(explanationReply.reply).not.toContain("Chat AI dapat membantu menjelaskan produk");

    const villageReply = await ask(
      request,
      "Di mana letak Desa Minasa Upa?",
      { product_id: productContext.id, product: productContext },
    );
    expect(villageReply.source).toBe("knowledge");
    expect(villageReply.reply).toContain("Kecamatan Bontoa");

    const offTopicReply = await ask(
      request,
      "Berapa harga saham hari ini?",
      { product_id: productContext.id, product: productContext },
    );
    expect(offTopicReply.source).toBe("scope");
    expect(offTopicReply.whatsappNumber).toBeUndefined();
  });
});
