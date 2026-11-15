import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const VIEWPORTS = [
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];

const OUT_DIR = path.resolve("../../docs/audit-screenshots");
const ARTIFACT_DIR = "/Users/sivabalan/.gemini/antigravity/brain/f054774d-faf9-4bb8-a7ef-b809fa526025";

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function saveScreenshot(buffer: Buffer, filename: string) {
  fs.writeFileSync(path.join(OUT_DIR, filename), buffer);
  fs.writeFileSync(path.join(ARTIFACT_DIR, filename), buffer);
}

test.describe("UI Polish Visual Audit Matrix", () => {
  for (const vp of VIEWPORTS) {
    test(`Capture Landing & Target Selector states at ${vp.name}px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Landing Idle
      await page.goto("http://127.0.0.1:4173/");
      await page.waitForLoadState("networkidle");
      const idleBuffer = await page.screenshot({ fullPage: true });
      saveScreenshot(idleBuffer, `audit_landing_idle_${vp.name}.png`);

      // 2. Landing File Selected
      const fixturePath = path.resolve("./e2e/fixtures/test_resume.pdf");
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(fixturePath);
      await expect(page.getByText("test_resume.pdf")).toBeVisible();
      const fileSelectedBuffer = await page.screenshot({ fullPage: true });
      saveScreenshot(fileSelectedBuffer, `audit_landing_selected_${vp.name}.png`);

      // 3. Target Selector: Custom JD mode with validation error / short text
      const customJdTab = page.getByRole("tab", { name: /custom job description/i });
      if (await customJdTab.isVisible()) {
        await customJdTab.click();
        const textarea = page.locator("textarea");
        await textarea.fill("Senior Python engineer with AWS.");
        const customJdBuffer = await page.screenshot({ fullPage: false });
        saveScreenshot(customJdBuffer, `audit_target_custom_jd_${vp.name}.png`);
      }
    });

    test(`Capture Results Dashboard states at ${vp.name}px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Go to results with completed mock state
      await page.goto("http://127.0.0.1:4173/results");
      await page.waitForLoadState("networkidle");
      await expect(page.getByRole("heading", { name: /match estimate/i })).toBeVisible();

      // Full results page
      const resultsBuffer = await page.screenshot({ fullPage: true });
      saveScreenshot(resultsBuffer, `audit_results_dashboard_${vp.name}.png`);

      // Score and skills view
      const scoreSection = page.locator("section, [class*='Card']").first();
      if (await scoreSection.isVisible()) {
        const scoreBuffer = await page.screenshot({ fullPage: false });
        saveScreenshot(scoreBuffer, `audit_results_above_fold_${vp.name}.png`);
      }

      // Evidence Dialog / Modal Open
      const evidenceBtn = page.getByRole("button", { name: /evidence/i }).first();
      if (await evidenceBtn.isVisible()) {
        await evidenceBtn.click();
        await page.waitForTimeout(300);
        const evidenceBuffer = await page.screenshot({ fullPage: false });
        saveScreenshot(evidenceBuffer, `audit_results_evidence_modal_${vp.name}.png`);
        const closeBtn = page.getByRole("button", { name: /close/i }).first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await page.waitForTimeout(200);
        }
      }
    });

    test(`Capture Static Pages (Privacy, Gallery, 404) at ${vp.name}px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Privacy
      await page.goto("http://127.0.0.1:4173/privacy");
      await page.waitForLoadState("networkidle");
      const privacyBuffer = await page.screenshot({ fullPage: true });
      saveScreenshot(privacyBuffer, `audit_privacy_${vp.name}.png`);

      // 404
      await page.goto("http://127.0.0.1:4173/non-existent-route");
      await page.waitForLoadState("networkidle");
      const notFoundBuffer = await page.screenshot({ fullPage: true });
      saveScreenshot(notFoundBuffer, `audit_not_found_${vp.name}.png`);
    });
  }

  test("Capture Print Preview State", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 1600 });
    await page.goto("http://127.0.0.1:4173/results");
    await page.waitForLoadState("networkidle");
    await page.emulateMedia({ media: "print" });
    const printBuffer = await page.screenshot({ fullPage: true });
    saveScreenshot(printBuffer, "audit_print_preview.png");
  });
});

