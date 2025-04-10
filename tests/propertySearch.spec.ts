import {
  fillPersonalDetails,
  fillStagingDetails,
  runAccessibilityTest,
} from "./helpers/helper";
import { test, expect } from "@playwright/test";

test("Property search", async ({ page }) => {
  await runAccessibilityTest(page, "property-search", [
    // Initial page load
    async () => {
      await page.goto(
        "https://staging.services.wellington.govt.nz/property-search/"
      );
      // We run this twice as Vercel often requires it(?)
      await fillStagingDetails(page);
      await fillStagingDetails(page);
    },

    // Search interaction
    async () => {
      test.slow();
      await expect(page).toHaveTitle(
        "Property search - Wellington City Council"
      );
      await page.locator(".css-19bb58m").click();
      await page
        .getByLabel("option , selected. Select is")
        .fill("113 the terrace");
      await page
        .getByText("226 Lambton Quay Wellington Central 6011", { exact: true })
        .click();
    },
    // Aerial photos modal
    async () => {
      await expect(page).toHaveURL(
        "https://staging.services.wellington.govt.nz/property-search/account/1123211/"
      );
      await page.getByRole("button", { name: "About aerial photos" }).click();
      await page.getByLabel("Close").click();
      await page.getByLabel("Expand Wellington City").click();
      await page.getByLabel("Collapse Wellington City").click();
      await page.getByLabel("Expand Greater Wellington").click();
      await page.getByLabel("Collapse Greater Wellington").click();
      await page.getByLabel("Expand Wellington Sludge").click();
      await page.getByLabel("Collapse Wellington Sludge").click();
      await page.getByRole("button", { name: "Remove my details" }).click();
    },
    // Form filling
    async () => {
      test.slow();
      await expect(page).toHaveURL(
        "https://staging.services.wellington.govt.nz/property-search/account/1123211/withhold-details/"
      );
      await page.getByTestId("confirmation").check();
      await fillPersonalDetails(page);
      await page.getByRole("button", { name: "Submit" }).click();
    },
  ]);
});
