from playwright.sync_api import sync_playwright
from axe_core_python.sync_playwright import Axe
from tqdm import tqdm
from datetime import datetime
import html  # For HTML escaping

axe = Axe()

# Get current date
now = datetime.now()
date_string = now.strftime("%d-%m-%Y")

# HTML template for the report
html_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Let's Talk accessibility report - {date}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
        h1 {{
            color: #2c3e50;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }}
        h2 {{
            margin-top: 30px;
            padding: 10px;
            background-color: #f5f5f5;
            border-left: 4px solid #2c3e50;
        }}
        .summary {{
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }}
        .url-section {{
            margin-bottom: 40px;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .url-header {{
            background-color: #f1f1f1;
            padding: 15px;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .url-content {{
            padding: 20px;
        }}
        .url-status {{
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 14px;
            font-weight: bold;
        }}
        .status-error {{
            background-color: #f8d7da;
            color: #721c24;
        }}
        .status-pass {{
            background-color: #d4edda;
            color: #155724;
        }}
        .status-violations {{
            background-color: #fff3cd;
            color: #856404;
        }}
        .violation {{
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }}
        .violation:last-child {{
            border-bottom: none;
        }}
        .violation-header {{
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 18px;
        }}
        .violation-impact {{
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
            margin-left: 10px;
        }}
        .impact-critical {{
            background-color: #dc3545;
            color: white;
        }}
        .impact-serious {{
            background-color: #fd7e14;
            color: white;
        }}
        .impact-moderate {{
            background-color: #ffc107;
            color: #333;
        }}
        .impact-minor {{
            background-color: #6c757d;
            color: white;
        }}
        .violation-description {{
            margin-bottom: 15px;
        }}
        .help-link {{
            display: inline-block;
            margin-top: 10px;
            margin-bottom: 15px;
            color: #007bff;
            text-decoration: none;
        }}
        .help-link:hover {{
            text-decoration: underline;
        }}
        .node-item {{
            margin-bottom: 15px;
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
        }}
        code {{
            display: block;
            white-space: pre-wrap;
            word-wrap: break-word;
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-family: monospace;
            margin: 10px 0;
            border: 1px solid #ddd;
        }}
    </style>
</head>
<body>
    <h1>Let's Talk accessibility report - {date}</h1>
    <div class="summary">
        <p><strong>Total URLs checked:</strong> {total_urls}</p>
        <p><strong>URLs with violations:</strong> {urls_with_violations}</p>
        <p><strong>URLs with errors:</strong> {urls_with_errors}</p>
        <p><strong>URLs with no issues:</strong> {urls_with_no_issues}</p>
        <p><strong>Total violations found:</strong> {total_violations}</p>
    </div>
    
    <div id="results">
        {results_content}
    </div>
</body>
</html>
"""

def format_violation(violation):
    """Format a single violation as HTML with code blocks for violations"""
    impact_class = f"impact-{violation['impact']}" if 'impact' in violation else ""
    
    nodes_html = ""
    if 'nodes' in violation:
        for i, node in enumerate(violation['nodes']):
            # Escape HTML to prevent rendering
            html_content = html.escape(node.get('html', 'No HTML available'))
            target = html.escape(', '.join(node.get('target', ['No target available'])))
            
            nodes_html += f"""
            <div class="node-item">
                <div><strong>Element {i+1}:</strong></div>
                <div><strong>HTML:</strong></div>
                <code>{html_content}</code>
                <div><strong>Selector:</strong></div>
                <code>{target}</code>
            </div>
            """
    
    return f"""
    <div class="violation">
        <div class="violation-header">
            {violation.get('id', 'Unknown')}
            <span class="violation-impact {impact_class}">{violation.get('impact', 'unknown').upper()}</span>
        </div>
        <div class="violation-description">{violation.get('help', 'No help available')}</div>
        <div><strong>Description:</strong> {violation.get('description', 'No description available')}</div>
        <a href="{violation.get('helpUrl', '#')}" class="help-link" target="_blank">Learn more</a>
        
        <h3>Affected Elements:</h3>
        {nodes_html}
    </div>
    """

def generate_report():
    total_urls = 0
    urls_with_violations = 0
    urls_with_errors = 0
    urls_with_no_issues = 0
    total_violations = 0
    results_content = ""
    
    # Read the URLs from the file
    with open('letstalkurls.txt', 'r') as url_file:
        urls = [url.strip() for url in url_file]
    
    total_urls = len(urls)
    
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
                    urls_with_violations += 1
                    total_violations += len(violations)
                    
                    violations_html = "".join([format_violation(v) for v in violations])
                    results_content += f"""
                    <div class="url-section">
                        <div class="url-header">
                            <h2>{url}</h2>
                            <span class="url-status status-violations">{len(violations)} Violations</span>
                        </div>
                        <div class="url-content">
                            {violations_html}
                        </div>
                    </div>
                    """
                    tqdm.write(f"{len(violations)} violations found on {url}")
                else:
                    urls_with_no_issues += 1
                    results_content += f"""
                    <div class="url-section">
                        <div class="url-header">
                            <h2>{url}</h2>
                            <span class="url-status status-pass">No Violations</span>
                        </div>
                        <div class="url-content">
                            <p>No accessibility violations were detected.</p>
                        </div>
                    </div>
                    """
                    tqdm.write(f"No violations found on {url}")
                    
            except Exception as e:
                urls_with_errors += 1
                results_content += f"""
                <div class="url-section">
                    <div class="url-header">
                        <h2>{url}</h2>
                        <span class="url-status status-error">Error</span>
                    </div>
                    <div class="url-content">
                        <p>Error: {str(e)}</p>
                    </div>
                </div>
                """
                tqdm.write(f"Timeout or other error occurred while visiting {url}: {e}")
            finally:
                # Ensure the page is closed after each iteration
                page.close()
                
        browser.close()
    
    # Fill in the template
    report_html = html_template.format(
        date=date_string,
        total_urls=total_urls,
        urls_with_violations=urls_with_violations,
        urls_with_errors=urls_with_errors,
        urls_with_no_issues=urls_with_no_issues,
        total_violations=total_violations,
        results_content=results_content
    )
    
    # Write the HTML report to a file
    filename = f'accessibility-report-lets-talk-{date_string}.html'
    with open(filename, 'w', encoding='utf-8') as file:
        file.write(report_html)
    
    print(f"Report generated successfully: {filename}")

if __name__ == "__main__":
    generate_report()
