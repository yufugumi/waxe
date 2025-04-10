import { expect, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { ensureDirSync } from "fs-extra";

// Store results for HTML report
interface ViolationData {
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  html: string;
  selector: string;
}

interface StepData {
  stepNumber: number;
  url: string;
  urlPath: string;
  violations: ViolationData[];
}

const testResults: Map<string, StepData[]> = new Map();

// Updated function to store accessibility issues for HTML report
export async function recordAccessibilityIssues(
  results,
  pageName: string,
  currentUrl: string,
  step: number
): Promise<number> {
  if (!testResults.has(pageName)) {
    testResults.set(pageName, []);
  }

  const violations = results.violations.map((violation) => {
    const node = violation.nodes[0]; // Get the first node for simplicity
    return {
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      html: node?.html || "No HTML available",
      selector: node?.target.join(", ") || "No selector available",
    };
  });

  const urlObj = new URL(currentUrl);
  const pageResults = testResults.get(pageName);
  if (pageResults) {
    pageResults.push({
      stepNumber: step,
      url: urlObj.hostname + urlObj.pathname,
      urlPath: urlObj.pathname,
      violations,
    });
  }

  // Log information
  if (violations.length === 0) {
    console.log(
      `No accessibility issues found for ${pageName} at step ${step}`
    );
  } else {
    console.log(
      `Found ${violations.length} accessibility issues for ${pageName} at step ${step}`
    );
  }

  return violations.length;
}

// Generate HTML report
export async function generateAccessibilityReport(
  pageName: string
): Promise<void> {
  const steps = testResults.get(pageName) || [];
  const totalIssues = steps.reduce(
    (total, step) => total + step.violations.length,
    0
  );

  if (totalIssues === 0) {
    console.log(`No issues found for ${pageName}, skipping report generation`);
    return;
  }

  // Create directory if it doesn't exist
  const reportsDir = path.join(process.cwd(), "reports");
  ensureDirSync(reportsDir);

  // Read template
  const templatePath = path.join(process.cwd(), "services-template.html");
  const templateSource = fs.readFileSync(templatePath, "utf-8");
  const template = Handlebars.compile(templateSource);

  // Generate report
  const today = new Date();
  const dateString = today.toLocaleDateString();

  // Format date as DD-MM-YYYY for the filename
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  const htmlContent = template({
    testName: pageName,
    date: dateString,
    steps,
  });

  // Write the report with new date format
  const reportPath = path.join(reportsDir, `${pageName}-${formattedDate}.html`);
  fs.writeFileSync(reportPath, htmlContent);

  console.log(`Accessibility report generated: ${reportPath}`);
}

export async function fillStagingDetails(page: Page): Promise<void> {
  const password = process.env.VISITOR_PASSWORD || "";
  await page.getByRole("textbox", { name: "VISITOR PASSWORD" }).fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
}

export async function processCreditCardPayment(page: Page) {
  await page.locator('[autocomplete="cc-number"]').fill("4111 1111 1111 1111");
  await page;
  page.locator('[autocomplete="cc-name"]').fill("TEST");
  await page
    .locator('[autocomplete="cc-exp-month"], [name="month"]')
    .selectOption("01");
  await page
    .locator('[autocomplete="cc-exp-year"], [name="year"]')
    .selectOption("30");
  await page.getByRole("textbox", { name: "CVC:*" }).fill("888");
  await page.getByRole("button", { name: "Submit" }).press("Enter");
  await expect(page).toHaveTitle(/Windcave | Payment Result Page/);
  await page.getByRole("link", { name: "Next" }).press("Enter");
}

export async function fillPersonalDetails(
  page: Page,
  options: {
    organisationType?: string;
    givenNames?: string;
    surname?: string;
    familyName?: string;
    company?: string;
    email?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: { day: string; month: string; year: string };
    givenNamesTestId?: string;
    surnameTestId?: string;
    familyNameTestId?: string;
    companyTestId?: string;
    emailTestId?: string;
    phoneTestId?: string;
    addressSelector?: string;
    dateOfBirthTestIdPrefix?: string;
    clickNext?: boolean;
  } = {}
) {
  const {
    organisationType,
    givenNames = "Test",
    surname = "Test",
    familyName = "Test",
    company,
    email = "test@test.com",
    phone = "+642 111 1111",
    givenNamesTestId = "givenNames",
    surnameTestId = "surname",
    familyNameTestId = "familyName",
    companyTestId = "company",
    emailTestId = "email",
    phoneTestId = "phone",
    clickNext = false,
  } = options;

  // Handle organization type if provided
  if (organisationType) {
    await page.getByTestId(`organisation-${organisationType}`).check();
  }

  // Fill in names
  if (givenNames) {
    // Check if element exists before interacting
    const givenNamesElement = page.getByTestId(givenNamesTestId);
    if ((await givenNamesElement.count()) > 0) {
      await givenNamesElement.fill(givenNames);
    }
  }

  // Handle both surname and familyName fields
  if (surname) {
    const surnameElement = page.getByTestId(surnameTestId);
    if ((await surnameElement.count()) > 0) {
      await surnameElement.fill(surname);
    }
  }

  if (familyName) {
    const familyNameElement = page.getByTestId(familyNameTestId);
    if ((await familyNameElement.count()) > 0) {
      await familyNameElement.fill(familyName);
    }
  }

  // Only try to fill company if it was specified
  if (company) {
    const companyElement = page.getByTestId(companyTestId);
    if ((await companyElement.count()) > 0) {
      await companyElement.fill(company);
    }
  }

  // Fill in contact details
  if (email) {
    const emailElement = page.getByTestId(emailTestId);
    if ((await emailElement.count()) > 0) {
      await emailElement.fill(email);
    }
  }

  if (phone) {
    const phoneElement = page.getByTestId(phoneTestId);
    if ((await phoneElement.count()) > 0) {
      await phoneElement.fill(phone);
    }
  }

  // Click next button if specified
  if (clickNext) {
    const nextButton = page.getByTestId("next");
    if ((await nextButton.count()) > 0) {
      await nextButton.click();
    }
  }
}

// Enhanced test wrapper to handle step-by-step accessibility testing
export async function runAccessibilityTest(
  page: Page,
  pageName: string,
  actions: (() => Promise<void>)[]
) {
  let step = 1;
  let totalIssues = 0;

  // Clear previous results for this test
  testResults.delete(pageName);

  try {
    for (const action of actions) {
      await action();
      // Wait for any animations or transitions to complete
      await page.waitForTimeout(500);

      const currentUrl = page.url();
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      const issuesCount = await recordAccessibilityIssues(
        accessibilityScanResults,
        pageName,
        currentUrl,
        step
      );

      totalIssues += issuesCount;
      step++;
    }

    // Generate the HTML report
    await generateAccessibilityReport(pageName);
  } catch (error) {
    console.error(
      `Error during accessibility testing at step ${step}: ${error.message}`
    );
    throw error;
  }
}
