import { test, expect } from "@playwright/test";

test.describe("Smart Resume Screener End-to-End Tests", () => {
  test("loads home page and fetches predefined roles from API", async ({ page }) => {
    await page.goto("/");

    // Verify Brand Title & Pitch
    await expect(page.locator("header")).toContainText("Smart Resume Screener");
    await expect(page.locator("h1")).toContainText(/Screen your resume against real jobs|See how your resume reads/i);

    // Verify Dropzone is visible
    await expect(page.getByText(/drop your resume here/i)).toBeVisible();

    // Verify Predefined Roles combobox can be opened and contains Python Developer
    const roleSelect = page.locator("#role-select");
    await expect(roleSelect).toBeVisible();
    await roleSelect.click();
    const pythonOption = page.getByRole("option", { name: /python developer/i });
    await expect(pythonOption).toBeVisible();
    await pythonOption.click();
    await expect(roleSelect).toContainText("Python Developer");
  });

  test("loads results view with full alignment analysis dashboard", async ({ page }) => {
    await page.goto("/results");
    await page.waitForLoadState("networkidle");

    // Assert Results sections render
    await expect(page.getByRole("heading", { name: /match estimate/i })).toBeVisible();
    await expect(page.getByText(/required skills/i).first()).toBeVisible();
    await expect(page.getByText(/resume health/i).first()).toBeVisible();

    // Check score gauge exists
    const scoreText = page.locator(".font-display.text-5xl");
    await expect(scoreText).toBeVisible();

    // Check matched skills
    await expect(page.getByText("Python", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("FastAPI", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Docker", { exact: true }).first()).toBeVisible();

    // Check ATS health score
    await expect(page.getByText(/ATS Optimized|Needs Polish/i)).toBeVisible();

    // Verify Print Report button exists
    const exportBtn = page.getByRole("button", { name: /print report/i });
    await expect(exportBtn).toBeVisible();
  });

  test("navigates to privacy page and verifies hard guarantees", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Privacy" }).click();

    await expect(page).toHaveURL(/\/privacy/);
    await expect(page.locator("h1")).toContainText(/privacy (?:&|and) data protection architecture/i);
    await expect(page.getByText(/in-memory execution only/i)).toBeVisible();
    await expect(page.getByText(/pii redaction before/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /no (?:database|user accounts)/i })).toBeVisible();

    // Return to screener
    await page.getByRole("link", { name: /return to screener/i }).click();
    await expect(page).toHaveURL(/\//);
  });

  test("renders 404 page for unknown routes and navigates back", async ({ page }) => {
    await page.goto("/some-unknown-path-xyz");

    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();

    await page.getByRole("button", { name: /return to screener/i }).click();
    await expect(page).toHaveURL(/\//);
  });
});
