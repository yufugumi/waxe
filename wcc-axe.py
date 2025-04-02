from playwright.sync_api import sync_playwright
from axe_core_python.sync_playwright import Axe
from tqdm import tqdm
from datetime import datetime
from jinja2 import Template
import html

axe = Axe()
now = datetime.now()
date_string = now.strftime("%d-%m-%Y")
test_name="wellington-govt-nz"

# Store results in a list
results = []

# Read template
with open('template.html') as f:
    template = Template(f.read())

with open('urls.txt', 'r') as url_file:
    urls = [url.strip() for url in url_file]

with sync_playwright() as playwright:
    browser = playwright.chromium.launch()

    for url in tqdm(urls):
        try:
            page = browser.new_page()
            page.goto(url, timeout=60000)
            result = axe.run(page)
            results.append((url, result.get('violations', [])))
            
            if result.get('violations'):
                tqdm.write(f"{len(result['violations'])} violations found on {url}")
            else:
                tqdm.write(f"No violations found on {url}")
                
        except Exception as e:
            tqdm.write(f"Error on {url}: {e}")
            results.append((url, []))
        finally:
            page.close()
            
    browser.close()

# Render HTML report
html_output = template.render(
    date=date_string, 
    results=results,
    test_name="wellington-govt-nz"
)

with open(f'accessibility-report-{test_name}.html', 'w', encoding='utf-8') as f:
    f.write(html_output)