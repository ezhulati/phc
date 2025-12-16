/**
 * Deep Visual QA Script
 * Comprehensive visual testing across all page types at multiple viewports
 * and scroll positions
 */
import { chromium, type Page, type Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4321';

// Viewports to test
const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'desktop-wide', width: 1920, height: 1080 },
];

// Comprehensive page list covering all templates
const pages = [
  // Core pages
  { name: 'homepage', path: '/' },
  { name: 'about', path: '/about/' },
  { name: 'services', path: '/services/' },
  { name: 'careers', path: '/careers/' },
  { name: 'contact', path: '/contact/' },
  { name: 'thank-you', path: '/thank-you/' },

  // Contact regional pages
  { name: 'contact-north-texas', path: '/contact/north-texas/' },
  { name: 'contact-san-antonio', path: '/contact/san-antonio/' },
  { name: 'contact-el-paso', path: '/contact/el-paso/' },

  // ABA Therapy section
  { name: 'aba-therapy-index', path: '/aba-therapy/' },
  { name: 'aba-therapy-texas', path: '/aba-therapy/texas/' },
  { name: 'aba-therapy-flower-mound', path: '/aba-therapy/texas/flower-mound/' },
  { name: 'aba-therapy-san-antonio', path: '/aba-therapy/texas/san-antonio/' },
  { name: 'aba-therapy-el-paso', path: '/aba-therapy/texas/el-paso/' },
  { name: 'aba-therapy-dallas', path: '/aba-therapy/texas/dallas/' },
  { name: 'aba-therapy-fort-worth', path: '/aba-therapy/texas/fort-worth/' },

  // Blog posts (different content types)
  { name: 'blog-toilet-training', path: '/toilet-training-autism/' },
  { name: 'blog-applied-behavior-analysis', path: '/applied-behavior-analysis-aba/' },
  { name: 'blog-what-is-aba-therapist', path: '/what-is-aba-therapist/' },

  // Category pages
  { name: 'category-health-care', path: '/aba-therapy/health-and-care/' },

  // Spanish pages
  { name: 'es-home', path: '/es/' },
  { name: 'es-about', path: '/es/about/' },
  { name: 'es-servicios', path: '/es/servicios/' },
  { name: 'es-contacto', path: '/es/contacto/' },
  { name: 'es-carreras', path: '/es/carreras/' },
  { name: 'es-terapia-aba', path: '/es/terapia-aba/' },
  { name: 'es-contact-north-texas', path: '/es/contacto/north-texas/' },

  // About subpages
  { name: 'editorial-standards', path: '/about/editorial-process-standards/' },
];

interface Issue {
  page: string;
  viewport: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  element?: string;
  details: string;
  screenshot?: string;
}

const issues: Issue[] = [];

