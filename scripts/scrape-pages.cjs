#!/usr/bin/env node
/**
 * Page Scraper - Scrapes pages directly from the website
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'content', 'scraped');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'wp');

// Pages to scrape (from sitemap)
const PAGES_TO_SCRAPE = [
  { url: 'https://prosperahealthcare.com/about/', slug: 'about' },
  { url: 'https://prosperahealthcare.com/contact/', slug: 'contact' },
  { url: 'https://prosperahealthcare.com/careers/', slug: 'careers' },
  { url: 'https://prosperahealthcare.com/services/', slug: 'services' },
  { url: 'https://prosperahealthcare.com/privacy-policy/', slug: 'privacy-policy' },
  { url: 'https://prosperahealthcare.com/terms-and-conditions/', slug: 'terms-and-conditions' },
  { url: 'https://prosperahealthcare.com/about/editorial-process-standards/', slug: 'editorial-process-standards' },
  { url: 'https://prosperahealthcare.com/contact/north-texas/', slug: 'contact-north-texas' },
  { url: 'https://prosperahealthcare.com/contact/san-antonio/', slug: 'contact-san-antonio' },
  { url: 'https://prosperahealthcare.com/contact/el-paso/', slug: 'contact-el-paso' },
  // Spanish pages
  { url: 'https://prosperahealthcare.com/es/', slug: 'es-home', lang: 'es' },
  { url: 'https://prosperahealthcare.com/es/acerca-de/', slug: 'es-about', lang: 'es' },
  { url: 'https://prosperahealthcare.com/es/contacto/', slug: 'es-contact', lang: 'es' },
  { url: 'https://prosperahealthcare.com/es/servicios/', slug: 'es-services', lang: 'es' },
  { url: 'https://prosperahealthcare.com/es/carreras/', slug: 'es-careers', lang: 'es' },
];

// Fetch with retry
async function fetchPage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      console.log(`  Retry ${i + 1}/${retries} for ${url}`);
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

// Extract content from HTML
function extractContent(html) {
  // Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(' - Prospera Healthcare', '').trim() : '';

  // Extract meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1] : '';

  // Extract main content (try multiple selectors)
  let content = '';

  // Try to find main content area
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    content = mainMatch[1];
  } else {
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      content = articleMatch[1];
    } else {
      const contentMatch = html.match(/<div[^>]+class="[^"]*(?:content|entry|post)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (contentMatch) {
        content = contentMatch[1];
      }
    }
  }

  // Extract OG image
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const ogImage = ogImageMatch ? ogImageMatch[1] : '';

  // Extract images from content
  const images = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    if (imgMatch[1].includes('prosperahealthcare.com') || imgMatch[1].startsWith('/')) {
      images.push(imgMatch[1]);
    }
  }

  return { title, description, content, ogImage, images };
}

// Download image helper
async function downloadImage(imageUrl, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(IMAGES_DIR, filename);
    if (fs.existsSync(filePath)) {
      resolve(filePath);
      return;
    }

    const protocol = imageUrl.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filePath);

    protocol.get(imageUrl, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        const redirectProtocol = redirectUrl.startsWith('https') ? https : http;
        redirectProtocol.get(redirectUrl, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(filePath);
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(filePath);
        });
      }
    }).on('error', reject);
  });
}

// Main
async function main() {
  console.log('=== Page Scraper ===\n');

  // Ensure directories exist
  [OUTPUT_DIR, IMAGES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const scrapedPages = [];
  const allImages = new Set();

  for (const page of PAGES_TO_SCRAPE) {
    console.log(`Scraping: ${page.url}`);
    try {
      const html = await fetchPage(page.url);
      const extracted = extractContent(html);

      scrapedPages.push({
        slug: page.slug,
        url: page.url,
        lang: page.lang || 'en',
        title: extracted.title,
        description: extracted.description,
        content: extracted.content,
        ogImage: extracted.ogImage,
        images: extracted.images
      });

      // Collect images
      if (extracted.ogImage) allImages.add(extracted.ogImage);
      extracted.images.forEach(img => allImages.add(img));

      console.log(`  ✓ ${page.slug} - "${extracted.title}"`);
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  // Load existing content
  const contentPath = path.join(OUTPUT_DIR, 'content.json');
  let existingContent = { posts: [], pages: [], categories: [], media: [] };
  if (fs.existsSync(contentPath)) {
    existingContent = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
  }

  // Merge pages
  existingContent.pages = scrapedPages;
  existingContent.scraped = new Date().toISOString();

  // Save
  fs.writeFileSync(contentPath, JSON.stringify(existingContent, null, 2));
  console.log(`\nSaved ${scrapedPages.length} pages`);

  // Download new images
  console.log(`\nDownloading ${allImages.size} images...`);
  let downloaded = 0;
  for (const imageUrl of allImages) {
    try {
      if (!imageUrl || imageUrl.startsWith('data:')) continue;
      const fullUrl = imageUrl.startsWith('/')
        ? `https://prosperahealthcare.com${imageUrl}`
        : imageUrl;
      const urlObj = new URL(fullUrl);
      const filename = path.basename(urlObj.pathname);
      if (filename && filename.includes('.')) {
        await downloadImage(fullUrl, filename);
        downloaded++;
      }
    } catch (error) {
      // Skip failed downloads
    }
  }
  console.log(`Downloaded ${downloaded} images`);

  console.log('\n=== Done ===');
}

main().catch(console.error);
