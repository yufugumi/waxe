import asyncio
from playwright.async_api import async_playwright
from axe_core_python.async_playwright import Axe
from tqdm.asyncio import tqdm
from datetime import datetime
from jinja2 import Template
import logging
from typing import List, Dict, Tuple

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("accessibility_scan_archives.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

async def process_url(url: str, browser, semaphore, axe: Axe, progress_bar) -> Tuple[str, List[Dict]]:
    """Process a single URL with error handling and retries."""
    max_retries = 2
    retry_count = 0
    
    while retry_count <= max_retries:
        try:
            async with semaphore:  # Limit concurrent connections
                context = await browser.new_context(
                    viewport={'width': 1280, 'height': 720},
                    user_agent='WAXE accessibility testing bot'
                )
                
                try:
                    page = await context.new_page()
                    await page.goto(url, timeout=30000, wait_until='networkidle')
                    
                    # Wait for page to be fully loaded
                    await page.wait_for_load_state('networkidle')
                    
                    # Run accessibility tests
                    result = await axe.run(page)
                    
                    if result.get('violations'):
                        progress_bar.write(f"{len(result['violations'])} violations found on {url}")
                    else:
                        progress_bar.write(f"No violations found on {url}")
                    
                    return url, result.get('violations', [])
                
                finally:
                    await context.close()  # Ensure context is closed to free resources
        
        except Exception as e:
            retry_count += 1
            if retry_count <= max_retries:
                progress_bar.write(f"Error on {url}, retrying ({retry_count}/{max_retries}): {e}")
                await asyncio.sleep(2)  # Wait before retry
            else:
                progress_bar.write(f"Failed to process {url} after {max_retries} retries: {e}")
                return url, []
        finally:
            progress_bar.update(1)  # Update progress bar after each URL

async def process_urls(urls: List[str]) -> List[Tuple[str, List[Dict]]]:
    """Process all URLs with a global progress bar."""
    axe = Axe()
    results = []
    
    max_concurrent = 10  
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        
        try:
            # Create a single progress bar for all URLs
            with tqdm(total=len(urls), desc="Processing URLs") as progress_bar:
                # Process URLs in smaller chunks to manage memory while maintaining the global progress bar
                chunk_size = 20  # Adjust based on memory constraints
                for i in range(0, len(urls), chunk_size):
                    chunk = urls[i:i + chunk_size]
                    
                    # Create tasks for this chunk
                    tasks = [
                        process_url(url, browser, semaphore, axe, progress_bar) 
                        for url in chunk
                    ]
                    
                    # Wait for all tasks in this chunk to complete
                    chunk_results = await asyncio.gather(*tasks)
                    results.extend(chunk_results)
                    
                    await asyncio.sleep(2)
                    
        finally:
            await browser.close()
            
    return results

async def main():
    now = datetime.now()
    date_string = now.strftime("%d-%m-%Y")
    test_name = "archives-online"
    
    # Read URLs
    with open('archives.txt', 'r') as url_file:
        urls = [url.strip() for url in url_file if url.strip()]
        
    logger.info(f"Starting accessibility scan of {len(urls)} URLs")
    
    # Process all URLs with a global progress bar
    results = await process_urls(urls)
    
    # Read template
    with open('template.html') as f:
        template = Template(f.read())
    
    # Render HTML report
    html_output = template.render(
        date=date_string,
        results=results,
        test_name=test_name
    )
    
    report_filename = f'accessibility-report-{test_name}.html'
    with open(report_filename, 'w', encoding='utf-8') as f:
        f.write(html_output)
        
    logger.info(f"Accessibility report generated: {report_filename}")

if __name__ == "__main__":
    asyncio.run(main())