async function analyzePage(page: Page, pageName: string, viewportName: string, screenshotDir: string): Promise<void> {
  const screenshotPath = path.join(screenshotDir, `${pageName}-${viewportName}.png`);

  // Full page screenshot
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // Run visual analysis
  const analysisResults = await page.evaluate(() => {
    const results: any[] = [];

    // 1. Check touch targets (< 44px)
    const clickables = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
    clickables.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);

      // Skip hidden elements
      if (styles.display === 'none' || styles.visibility === 'hidden' || rect.width === 0) return;

      // Skip skip-to-content links (intentionally small)
      if (el.textContent?.toLowerCase().includes('skip to')) return;

      const minDimension = Math.min(rect.width, rect.height);
      if (minDimension < 44 && minDimension > 0) {
        results.push({
          type: 'touch-target',
          severity: minDimension < 32 ? 'critical' : 'warning',
          element: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : ''),
          details: `Touch target ${Math.round(rect.width)}x${Math.round(rect.height)}px (min 44px). Text: "${el.textContent?.slice(0, 50)}"`,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        });
      }
    });

    // 2. Check text overflow/clipping
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, li');
    textElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);

      if (styles.display === 'none' || rect.width === 0) return;

      // Check if text is clipped
      if (el.scrollWidth > el.clientWidth && styles.overflow !== 'hidden' && !styles.textOverflow) {
        results.push({
          type: 'text-overflow',
          severity: 'warning',
          element: el.tagName.toLowerCase(),
          details: `Text may be clipped. Scroll width: ${el.scrollWidth}, Client width: ${el.clientWidth}. Text: "${el.textContent?.slice(0, 30)}..."`,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        });
      }
    });

    // 3. Check images
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      const rect = img.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Check for missing alt text
      if (!img.alt && !img.getAttribute('aria-hidden')) {
        results.push({
          type: 'missing-alt',
          severity: 'warning',
          element: 'img',
          details: `Image missing alt text. Src: ${img.src.slice(-50)}`,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        });
      }

      // Check aspect ratio distortion
      if (img.naturalWidth && img.naturalHeight) {
        const naturalRatio = img.naturalWidth / img.naturalHeight;
        const displayRatio = rect.width / rect.height;
        const ratioDiff = Math.abs(naturalRatio - displayRatio) / naturalRatio;

        if (ratioDiff > 0.1) {
          results.push({
            type: 'aspect-ratio',
            severity: 'warning',
            element: 'img',
            details: `Image aspect ratio distorted by ${Math.round(ratioDiff * 100)}%. Natural: ${img.naturalWidth}x${img.naturalHeight}, Display: ${Math.round(rect.width)}x${Math.round(rect.height)}`,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          });
        }
      }
    });

    // 4. Check horizontal overflow (causes horizontal scroll)
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
      results.push({
        type: 'horizontal-overflow',
        severity: 'critical',
        element: 'body',
        details: `Page has horizontal overflow. Body width: ${document.documentElement.scrollWidth}px, Viewport: ${document.documentElement.clientWidth}px`,
        rect: { x: 0, y: 0, width: 100, height: 100 }
      });
    }

    // 5. Check z-index issues (elements overlapping unexpectedly)
    const fixedElements = document.querySelectorAll('[style*="position: fixed"], [style*="position: sticky"]');
    fixedElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);

      if (parseInt(styles.zIndex) > 9999) {
        results.push({
          type: 'z-index',
          severity: 'info',
          element: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : ''),
          details: `Very high z-index: ${styles.zIndex}`,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        });
      }
    });

    // 6. Check button/link contrast
    const buttons = document.querySelectorAll('button, .btn, [role="button"], a.bg-primary-600, a.bg-white');
    buttons.forEach((btn) => {
      const rect = btn.getBoundingClientRect();
      const styles = window.getComputedStyle(btn);

      if (styles.display === 'none' || rect.width === 0) return;

      // Check if button has visible text or icon
      const hasText = btn.textContent?.trim();
      const hasIcon = btn.querySelector('svg, img, [class*="icon"]');

      if (!hasText && !hasIcon) {
        results.push({
          type: 'empty-button',
          severity: 'warning',
          element: btn.tagName.toLowerCase(),
          details: 'Button appears to have no visible content',
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        });
      }
    });

    // 7. Check form fields
    const formFields = document.querySelectorAll('input, select, textarea');
    formFields.forEach((field) => {
      const rect = field.getBoundingClientRect();
      const styles = window.getComputedStyle(field);

      if (styles.display === 'none' || rect.width === 0) return;

      // Check minimum height for inputs
      if (rect.height < 40 && field.tagName !== 'INPUT' || (field as HTMLInputElement).type !== 'hidden') {
        results.push({
          type: 'form-field-height',
          severity: 'info',
          element: field.tagName.toLowerCase(),
          details: `Form field height ${Math.round(rect.height)}px (recommended 44px+)`,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        });
      }
    });

    // 8. Check spacing consistency
    const sections = document.querySelectorAll('section');
    const paddings: number[] = [];
    sections.forEach((section) => {
      const styles = window.getComputedStyle(section);
      const paddingTop = parseInt(styles.paddingTop);
      const paddingBottom = parseInt(styles.paddingBottom);
      paddings.push(paddingTop, paddingBottom);
    });

    // Check for inconsistent section padding
    const uniquePaddings = [...new Set(paddings.filter(p => p > 0))];
    if (uniquePaddings.length > 4) {
      results.push({
        type: 'inconsistent-spacing',
        severity: 'info',
        element: 'section',
        details: `${uniquePaddings.length} different padding values detected across sections: ${uniquePaddings.sort((a,b) => a-b).join(', ')}px`,
        rect: { x: 0, y: 0, width: 100, height: 100 }
      });
    }

    // 9. Check heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName[1]);
      if (level > lastLevel + 1 && lastLevel !== 0) {
        results.push({
          type: 'heading-hierarchy',
          severity: 'warning',
          element: heading.tagName.toLowerCase(),
          details: `Heading level skipped from H${lastLevel} to H${level}. Text: "${heading.textContent?.slice(0, 40)}"`,
          rect: heading.getBoundingClientRect()
        });
      }
      lastLevel = level;
    });

    // 10. Check for multiple H1s
    const h1s = document.querySelectorAll('h1');
    if (h1s.length > 1) {
      results.push({
        type: 'multiple-h1',
        severity: 'warning',
        element: 'h1',
        details: `Page has ${h1s.length} H1 elements (should have exactly 1)`,
        rect: { x: 0, y: 0, width: 100, height: 100 }
      });
    }

    return results;
  });

  // Add results to issues array
  for (const result of analysisResults) {
    issues.push({
      page: pageName,
      viewport: viewportName,
      type: result.type,
      severity: result.severity,
      element: result.element,
      details: result.details,
      screenshot: screenshotPath
    });
  }
}

