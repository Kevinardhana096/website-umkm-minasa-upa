import { expect, test } from "@playwright/test";

for (const route of ["/", "/profil", "/login"]) {
  test(`${route} tampil tanpa overflow atau gambar rusak`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();

    const layout = await page.evaluate(() => ({
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      brokenImageCount: [...document.images].filter(
        (image) => image.complete && image.naturalWidth === 0,
      ).length,
    }));

    expect(layout.hasHorizontalOverflow).toBe(false);
    expect(layout.brokenImageCount).toBe(0);
    expect(pageErrors).toEqual([]);
  });
}

test("navbar tetap terlihat saat scroll naik maupun turun", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    browserErrors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText})`);
  });
  await page.goto("/profil", { waitUntil: "domcontentloaded" });
  const navbar = page.locator("header").first();
  await expect(navbar).toBeVisible();
  await page.waitForTimeout(2_000);
  expect(
    await navbar.getAttribute("data-scroll-ready"),
    browserErrors.join("\n") || "Navbar belum terhidrasi tanpa error browser yang tertangkap",
  ).toBe("true");

  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(90);
  await expect(navbar).toHaveAttribute("data-scroll-visible", "true");

  for (let step = 0; step < 8; step += 1) {
    await page.mouse.wheel(0, -1);
    await page.waitForTimeout(20);
  }

  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(90);
  await expect(navbar).toHaveAttribute("data-scroll-visible", "true");
});

test("navbar katalog tetap terlihat saat mencapai bagian bawah halaman", async ({ page }) => {
  await page.goto("/katalog", { waitUntil: "domcontentloaded" });
  const navbar = page.locator("header").first();

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);

  await expect(navbar).toBeVisible();
  await expect(navbar).toHaveAttribute("data-scroll-visible", "true");
  await expect(navbar).toHaveCSS("transform", "none");
});

test("halaman profil menampilkan data produk atau empty state yang jujur", async ({ page }) => {
  await page.goto("/profil", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Produk Unggulan" })).toBeVisible();

  const productCards = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Produk Unggulan" }),
  }).locator(".grid > div");
  const emptyState = page.getByText("Produk unggulan belum tersedia.");

  expect((await productCards.count()) > 0 || await emptyState.isVisible()).toBe(true);
});
