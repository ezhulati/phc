/**
 * Pre-fetch all WordPress content to JSON files
 * Run this before build to avoid rate limiting issues
 *
 * Usage: npx tsx scripts/fetch-wordpress-content.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const WP_REST_URL = 'https://prosperahealthcare.com/wp-json/wp/v2';
const WP_GRAPHQL_URL = 'https://prosperahealthcare.com/graphql';
const DATA_DIR = join(process.cwd(), 'src/data');

// Ensure data directory exists
mkdirSync(DATA_DIR, { recursive: true });

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = 8): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`  Fetching: ${url.substring(0, 80)}...`);
      const response = await fetch(url);

      if (response.status >= 500) {
        if (attempt < retries) {
          const delay = Math.min(attempt * 5000, 30000); // 5s, 10s, 15s, up to 30s
          console.log(`  ⚠️ Server error ${response.status}, retrying in ${delay / 1000}s...`);
          await sleep(delay);
          continue;
        }
      }
      return response;
    } catch (error) {
      if (attempt < retries) {
        const delay = Math.min(attempt * 5000, 30000);
        console.log(`  ⚠️ Network error, retrying in ${delay / 1000}s...`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed after all retries');
}

interface WPPage {
  id: number;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt?: { rendered: string };
  date: string;
  modified: string;
  featured_media: number;
  parent: number;
}

interface WPPost {
  id: number;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  modified: string;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    author?: Array<{
      name: string;
      description: string;
      avatar_urls?: { [key: string]: string };
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
      link: string;
    }>>;
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
      media_details?: {
        width: number;
        height: number;
      };
    }>;
  };
}

interface WPCategory {
  id: number;
  name: string;
  slug: string;
  link: string;
  description: string;
  count: number;
  parent: number;
}

// Known page IDs from WordPress (fetched earlier when API was working)
const KNOWN_PAGE_IDS = [4698, 3653, 914, 1134, 974, 969, 912, 910, 908, 906, 721, 404, 3];

async function fetchAllPages(): Promise<WPPage[]> {
  console.log('\n📄 Fetching all pages (by individual ID to avoid rate limits)...');
  const allPages: WPPage[] = [];

  // First try bulk fetch
  try {
    await sleep(2000);
    const response = await fetch(
      `${WP_REST_URL}/pages?per_page=100&_fields=id,slug,link,title,content,excerpt,date,modified,featured_media,parent`
    );

    if (response.ok) {
      const pages: WPPage[] = await response.json();
      console.log(`  ✓ Bulk fetch succeeded: ${pages.length} pages`);
      return pages;
    }
    console.log('  ⚠️ Bulk fetch failed, falling back to individual fetches...');
  } catch (error) {
    console.log('  ⚠️ Bulk fetch error, falling back to individual fetches...');
  }

  // Fallback: fetch each page individually
  for (const pageId of KNOWN_PAGE_IDS) {
    await sleep(2000); // Longer delay between individual requests
    try {
      const response = await fetch(
        `${WP_REST_URL}/pages/${pageId}?_fields=id,slug,link,title,content,excerpt,date,modified,featured_media,parent`
      );

      if (response.ok) {
        const page: WPPage = await response.json();
        allPages.push(page);
        console.log(`  ✓ Fetched page: ${page.slug}`);
      } else if (response.status >= 500) {
        // Retry once after longer delay
        await sleep(5000);
        const retryResponse = await fetch(
          `${WP_REST_URL}/pages/${pageId}?_fields=id,slug,link,title,content,excerpt,date,modified,featured_media,parent`
        );
        if (retryResponse.ok) {
          const page: WPPage = await retryResponse.json();
          allPages.push(page);
          console.log(`  ✓ Fetched page (retry): ${page.slug}`);
        } else {
          console.log(`  ⚠️ Could not fetch page ${pageId}`);
        }
      }
    } catch (error) {
      console.log(`  ⚠️ Error fetching page ${pageId}:`, error);
    }
  }

  console.log(`  ✅ Total pages: ${allPages.length}`);
  return allPages;
}

async function fetchAllPosts(): Promise<WPPost[]> {
  console.log('\n📝 Fetching all posts...');
  const allPosts: WPPost[] = [];
  let page = 1;

  while (true) {
    await sleep(2000); // Rate limiting - longer delay
    const response = await fetchWithRetry(
      `${WP_REST_URL}/posts?page=${page}&per_page=100&_embed`
    );

    if (!response.ok) {
      if (response.status === 400) break;
      throw new Error(`Failed to fetch posts: ${response.status}`);
    }

    const posts: WPPost[] = await response.json();
    if (posts.length === 0) break;

    allPosts.push(...posts);
    console.log(`  ✓ Page ${page}: ${posts.length} posts fetched (total: ${allPosts.length})`);

    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
    if (page >= totalPages) break;
    page++;
  }

  console.log(`  ✅ Total posts: ${allPosts.length}`);
  return allPosts;
}

async function fetchAllCategories(): Promise<WPCategory[]> {
  console.log('\n📁 Fetching all categories...');
  const response = await fetchWithRetry(
    `${WP_REST_URL}/categories?per_page=100&hide_empty=true`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  const categories: WPCategory[] = await response.json();
  console.log(`  ✅ Total categories: ${categories.length}`);
  return categories;
}

async function fetchABALocations(): Promise<any[]> {
  console.log('\n📍 Fetching ABA therapy locations via GraphQL...');

  const query = `
    query GetAllLocations($after: String) {
      contentNodes(
        where: { contentTypes: ABA_THERAPY }
        first: 100
        after: $after
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          ... on ABATherapy {
            id
            databaseId
            slug
            title
            featuredImage {
              node {
                sourceUrl
                altText
              }
            }
          }
        }
      }
    }
  `;

  const allLocations: any[] = [];
  let hasNextPage = true;
  let endCursor: string | null = null;

  while (hasNextPage) {
    await sleep(2000); // Rate limiting - longer delay

    const graphqlResponse = await fetch(WP_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { after: endCursor } }),
    });

    if (!graphqlResponse.ok) {
      throw new Error(`GraphQL request failed: ${graphqlResponse.status}`);
    }

    const data = await graphqlResponse.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      break;
    }

    const nodes = data.data?.contentNodes?.nodes || [];
    allLocations.push(...nodes);

    hasNextPage = data.data?.contentNodes?.pageInfo?.hasNextPage || false;
    endCursor = data.data?.contentNodes?.pageInfo?.endCursor || null;

    console.log(`  ✓ Batch fetched: ${nodes.length} locations (total: ${allLocations.length})`);
  }

  // Fetch content for each location via REST API
  console.log('  Fetching content for each location...');
  for (let i = 0; i < allLocations.length; i++) {
    const location = allLocations[i];
    if (location.databaseId) {
      await sleep(1500); // Rate limiting - longer delay
      try {
        const contentResponse = await fetchWithRetry(
          `${WP_REST_URL}/aba-therapy/${location.databaseId}?_fields=content`
        );
        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          location.content = contentData.content?.rendered || '';
        }
      } catch (error) {
        console.log(`  ⚠️ Could not fetch content for location ${location.slug}`);
        location.content = '';
      }
    }
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Content fetched for ${i + 1}/${allLocations.length} locations`);
    }
  }

  console.log(`  ✅ Total locations: ${allLocations.length}`);
  return allLocations;
}

function transformPages(wpPages: WPPage[]): any[] {
  return wpPages.map(p => ({
    id: String(p.id),
    databaseId: p.id,
    slug: p.slug,
    uri: new URL(p.link).pathname,
    title: p.title?.rendered || '',
    content: p.content?.rendered || '',
    excerpt: p.excerpt?.rendered || '',
    date: p.date,
    modified: p.modified,
    parentId: p.parent || 0,
  }));
}

function transformPosts(wpPosts: WPPost[]): any[] {
  return wpPosts.map(p => {
    const author = p._embedded?.author?.[0];
    const categories = p._embedded?.['wp:term']?.[0] || [];
    const tags = p._embedded?.['wp:term']?.[1] || [];
    const featuredImage = p._embedded?.['wp:featuredmedia']?.[0];

    return {
      id: String(p.id),
      databaseId: p.id,
      slug: p.slug,
      uri: new URL(p.link).pathname,
      title: p.title?.rendered || '',
      content: p.content?.rendered || '',
      excerpt: p.excerpt?.rendered || '',
      date: p.date,
      modified: p.modified,
      author: author ? {
        node: {
          name: author.name,
          description: author.description,
          avatar: author.avatar_urls ? { url: author.avatar_urls['96'] } : undefined,
        },
      } : undefined,
      categories: {
        nodes: categories.map((c: any) => ({
          id: String(c.id),
          name: c.name,
          slug: c.slug,
          uri: new URL(c.link).pathname,
        })),
      },
      tags: {
        nodes: tags.map((t: any) => ({
          name: t.name,
          slug: t.slug,
        })),
      },
      featuredImage: featuredImage ? {
        node: {
          sourceUrl: featuredImage.source_url,
          altText: featuredImage.alt_text,
          mediaDetails: featuredImage.media_details,
        },
      } : undefined,
    };
  });
}

function transformCategories(wpCategories: WPCategory[]): any[] {
  return wpCategories.map(c => ({
    id: String(c.id),
    databaseId: c.id,
    name: c.name,
    slug: c.slug,
    uri: new URL(c.link).pathname,
    description: c.description,
    count: c.count,
    parentId: c.parent || 0,
  }));
}

function transformLocations(locations: any[]): any[] {
  return locations.map(l => ({
    id: l.id,
    databaseId: l.databaseId,
    slug: l.slug,
    uri: `/aba-therapy/texas/${l.slug}/`,
    title: l.title || '',
    content: l.content || '',
    featuredImage: l.featuredImage,
  }));
}

async function main() {
  console.log('🚀 WordPress Content Fetcher');
  console.log('============================');
  console.log(`Target: ${WP_REST_URL}`);
  console.log(`Output: ${DATA_DIR}`);

  let wpCategories: WPCategory[] = [];
  let wpPosts: WPPost[] = [];
  let wpPages: WPPage[] = [];
  let abaLocations: any[] = [];

  // Fetch all content types SEQUENTIALLY to avoid rate limiting
  // Continue even if some fail

  try {
    wpCategories = await fetchAllCategories();
  } catch (error) {
    console.error('  ⚠️ Failed to fetch categories:', error);
  }
  await sleep(3000);

  try {
    wpPosts = await fetchAllPosts();
  } catch (error) {
    console.error('  ⚠️ Failed to fetch posts:', error);
  }
  await sleep(5000); // Longer wait before pages (most problematic)

  try {
    wpPages = await fetchAllPages();
  } catch (error) {
    console.error('  ⚠️ Failed to fetch pages:', error);
  }
  await sleep(5000);

  try {
    abaLocations = await fetchABALocations();
  } catch (error) {
    console.error('  ⚠️ Failed to fetch locations:', error);
  }

  // Transform data
  const pages = transformPages(wpPages);
  const posts = transformPosts(wpPosts);
  const categories = transformCategories(wpCategories);
  const locations = transformLocations(abaLocations);

  // Save to JSON files (even partial data is useful)
  console.log('\n💾 Saving data to JSON files...');

  writeFileSync(
    join(DATA_DIR, 'pages.json'),
    JSON.stringify(pages, null, 2)
  );
  console.log(`  ✓ pages.json (${pages.length} pages)`);

  writeFileSync(
    join(DATA_DIR, 'posts.json'),
    JSON.stringify(posts, null, 2)
  );
  console.log(`  ✓ posts.json (${posts.length} posts)`);

  writeFileSync(
    join(DATA_DIR, 'categories.json'),
    JSON.stringify(categories, null, 2)
  );
  console.log(`  ✓ categories.json (${categories.length} categories)`);

  writeFileSync(
    join(DATA_DIR, 'locations.json'),
    JSON.stringify(locations, null, 2)
  );
  console.log(`  ✓ locations.json (${locations.length} locations)`);

  // Summary
  console.log('\n✅ Content fetch complete!');
  console.log('============================');
  console.log(`  Pages:     ${pages.length}`);
  console.log(`  Posts:     ${posts.length}`);
  console.log(`  Categories: ${categories.length}`);
  console.log(`  Locations: ${locations.length}`);
  console.log(`  Total:     ${pages.length + posts.length + categories.length + locations.length}`);

  if (pages.length === 0 || posts.length === 0 || locations.length === 0) {
    console.log('\n⚠️ Warning: Some content types are empty. You may need to re-run the script.');
  }

  console.log('\nRun `npm run build` to generate the static site.');
}

main();