async function captureInteractionStates(page: Page, pageName: string, viewportName: string, screenshotDir: string): Promise<void> {
  // Test mobile menu on mobile viewport
  if (viewportName === 'mobile') {
    const menuButton = await page.$('button[aria-label*="menu"], button[aria-label*="Menu"], .mobile-menu-button, [data-mobile-menu]');
    if (menuButton) {
      await menuButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotDir, `${pageName}-${viewportName}-menu-open.png`),
        fullPage: false
      });

      // Check if menu is visible and properly sized
      const menuOpen = await page.evaluate(() => {
        const nav = document.querySelector('nav[data-mobile-nav], .mobile-nav, [role="navigation"]');
        if (nav) {
          const styles = window.getComputedStyle(nav);
          return {
            visible: styles.display !== 'none' && styles.visibility !== 'hidden',
            width: nav.getBoundingClientRect().width
          };
        }
        return null;
      });

      if (menuOpen && !menuOpen.visible) {
        issues.push({
          page: pageName,
          viewport: viewportName,
          type: 'mobile-menu',
          severity: 'critical',
          details: 'Mobile menu button clicked but menu not visible'
        });
      }

      // Close menu
      await menuButton.click();
      await page.waitForTimeout(300);
    }
  }
}

async function main() {
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'deep-qa');

  // Create directory
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('Starting deep visual QA...\n');

  const browser = await chromium.launch();

  for (const viewport of viewports) {
    console.log(`\n=== Testing ${viewport.name} (${viewport.width}x${viewport.height}) ===\n`);

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.name === 'mobile' ? 2 : 1,
    });

    const page = await context.newPage();

    for (const p of pages) {
      const url = `${BASE_URL}${p.path}`;
      console.log(`  Testing: ${p.name} (${p.path})`);

      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        if (!response || response.status() >= 400) {
          issues.push({
            page: p.name,
            viewport: viewport.name,
            type: 'http-error',
            severity: 'critical',
            details: `HTTP ${response?.status() || 'no response'} error`
          });
          continue;
        }

        // Wait for any animations
        await page.waitForTimeout(500);

        // Run analysis
        await analyzePage(page, p.name, viewport.name, screenshotDir);

        // Test interaction states
        await captureInteractionStates(page, p.name, viewport.name, screenshotDir);

      } catch (error) {
        issues.push({
          page: p.name,
          viewport: viewport.name,
          type: 'page-error',
          severity: 'critical',
          details: `Error loading page: ${error}`
        });
      }
    }

    await context.close();
  }

  await browser.close();

  // Generate report
  console.log('\n\n========================================');
  console.log('DEEP VISUAL QA REPORT');
  console.log('========================================\n');

  // Group by severity
  const critical = issues.filter(i => i.severity === 'critical');
  const warnings = issues.filter(i => i.severity === 'warning');
  const info = issues.filter(i => i.severity === 'info');

  console.log(`Total issues found: ${issues.length}`);
  console.log(`  Critical: ${critical.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log(`  Info: ${info.length}`);

  // Group by type
  const byType = issues.reduce((acc, issue) => {
    acc[issue.type] = acc[issue.type] || [];
    acc[issue.type].push(issue);
    return acc;
  }, {} as Record<string, Issue[]>);

  console.log('\n--- Issues by Type ---\n');
  for (const [type, typeIssues] of Object.entries(byType).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`${type}: ${typeIssues.length}`);
  }

  if (critical.length > 0) {
    console.log('\n--- CRITICAL ISSUES ---\n');
    for (const issue of critical) {
      console.log(`[${issue.page}] [${issue.viewport}] ${issue.type}`);
      console.log(`  ${issue.details}`);
      console.log('');
    }
  }

  if (warnings.length > 0) {
    console.log('\n--- WARNINGS ---\n');
    for (const issue of warnings) {
      console.log(`[${issue.page}] [${issue.viewport}] ${issue.type}`);
      console.log(`  ${issue.details}`);
      if (issue.element) console.log(`  Element: ${issue.element}`);
      console.log('');
    }
  }

  // Save full report to JSON
  const reportPath = path.join(screenshotDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: issues.length,
      critical: critical.length,
      warnings: warnings.length,
      info: info.length
    },
    byType,
    issues
  }, null, 2));

  console.log(`\nFull report saved to: ${reportPath}`);
  console.log(`Screenshots saved to: ${screenshotDir}`);
}

main().catch(console.error);
