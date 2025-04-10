import {
  fillPersonalDetails,
  fillStagingDetails,
  runAccessibilityTest,
} from "./helpers/helper";
import { test, expect } from "@playwright/test";

test("TEPP", async ({ page }) => {
  await runAccessibilityTest(page, "outdoor-events", [
    // Initial page load - Applicant Details
    async () => {
      await page.goto(
        "https://staging.services.wellington.govt.nz/outdoor-event-booking/booking-request/step/applicant-details/"
      );
      await fillStagingDetails(page);
      await fillStagingDetails(page);
    },
    // Fill applicant details
    async () => {
      await expect(page).toHaveTitle(
        "Outdoor event booking request - Wellington City Council"
      );
      await expect(page).toHaveURL(
        "https://staging.services.wellington.govt.nz/outdoor-event-booking/booking-request/step/applicant-details/"
      );
      await page.getByTestId("organisation-Individual").check();
      await fillPersonalDetails(page, {
        organisationType: "Individual",
        givenNames: "Test",
        familyName: "Test",
        emailTestId: "emailAddress",
        phoneTestId: "organiser_phoneNumber",
      });

      await page.getByTestId("next").click();
    },
    // Event details page
    async () => {
      await page.getByTestId("eventName").fill("Test Ahh Event");
      await page
        .getByTestId("purposeOfYourEvent")
        .fill("This is a big ahh event");
      await page.getByTestId("moreThanOneLocation-No").check();
      await page.locator("#singleLocation div").nth(3).click();
      await page.locator("#react-select-singleLocation-input").fill("Mak");
      await page
        .getByText("Mākara Peak Mountain Bike Park", { exact: true })
        .click();
      await page.getByTestId("willYouNeedToCrossOrCloseAnyRoads-No").check();
      await page.getByTestId("eventDuration-One day").check();
      await page.getByTestId("eventDate-date").fill("20");
      await page.getByTestId("eventDate-month").fill("08");
      await page.getByTestId("eventDate-year").fill("2025");
      await page
        .getByTestId("startTime-label")
        .getByText("Choose an option...")
        .click();
      await page.getByText("5:00 AM", { exact: true }).click();
      await page.getByText("Choose an option...").click();
      await page.getByText("5:15 AM").click();
      await page
        .getByTestId("willSetUpAndPackDownHappenOnTheSameDayAsTheEvent-Yes")
        .check();
      await page
        .getByTestId("setupStartTime-label")
        .getByText("Choose an option...")
        .click();
      await page
        .getByTestId("setupStartTime-label")
        .getByText("5:15 AM")
        .click();
      await page.getByText("Choose an option...").click();
      await page.getByText("5:30 AM").click();
      await page.getByTestId("postponementDate-date").fill("21");
      await page.getByTestId("postponementDate-month").fill("08");
      await page.getByTestId("postponementDate-year").fill("2025");
      await page.getByTestId("recurringEvent-No").check();
      await page.getByTestId("totalNumberOfPeople").fill("1");
      await page.getByTestId("maximumNumberOfPeople").fill("1");
      await page.getByTestId("chargingEntryFee-No").check();
      await page.getByTestId("willTheEventHaveFood-No").check();
      await page.getByTestId("willYouSellOrSupplyAlcoholAtTheEvent-No").check();
      await page.getByTestId("willTheEventInvolveFundraising-No").check();
      await page.getByTestId("willTheEventHaveItemsForSale-No").check();
      await page.getByTestId("doYouNeedAnyVehiclesOnsite-No").check();
      await page.getByTestId("willYouHaveFireworksOrSpecialEffects-No").check();
      await page.getByTestId("next").click();
    },
    // Equipment selection
    async () => {
      await page.getByTestId("largeEquipment[0]-Art installation").check();
      await page.getByTestId("otherEquipment[0]-Chairs").check();
      await page.getByTestId("next").click();
    },
    async () => {
      await page.getByRole("button", { name: "Submit" }).click();
    },
  ]);
});
