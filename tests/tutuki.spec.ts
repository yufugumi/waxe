import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";
import { createObjectCsvWriter } from "csv-writer";

// Utility function to write accessibility issues to CSV
async function writeAccessibilityIssuesToCsv(
  results,
  pageName,
  currentUrl,
  step,
  isFirstWrite = false
) {
  const records = results.violations.flatMap((violation) =>
    violation.nodes.map((node) => ({
      page: pageName,
      url: new URL(currentUrl).pathname,
      step: step,
      impact: violation.impact,
      type: violation.id,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      selector: node.target.join(", "),
    }))
  );

  // If no violations found, return early
  if (records.length === 0) {
    console.log(
      `No accessibility issues found for ${pageName} at step ${step}`
    );
    return 0;
  }

  // Create directory if it doesn't exist
  if (!fs.existsSync("tutuki-accessibility-results")) {
    fs.mkdirSync("tutuki-accessibility-results");
  }

  const filePath = path.join(
    process.cwd(),
    "tutuki-accessibility-results",
    `${pageName}.csv`
  );

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: "url", title: "URL" },
      { id: "step", title: "Step" },
      { id: "impact", title: "Impact" },
      { id: "description", title: "Description" },
      { id: "help", title: "Issue" },
      { id: "helpUrl", title: "More information" },
      { id: "selector", title: "CSS selector" },
    ],
    append: !isFirstWrite, // Only append if it's not the first write
  });

  await csvWriter.writeRecords(records);
  console.log(
    `Wrote ${records.length} accessibility issues to CSV for ${pageName} at step ${step}`
  );
  return records.length;
}

// Enhanced test wrapper to handle step-by-step accessibility testing
async function runAccessibilityTest(page, pageName, actions) {
  let step = 1;
  let totalIssues = 0;
  let isFirstWrite = true;
  const filePath = path.join(
    process.cwd(),
    "tutuki-accessibility-results",
    `${pageName}.csv`
  );

  // Delete existing file if it exists
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  try {
    for (const action of actions) {
      await action();
      // Wait for any animations or transitions to complete
      await page.waitForTimeout(500);

      const currentUrl = page.url();
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      const issuesCount = await writeAccessibilityIssuesToCsv(
        accessibilityScanResults,
        pageName,
        currentUrl,
        step,
        isFirstWrite
      );

      if (issuesCount > 0) {
        isFirstWrite = false;
      }

      totalIssues += issuesCount;
      step++;
    }

    // If no issues were found across all steps, delete the CSV file if it exists
    if (totalIssues === 0 && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      `Error during accessibility testing at step ${step}: ${error.message}`
    );
    throw error;
  }
}

test("Property search", async ({ page }) => {
  await runAccessibilityTest(page, "property-search", [
    // Initial page load
    async () => {
      await page.goto("https://services.wellington.govt.nz/property-search/");
    },
    // Search interaction
    async () => {
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
      await page.getByTestId("confirmation").check();
      await page.getByTestId("givenNames").fill("Test");
      await page.getByTestId("surname").fill("Test");
      await page.getByTestId("company").fill("Test");
      await page.getByTestId("phone").fill("021 111 1111");
      await page.getByTestId("email").fill("test@test.com");
    },
  ]);
});

