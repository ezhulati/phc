#!/usr/bin/env node
/**
 * Downloads all media from WordPress
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'wp');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'content', 'scraped');

// Ensure directories exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Fetch with retry
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

// Download file
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filepath)) {
      resolve(filepath);
      return;
    }

    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => { file.close(); resolve(filepath); });
        }).on('error', reject);
      } else if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(filepath); });
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== Media Downloader ===\n');

  // Fetch all media
  console.log('Fetching media list...');
  const allMedia = [];
  let page = 1;

  while (true) {
    try {
      const response = await fetchWithRetry(
        `https://prosperahealthcare.com/wp-json/wp/v2/media?per_page=100&page=${page}`
      );
      const data = await response.json();
      if (!data.length) break;
      allMedia.push(...data);
      console.log(`  Page ${page}: ${data.length} items`);
      page++;
    } catch (error) {
      break;
    }
  }

  console.log(`\nTotal media items: ${allMedia.length}`);

  // Download all
  let downloaded = 0;
  let failed = 0;

  for (const media of allMedia) {
    const url = media.source_url;
    if (!url) continue;

    try {
      const urlObj = new URL(url);
      const filename = path.basename(urlObj.pathname);
      const filepath = path.join(IMAGES_DIR, filename);

      await downloadFile(url, filepath);
      downloaded++;

      if (downloaded % 20 === 0) {
        console.log(`Downloaded ${downloaded}/${allMedia.length}`);
      }
    } catch (error) {
      failed++;
    }
  }

  console.log(`\nComplete: ${downloaded} downloaded, ${failed} failed`);

  // Save media index
  const mediaIndex = allMedia.map(m => ({
    id: m.id,
    slug: m.slug,
    filename: path.basename(new URL(m.source_url).pathname),
    originalUrl: m.source_url,
    localPath: `/images/wp/${path.basename(new URL(m.source_url).pathname)}`,
    alt: m.alt_text || '',
    title: m.title?.rendered || ''
  }));

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'media-index.json'),
    JSON.stringify(mediaIndex, null, 2)
  );
  console.log('Saved media index');
}

main().catch(console.error);
