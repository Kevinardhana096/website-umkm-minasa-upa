import { expect, test, type APIRequestContext } from "@playwright/test";
import { buildPublicKnowledgeReply, getPublicKnowledgeContext, getPublicKnowledgeMetadata } from "../../src/lib/knowledge";
import { buildWebsiteHelpReply } from "../../src/lib/site-knowledge";
import { buildDirectChatReply, buildProductListReply, isProductListRequest } from "../../src/lib/chat";
import { getHttpProviderFailure, shouldFallbackToMistral } from "../../src/lib/chat-provider-policy";

async function ask(request: APIRequestContext, message: string, extra: Record<string, unknown> = {}) {
  const response = await request.post("/api/chat", {
    data: { message, ...extra },
    headers: { "x-forwarded-for": `e2e-${Date.now()}-${Math.random()}` },
  });
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<{ reply?: string; source?: string; whatsappNumber?: string }>;
}

test.describe("chat policy", () => {
  test("Mistral hanya menjadi fallback Gemini untuk quota", () => {
    const quotaFailure = getHttpProviderFailure(429);
    const timeoutFailure = getHttpProviderFailure(408);
    const serverFailure = getHttpProviderFailure(503);
    const authFailure = getHttpProviderFailure(401);

    expect(shouldFallbackToMistral("gemini", "mistral", quotaFailure)).toBe(true);
    expect(shouldFallbackToMistral("gemini", "mistral", timeoutFailure)).toBe(false);
    expect(shouldFallbackToMistral("gemini", "mistral", serverFailure)).toBe(false);
    expect(shouldFallbackToMistral("gemini", "mistral", authFailure)).toBe(false);
    expect(shouldFallbackToMistral("mistral", undefined, quotaFailure)).toBe(false);
  });

  test("pertanyaan daftar produk diarahkan ke daftar katalog", () => {
    expect(isProductListRequest("Apa saja produk yang ada di website ini?")).toBe(true);
    expect(isProductListRequest("Tampilkan daftar produk yang tersedia")).toBe(true);
    expect(isProductListRequest("Bagaimana cara membeli produk?")).toBe(false);
  });

  test("jawaban daftar produk memakai data katalog", () => {
    const response = buildProductListReply([
      {
        id: "product-1",
        name: "Keripik Pisang",
        merchantName: "UMKM Minasa Upa",
        description: "Keripik renyah.",
        price: 15000,
        isAvailable: true,
        whatsappNumber: "628123456789",
      },
    ]);

    expect(response.source).toBe("catalog");
    expect(response.reply).toContain("Keripik Pisang");
    expect(response.reply).toContain("Rp15.000");
  });

  test("pertanyaan varian yang tersedia bukan pertanyaan status stok produk", () => {
    const product = {
      id: "sambal-kemasan",
      name: "Sambal Kemasan",
      merchantName: "UMKM Minasa Upa",
      description: "Sambal kemasan dengan beberapa pilihan rasa.",
      price: 20_000,
      isAvailable: true,
      whatsappNumber: "628123456789",
    };
    const variantResponse = buildDirectChatReply("Apa saja varian rasa Sambal Kemasan yang tersedia?", product);
    const materialResponse = buildDirectChatReply("Apa bahan utama sambal ini?", product);
    const availabilityResponse = buildDirectChatReply("Apakah Sambal Kemasan masih tersedia?", product);
    const orderingResponse = buildDirectChatReply("Bagaimana cara memesan Sambal Kemasan?", product);

    expect(variantResponse).toBeNull();
    expect(materialResponse).toBeNull();
    expect(availabilityResponse?.reply).toContain("ditandai tersedia");
    expect(orderingResponse?.reply).toContain("membeli atau memesan");
  });

  test("pertanyaan memilih toko di katalog tidak diarahkan ke bantuan akun", () => {
    const response = buildWebsiteHelpReply("Bagaimana cara memilih toko di katalog?");

    expect(response?.source).toBe("website");
    expect(response?.reply).toContain("katalog produk");
    expect(response?.reply).not.toContain("Akun toko dan admin");
  });

  test("pertanyaan kondisi hari ini tidak memakai knowledge statis", () => {
    const response = buildPublicKnowledgeReply("Bagaimana kondisi UMKM Minasa Upa hari ini?");

    expect(response).toBeNull();
  });

  test("knowledge memiliki provenance dan status verifikasi yang eksplisit", () => {
    const metadata = getPublicKnowledgeMetadata();
    const response = buildPublicKnowledgeReply("Di mana letak Desa Minasa Upa?");

    expect(metadata.documentId).toBe("minasa-upa-umkm-profile");
    expect(metadata.version).toBeTruthy();
    expect(metadata.status).toBe("draft");
    expect(metadata.verifiedAt).toBeNull();
    expect(metadata.sourceLabel).toContain("belum diverifikasi");
    expect(response?.knowledgeMeta).toEqual(metadata);
    expect(response?.reply).toContain("snapshot profil proyek");
  });

  test("detail operasional internal tidak diberikan oleh knowledge publik", () => {
    for (const message of [
      "Berapa omzet dan kapasitas produksi Kelompok UMKM Wanita Tangguh?",
      "Berapa omzet UMKM ini?",
    ]) {
      const response = buildPublicKnowledgeReply(message);

      expect(response?.source).toBe("knowledge");
      expect(response?.reply).toContain("tidak ditampilkan dalam profil publik");
      expect(response?.reply).not.toContain("Rp");
      expect(response?.reply).not.toContain("kapasitas produksi");
    }
  });

  test("context AI membawa metadata knowledge serta tidak menyebut draft sebagai data resmi", () => {
    const context = getPublicKnowledgeContext();

    expect(context).toContain("<knowledge_provenance>");
    expect(context).toContain("status: draft");
    expect(context).toContain("terverifikasi: belum");
    expect(context).toContain("jangan menyebutnya sebagai data resmi atau real-time");
    expect(context).toContain("tidak termasuk dalam knowledge publik");
    expect(context).toContain("[village-location-and-potential]");
  });

  test("widget menampilkan hanya sumber web dengan URL aman", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply: "Jawaban terbaru dari web.",
          source: "web",
          sources: [
            { title: "Sumber tepercaya", url: "https://example.com/source" },
            { title: "Sumber tidak aman", url: "javascript:alert(1)" },
          ],
        }),
      });
    });

    await page.goto("/profil");
    await page.getByRole("button", { name: "Buka chat" }).click();
    const chat = page.getByRole("dialog", { name: "Asisten UMKM Bot" });
    const input = page.getByLabel("Pesan untuk asisten UMKM");

    await input.fill("Apa kabar terbaru?");
    await input.press("Enter");
    await expect(chat).toContainText("Sumber web");
    await expect(chat.getByRole("link", { name: "Sumber tepercaya" })).toHaveAttribute("href", "https://example.com/source");
    await expect(chat.getByRole("link", { name: "Sumber tidak aman" })).toHaveCount(0);
  });

  test("widget memberi countdown saat API mengembalikan rate limit", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 429,
        headers: { "Retry-After": "5" },
        contentType: "application/json",
        body: JSON.stringify({
          error: "Batas pertanyaan sementara tercapai.",
          retryAfterSeconds: 5,
        }),
      });
    });

    await page.goto("/profil");
    await page.getByRole("button", { name: "Buka chat" }).click();
    const chat = page.getByRole("dialog", { name: "Asisten UMKM Bot" });
    const input = page.getByLabel("Pesan untuk asisten UMKM");

    await input.fill("Tes batas request");
    await input.press("Enter");
    await expect(chat).toContainText("Batas pertanyaan sementara tercapai");
    await expect(input).toBeDisabled();
    await expect(input).toHaveAttribute("placeholder", /Coba lagi dalam 5 detik/);
  });

  test("widget menampilkan rekomendasi lanjutan setelah jawaban", async ({ page }) => {
    let followUpRequestSeen = false;
    await page.route("**/api/chat", async (route) => {
      const body = route.request().postDataJSON() as {
        action?: string;
        last_question?: string;
        last_answer?: string;
      };
      if (body.action === "suggestions" && body.last_question && body.last_answer) {
        followUpRequestSeen = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: ["Kapan kelompok ini didirikan?", "Berapa jumlah anggotanya?", "Di mana lokasi kelompok ini?"],
            source: "ai",
          }),
        });
        return;
      }
      if (body.action === "suggestions") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: ["Apa itu kelompok UMKM ini?", "Kapan kelompok ini didirikan?", "Berapa jumlah anggotanya?"],
            source: "ai",
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ reply: "Kelompok ini adalah kelompok usaha bersama perempuan di Minasa Upa.", source: "ai" }),
      });
    });

    await page.goto("/profil");
    await page.getByRole("button", { name: "Buka chat" }).click();
    const chat = page.getByRole("dialog", { name: "Asisten UMKM Bot" });
    await chat.getByRole("button", { name: "Apa itu kelompok UMKM ini?" }).click();

    await expect(chat).toContainText("Kelompok ini adalah kelompok usaha bersama");
    await expect(chat.getByRole("button", { name: "Di mana lokasi kelompok ini?" })).toBeVisible();
    expect(followUpRequestSeen).toBe(true);
  });

  test("Tanya AI dari detail hanya membuka rekomendasi kontekstual", async ({ page }) => {
    let answerRequests = 0;
    await page.route("**/api/chat", async (route) => {
      const body = route.request().postDataJSON() as { action?: string };
      if (body.action !== "suggestions") answerRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body.action === "suggestions"
          ? { suggestions: ["Apa bahan utama produk ini?", "Bagaimana proses pembuatannya?", "Apa keunggulan produk ini?"], source: "ai" }
          : { reply: "Jawaban yang tidak seharusnya diminta otomatis.", source: "ai" }),
      });
    });

    await page.goto("/katalog");
    const detailButton = page.getByRole("button", { name: /Lihat detail / }).first();
    if (await detailButton.count() === 0) {
      test.skip(true, "Tidak ada produk publik untuk pengujian detail produk.");
      return;
    }

    await detailButton.click();
    await page.getByRole("button", { name: "Tanya AI", exact: true }).click();
    const chat = page.getByRole("dialog", { name: "Asisten UMKM Bot" });

    await expect(chat.getByRole("button", { name: "Apa bahan utama produk ini?" })).toBeVisible();
    await expect(chat).not.toContainText("Tolong jelaskan produk");
    expect(answerRequests).toBe(0);
  });

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
