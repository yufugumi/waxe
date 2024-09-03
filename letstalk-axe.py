import csv
from playwright.sync_api import sync_playwright
from axe_core_python.sync_playwright import Axe
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
    with open('urls.txt', 'r') as url_file:
        urls = [url.strip() for url in url_file]  # Remove any trailing newline and store URLs

    # Use tqdm to wrap around urls for progress bar
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()

        for url in tqdm(urls):
            try:
                page = browser.new_page()
                # Set a generous timeout for navigation if the sites are slow to load
                page.goto(url, timeout=60000)
                result = axe.run(page)
                violations = result.get('violations', [])
                
                if violations:
                    # If violations are found, write them to the CSV file
                    writer.writerow([url, ', '.join([str(v) for v in violations]), "", ""])
                    tqdm.write(f"{len(violations)} violations found on {url}")
                else:
                    # If no violations are found, write an empty row with the URL
                    writer.writerow([url, "", "", ""])
                    tqdm.write(f"No violations found on {url}")
                    
            except Exception as e:
                # Handle exceptions, like timeouts, and log them
                tqdm.write(f"Timeout or other error occurred while visiting {url}: {e}")
                # Write an empty row with the URL and an error comment
                writer.writerow([url, "", "", f"Error: {e}"])
            finally:
                # Ensure the page is closed after each iteration
                page.close()
                
        browser.close()
