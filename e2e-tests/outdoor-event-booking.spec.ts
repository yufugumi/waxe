import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'path';
import { createObjectCsvWriter } from "csv-writer";

test("[Axe] Individual - single location, single day, no extras, no submission", async ({
    page,
  }) => {
    test.slow();
    let accessibilityScanResults;

    try {
      
    await page.goto(
      "https://services.wellington.govt.nz/outdoor-event-booking/booking-request/step/applicant-details/"
    );
    page.url();
    await page.getByTestId("organisation-Individual").check();
    await page.getByTestId("givenNames").click();
    await page.getByTestId("givenNames").fill("Tom");
    await page.getByTestId("familyName").fill("Hackshaw");
    await page.getByTestId("emailAddress").fill("tom@tomhackshaw.com");
    await page.getByTestId("organiser_phoneNumber").click();
    await page.getByTestId("organiser_phoneNumber").fill("021 143 1725");

    await page
    .locator("#main div")
    .filter({ hasText: "0% complete12341. Applicant" })
    .nth(3)
    .click();
    await page.getByTestId("next").click();
    await page.getByTestId("eventName").click();
    await page.getByTestId("eventName").fill("This is a Test Event");
    await page
        .getByTestId("purposeOfYourEvent")
        .fill("This is an event to test this form.");
    await page.locator("div > label:nth-child(2) > .flex").first().click();
    await page.locator("#singleLocation div").nth(3).click();
    await page.locator("#react-select-singleLocation-input").fill("Owhi");
    await page.getByText("Owhiro Bay Beach", { exact: true }).click();
    await page
        .locator(".flex > div:nth-child(2) > div > div > div > label:nth-child(2)")
        .click();
    await page.getByText("One day").click();
    await page.getByTestId("eventDate-date").click();
    await page.getByTestId("eventDate-date").fill("20");
    await page.getByTestId("eventDate-month").fill("08");
    await page.getByTestId("eventDate-year").fill("2024");
    await page
        .getByTestId("startTime-label")
        .getByText("Choose an option...")
        .click();
    await page.getByText("8:00 AM", { exact: true }).click();
    await page.getByText("Choose an option...").click();
    await page.getByText("6:00 AM", { exact: true }).click();
    await page.getByText("6:00 AM", { exact: true }).click();
    await page.getByText("12:00 PM", { exact: true }).click();
    await page
        .getByTestId("willSetUpAndPackDownHappenOnTheSameDayAsTheEvent-Yes")
        .check();
    await page
        .getByTestId("setupStartTime-label")
        .getByText("Choose an option...")
        .click();
    await page.getByText("6:30 AM", { exact: true }).click();
    await page
        .getByTestId("packdownEndTime-label")
        .locator("div")
        .filter({ hasText: "Choose an option..." })
        .nth(1)
        .click();
    await page.getByText("1:45 PM", { exact: true }).click();
    await page
        .locator("div:nth-child(14) > div > div > div > label:nth-child(2) > .flex")
        .click();
    await page.getByTestId("totalNumberOfPeople").click();
    await page.getByTestId("totalNumberOfPeople").fill("100");
    await page.getByTestId("maximumNumberOfPeople").click();
    await page.getByTestId("maximumNumberOfPeople").fill("118");
    await page.getByTestId("chargingEntryFee-No").check();
    await page.getByTestId("willTheEventHaveFood-No").check();
    await page.getByTestId("willYouSellOrSupplyAlcoholAtTheEvent-No").check();
    await page.getByTestId("willTheEventInvolveFundraising-No").check();
    await page.getByTestId("willTheEventHaveItemsForSale-No").check();
    await page.getByTestId("doYouNeedAnyVehiclesOnsite-No").check();
    await page
    .locator("div:nth-child(25) > div > div > div > label:nth-child(2) > .flex")
    .click();
    await page.getByTestId("next").click();
    await page.getByTestId("maximumNumberOfPeople").click();
    await page.getByTestId("maximumNumberOfPeople").click();
    await page.getByTestId("maximumNumberOfPeople").dblclick();
    await page.getByTestId("maximumNumberOfPeople").fill("99");
    await page
        .locator("#main div")
        .filter({ hasText: "25% complete12342. About your" })
        .nth(3)
        .click();
    await page.getByTestId("next").click();
    await page.getByText("Art installation").click();
    await page.getByText("Signage").click();
    await page.getByText("Lighting equipment").click();

    accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

    } catch (error) {
      console.error("An error occurred during the test:", error);
    } finally {
        
      if (accessibilityScanResults) {
        const resultsFilePath = path.join(
          process.cwd(),
          `outdoor-event-booking.csv`
        );
        const csvWriter = createObjectCsvWriter({
          path: resultsFilePath,
          header: [
            { id: "id", title: "ID" },
            { id: "impact", title: "Impact" },
            { id: "description", title: "Description" },
            { id: "help", title: "Help" },
            { id: "helpUrl", title: "Help URL" },
            { id: "tags", title: "Tags" },
            { id: "nodes", title: "Nodes" },
          ],
        });

        const accessibilityData = accessibilityScanResults.violations.map(
          (violation) => ({
            id: violation.id,
            impact: violation.impact,
            description: violation.description,
            help: violation.help,
            helpUrl: violation.helpUrl,
            tags: violation.tags.join(", "),
            nodes: violation.nodes.map((node) => node.html).join("\n"),
          })
        );

        await csvWriter.writeRecords(accessibilityData);
        console.log("CSV file written successfully");
      }

      await page.close();
    }
  });