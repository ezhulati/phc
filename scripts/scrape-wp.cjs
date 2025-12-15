#!/usr/bin/env node
/**
 * WordPress Content Scraper
 * Scrapes all posts, pages, and images from prosperahealthcare.com
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://prosperahealthcare.com';
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'content', 'scraped');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'wp');

// Ensure directories exist
[OUTPUT_DIR, IMAGES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Fetch helper with retry
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      console.log(`  Retry ${i + 1}/${retries} for ${url}`);
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

// Download image
async function downloadImage(imageUrl, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(IMAGES_DIR, filename);
    if (fs.existsSync(filePath)) {
      resolve(filePath);
      return;
    }

    const file = fs.createWriteStream(filePath);
    https.get(imageUrl, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (res) => {
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

// Extract images from HTML content
function extractImages(html) {
  const images = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    if (match[1].includes('prosperahealthcare.com')) {
      images.push(match[1]);
    }
  }
  return images;
}

// Fetch all posts
async function fetchAllPosts() {
  console.log('Fetching all posts...');
  const posts = [];
  let page = 1;

  while (true) {
    try {
      const response = await fetchWithRetry(
        `${BASE_URL}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed`
      );
      const data = await response.json();
      if (!data.length) break;
      posts.push(...data);
      console.log(`  Fetched page ${page}: ${data.length} posts`);
      page++;
    } catch (error) {
      break;
    }
  }

  console.log(`Total posts: ${posts.length}`);
  return posts;
}

// Fetch all pages
async function fetchAllPages() {
  console.log('Fetching all pages...');
  const pages = [];
  let page = 1;

  while (true) {
    try {
      const response = await fetchWithRetry(
        `${BASE_URL}/wp-json/wp/v2/pages?per_page=100&page=${page}&_embed`
      );
      const data = await response.json();
      if (!data.length) break;
      pages.push(...data);
      console.log(`  Fetched page ${page}: ${data.length} pages`);
      page++;
    } catch (error) {
      break;
    }
  }

  console.log(`Total pages: ${pages.length}`);
  return pages;
}

// Fetch categories
async function fetchCategories() {
  console.log('Fetching categories...');
  try {
    const response = await fetchWithRetry(`${BASE_URL}/wp-json/wp/v2/categories?per_page=100`);
    const data = await response.json();
    console.log(`Total categories: ${data.length}`);
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Fetch media
async function fetchAllMedia() {
  console.log('Fetching all media...');
  const media = [];
  let page = 1;

  while (true) {
    try {
      const response = await fetchWithRetry(
        `${BASE_URL}/wp-json/wp/v2/media?per_page=100&page=${page}`
      );
      const data = await response.json();
      if (!data.length) break;
      media.push(...data);
      console.log(`  Fetched page ${page}: ${data.length} media items`);
      page++;
    } catch (error) {
      break;
    }
  }

  console.log(`Total media: ${media.length}`);
  return media;
}

// Process and save content
async function processContent(items, type) {
  console.log(`\nProcessing ${items.length} ${type}...`);
  const processed = [];

  for (const item of items) {
    const slug = item.slug;
    const title = item.title?.rendered || item.title || '';
    const content = item.content?.rendered || '';
    const excerpt = item.excerpt?.rendered || '';
    const date = item.date;
    const modified = item.modified;

    // Get featured image
    let featuredImage = null;
    if (item._embedded?.['wp:featuredmedia']?.[0]) {
      featuredImage = item._embedded['wp:featuredmedia'][0].source_url;
    }

    // Get categories
    const categories = item._embedded?.['wp:term']?.[0]?.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug
    })) || [];

    // Extract images from content
    const contentImages = extractImages(content);

    processed.push({
      id: item.id,
      slug,
      title,
      content,
      excerpt,
      date,
      modified,
      featuredImage,
      categories,
      contentImages,
      link: item.link,
      type
    });

    console.log(`  ✓ ${slug}`);
  }

  return processed;
}

// Download all images
async function downloadAllImages(items) {
  console.log('\nDownloading images...');
  const allImages = new Set();

  for (const item of items) {
    if (item.featuredImage) {
      allImages.add(item.featuredImage);
    }
    item.contentImages?.forEach(img => allImages.add(img));
  }

  console.log(`Found ${allImages.size} unique images`);

  let downloaded = 0;
  for (const imageUrl of allImages) {
    try {
      const urlObj = new URL(imageUrl);
      const filename = path.basename(urlObj.pathname);
      await downloadImage(imageUrl, filename);
      downloaded++;
      if (downloaded % 10 === 0) {
        console.log(`  Downloaded ${downloaded}/${allImages.size}`);
      }
    } catch (error) {
      console.error(`  Failed: ${imageUrl}`);
    }
  }

  console.log(`Downloaded ${downloaded} images`);
}

// Main function
async function main() {
  console.log('=== WordPress Content Scraper ===\n');

  try {
    // Fetch all content
    const [posts, pages, categories, media] = await Promise.all([
      fetchAllPosts(),
      fetchAllPages(),
      fetchCategories(),
      fetchAllMedia()
    ]);

    // Process content
    const processedPosts = await processContent(posts, 'post');
    const processedPages = await processContent(pages, 'page');

    // Save to JSON files
    const data = {
      posts: processedPosts,
      pages: processedPages,
      categories,
      media: media.map(m => ({
        id: m.id,
        slug: m.slug,
        url: m.source_url,
        alt: m.alt_text,
        title: m.title?.rendered
      })),
      scraped: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'content.json'),
      JSON.stringify(data, null, 2)
    );
    console.log(`\nSaved content to ${path.join(OUTPUT_DIR, 'content.json')}`);

    // Download images
    await downloadAllImages([...processedPosts, ...processedPages]);

    console.log('\n=== Scraping Complete ===');
    console.log(`Posts: ${processedPosts.length}`);
    console.log(`Pages: ${processedPages.length}`);
    console.log(`Categories: ${categories.length}`);
    console.log(`Media items: ${media.length}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
