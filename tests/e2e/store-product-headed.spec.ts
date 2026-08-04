import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { expect, test, type BrowserContext } from "@playwright/test";
import { randomUUID } from "node:crypto";

loadEnvConfig(process.cwd());

test("role toko dapat membuat produk dan menguji katalog serta chat", async ({ browser, page }) => {
  test.setTimeout(180_000);

  const suffix = randomUUID().slice(0, 8);
  const userEmail = `codex-store-${suffix}@example.test`;
  const userPassword = `Codex-${suffix}-Test!`;
  const storeName = `Toko Uji Codex ${suffix}`;
  const productName = `Produk Uji Chat ${suffix}`;
  let userId = "";
  let storeContext: BrowserContext | undefined;

  try {
    const accessResponse = await page.request.post("/api/dev-access");
    expect(accessResponse.ok()).toBeTruthy();
    const accessPayload = await accessResponse.json() as { role?: string };
    expect(accessPayload.role).toBe("admin");

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);
    await page.getByRole("button", { name: /Manajemen user/i }).click();
    await page.getByRole("button", { name: /Tambah User/i }).click();

    const userForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Buat User Baru", exact: true }) });
    await userForm.locator("input").nth(0).fill(`Pengujian Toko ${suffix}`);
    await userForm.locator("input[type=email]").fill(userEmail);
    await userForm.locator('input[type="password"]').nth(0).fill(userPassword);
    await userForm.locator('input[type="password"]').nth(1).fill(userPassword);
    await userForm.locator("select").selectOption("toko");

    const createResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/admin/users") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Buat User Baru", exact: true }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.ok()).toBeTruthy();
    const createPayload = await createResponse.json() as { user_id?: string };
    userId = createPayload.user_id ?? "";
    expect(userId).toMatch(/[0-9a-f-]{20,}/i);
    await expect(page.getByRole("status")).toContainText("berhasil dibuat");

    storeContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const storePage = await storeContext.newPage();
    await storePage.goto("/login");
    await storePage.locator('input[type="email"]').fill(userEmail);
    await storePage.locator('input[type="password"]').fill(userPassword);
    await storePage.getByRole("button", { name: "Login Pengelola" }).click();
    await storePage.waitForURL(/\/dashboard/, { timeout: 20_000 });

    const profileForm = storePage.locator("form").filter({ hasText: "Profil publik toko" });
    await profileForm.locator("input").nth(0).fill(storeName);
    await profileForm.locator("input").nth(1).fill(`Penjual Uji ${suffix}`);
    await profileForm.locator("input").nth(2).fill("628123456789");
    await profileForm.locator("textarea").fill("Toko sementara untuk pengujian katalog dan chat AI.");
    await storePage.getByRole("button", { name: /Simpan perubahan/i }).click();
    await expect(storePage.getByRole("button", { name: /Tambah Produk/i })).toBeVisible();

    await storePage.getByRole("button", { name: /Tambah Produk/i }).click();
    const productForm = storePage.locator("form").filter({
      has: storePage.getByPlaceholder("Contoh: Kerajinan Kain Tenun Minasa Upa"),
    });
    await productForm.locator("input").first().fill(productName);
    await productForm.locator("textarea").fill("Produk sementara untuk menguji harga, stok, pemesanan, dan konteks chat.");
    await productForm.locator('input[type="number"]').fill("15000");
    await storePage.getByRole("button", { name: "Simpan Produk", exact: true }).click();
    await expect(storePage.getByRole("table").getByText(productName, { exact: true })).toBeVisible();

    const publicPage = await storeContext.newPage();
    await publicPage.goto("/katalog", { waitUntil: "domcontentloaded" });
    await expect(publicPage.getByRole("button", { name: `Lihat detail ${productName}`, exact: true }))
      .toBeVisible({ timeout: 30_000 });

    await publicPage.getByRole("button", { name: `Lihat detail ${productName}`, exact: true }).click();
    await expect(publicPage.getByRole("dialog")).toContainText(productName);
    await publicPage.getByRole("button", { name: "Tanya AI", exact: true }).click();

    const chat = publicPage.getByRole("dialog", { name: "Asisten UMKM Bot" });
    const input = publicPage.getByLabel("Pesan untuk asisten UMKM");
    await expect(chat).toBeVisible();
    await expect(input).toBeEnabled({ timeout: 20_000 });
    await expect(chat).toContainText(`"${productName}"`);
    await expect(chat).toContainText("Rp 15.000");
    await expect(chat).toContainText("Produk sementara untuk menguji harga, stok, pemesanan, dan konteks chat.");

    await input.fill(`Berapa harga dan stok ${productName}, serta bagaimana cara memesannya?`);
    await input.press("Enter");
    await expect(chat).toContainText(`Harga "${productName}"`, { timeout: 20_000 });
    await expect(chat).toContainText("Untuk membeli atau memesan");

    const whatsappLinksBeforeKnowledge = await chat.getByRole("link", { name: "Chat penjual di WhatsApp" }).count();
    await expect(input).toBeEnabled({ timeout: 20_000 });
    await input.fill("Di mana letak Desa Minasa Upa?");
    await input.press("Enter");
    await expect(chat).toContainText("Kecamatan Bontoa", { timeout: 20_000 });
    await expect(chat).not.toContainText(/proposal|dokumen sumber|Sumber web|https?:\/\//i);
    await expect(chat.getByRole("link", { name: "Chat penjual di WhatsApp" })).toHaveCount(whatsappLinksBeforeKnowledge);

    await expect(input).toBeEnabled({ timeout: 20_000 });
    await input.fill("Berapa harga saham hari ini?");
    await input.press("Enter");
    await expect(chat).toContainText("hanya dapat membantu", { timeout: 20_000 });
    await expect(chat.getByRole("link", { name: "Chat penjual di WhatsApp" })).toHaveCount(whatsappLinksBeforeKnowledge);

    await expect(input).toBeEnabled({ timeout: 20_000 });
    await input.fill("Apakah produk ini bisa COD?");
    await input.press("Enter");
    await expect(chat).toContainText("kebijakan pembayaran", { timeout: 20_000 });
    await expect(chat).toContainText("penjual");
    await expect(chat.getByRole("link", { name: "Chat penjual di WhatsApp" })).toHaveCount(whatsappLinksBeforeKnowledge);

    await publicPage.close();
    await storePage.goto("/dashboard");
    await expect(storePage.getByRole("table").getByText(productName, { exact: true })).toBeVisible();
    storePage.once("dialog", (dialog) => dialog.accept());
    await storePage.getByRole("button", { name: "Hapus produk", exact: true }).first().click();
    await expect(storePage.getByText(productName, { exact: true })).toHaveCount(0);
  } finally {
    await storeContext?.close();
    if (userId) {
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
      const { error } = await serviceClient.auth.admin.deleteUser(userId);
      if (error) console.warn("Akun uji tidak dapat dibersihkan:", error.message);
    }
  }
});
