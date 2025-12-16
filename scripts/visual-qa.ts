/**
 * Visual QA Screenshot Script
 * Captures full-page screenshots at mobile, tablet, and desktop viewports
 */

import { chromium } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

const pages = [
  { name: 'homepage', path: '/' },
  { name: 'blog-post', path: '/toilet-training-autism/' },
  { name: 'location', path: '/aba-therapy/texas/north-texas/' },
  { name: 'services', path: '/services/' },
  { name: 'about', path: '/about/' },
  { name: 'contact', path: '/contact/' },
  { name: 'careers', path: '/careers/' },
  { name: 'aba-therapy', path: '/aba-therapy/' },
  { name: 'es-home', path: '/es/' },
];

async function captureScreenshots() {
  console.log('Starting visual QA screenshot capture...\n');
  const browser = await chromium.launch();

  for (const viewport of viewports) {
    console.log(`\n=== ${viewport.name.toUpperCase()} (${viewport.width}x${viewport.height}) ===`);

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    for (const p of pages) {
      const url = `http://localhost:4321${p.path}`;
      console.log(`  Capturing: ${p.name} -> ${p.path}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for any animations to complete
        await page.waitForTimeout(500);

        // Full page screenshot
        await page.screenshot({
          path: `screenshots/${p.name}-${viewport.name}.png`,
          fullPage: true,
        });

        console.log(`    ✓ Saved: screenshots/${p.name}-${viewport.name}.png`);
      } catch (error) {
        console.error(`    ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('\n\nScreenshot capture complete!');
  console.log(`Total screenshots: ${viewports.length * pages.length}`);
}

captureScreenshots();
