/**
 * GraphQL Client for WordPress WPGraphQL
 * Fetches content at build time for static site generation
 */

const GRAPHQL_URL = import.meta.env.WP_GRAPHQL_URL || 'https://prosperahealthcare.com/graphql';

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string; locations?: Array<{ line: number; column: number }> }>;
}

interface FetchOptions {
  cache?: RequestCache;
  revalidate?: number;
  retries?: number;
  delayMs?: number;
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a GraphQL query against the WordPress endpoint with retry logic
 */
export async function fetchGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  options: FetchOptions = {}
): Promise<T> {
  const { cache = 'force-cache', retries = 5, delayMs = 0 } = options;

  // Optional delay before making request (for rate limiting)
  if (delayMs > 0) {
    await sleep(delayMs);
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
        cache,
      });

      // Retry on server errors (5xx)
      if (response.status >= 500) {
        lastError = new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
        if (attempt < retries) {
          const delay = Math.min(attempt * 3000, 15000); // 3s, 6s, 9s, 12s, 15s max
          console.warn(`GraphQL request failed (attempt ${attempt}/${retries}), retrying in ${delay / 1000}s...`);
          await sleep(delay);
          continue;
        }
        throw lastError;
      }

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      }

      const json: GraphQLResponse<T> = await response.json();

      if (json.errors) {
        const errorMessages = json.errors.map((e) => e.message).join(', ');
        console.error('GraphQL Errors:', json.errors);
        throw new Error(`GraphQL errors: ${errorMessages}`);
      }

      return json.data;
    } catch (error) {
      lastError = error as Error;

      // Retry on network errors
      if (attempt < retries && (error as Error).message?.includes('fetch')) {
        const delay = Math.min(attempt * 3000, 15000);
        console.warn(`GraphQL network error (attempt ${attempt}/${retries}), retrying in ${delay / 1000}s...`);
        await sleep(delay);
        continue;
      }

      console.error('GraphQL fetch error:', error);
      throw error;
    }
  }

  throw lastError || new Error('GraphQL request failed after all retries');
}

/**
 * Paginate through all results for a GraphQL query
 * Useful for fetching all posts, pages, etc.
 * Includes throttling to avoid overwhelming the server
 */
export async function fetchAllPaginated<T, N>(
  query: string,
  variables: Record<string, unknown>,
  getNodes: (data: T) => N[],
  getPageInfo: (data: T) => { hasNextPage: boolean; endCursor: string | null },
  throttleMs = 500 // Delay between pagination requests
): Promise<N[]> {
  const allNodes: N[] = [];
  let hasNextPage = true;
  let after: string | null = null;
  let pageCount = 0;

  while (hasNextPage) {
    // Add throttling between requests (not on first request)
    if (pageCount > 0 && throttleMs > 0) {
      await sleep(throttleMs);
    }

    const data = await fetchGraphQL<T>(query, { ...variables, after });
    const nodes = getNodes(data);
    allNodes.push(...nodes);

    const pageInfo = getPageInfo(data);
    hasNextPage = pageInfo.hasNextPage;
    after = pageInfo.endCursor;
    pageCount++;
  }

  return allNodes;
}
