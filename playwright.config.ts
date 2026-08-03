import { defineConfig, devices } from "@playwright/test";

const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 30_000,
  expect: {
    timeout: 7_500,
  },
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    launchOptions: chromiumExecutablePath
      ? { executablePath: chromiumExecutablePath }
      : undefined,
  },
  webServer: {
    command: "npm run dev -- --port 3100",
    url: baseURL,
    reuseExistingServer: Boolean(process.env.PLAYWRIGHT_BASE_URL),
    timeout: 120_000,
  },
  projects: [
    {
      name: "laptop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],
});
