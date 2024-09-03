import csv
from playwright.sync_api import sync_playwright
from axe_core_python.sync_api import Axe
from tqdm import tqdm
from datetime import datetime

axe = Axe()

# Get current date
now = datetime.now()
date_string = now.strftime("%d-%m-%Y")

# Open the CSV file for writing
filename = f'accessibility-report-letstalk.csv'
with open(filename, 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(["URL", "Violations", "Status of issue", "Comment"])

    # Read the URLs from the file
    with open('letstalkurls.txt', 'r') as url_file:
        urls = [url.strip() for url in url_file]  # Remove any trailing newline and store URLs

    # Use tqdm to wrap around urls for progress bar
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()

        for url in tqdm(urls):
            try:
                page = browser.new_page()
                # Set a generous timeout for navigation if the sites are slow to load
                page.goto(url, timeout=60000)
                
                # Wait for the page to be fully loaded
                page.wait_for_load_state('networkidle')
                
                # Run axe with specific options
                result = axe.run(page, options={
                    'runOnly': {
                        'type': 'tag',
                        'values': ['wcag2a', 'wcag2aa', 'best-practice']
                    },
                    'resultTypes': ['violations', 'incomplete', 'inapplicable']
                })
                
                violations = result.get('violations', [])
                incomplete = result.get('incomplete', [])
                inapplicable = result.get('inapplicable', [])
                
                if violations:
                    # If violations are found, write them to the CSV file
                    writer.writerow([url, ', '.join([v['id'] for v in violations]), "Violation", ""])
                    tqdm.write(f"{len(violations)} violations found on {url}")
                if incomplete:
                    writer.writerow([url, ', '.join([i['id'] for i in incomplete]), "Needs Review", ""])
                    tqdm.write(f"{len(incomplete)} incomplete checks on {url}")
                if not violations and not incomplete:
                    # If no violations or incomplete checks are found, write an empty row with the URL
                    writer.writerow([url, "", "Pass", f"{len(inapplicable)} inapplicable rules"])
                    tqdm.write(f"No violations or incomplete checks found on {url}")
                    
            except Exception as e:
                # Handle exceptions, like timeouts, and log them
                tqdm.write(f"Timeout or other error occurred while visiting {url}: {e}")
                # Write an empty row with the URL and an error comment
                writer.writerow([url, "", "Error", f"Error: {e}"])
            finally:
                # Ensure the page is closed after each iteration
                page.close()
                
        browser.close()