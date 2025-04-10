import { fillStagingDetails, runAccessibilityTest } from "./helpers/helper";
import { test, expect } from "@playwright/test";

test("Register your dog", async ({ page }) => {
  await runAccessibilityTest(page, "register-your-dog", [
    // Initial page load
    async () => {
      await page.goto(
        "https://staging.services.wellington.govt.nz/register-your-dog/step/your-details/"
      );
      await fillStagingDetails(page);
      await fillStagingDetails(page);
      await expect(page).toHaveTitle("Register your dog");
      await page.getByTestId("givenNames").fill("Test");
      await page.getByTestId("familyName").fill("Test");
      await page.locator("#address div").nth(3).click();
      await page.getByLabel("Your address *option ,").fill("1");
      await page
        .getByText(
          "Apartment 1005, 1 Market Lane, Wellington Central, Wellington 6011",
          { exact: true }
        )
        .click();
      await page.getByTestId("emailAddress").fill("test@test.com");
      await page.getByTestId("phoneNumber").fill("+64211111111");
      await page.getByTestId("dateOfBirth-date").click();
      await page.getByTestId("dateOfBirth-date").fill("20");
      await page.getByTestId("dateOfBirth-month").fill("08");
      await page.getByTestId("dateOfBirth-year").fill("1995");
      await page.getByTestId("registeredBefore-no").check();
      await page.getByTestId("completedResponsibleDogOwnerCourse-no").check();
      await page.getByTestId("next").click();
    },
    // dog details
    async () => {
      await page.getByTestId("dogDetails.0.dogName").fill("Jim");
      await page
        .getByTestId(
          "dogDetails.0.dogAddress-Apartment 1005, 1 Market Lane, Wellington Central, Wellington 6011"
        )
        .check();
      await page.getByTestId("dogDetails.0.dogSex-Male").check();
      await page.getByTestId("dogDetails.0.dogDateOfBirth-date").fill("20");
      await page.getByTestId("dogDetails.0.dogDateOfBirth-month").fill("08");
      await page.getByTestId("dogDetails.0.dogDateOfBirth-year").fill("1995");
      await page
        .getByTestId("dogDetails.0.dogPrimaryBreed-label")
        .getByText("Choose an option...")
        .click();
      await page.getByText("Australian Cattle", { exact: true }).click();
      await page
        .getByTestId("dogDetails.0.dogSecondaryBreed-label")
        .getByText("Choose an option...")
        .click();
      await page.getByText("American Cocker Spaniel", { exact: true }).click();
      await page
        .getByTestId("dogDetails.0.dogPrimaryColour-label")
        .getByText("Choose an option...")
        .click();
      await page.getByText("Black", { exact: true }).click();
      await page.getByText("Choose an option...").click();
      await page.getByText("Brindle", { exact: true }).click();
      await page.getByTestId("dogDetails.0.dogUniqueMarkings").fill("None");
      await page.getByTestId("dogDetails.0.dogIsTransferring-No").check();
      await page.getByTestId("dogDetails.0.dogIsDangerous-No").check();
      await page.getByTestId("dogDetails.0.dogIsMenacing-No").check();
      await page.getByTestId("next").click();
    },
    // supporting documents
    async () => {
      await page.getByTestId("supportingDocuments.0.desexed-no").check();
      await page.getByTestId("supportingDocuments.0.adopted-no").check();
      await page.getByTestId("supportingDocuments.0.imported-no").check();
      await page.getByTestId("supportingDocuments.0.microchipped-no").check();
      await page
        .locator("div")
        .filter({ hasText: /^Large \(35mm in diameter\)$/ })
        .getByRole("img")
        .click();
      await page.getByTestId("next").click();
    },
    // declaration
    async () => {
      await page.getByTestId("next").click();
      await page.getByTestId("declaration").check();
      await page.getByTestId("next").click();
    },
    // payment
    async () => {
      await page.getByRole("button", { name: "Pay now" }).click();
    },
  ]);
});
