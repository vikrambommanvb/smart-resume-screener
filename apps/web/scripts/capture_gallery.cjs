const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const ARTIFACT_DIR = "/Users/sivabalan/.gemini/antigravity/brain/f054774d-faf9-4bb8-a7ef-b809fa526025";
const URL = "http://127.0.0.1:5173/gallery";

async function capture() {
  console.log("Launching Chromium for Testing...");
  const executablePath = "/Users/sivabalan/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
  const browser = await chromium.launch({
    executablePath: fs.existsSync(executablePath) ? executablePath : undefined,
  });

  // 1. Desktop (1440 x 900)
  console.log("Capturing Desktop 1440x900...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(URL, { waitUntil: "networkidle" });
  const desktopPath = path.join(ARTIFACT_DIR, "gallery_1440.png");
  await desktopPage.screenshot({ path: desktopPath, fullPage: true });
  console.log(`Saved: ${desktopPath}`);

  // Test modal open on desktop
  const openModalBtn = desktopPage.locator('button:has-text("Open Methodology Dialog")');
  await openModalBtn.click();
  await desktopPage.waitForTimeout(300);
  const modalPath = path.join(ARTIFACT_DIR, "gallery_dialog.png");
  await desktopPage.screenshot({ path: modalPath });
  console.log(`Saved: ${modalPath}`);
  await desktopContext.close();

  // 2. Tablet (768 x 1024)
  console.log("Capturing Tablet 768x1024...");
  const tabletContext = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
  });
  const tabletPage = await tabletContext.newPage();
  await tabletPage.goto(URL, { waitUntil: "networkidle" });
  const tabletPath = path.join(ARTIFACT_DIR, "gallery_768.png");
  await tabletPage.screenshot({ path: tabletPath, fullPage: true });
  console.log(`Saved: ${tabletPath}`);
  await tabletContext.close();

  // 3. Mobile (390 x 844)
  console.log("Capturing Mobile 390x844...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(URL, { waitUntil: "networkidle" });
  const mobilePath = path.join(ARTIFACT_DIR, "gallery_390.png");
  await mobilePage.screenshot({ path: mobilePath, fullPage: true });
  console.log(`Saved: ${mobilePath}`);
  await mobileContext.close();

  await browser.close();
  console.log("All visual QA screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
