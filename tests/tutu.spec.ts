/* import { test, expect, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";
import { createObjectCsvWriter, ObjectMap } from "csv-writer";

interface AccessibilityIssue {
  page: string;
  url: string;
  step: number;
  impact: string;
  type: string;
  description: string;
  help: string;
  helpUrl: string;
  selector: string;
}

// Utility function to write accessibility issues to CSV
async function writeAccessibilityIssuesToCsv(
  results: any,
  pageName: string,
  currentUrl: string,
  step: number,
  isFirstWrite = false
): Promise<number> {
  const records: AccessibilityIssue[] = results.violations.flatMap(
    (violation: any) =>
      violation.nodes.map((node: any) => ({
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

  if (records.length === 0) {
    console.log(
      `No accessibility issues found for ${pageName} at step ${step}`
    );
    return 0;
  }

  const dirPath = "tutuki-accessibility-results";
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }

  const filePath = path.join(process.cwd(), dirPath, `${pageName}.csv`);
  const headers: ObjectMap<string> = {
    url: "URL",
    step: "Step",
    impact: "Impact",
    description: "Description",
    help: "Issue",
    helpUrl: "More information",
    selector: "CSS selector",
  };

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: Object.entries(headers).map(([id, title]) => ({ id, title })),
    append: !isFirstWrite,
  });

  await csvWriter.writeRecords(records);
  console.log(
    `Wrote ${records.length} accessibility issues to CSV for ${pageName} at step ${step}`
  );
  return records.length;
}

// Define a type for the action function
type TestAction = () => Promise<void>;

// Enhanced test wrapper to handle step-by-step accessibility testing
async function runAccessibilityTest(
  page: Page,
  pageName: string,
  actions: TestAction[]
): Promise<void> {
  let step = 1;
  let totalIssues = 0;
  let isFirstWrite = true;
  const filePath = path.join(
    process.cwd(),
    "tutuki-accessibility-results",
    `${pageName}.csv`
  );

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  try {
    for (const action of actions) {
      await action();
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

    if (totalIssues === 0 && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      `Error during accessibility testing at step ${step}: ${
        (error as Error).message
      }`
    );
    throw error;
  }
}

// Helper functions for common interactions
async function fillTextField(page: Page, testId: string, value: string) {
  await page.getByTestId(testId).fill(value);
}

async function selectDropdownOption(
  page: Page,
  selector: string,
  text: string
) {
  await page.locator(selector).click();
  await page.getByText(text, { exact: true }).click();
}

async function checkRadioButton(page: Page, testId: string) {
  await page.getByTestId(testId).check();
}

async function uploadFile(
  page: Page,
  locator: string,
  filePath: string,
  index: number = 0
) {
  await page.locator(locator).nth(index).setInputFiles(filePath);
  await page.waitForTimeout(1000);
}

// Centralized data for file uploads
const exampleFilePath = "./test.pdf";

const testData = {
  propertySearch: {
    url: "https://services.wellington.govt.nz/property-search/",
    actions: [
      // Initial page load
      async ({ page }: { page: Page }) => {
        await page.goto(testData.propertySearch.url);
      },
      // Search interaction
      async ({ page }: { page: Page }) => {
        await page.locator(".css-19bb58m").click();
        await page
          .getByLabel("option , selected. Select is")
          .fill("113 the terrace");
        await page
          .getByText("226 Lambton Quay Wellington Central 6011", {
            exact: true,
          })
          .click();
      },
      // Aerial photos modal
      async ({ page }: { page: Page }) => {
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
      async ({ page }: { page: Page }) => {
        await checkRadioButton(page, "confirmation");
        await fillTextField(page, "givenNames", "Test");
        await fillTextField(page, "surname", "Test");
        await fillTextField(page, "company", "Test");
        await fillTextField(page, "phone", "021 111 1111");
        await fillTextField(page, "email", "test@test.com");
      },
    ],
  },
  tepp: {
    url: "https://services.wellington.govt.nz/outdoor-event-booking/booking-request/step/applicant-details/",
    actions: [
      // Initial page load - Applicant Details
      async ({ page }: { page: Page }) => {
        await page.goto(testData.tepp.url);
      },
      // Fill applicant details
      async ({ page }: { page: Page }) => {
        await checkRadioButton(page, "organisation-Individual");
        await fillTextField(page, "givenNames", "Test");
        await fillTextField(page, "familyName", "Test");
        await fillTextField(page, "emailAddress", "test@test.com");
        await fillTextField(page, "organiser_phoneNumber", "021 111 1111");
        await page.getByTestId("next").click();
      },
      // Event details page
      async ({ page }: { page: Page }) => {
        await fillTextField(page, "eventName", "Test Ahh Event");
        await fillTextField(
          page,
          "purposeOfYourEvent",
          "This is a big ahh event"
        );
        await checkRadioButton(page, "moreThanOneLocation-No");
        await page.locator("#singleLocation div").nth(3).click();
        await page.locator("#react-select-singleLocation-input").fill("Mak");
        await selectDropdownOption(page, "", "Mākara Peak Mountain Bike Park");
        await checkRadioButton(page, "willYouNeedToCrossOrCloseAnyRoads-No");
        await checkRadioButton(page, "eventDuration-One day");
        await fillTextField(page, "eventDate-date", "20");
        await fillTextField(page, "eventDate-month", "08");
        await fillTextField(page, "eventDate-year", "2025");
        await selectDropdownOption(
          page,
          "#eventTime .react-select__control",
          "5:00 AM"
        );
        await selectDropdownOption(
          page,
          "#endTime .react-select__control",
          "5:15 AM"
        );
        await checkRadioButton(
          page,
          "willSetUpAndPackDownHappenOnTheSameDayAsTheEvent-Yes"
        );
        await selectDropdownOption(
          page,
          "#setupStartTime .react-select__control",
          "5:15 AM"
        );
        await selectDropdownOption(
          page,
          "#packDownEndTime .react-select__control",
          "5:30 AM"
        );
        await fillTextField(page, "postponementDate-date", "21");
        await fillTextField(page, "postponementDate-month", "08");
        await fillTextField(page, "postponementDate-year", "2025");
        await checkRadioButton(page, "recurringEvent-No");
        await fillTextField(page, "totalNumberOfPeople", "1");
        await fillTextField(page, "maximumNumberOfPeople", "1");
        await checkRadioButton(page, "chargingEntryFee-No");
        await checkRadioButton(page, "willTheEventHaveFood-No");
        await checkRadioButton(page, "willYouSellOrSupplyAlcoholAtTheEvent-No");
        await checkRadioButton(page, "willTheEventInvolveFundraising-No");
        await checkRadioButton(page, "willTheEventHaveItemsForSale-No");
        await checkRadioButton(page, "doYouNeedAnyVehiclesOnsite-No");
        await checkRadioButton(page, "willYouHaveFireworksOrSpecialEffects-No");
        await page.getByTestId("next").click();
      },
      // Equipment selection
      async ({ page }: { page: Page }) => {
        await checkRadioButton(page, "largeEquipment[0]-Art installation");
        await checkRadioButton(page, "otherEquipment[0]-Chairs");
        await page.getByTestId("next").click();
      },
    ],
  },
  registerYourDog: {
    url: "https://services.wellington.govt.nz/register-your-dog/step/your-details/",
    actions: [
      // Initial page load
      async ({ page }: { page: Page }) => {
        await page.goto(testData.registerYourDog.url);
        await fillTextField(page, "givenNames", "Test");
        await fillTextField(page, "familyName", "Test");
        await page.locator("#address div").nth(3).click();
        await page
          .getByLabel("Your address *option ,")
          .fill("1 Market Lane, Wellington");
        await selectDropdownOption(
          page,
          "",
          "Apartment 1005, 1 Market Lane, Wellington Central, Wellington 6011"
        );
        await fillTextField(page, "emailAddress", "test@test.com");
        await fillTextField(page, "phoneNumber", "+64211111111");
        await fillTextField(page, "dateOfBirth-date", "20");
        await fillTextField(page, "dateOfBirth-month", "08");
        await fillTextField(page, "dateOfBirth-year", "1995");
        await checkRadioButton(page, "registeredBefore-no");
        await checkRadioButton(page, "completedResponsibleDogOwnerCourse-no");
        await page.getByTestId("next").click();
      },
      // dog details
      async ({ page }: { page: Page }) => {
        await fillTextField(page, "dogDetails.0.dogName", "Jim");
        await checkRadioButton(
          page,
          "dogDetails.0.dogAddress-Apartment 1005, 1 Market Lane, Wellington Central, Wellington 6011"
        );
        await checkRadioButton(page, "dogDetails.0.dogSex-Male");
        await fillTextField(page, "dogDetails.0.dogDateOfBirth-date", "20");
        await fillTextField(page, "dogDetails.0.dogDateOfBirth-month", "08");
        await fillTextField(page, "dogDetails.0.dogDateOfBirth-year", "1995");
        await selectDropdownOption(
          page,
          "#dogDetails\\.0\\.dogPrimaryBreed-label",
          "Australian Cattle"
        );
        await selectDropdownOption(
          page,
          "#dogDetails\\.0\\.dogSecondaryBreed-label",
          "American Cocker Spaniel"
        );
        await selectDropdownOption(
          page,
          "#dogDetails\\.0\\.dogPrimaryColour-label",
          "Black"
        );
        await selectDropdownOption(page, ".css-ua61o7-control", "Brindle");
        await fillTextField(page, "dogDetails.0.dogUniqueMarkings", "None");
        await checkRadioButton(page, "dogDetails.0.dogIsTransferring-No");
        await checkRadioButton(page, "dogDetails.0.dogIsDangerous-No");
        await checkRadioButton(page, "dogDetails.0.dogIsMenacing-No");
        await page.getByTestId("next").click();
      },
      // supporting documents
      async ({ page }: { page: Page }) => {
        await checkRadioButton(page, "supportingDocuments.0.desexed-no");
        await checkRadioButton(page, "supportingDocuments.0.adopted-no");
        await checkRadioButton(page, "supportingDocuments.0.imported-no");
        await checkRadioButton(page, "supportingDocuments.0.microchipped-no");
        await page
          .locator("div")
          .filter({ hasText: /^Large \(35mm in diameter\)$/ })
          .getByRole("img")
          .click();
        await page.getByTestId("next").click();
      },
      // declaration
      async ({ page }: { page: Page }) => {
        await page.getByTestId("next").click();
        await checkRadioButton(page, "declaration");
        await page.getByTestId("next").click();
      },
      // payment
      async ({ page }: { page: Page }) => {
        await page.goto(
          "https://services.wellington.govt.nz/register-your-dog/step/payment/"
        );
      },
    ],
  },
  updateDogOwnership: {
    url: "https://services.wellington.govt.nz/dog-ownership-details/update-dog-ownership/step/applicant-details/",
    actions: [
      async ({ page }: { page: Page }) => {
        await page.goto(testData.updateDogOwnership.url);
        await fillTextField(page, "givenNames", "Test");
        await fillTextField(page, "familyName", "Test");
        await page.locator("#address div").nth(3).click();
        await page
          .getByLabel("Postal address *option ,")
          .fill("1 The Avenue, Mount Roskill");
        await selectDropdownOption(
          page,
          "",
          "1-15 The Avenue, Mount Roskill, Auckland 1041"
        );
        await fillTextField(page, "emailAddress", "test@test.com");
        await fillTextField(page, "dogName", "Jim");
        await page.getByTestId("next").click();
      },
      // specify circumstances
      async ({ page }: { page: Page }) => {
        await checkRadioButton(page, "situationChange-Jim has passed away");
        await fillTextField(page, "dateOfDeath-date", "20");
        await fillTextField(page, "dateOfDeath-month", "08");
        await fillTextField(page, "dateOfDeath-year", "2024");
        await page
          .locator("label")
          .filter({ hasText: "I declare that Jim has passed" })
          .click();
        await checkRadioButton(page, "declarePassedAway");
        await checkRadioButton(
          page,
          "refundRegistrationFee-No refund requested"
        );
        await page.getByTestId("next").click();
      },
      // declaration
      async ({ page }: { page: Page }) => {
        await checkRadioButton(page, "declaration");
      },
    ],
  },
  bwofCompliance: {
    url: "https://building-warrant-of-fitness.services.wellington.govt.nz/building-warrant-of-fitness/",
    actions: [
      async ({ page }: { page: Page }) => {
        await page.goto(testData.bwofCompliance.url);
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
    ],
  },
  bwofIqp: {
    url: "https://building-warrant-of-fitness.services.wellington.govt.nz/building-warrant-of-fitness/search-for-an-iqp/",
    actions: [
      async ({ page }: { page: Page }) => {
        await page.goto(testData.bwofIqp.url);
        await checkRadioButton(page, "SS3/1 Automatic doors");
        await page.getByRole("button", { name: "Search" }).click();
        await page
          .locator("div:nth-child(46) > div:nth-child(2) > .p-8 > .mt-2")
          .click();
        await page.getByRole("button", { name: "Name or IQP number" }).click();
        await page.getByLabel("Search for an independent").click();
        await page.getByLabel("Search for an independent").fill("Richard");
        await page.getByLabel("Search for an independent").press("Enter");
      },
    ],
  },
  reportAProblem: {
    url: "https://services.wellington.govt.nz/report/",
    actions: [
      async ({ page }: { page: Page }) => {
        await page.goto(testData.reportAProblem.url);
        await selectDropdownOption(
          page,
          ".css-ua61o7-control",
          "Graffiti or vandalism"
        );
        await checkRadioButton(page, "graffiti.isOffensive-yes");
        await page
          .locator('[id="details\\.location\\.address"] div')
          .nth(3)
          .click();
        await page
          .getByLabel("Enter the address of the")
          .fill("113 The Terrace");
        await selectDropdownOption(
          page,
          "",
          "113 The Terrace, Wellington Central"
        );
        await fillTextField(
          page,
          "details.description",
          "Offensive ahh graffiti "
        );
        await checkRadioButton(page, "details.alreadyReported-no");
        await checkRadioButton(page, "contact.contactable-no");
      },
    ],
  },
  alcoholNewOnLicence: {
    url: "https://services.wellington.govt.nz/alcohol-licensing/new-on-licence/",
    actions: [
      async ({ page }: { page: Page }) => {
        await page.goto(testData.alcoholNewOnLicence.url);
        await page.getByTestId("getStarted").click();
      },
      async ({ page }: { page: Page }) => {
        await fillTextField(page, "contactPersonGivenNames", "Test");
        await fillTextField(page, "contactPersonFamilyName", "Test");
        await fillTextField(page, "contactPersonPhoneNumber", "021 111 11111");
        await fillTextField(page, "contactPersonEmailAddress", "test@test.com");
        await checkRadioButton(page, "applicantType-Individual");
        await fillTextField(page, "givenNames", "Test");
        await fillTextField(page, "familyName", "Test");
        await fillTextField(page, "dateOfBirth-date", "20");
        await fillTextField(page, "dateOfBirth-month", "08");
        await fillTextField(page, "dateOfBirth-year", "1995");
        await selectDropdownOption(page, ".css-19bb58m", "Afghanistan");
        await checkRadioButton(page, "gender-Male");
        await fillTextField(page, "occupation", "Rapper");
        await fillTextField(
          page,
          "applicantsExperience",
          "I spit a mean 16 bar"
        );
        await page.locator("#address div").nth(3).click();
        await page
          .getByLabel("Applicant’s address *option")
          .fill("1-15 The Avenue, Mount Roskill");
        await selectDropdownOption(
          page,
          "",
          "1-15 The Avenue, Mount Roskill, Auckland 1041"
        );
        await fillTextField(page, "emailAddress", "test@test.com");
        await fillTextField(page, "phoneNumber", "021 111 1111");
        await checkRadioButton(page, "individualConvictions-No");
        await page.getByTestId("next").click();
      },
      async ({ page }: { page: Page }) => {
        await fillTextField(page, "tradingName", "Cash Money Entertainment");
        await checkRadioButton(
          page,
          "businessType-Tavern/bar (A business mainly used for providing alcohol and other refreshments, rather than for serving meals)"
        );
        await fillTextField(page, "description", "Young Moolah Babeh");
        await checkRadioButton(page, "alcoholPrincipalService-No");
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
        await selectDropdownOption(page, ".css-19bb58m", "9am");
        await selectDropdownOption(page, ".css-ua61o7-control", "10am");
        await page.getByTestId("next").click();
      },
      async ({ page }: { page: Page }) => {
        await checkRadioButton(
          page,
          "premisesType-a premises i.e. in a building"
        );
        await page.locator("#businessAddress div").nth(3).click();
        await page.getByLabel("Business address *option ,").fill("1");
        await selectDropdownOption(
          page,
          "",
          "Apartment 1005, 1 Market Lane, Wellington Central, Wellington 6011"
        );
        await fillTextField(page, "maximumOccupancy", "10");
        await checkRadioButton(page, "applicantOwnershipOfPremises-Yes");
        await checkRadioButton(page, "premisesNewBuild-No");
        await page
          .getByLabel("Is the licence being applied")
          .locator("label")
          .filter({ hasText: "No" })
          .locator("span")
          .click();
        await checkRadioButton(
          page,
          "premisesAdditions[0]-No designated areas"
        );
        await checkRadioButton(page, "premisesOutdoorArea-No");
        await checkRadioButton(page, "isLocationCorrect-Yes");

        await page.getByTestId("recordOfTitle-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 0);

        await page.getByTestId("scalePlan-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 1);

        await page.getByTestId("premisesImpression-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 2);

        await page.getByTestId("buildingCertificate-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 3);

        await page.getByTestId("townPlanningCertificate-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 4);

        await page.getByTestId("next").click();
      },
      async ({ page }: { page: Page }) => {
        await page.getByText("Are you applying to add an").click();
        await page
          .getByLabel("Are you applying to add an")
          .getByText("No")
          .click();
        await page
          .getByLabel("Do you wish to complete a")
          .getByText("No")
          .click();
        await fillTextField(
          page,
          "managerDetails.0.contactPersonGivenNames",
          "Test"
        );
        await fillTextField(
          page,
          "managerDetails.0.contactPersonFamilyName",
          "Test"
        );
        await fillTextField(
          page,
          "managerDetails.0.managersCertificateExpiry-date",
          "20"
        );
        await fillTextField(
          page,
          "managerDetails.0.managersCertificateExpiry-month",
          "08"
        );
        await fillTextField(
          page,
          "managerDetails.0.managersCertificateExpiry-year",
          "2025"
        );
        await checkRadioButton(
          page,
          "managerDetails.0.certificateIssuedByWCC-No"
        );
        await page
          .getByTestId("managerDetails.0.dutyManagersCertificates-uploadButton")
          .click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath);
        await page.getByTestId("next").click();
      },
      async ({ page }: { page: Page }) => {
        await checkRadioButton(
          page,
          "appliedForACertificateOfRegistration-Yes"
        );
        await checkRadioButton(page, "confirmLegalFoodAndDrinkRequirements");
        await checkRadioButton(
          page,
          "freeDrinkingWater[0]-Tap available in customer area"
        );
        await checkRadioButton(page, "mainSupplyWater-Yes");
        await page.getByTestId("sampleMenu-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath);
        await page.getByTestId("next").click();
      },
      async ({ page }: { page: Page }) => {
        await page.getByTestId("hostResponsibilityPolicy-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 0);

        await page.getByTestId("staffTrainingPlan-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 1);

        await page.getByTestId("securityPlan-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 2);

        await page.getByTestId("noiseManagementPlan-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 3);

        await page.getByTestId("evacuationDeclaration-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 4);

        await fillTextField(page, "safeTransportOptions", "Get an Uber bro");
        await page.getByTestId("next").click();
      },
      async ({ page }: { page: Page }) => {
        await checkRadioButton(page, "declaration");
        await page.getByTestId("next").click();
      },
      async ({ page }: { page: Page }) => {
        await page.goto(
          "https://services.wellington.govt.nz/alcohol-licensing/new-on-licence/step/payment/"
        );
      },
    ],
  },
  alcoholRenewDutyManagerCertificate: {
    url: "https://services.wellington.govt.nz/alcohol-licensing/renew-managers-certificate/",
    actions: [
      async ({ page }: { page: Page }) => {
        await page.goto(testData.alcoholRenewDutyManagerCertificate.url);
        await page.getByTestId("getStarted").click();
        await checkRadioButton(
          page,
          "contactPerson-No - I am the duty manager"
        );
        await fillTextField(page, "givenNames", "Tom");
        await fillTextField(page, "familyName", "Test");
        await checkRadioButton(page, "otherNames-No");
        await fillTextField(page, "dateOfBirth-date", "20");
        await fillTextField(page, "dateOfBirth-month", "08");
        await fillTextField(page, "dateOfBirth-year", "1995");
        await selectDropdownOption(page, ".css-19bb58m", "Afghanistan");
        await checkRadioButton(page, "gender-Male");
        await fillTextField(page, "occupation", "Plumber");
        await page.locator("#address div").nth(3).click();
        await page
          .getByTestId("address-label")
          .locator("div")
          .filter({ hasText: "Start typing to search..." })
          .nth(2)
          .click();
        await page
          .getByLabel("Applicant’s address *option")
          .fill("113 The Terrace. Wellington");
        await selectDropdownOption(
          page,
          "",
          "113 The Terrace, Wellington Central, Wellington 6011"
        );
        await fillTextField(page, "emailAddress", "test@test.com");
        await fillTextField(page, "phoneNumber", "021 111 11111");
        await checkRadioButton(page, "managerConvictions-No");

        await page.getByTestId("photoIdentification-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 0);

        await page.getByTestId("next").click();
      },
      async ({ page }: { page: Page }) => {
        await checkRadioButton(page, "certificateIssuedByWCC-No");

        await page.getByTestId("dutyManagersCertificates-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 0);

        await fillTextField(page, "managersCertificateExpiry-date", "20");
        await fillTextField(page, "managersCertificateExpiry-month", "08");
        await fillTextField(page, "managersCertificateExpiry-year", "2025");

        await page
          .getByTestId("managersLicenseControllerCertificate-uploadButton")
          .click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 1);

        await checkRadioButton(page, "LCQBefore2012-No");
        await checkRadioButton(page, "currentDutyManager-Yes");
        await fillTextField(
          page,
          "currentDutyManagerCurrentEmployer",
          "The Bar"
        );
        await fillTextField(page, "stepsToManageSale", "Hehe");
        await page.getByTestId("next").click();
      },
      async ({ page }: { page: Page }) => {
        await checkRadioButton(page, "declaration");
        await page.getByTestId("next").click();
      },
      async ({ page }: { page: Page }) => {
        await page.goto(
          "https://services.wellington.govt.nz/alcohol-licensing/renew-managers-certificate/step/payment/"
        );
      },
    ],
  },
  alcoholTempAuthority: {
    url: "https://services.wellington.govt.nz/alcohol-licensing/temporary-authority/",
    actions: [
      async ({ page }: { page: Page }) => {
        await page.goto(testData.alcoholTempAuthority.url);
        await page.getByTestId("getStarted").click();
        await fillTextField(page, "contactPersonGivenNames", "Test");
        await fillTextField(page, "contactPersonFamilyName", "Test");
        await fillTextField(page, "contactPersonPhoneNumber", "021 111 1111");
        await fillTextField(page, "contactPersonEmailAddress", "test@test.com");
        await checkRadioButton(page, "firstApplication-Yes");
        await checkRadioButton(page, "applicationReason-Purchasing a business");
        await checkRadioButton(page, "applicantType-Individual");
        await fillTextField(page, "givenNames", "Test");
        await fillTextField(page, "familyName", "Test");
        await fillTextField(
          page,
          "applicantsExperience",
          "I have lots of experience"
        );
        await page
          .getByTestId("address-label")
          .locator("div")
          .filter({ hasText: "Start typing to search..." })
          .nth(2)
          .click();
        await page
          .getByLabel("Applicant’s address *option")
          .fill("113 The Terrace, Wellington");
        await selectDropdownOption(
          page,
          "",
          "113 The Terrace, Wellington Central, Wellington 6011"
        );
        await fillTextField(page, "emailAddress", "test@test.com");
        await fillTextField(page, "phoneNumber", "021 111 1111");
        await checkRadioButton(page, "individualConvictions-No");
        await page.getByTestId("next").click();
        await fillTextField(page, "currentTradingName", "Big Business LLC");
        await fillTextField(page, "newTradingName", "Small Business LLC");
        await fillTextField(page, "dateStartTrading-date", "01");
        await fillTextField(page, "dateStartTrading-month", "10");
        await fillTextField(page, "dateStartTrading-year", "2029");
        await checkRadioButton(page, "currentLicenceType-Off-licence");
        await fillTextField(page, "currentLicenceNumber", "123456");

        await page.getByTestId("currentLicence-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 0);

        await page.getByTestId("next").click();
        await page.locator("#businessAddress div").nth(3).click();
        await page
          .getByLabel("Business address *option ,")
          .fill("113 The Terrace, Wellington");
        await selectDropdownOption(
          page,
          "",
          "113 The Terrace, Wellington Central, Wellington 6011"
        );
        await checkRadioButton(page, "premisesOwnedByApplicant-Yes");

        await page.getByTestId("recordOfTitle-uploadButton").click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 0);

        await page.getByTestId("next").click();
        await fillTextField(
          page,
          "managerDetails.0.contactPersonGivenNames",
          "Test"
        );
        await fillTextField(
          page,
          "managerDetails.0.contactPersonFamilyName",
          "Test"
        );
        await fillTextField(
          page,
          "managerDetails.0.managersCertificateExpiry-date",
          "01"
        );
        await fillTextField(
          page,
          "managerDetails.0.managersCertificateExpiry-month",
          "10"
        );
        await fillTextField(
          page,
          "managerDetails.0.managersCertificateExpiry-year",
          "2029"
        );
        await checkRadioButton(
          page,
          "managerDetails.0.certificateIssuedByWCC-No"
        );

        await page
          .getByTestId("managerDetails.0.dutyManagersCertificates-uploadButton")
          .click();
        await uploadFile(page, 'input[type="file"]', exampleFilePath, 0);

        await page.getByTestId("next").click();
        await page.getByTestId("next").click();
        await page.getByTestId("next").click();
        await checkRadioButton(page, "declaration");
        await page.getByTestId("next").click();

        await page.goto(
          "https://services.wellington.govt.nz/alcohol-licensing/temporary-authority/step/payment/"
        );
        await page.getByTestId("pay-now").click();
      },
    ],
  },
};

// Run tests for each page
for (const [pageName, { url, actions }] of Object.entries(testData)) {
  test(pageName, async ({ page }) => {
    await runAccessibilityTest(
      page,
      pageName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(), // Convert camelCase to kebab-case for file naming
      actions.map((action) => () => action({ page })) // Pass the page object to each action
    );
  });
}
 */
