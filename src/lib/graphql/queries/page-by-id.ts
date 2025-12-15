/**
 * Fetch individual pages by ID from WordPress REST API
 * More reliable than bulk fetching for rate-limited servers
 */

const WP_REST_URL = 'https://prosperahealthcare.com/wp-json/wp/v2';

interface WPPageData {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  date: string;
  modified: string;
  link: string;
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a single page by WordPress ID with retry
 */
export async function fetchPageById(pageId: number, retries = 3): Promise<WPPageData | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `${WP_REST_URL}/pages/${pageId}?_fields=id,slug,title,content,date,modified,link`
      );

      if (response.status >= 500) {
        if (attempt < retries) {
          await sleep(attempt * 2000);
          continue;
        }
        return null;
      }

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      if (attempt < retries) {
        await sleep(attempt * 2000);
        continue;
      }
      console.error(`Error fetching page ${pageId}:`, error);
      return null;
    }
  }
  return null;
}

/**
 * Extract URI from page link
 */
export function getUriFromLink(link: string): string {
  try {
    return new URL(link).pathname;
  } catch {
    return '/';
  }
}