test("TEPP", async ({ page }) => {
  await runAccessibilityTest(page, "outdoor-events", [
    // Initial page load - Applicant Details
    async () => {
      await page.goto(
        "https://services.wellington.govt.nz/outdoor-event-booking/booking-request/step/applicant-details/"
      );
    },
    // Fill applicant details
    async () => {
      await page.getByTestId("organisation-Individual").check();
      await page.getByTestId("givenNames").fill("Test");
      await page.getByTestId("familyName").fill("Test");
      await page.getByTestId("emailAddress").fill("test@test.com");
      await page.getByTestId("organiser_phoneNumber").fill("021 111 1111");
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
  ]);
});

test("Register your dog", async ({ page }) => {
  await runAccessibilityTest(page, "register-your-dog", [
    // Initial page load
    async () => {
      await page.goto(
        "https://services.wellington.govt.nz/register-your-dog/step/your-details/"
      );
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
      await page.goto(
        "https://services.wellington.govt.nz/register-your-dog/step/payment/"
      );
    },
  ]);
});

test("Dog ownership details", async ({ page }) => {
  await runAccessibilityTest(page, "update-dog-ownership", [
    async () => {
      await page.goto(
        "https://services.wellington.govt.nz/dog-ownership-details/update-dog-ownership/step/applicant-details/"
      );
      await page.getByTestId("givenNames").fill("Test");
      await page.getByTestId("familyName").fill("Test");
      await page.locator("#address div").nth(3).click();
      await page.getByLabel("Postal address *option ,").fill("1");
      await page
        .getByText("1-15 The Avenue, Mount Roskill, Auckland 1041", {
          exact: true,
        })
        .click();
      await page.getByTestId("emailAddress").fill("test@test.com");
      await page.getByTestId("dogName").fill("Jim");
      await page.getByTestId("next").click();
    },
    // specify circumstances
    async () => {
      await page.getByTestId("situationChange-Jim has passed away").check();
      await page.getByTestId("dateOfDeath-date").fill("20");
      await page.getByTestId("dateOfDeath-month").fill("08");
      await page.getByTestId("dateOfDeath-year").fill("2024");
      await page
        .locator("label")
        .filter({ hasText: "I declare that Jim has passed" })
        .click();
      await page.getByTestId("declarePassedAway").check();
      await page
        .getByTestId("refundRegistrationFee-No refund requested")
        .check();
      await page.getByTestId("next").click();
    },
    // declaration
    async () => {
      await page.getByTestId("declaration").check();
    },
  ]);
});

test("BWOF compliance schedule", async ({ page }) => {
  await runAccessibilityTest(page, "bwof-compliance", [
    async () => {
      await page.goto(
        "https://building-warrant-of-fitness.services.wellington.govt.nz/building-warrant-of-fitness/"
      );
      await page.getByLabel("Search for a compliance").fill("the terrace");
      await page.getByLabel("Search for a compliance").press("Enter");
      await page
        .locator("div")
        .filter({
          hasText:
            /^The Treasury Building1 The TerraceCompliance schedule number: 28303View PDF$/,
        })
        .getByRole("link")
        .click();
    },
  ]);
});

test("BWOF find IQP", async ({ page }) => {
  await runAccessibilityTest(page, "bwof-iqp", [
    async () => {
      await page.goto(
        "https://building-warrant-of-fitness.services.wellington.govt.nz/building-warrant-of-fitness/search-for-an-iqp/"
      );
      await page.getByLabel("SS3/1 Automatic doors").check();
      await page.getByRole("button", { name: "Search" }).click();
      await page
        .locator("div:nth-child(46) > div:nth-child(2) > .p-8 > .mt-2")
        .click();
      await page.getByRole("button", { name: "Name or IQP number" }).click();
      await page.getByLabel("Search for an independent").click();
      await page.getByLabel("Search for an independent").fill("Richard");
      await page.getByLabel("Search for an independent").press("Enter");
    },
  ]);
});

test("Report a problem - FIXit", async ({ page }) => {
  await runAccessibilityTest(page, "report-a-problem", [
    async () => {
      await page.goto("https://services.wellington.govt.nz/report/");
      await page.getByText("Choose an option...").click();
      await page.getByText("Graffiti or vandalism", { exact: true }).click();
      await page.getByTestId("graffiti.isOffensive-yes").check();
      await page
        .locator('[id="details\\.location\\.address"] div')
        .nth(3)
        .click();
      await page.getByLabel("Enter the address of the").fill("1");
      await page
        .getByText("1-15 The Avenue, Mount Roskill, Auckland 1041", {
          exact: true,
        })
        .click();
      await page.getByTestId("details.description").click();
      await page
        .getByTestId("details.description")
        .fill("Offensive ahh graffiti ");
      await page.getByTestId("details.alreadyReported-no").check();
      await page.getByTestId("contact.contactable-no").check();
    },
  ]);
});

test("Alcohol - new on-licence", async ({ page }) => {
  const exampleFilePath = "./test.pdf";

  await runAccessibilityTest(page, "alcohol-new-on-licence", [
    async () => {
      await page.goto(
        "https://services.wellington.govt.nz/alcohol-licensing/new-on-licence/"
      );
      await page.getByTestId("getStarted").click();
    },
    async () => {
      await page.getByTestId("contactPersonGivenNames").fill("Test");
      await page.getByTestId("contactPersonFamilyName").fill("Test");
      await page.getByTestId("contactPersonPhoneNumber").fill("021 111 11111");
      await page.getByTestId("contactPersonEmailAddress").fill("test@test.com");
      await page.getByTestId("applicantType-Individual").check();
      await page.getByTestId("givenNames").fill("Test");
      await page.getByTestId("familyName").fill("Test");
      await page.getByTestId("dateOfBirth-date").fill("20");
      await page.getByTestId("dateOfBirth-month").fill("08");
      await page.getByTestId("dateOfBirth-year").fill("1995");
      await page.locator(".css-19bb58m").first().click();
      await page.getByText("Afghanistan", { exact: true }).click();
      await page.getByTestId("gender-Male").check();
      await page.getByTestId("occupation").click();
      await page.getByTestId("occupation").fill("Rapper");
      await page.getByTestId("applicantsExperience").click();
      await page
        .getByTestId("applicantsExperience")
        .fill("I spit a mean 16 bar");
      await page.locator("#address div").nth(3).click();
      await page.getByLabel("Applicant’s address *option").fill("1");
      await page
        .getByText("1-15 The Avenue, Mount Roskill, Auckland 1041", {
          exact: true,
        })
        .click();
      await page.getByTestId("emailAddress").fill("test@test.com");
      await page.getByTestId("phoneNumber").fill("021 111 1111");
      await page.getByTestId("individualConvictions-No").check();
      await page.getByTestId("next").click();
    },
    async () => {
      await page.getByTestId("tradingName").fill("Cash Money Entertainment");
      await page
        .getByTestId(
          "businessType-Tavern/bar (A business mainly used for providing alcohol and other refreshments, rather than for serving meals)"
        )
        .check();
      await page.getByTestId("description").fill("Young Moolah Babeh");
      await page.getByTestId("alcoholPrincipalService-No").check();
      await page
        .locator("div")
        .filter({ hasText: /^MondayClosed$/ })
        .getByLabel("Closed")
        .check();
      await page
        .locator("div")
        .filter({ hasText: /^TuesdayClosed$/ })
        .getByLabel("Closed")
        .check();
      await page
        .locator("div")
        .filter({ hasText: /^WednesdayClosed$/ })
        .getByLabel("Closed")
        .check();
      await page
        .locator("div")
        .filter({ hasText: /^ThursdayClosed$/ })
        .getByLabel("Closed")
        .check();
      await page
        .locator("div")
        .filter({ hasText: /^FridayClosed$/ })
        .getByLabel("Closed")
        .check();
      await page
        .locator("div")
        .filter({ hasText: /^SaturdayClosed$/ })
        .getByLabel("Closed")
        .check();
      await page.locator(".css-19bb58m").first().click();
      await page.getByText("9am").click();
      await page
        .locator(".css-ua61o7-control > .css-hlgwow > .css-19bb58m")
        .click();
      await page.getByText("10am").click();
      await page.getByTestId("next").click();
    },
    async () => {
      await page
        .getByTestId("premisesType-a premises i.e. in a building")
        .check();
      await page.locator("#businessAddress div").nth(3).click();
      await page.getByLabel("Business address *option ,").fill("1");
      await page
        .getByText(
          "Apartment 1005, 1 Market Lane, Wellington Central, Wellington 6011",
          { exact: true }
        )
        .click();
      await page.getByTestId("maximumOccupancy").fill("10");
      await page.getByTestId("applicantOwnershipOfPremises-Yes").check();
      await page.getByTestId("premisesNewBuild-No").check();
      await page
        .getByLabel("Is the licence being applied")
        .locator("label")
        .filter({ hasText: "No" })
        .locator("span")
        .click();
      await page
        .getByTestId("premisesAdditions[0]-No designated areas")
        .check();
      await page.getByTestId("premisesOutdoorArea-No").check();
      await page.getByTestId("isLocationCorrect-Yes").check();

      // Handle file uploads using setInputFiles
      await page.getByTestId("recordOfTitle-uploadButton").click();
      await page
        .locator('input[type="file"]')
        .first()
        .setInputFiles(exampleFilePath);
      await page.waitForTimeout(1000);

      await page.getByTestId("scalePlan-uploadButton").click();
      await page
        .locator('input[type="file"]')
        .nth(1)
        .setInputFiles(exampleFilePath);
      await page.waitForTimeout(1000);

      await page.getByTestId("premisesImpression-uploadButton").click();
      await page
        .locator('input[type="file"]')
        .nth(2)
        .setInputFiles(exampleFilePath);
      await page.waitForTimeout(1000);

      await page.getByTestId("buildingCertificate-uploadButton").click();
      await page
        .locator('input[type="file"]')
        .nth(3)
        .setInputFiles(exampleFilePath);
      await page.waitForTimeout(1000);

      await page.getByTestId("townPlanningCertificate-uploadButton").click();
      await page
        .locator('input[type="file"]')
        .nth(4)
        .setInputFiles(exampleFilePath);
      await page.waitForTimeout(1000);

      await page.getByTestId("next").click();
    },
    async () => {
      await page.getByText("Are you applying to add an").click();
      await page
        .getByLabel("Are you applying to add an")
        .getByText("No")
        .click();
      await page
        .getByLabel("Do you wish to complete a")
        .getByText("No")
        .click();
      await page
        .getByTestId("managerDetails.0.contactPersonGivenNames")
        .click();
      await page
        .getByTestId("managerDetails.0.contactPersonGivenNames")
        .fill("Test");
      await page
        .getByTestId("managerDetails.0.contactPersonGivenNames")
        .press("Tab");
      await page
        .getByTestId("managerDetails.0.contactPersonFamilyName")
        .fill("Test");
      await page
        .getByTestId("managerDetails.0.managersCertificateExpiry-date")
        .click();
      await page
        .getByTestId("managerDetails.0.managersCertificateExpiry-date")
        .fill("20");
      await page
        .getByTestId("managerDetails.0.managersCertificateExpiry-month")
        .fill("08");
      await page
        .getByTestId("managerDetails.0.managersCertificateExpiry-year")
        .fill("2025");
      await page
        .getByTestId("managerDetails.0.certificateIssuedByWCC-No")
        .check();
      await page
        .getByTestId("managerDetails.0.dutyManagersCertificates-uploadButton")
        .click();
      await page.locator('input[type="file"]').setInputFiles(exampleFilePath);
      await page.waitForTimeout(1000);

      await page.getByTestId("next").click();
    },
    async () => {
      await page
        .getByTestId("appliedForACertificateOfRegistration-Yes")
        .check();
      await page.getByTestId("confirmLegalFoodAndDrinkRequirements").check();
      await page
        .getByTestId("freeDrinkingWater[0]-Tap available in customer area")
        .check();
      await page.getByTestId("mainSupplyWater-Yes").check();
      await page.getByTestId("sampleMenu-uploadButton").click();
      await page.locator('input[type="file"]').setInputFiles(exampleFilePath);
      await page.getByTestId("next").click();
    },
    async () => {
      await page.getByTestId("hostResponsibilityPolicy-uploadButton").click();
      await page
        .locator('input[type="file"]')
        .first()
        .setInputFiles(exampleFilePath);
      await page.getByTestId("staffTrainingPlan-uploadButton").click();
      await page
        .locator('input[type="file"]')
        .nth(1)
        .setInputFiles(exampleFilePath);
      await page.getByTestId("securityPlan-uploadButton").click();
      await page
        .locator('input[type="file"]')
        .nth(2)
        .setInputFiles(exampleFilePath);
      await page.getByTestId("noiseManagementPlan-uploadButton").click();
      await page
        .locator('input[type="file"]')
        .nth(3)
        .setInputFiles(exampleFilePath);
      await page.getByTestId("evacuationDeclaration-uploadButton").click();
      await page
        .locator('input[type="file"]')
        .nth(4)
        .setInputFiles(exampleFilePath);
      await page.getByTestId("safeTransportOptions").fill("Get an Uber bro");
      await page.getByTestId("next").click();
    },
    async () => {
      await page.getByTestId("declaration").check();
      await page.getByTestId("next").click();
    },
    async () => {
      await page.goto(
        "https://services.wellington.govt.nz/alcohol-licensing/new-on-licence/step/payment/"
      );
    },
  ]);
});
