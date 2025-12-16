"""
Visual inspection script for comprehensive page review
Captures screenshots and logs DOM structure for analysis
"""

from playwright.sync_api import sync_playwright
import os

# Viewports to test
VIEWPORTS = [
    {'name': 'mobile', 'width': 375, 'height': 812},
    {'name': 'tablet', 'width': 768, 'height': 1024},
    {'name': 'desktop', 'width': 1280, 'height': 800},
]

# Pages to test
PAGES = [
    {'name': 'homepage', 'path': '/'},
    {'name': 'blog-post', 'path': '/toilet-training-autism/'},
    {'name': 'location', 'path': '/aba-therapy/texas/north-texas/'},
    {'name': 'services', 'path': '/services/'},
    {'name': 'about', 'path': '/about/'},
    {'name': 'contact', 'path': '/contact/'},
    {'name': 'careers', 'path': '/careers/'},
    {'name': 'aba-therapy', 'path': '/aba-therapy/'},
    {'name': 'es-home', 'path': '/es/'},
]

BASE_URL = 'http://localhost:4321'
OUTPUT_DIR = 'screenshots'

def analyze_page(page, page_info, viewport):
    """Analyze a page for common visual issues"""
    issues = []

    # Check for horizontal overflow
    scroll_width = page.evaluate('document.documentElement.scrollWidth')
    client_width = page.evaluate('document.documentElement.clientWidth')
    if scroll_width > client_width:
        issues.append(f"Horizontal overflow detected: scrollWidth={scroll_width}, clientWidth={client_width}")

    # Check for text truncation (elements with overflow:hidden and text-overflow:ellipsis)
    truncated = page.evaluate('''() => {
        const elements = document.querySelectorAll('*');
        let count = 0;
        for (const el of elements) {
            const style = window.getComputedStyle(el);
            if (style.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth) {
                count++;
            }
        }
        return count;
    }''')
    if truncated > 0:
        issues.append(f"Found {truncated} elements with truncated text")

    # Check for small touch targets on mobile
    if viewport['name'] == 'mobile':
        small_targets = page.evaluate('''() => {
            const interactive = document.querySelectorAll('a, button, input, select, textarea');
            let small = [];
            for (const el of interactive) {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    if (rect.width < 44 || rect.height < 44) {
                        small.push({
                            tag: el.tagName,
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                            text: el.textContent?.slice(0, 30)
                        });
                    }
                }
            }
            return small.slice(0, 10);  // Return first 10
        }''')
        if small_targets:
            issues.append(f"Small touch targets (<44px): {len(small_targets)} found")
            for t in small_targets[:5]:
                issues.append(f"  - {t['tag']} ({t['width']}x{t['height']}): {t.get('text', '')[:20]}")

    # Check for images without alt text
    missing_alt = page.evaluate('''() => {
        const imgs = document.querySelectorAll('img');
        let count = 0;
        for (const img of imgs) {
            if (!img.alt || img.alt.trim() === '') count++;
        }
        return count;
    }''')
    if missing_alt > 0:
        issues.append(f"Images without alt text: {missing_alt}")

    # Check for contrast issues (simplified check for light text)
    low_contrast = page.evaluate('''() => {
        const elements = document.querySelectorAll('p, span, a, h1, h2, h3, h4, h5, h6, li');
        let count = 0;
        for (const el of elements) {
            const style = window.getComputedStyle(el);
            const color = style.color;
            // Simple check for very light colors
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                const [_, r, g, b] = match.map(Number);
                // If all RGB values are > 200, might be too light on white bg
                if (r > 200 && g > 200 && b > 200) count++;
            }
        }
        return count;
    }''')
    if low_contrast > 0:
        issues.append(f"Potentially low contrast text elements: {low_contrast}")

    return issues

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        all_issues = {}

        for viewport in VIEWPORTS:
            print(f"\n{'='*60}")
            print(f"VIEWPORT: {viewport['name'].upper()} ({viewport['width']}x{viewport['height']})")
            print('='*60)

            context = browser.new_context(
                viewport={'width': viewport['width'], 'height': viewport['height']}
            )
            page = context.new_page()

            for page_info in PAGES:
                url = f"{BASE_URL}{page_info['path']}"
                key = f"{page_info['name']}-{viewport['name']}"

                print(f"\n  {page_info['name']} -> {page_info['path']}")

                try:
                    page.goto(url, wait_until='networkidle', timeout=30000)
                    page.wait_for_timeout(500)  # Let animations complete

                    # Capture screenshot
                    screenshot_path = f"{OUTPUT_DIR}/{key}.png"
                    page.screenshot(path=screenshot_path, full_page=True)
                    print(f"    Screenshot: {screenshot_path}")

                    # Analyze for issues
                    issues = analyze_page(page, page_info, viewport)
                    if issues:
                        all_issues[key] = issues
                        print(f"    Issues found: {len(issues)}")
                        for issue in issues:
                            print(f"      - {issue}")
                    else:
                        print(f"    No issues detected")

                except Exception as e:
                    print(f"    ERROR: {str(e)}")
                    all_issues[key] = [f"Page error: {str(e)}"]

            context.close()

        browser.close()

        # Summary
        print(f"\n\n{'='*60}")
        print("SUMMARY OF ISSUES")
        print('='*60)

        if all_issues:
            for key, issues in all_issues.items():
                print(f"\n{key}:")
                for issue in issues:
                    print(f"  - {issue}")
        else:
            print("No issues detected across all pages and viewports!")

if __name__ == '__main__':
    main()
