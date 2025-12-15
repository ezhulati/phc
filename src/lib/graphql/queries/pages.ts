/**
 * GraphQL Queries for WordPress Pages
 * Includes REST API fallback for rate limiting issues
 */

import { fetchGraphQL, fetchAllPaginated } from '../client';
import type { WPPage, PagesResponse } from '../types';

const WP_REST_URL = 'https://prosperahealthcare.com/wp-json/wp/v2';

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry for transient 502 errors
 */
async function fetchWithRetry(url: string, retries = 5): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);

      if (response.status >= 500) {
        lastError = new Error(`REST API failed: ${response.status}`);
        if (attempt < retries) {
          const delay = Math.min(attempt * 3000, 15000);
          console.warn(`REST API 5xx error (attempt ${attempt}/${retries}), retrying in ${delay / 1000}s...`);
          await sleep(delay);
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        const delay = Math.min(attempt * 3000, 15000);
        console.warn(`REST API network error (attempt ${attempt}/${retries}), retrying in ${delay / 1000}s...`);
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError || new Error('REST API request failed after all retries');
}

/**
 * Fetch all pages using WordPress REST API (fallback for GraphQL rate limits)
 */
export async function getAllPagesREST(): Promise<WPPage[]> {
  const allPages: WPPage[] = [];
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      const response = await fetchWithRetry(
        `${WP_REST_URL}/pages?page=${page}&per_page=${perPage}&_fields=id,slug,link,title,content,date,modified,featured_media`
      );

      if (!response.ok) {
        if (response.status === 400) break; // No more pages
        throw new Error(`REST API failed: ${response.status}`);
      }

      const pages = await response.json();
      if (pages.length === 0) break;

      for (const p of pages) {
        // Convert REST API format to our WPPage type
        const uri = new URL(p.link).pathname;
        allPages.push({
          id: String(p.id),
          databaseId: p.id,
          slug: p.slug,
          uri,
          title: p.title?.rendered || '',
          content: p.content?.rendered || '',
          date: p.date,
          modified: p.modified,
        });
      }

      // Check if there are more pages
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
      if (page >= totalPages) break;

      page++;
      await sleep(500); // Rate limiting
    }
  } catch (error) {
    console.error('Error fetching pages via REST:', error);
  }

  return allPages;
}

const GET_ALL_PAGES_QUERY = `
  query GetAllPages($after: String) {
    pages(first: 100, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        databaseId
        slug
        uri
        title
        content
        date
        modified
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }
        template {
          templateName
        }
      }
    }
  }
`;

const GET_PAGE_BY_SLUG_QUERY = `
  query GetPageBySlug($slug: ID!) {
    page(id: $slug, idType: SLUG) {
      id
      databaseId
      slug
      uri
      title
      content
      date
      modified
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
      }
      template {
        templateName
      }
    }
  }
`;

const GET_PAGE_BY_URI_QUERY = `
  query GetPageByUri($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      databaseId
      slug
      uri
      title
      content
      date
      modified
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
      }
      template {
        templateName
      }
    }
  }
`;

/**
 * Fetch all pages (with pagination)
 * Higher throttle to prevent overwhelming WordPress server
 */
export async function getAllPages(_language?: 'EN' | 'ES'): Promise<WPPage[]> {
  return fetchAllPaginated<PagesResponse, WPPage>(
    GET_ALL_PAGES_QUERY,
    {},
    (data) => data.pages.nodes,
    (data) => data.pages.pageInfo,
    1000 // 1 second between pagination requests
  );
}

/**
 * Fetch a single page by slug
 */
export async function getPageBySlug(slug: string): Promise<WPPage | null> {
  const data = await fetchGraphQL<{ page: WPPage | null }>(GET_PAGE_BY_SLUG_QUERY, { slug });
  return data.page;
}

/**
 * Fetch a single page by URI
 */
export async function getPageByUri(uri: string): Promise<WPPage | null> {
  const data = await fetchGraphQL<{ page: WPPage | null }>(GET_PAGE_BY_URI_QUERY, { uri });
  return data.page;
}

/**
 * Get all page slugs for static path generation
 */
export async function getAllPageSlugs(): Promise<string[]> {
  const pages = await getAllPages();
  return pages.map((page) => page.slug);
}
