import { test, expect } from "@playwright/test";

test.describe("Responsive Screenshot Capture", () => {
  const viewports = [
    { name: "390", width: 390, height: 844 },
    { name: "768", width: 768, height: 1024 },
    { name: "1440", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`captures analysis results at ${vp.name}px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/results");
      await page.waitForLoadState("networkidle");

      // Verify Results renders
      await expect(page.getByRole("heading", { name: /analysis report/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /print report/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /required skills/i })).toBeVisible();

      await page.waitForTimeout(500);

      const targetPath = `/Users/sivabalan/.gemini/antigravity/brain/f054774d-faf9-4bb8-a7ef-b809fa526025/phase_8_results_${vp.name}.png`;
      await page.screenshot({ path: targetPath, fullPage: true });
    });
  }
});
