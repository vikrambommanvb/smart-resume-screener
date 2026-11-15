import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const VIEWPORTS = [
  { name: "320", width: 320, height: 600 },
  { name: "375", width: 375, height: 667 },
  { name: "414", width: 414, height: 896 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];

const TARGET_DIR = path.resolve("../../docs/design/before");

function saveShot(buffer: Buffer, filename: string) {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }
  fs.writeFileSync(path.join(TARGET_DIR, filename), buffer);
}

test.describe("Hallmark Baseline Captures", () => {
  for (const vp of VIEWPORTS) {
    test(`Capture all requested states at ${vp.name}px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Landing Idle
      await page.goto("http://127.0.0.1:4173/");
      await page.waitForLoadState("networkidle");
      saveShot(await page.screenshot({ fullPage: true }), `landing_idle_${vp.name}.png`);

      // 2. Landing Drag-Over State
      const dropzone = page.locator('label[for="resume-upload-input"]');
      if (await dropzone.isVisible()) {
        await dropzone.dispatchEvent("dragenter", { dataTransfer: { types: ["Files"] } });
        saveShot(await page.screenshot({ fullPage: false }), `landing_dragover_${vp.name}.png`);
        await dropzone.dispatchEvent("dragleave");
      }

      // 3. Landing Invalid File
      const fileInput = page.locator('input[type="file"]');
      // Create a temporary text file to test invalid file upload
      const invalidPath = path.resolve("./e2e/fixtures/invalid_doc.txt");
      if (!fs.existsSync(invalidPath)) {
        fs.writeFileSync(invalidPath, "Invalid document content");
      }
      await fileInput.setInputFiles(invalidPath);
      await page.waitForTimeout(300);
      saveShot(await page.screenshot({ fullPage: false }), `landing_invalid_file_${vp.name}.png`);

      // 4. Landing File Chosen
      const fixturePdf = path.resolve("./e2e/fixtures/test_resume.pdf");
      await fileInput.setInputFiles(fixturePdf);
      await expect(page.getByText("test_resume.pdf")).toBeVisible();
      saveShot(await page.screenshot({ fullPage: true }), `landing_file_chosen_${vp.name}.png`);

      // 5. Target Selector: Role Mode
      const roleSelect = page.locator("#role-select");
      if (await roleSelect.isVisible()) {
        await roleSelect.click();
        await page.waitForTimeout(200);
        saveShot(await page.screenshot({ fullPage: false }), `target_selector_role_open_${vp.name}.png`);
        const pythonOption = page.getByRole("option", { name: /python developer/i });
        if (await pythonOption.isVisible()) {
          await pythonOption.click();
        }
      }

      // 6. Target Selector: Custom JD Invalid (< 250 chars)
      const customJdTab = page.getByRole("tab", { name: /custom job description/i });
      if (await customJdTab.isVisible()) {
        await customJdTab.click();
        const textarea = page.locator("textarea");
        await textarea.fill("Need a senior backend engineer with Python skills.");
        await page.waitForTimeout(200);
        saveShot(await page.screenshot({ fullPage: false }), `target_selector_custom_invalid_${vp.name}.png`);

        // 7. Target Selector: Custom JD Valid (>= 250 chars)
        await textarea.fill(
          "We are seeking an experienced Backend Python Developer to build and scale high-throughput distributed microservices, REST APIs, and asynchronous data pipelines. Required competencies include Python, FastAPI, Docker, PostgreSQL, Redis, Celery, and automated testing with Pytest in a cloud environment."
        );
        await page.waitForTimeout(200);
        saveShot(await page.screenshot({ fullPage: false }), `target_selector_custom_valid_${vp.name}.png`);
      }

      // 8. Processing Stage Simulation
      // Trigger analysis or capture results
      await page.goto("http://127.0.0.1:4173/results");
      await page.waitForLoadState("networkidle");
      saveShot(await page.screenshot({ fullPage: true }), `results_dashboard_${vp.name}.png`);

      // 9. Results: Evidence Drawer Opened
      const evidenceBtn = page.getByText(/view evidence/i).first();
      if (await evidenceBtn.isVisible()) {
        await evidenceBtn.click();
        await page.waitForTimeout(300);
        saveShot(await page.screenshot({ fullPage: false }), `results_evidence_drawer_${vp.name}.png`);
        await page.keyboard.press("Escape");
      }

      // 10. Static Pages: Privacy
      await page.goto("http://127.0.0.1:4173/privacy");
      await page.waitForLoadState("networkidle");
      saveShot(await page.screenshot({ fullPage: true }), `privacy_${vp.name}.png`);

      // 11. Static Pages: 404
      await page.goto("http://127.0.0.1:4173/unknown-page-route");
      await page.waitForLoadState("networkidle");
      saveShot(await page.screenshot({ fullPage: true }), `not_found_${vp.name}.png`);
    });
  }

  test("Capture Print Preview State", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 1400 });
    await page.goto("http://127.0.0.1:4173/results");
    await page.waitForLoadState("networkidle");
    await page.emulateMedia({ media: "print" });
    saveShot(await page.screenshot({ fullPage: true }), "print_preview.png");
  });
});
