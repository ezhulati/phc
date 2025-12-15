#!/usr/bin/env node
/**
 * Generate static Astro pages from scraped WordPress content
 */

const fs = require('fs');
const path = require('path');

const CONTENT_FILE = path.join(__dirname, '..', 'src', 'content', 'scraped', 'content.json');
const POSTS_DIR = path.join(__dirname, '..', 'src', 'pages', 'blog');
const PAGES_DIR = path.join(__dirname, '..', 'src', 'pages');

// Load content
const content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8'));

// Replace WordPress URLs with local paths
function localizeContent(html) {
  if (!html) return '';

  return html
    // Replace WordPress image URLs with local paths
    .replace(/https:\/\/prosperahealthcare\.com\/wp-content\/uploads\/[^"']+/g, (match) => {
      const filename = path.basename(match);
      return `/images/wp/${filename}`;
    })
    // Replace internal links to use relative paths
    .replace(/href="https:\/\/prosperahealthcare\.com\//g, 'href="/')
    // Clean up any double slashes
    .replace(/\/\//g, '/');
}

// Create post page template
function createPostPage(post) {
  const localizedContent = localizeContent(post.content);
  const title = post.title.replace(/"/g, '\\"').replace(/\n/g, ' ');
  const excerpt = (post.excerpt || '').replace(/<[^>]+>/g, '').replace(/"/g, '\\"').replace(/\n/g, ' ').trim();
  const date = post.date || new Date().toISOString();
  const categories = post.categories || [];

  // Get featured image
  let featuredImage = post.featuredImage || '';
  if (featuredImage && featuredImage.includes('prosperahealthcare.com')) {
    featuredImage = `/images/wp/${path.basename(featuredImage)}`;
  }

  return `---
/**
 * ${title.slice(0, 50)}
 * Generated from WordPress content
 */
import StaticPostLayout from '@/layouts/StaticPostLayout.astro';
---

<StaticPostLayout
  title="${title}"
  slug="${post.slug}"
  date="${date}"
  excerpt="${excerpt.slice(0, 200)}"
  featuredImage="${featuredImage}"
  categories={${JSON.stringify(categories)}}
>
  <Fragment set:html={\`${localizedContent.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`} />
</StaticPostLayout>
`;
}

// Create simple page template
function createSimplePage(page) {
  const localizedContent = localizeContent(page.content);
  const title = (page.title || page.slug).replace(/"/g, '\\"');
  const description = (page.description || '').replace(/"/g, '\\"');

  return `---
/**
 * ${title}
 * Generated from WordPress content
 */
import PageLayout from '@/layouts/PageLayout.astro';

const pageData = {
  title: "${title}",
  description: "${description}",
};
---

<PageLayout
  title={pageData.title}
  description={pageData.description}
  canonical="https://prosperahealthcare.com/${page.slug}/"
>
  <article class="prose prose-lg max-w-none">
    <Fragment set:html={\`${localizedContent.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`} />
  </article>
</PageLayout>
`;
}

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Main
async function main() {
  console.log('=== Static Page Generator ===\n');

  // Create directories
  ensureDir(POSTS_DIR);

  // Generate post pages
  console.log(`Generating ${content.posts.length} blog posts...`);
  let postsCreated = 0;

  for (const post of content.posts) {
    try {
      const filename = `${post.slug}.astro`;
      const filepath = path.join(POSTS_DIR, filename);
      const pageContent = createPostPage(post);
      fs.writeFileSync(filepath, pageContent);
      postsCreated++;
      console.log(`  ✓ ${post.slug}`);
    } catch (error) {
      console.log(`  ✗ ${post.slug}: ${error.message}`);
    }
  }

  // Generate static pages (skip ones that already have custom implementations)
  const skipPages = ['es-home', 'contact', 'es-contact', 'careers', 'es-careers', 'services', 'es-services'];

  console.log(`\nGenerating ${content.pages.length} pages...`);
  let pagesCreated = 0;

  for (const page of content.pages) {
    if (skipPages.includes(page.slug)) {
      console.log(`  - Skipping ${page.slug} (has custom implementation)`);
      continue;
    }

    try {
      // Determine output path based on slug
      let filepath;
      if (page.slug.startsWith('es-')) {
        const esSlug = page.slug.replace('es-', '');
        ensureDir(path.join(PAGES_DIR, 'es'));
        filepath = path.join(PAGES_DIR, 'es', `${esSlug}.astro`);
      } else if (page.slug.includes('-')) {
        filepath = path.join(PAGES_DIR, `${page.slug}.astro`);
      } else {
        filepath = path.join(PAGES_DIR, `${page.slug}.astro`);
      }

      const pageContent = createSimplePage(page);
      fs.writeFileSync(filepath, pageContent);
      pagesCreated++;
      console.log(`  ✓ ${page.slug}`);
    } catch (error) {
      console.log(`  ✗ ${page.slug}: ${error.message}`);
    }
  }

  // Create a blog index page that lists all posts
  const postsData = content.posts.map(p => ({
    slug: p.slug,
    title: p.title,
    excerpt: (p.excerpt || '').replace(/<[^>]+>/g, '').slice(0, 150),
    date: p.date,
    featuredImage: p.featuredImage ? `/images/wp/${path.basename(p.featuredImage)}` : '',
    categories: p.categories || []
  }));

  const blogIndexContent = `---
/**
 * Blog Index - Lists all blog posts
 * Generated from WordPress content
 */
import PageLayout from '@/layouts/PageLayout.astro';

const posts = ${JSON.stringify(postsData, null, 2)};
---

<PageLayout
  title="ABA Therapy Blog | Prospera Healthcare"
  description="Expert insights on ABA therapy, autism support, and child development from Prospera Healthcare."
>
  <div class="max-w-6xl mx-auto px-4 py-12">
    <h1 class="text-4xl font-bold text-gray-900 mb-8">ABA Therapy Resources</h1>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post) => (
        <article class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          {post.featuredImage && (
            <img
              src={post.featuredImage}
              alt={post.title}
              class="w-full h-48 object-cover"
            />
          )}
          <div class="p-6">
            <h2 class="text-xl font-semibold mb-2">
              <a href={\`/blog/\${post.slug}/\`} class="text-gray-900 hover:text-primary-600">
                {post.title}
              </a>
            </h2>
            <p class="text-gray-600 text-sm mb-4">{post.excerpt}...</p>
            <a
              href={\`/blog/\${post.slug}/\`}
              class="text-primary-600 font-medium hover:text-primary-700"
            >
              Read More →
            </a>
          </div>
        </article>
      ))}
    </div>
  </div>
</PageLayout>
`;

  fs.writeFileSync(path.join(POSTS_DIR, 'index.astro'), blogIndexContent);
  console.log('\n✓ Created blog index page');

  // Create data file for dynamic imports
  const postsDataFile = `// Auto-generated posts data
export const posts = ${JSON.stringify(content.posts.map(p => ({
  slug: p.slug,
  title: p.title,
  excerpt: (p.excerpt || '').replace(/<[^>]+>/g, '').slice(0, 200),
  date: p.date,
  categories: p.categories || []
})), null, 2)};

export const categories = ${JSON.stringify(content.categories, null, 2)};
`;

  fs.writeFileSync(
    path.join(__dirname, '..', 'src', 'lib', 'data', 'posts.ts'),
    postsDataFile
  );
  ensureDir(path.join(__dirname, '..', 'src', 'lib', 'data'));
  console.log('✓ Created posts data file');

  console.log(`\n=== Complete ===`);
  console.log(`Posts created: ${postsCreated}`);
  console.log(`Pages created: ${pagesCreated}`);
}

main().catch(console.error);
