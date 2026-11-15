import { defineConfig } from "@playwright/test";
import fs from "fs";

const customChromiumPath =
  "/Users/sivabalan/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://127.0.0.1:4173",
    headless: true,
    launchOptions: {
      executablePath: fs.existsSync(customChromiumPath) ? customChromiumPath : undefined,
    },
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});

