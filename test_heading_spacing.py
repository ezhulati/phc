from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})

    # Navigate to a blog post with H2 headings
    page.goto('http://localhost:4321/how-much-does-aba-therapy-cost/')
    page.wait_for_load_state('networkidle')

    # Scroll to show some H2 headings
    page.evaluate("window.scrollTo(0, 800)")
    page.wait_for_timeout(500)

    # Take screenshot
    page.screenshot(path='/tmp/heading_spacing_test.png', full_page=False)
    print("Screenshot saved to /tmp/heading_spacing_test.png")

    # Also get the computed styles for H2 elements
    h2_styles = page.evaluate("""
        () => {
            const h2s = document.querySelectorAll('article h2, .article-content h2, .prose h2');
            return Array.from(h2s).slice(0, 3).map(h2 => {
                const style = window.getComputedStyle(h2);
                return {
                    text: h2.textContent.substring(0, 50),
                    marginTop: style.marginTop,
                    marginBottom: style.marginBottom,
                    paddingTop: style.paddingTop,
                    paddingBottom: style.paddingBottom
                };
            });
        }
    """)

    print("\nH2 Computed Styles:")
    for h2 in h2_styles:
        print(f"  '{h2['text']}...'")
        print(f"    margin-top: {h2['marginTop']}, margin-bottom: {h2['marginBottom']}")
        print(f"    padding-top: {h2['paddingTop']}, padding-bottom: {h2['paddingBottom']}")

    browser.close()
