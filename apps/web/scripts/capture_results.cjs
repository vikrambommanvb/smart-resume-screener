const { chromium } = require("playwright");
const path = require("path");

const ARTIFACT_DIR = "/Users/sivabalan/.gemini/antigravity/brain/f054774d-faf9-4bb8-a7ef-b809fa526025";
const customChromiumPath =
  "/Users/sivabalan/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

async function capture() {
  const browser = await chromium.launch({ executablePath: customChromiumPath });

  // 1. Desktop 1440px
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/");

  const fixturePath = path.resolve(__dirname, "../e2e/fixtures/test_resume.pdf");
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await page.locator("#role-select").selectOption("python_developer");
  await page.getByRole("button", { name: /start alignment analysis/i }).click();

  // Wait for results
  await page.getByText(/deterministic alignment score/i).waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(500);

  const desktopPath = path.join(ARTIFACT_DIR, "results_1440.png");
  await page.screenshot({ path: desktopPath, fullPage: true });
  console.log("Saved: " + desktopPath);
  await context.close();

  // 2. Mobile 390px
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto("http://127.0.0.1:5173/");
  await mobilePage.locator('input[type="file"]').setInputFiles(fixturePath);
  await mobilePage.locator("#role-select").selectOption("python_developer");
  await mobilePage.getByRole("button", { name: /start alignment analysis/i }).click();
  await mobilePage.getByText(/deterministic alignment score/i).waitFor({ state: "visible", timeout: 15000 });
  await mobilePage.waitForTimeout(500);

  const mobilePath = path.join(ARTIFACT_DIR, "results_390.png");
  await mobilePage.screenshot({ path: mobilePath, fullPage: true });
  console.log("Saved: " + mobilePath);
  await mobileCtx.close();

  await browser.close();
}

capture().catch(console.error);

