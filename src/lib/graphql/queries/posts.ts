/**
 * GraphQL Queries for WordPress Posts (Blog Articles)
 * Includes REST API fallback for rate limiting issues
 */

import { fetchGraphQL, fetchAllPaginated } from '../client';
import type { WPPost, PostsResponse } from '../types';

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
 * Fetch all posts using WordPress REST API (fallback for GraphQL rate limits)
 */
export async function getAllPostsREST(): Promise<WPPost[]> {
  const allPosts: WPPost[] = [];
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      const response = await fetchWithRetry(
        `${WP_REST_URL}/posts?page=${page}&per_page=${perPage}&_embed&_fields=id,slug,link,title,excerpt,content,date,modified,_embedded`
      );

      if (!response.ok) {
        if (response.status === 400) break; // No more pages
        throw new Error(`REST API failed: ${response.status}`);
      }

      const posts = await response.json();
      if (posts.length === 0) break;

      for (const p of posts) {
        // Convert REST API format to our WPPost type
        const uri = new URL(p.link).pathname;
        const author = p._embedded?.author?.[0];
        const categories = p._embedded?.['wp:term']?.[0] || [];

        allPosts.push({
          id: String(p.id),
          databaseId: p.id,
          slug: p.slug,
          uri,
          title: p.title?.rendered || '',
          excerpt: p.excerpt?.rendered || '',
          content: p.content?.rendered || '',
          date: p.date,
          modified: p.modified,
          author: author ? {
            node: {
              name: author.name,
              avatar: author.avatar_urls ? { url: author.avatar_urls['96'] } : undefined,
              description: author.description,
            },
          } : undefined,
          categories: {
            nodes: categories.map((c: { id: number; name: string; slug: string; link: string }) => ({
              id: String(c.id),
              name: c.name,
              slug: c.slug,
              uri: new URL(c.link).pathname,
            })),
          },
        });
      }

      // Check if there are more pages
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
      if (page >= totalPages) break;

      page++;
      await sleep(500); // Rate limiting
    }
  } catch (error) {
    console.error('Error fetching posts via REST:', error);
  }

  return allPosts;
}

// Posts query without content field (due to custom GraphQL schema)
// Content will be fetched via REST API
const GET_ALL_POSTS_QUERY = `
  query GetAllPosts($after: String) {
    posts(first: 50, after: $after) {
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
        excerpt
        date
        modified
        author {
          node {
            name
            avatar {
              url
            }
            description
          }
        }
        categories {
          nodes {
            id
            name
            slug
            uri
          }
        }
        tags {
          nodes {
            name
            slug
          }
        }
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
      }
    }
  }
`;

const GET_POST_BY_SLUG_QUERY = `
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      databaseId
      slug
      uri
      title
      excerpt
      date
      modified
      author {
        node {
          name
          avatar {
            url
          }
          description
        }
      }
      categories {
        nodes {
          id
          name
          slug
          uri
        }
      }
      tags {
        nodes {
          name
          slug
        }
      }
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
    }
  }
`;

const GET_POSTS_BY_CATEGORY_QUERY = `
  query GetPostsByCategory($categorySlug: String!, $first: Int = 20, $after: String) {
    posts(
      first: $first,
      after: $after,
      where: { categoryName: $categorySlug }
    ) {
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
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`;

const GET_RELATED_POSTS_QUERY = `
  query GetRelatedPosts($categoryIn: [ID], $notIn: [ID], $first: Int = 4) {
    posts(
      first: $first,
      where: { categoryIn: $categoryIn, notIn: $notIn }
    ) {
      nodes {
        id
        slug
        title
        excerpt
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`;

/**
 * Fetch post content from WordPress REST API
 */
export async function fetchPostContent(slug: string): Promise<string> {
  try {
    const response = await fetch(
      `https://prosperahealthcare.com/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=content`
    );
    if (!response.ok) return '';
    const data = await response.json();
    return data[0]?.content?.rendered || '';
  } catch (error) {
    console.error('Error fetching post content:', error);
    return '';
  }
}

/**
 * Fetch all posts (with pagination)
 * Higher throttle to prevent overwhelming WordPress server
 */
export async function getAllPosts(_language?: 'EN' | 'ES'): Promise<WPPost[]> {
  return fetchAllPaginated<PostsResponse, WPPost>(
    GET_ALL_POSTS_QUERY,
    {},
    (data) => data.posts.nodes,
    (data) => data.posts.pageInfo,
    1000 // 1 second between pagination requests
  );
}

/**
 * Fetch a single post by slug (with content from REST API)
 */
export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const [graphqlData, content] = await Promise.all([
    fetchGraphQL<{ post: WPPost | null }>(GET_POST_BY_SLUG_QUERY, { slug }),
    fetchPostContent(slug),
  ]);

  if (!graphqlData.post) return null;

  return {
    ...graphqlData.post,
    content,
  };
}

/**
 * Get all post slugs for static path generation
 */
export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await getAllPosts();
  return posts.map((post) => post.slug);
}

/**
 * Fetch posts by category
 */
export async function getPostsByCategory(
  categorySlug: string,
  first = 20,
  after?: string
): Promise<{ posts: WPPost[]; hasNextPage: boolean; endCursor: string | null }> {
  const data = await fetchGraphQL<PostsResponse>(GET_POSTS_BY_CATEGORY_QUERY, {
    categorySlug,
    first,
    after,
  });
  return {
    posts: data.posts.nodes,
    hasNextPage: data.posts.pageInfo.hasNextPage,
    endCursor: data.posts.pageInfo.endCursor,
  };
}

/**
 * Fetch related posts by category
 */
export async function getRelatedPosts(
  categoryIds: string[],
  excludePostId: string,
  limit = 4
): Promise<WPPost[]> {
  const data = await fetchGraphQL<{ posts: { nodes: WPPost[] } }>(GET_RELATED_POSTS_QUERY, {
    categoryIn: categoryIds,
    notIn: [excludePostId],
    first: limit,
  });
  return data.posts.nodes;
}

/**
 * Get recent posts
 */
export async function getRecentPosts(limit = 6): Promise<WPPost[]> {
  const posts = await getAllPosts();
  return posts.slice(0, limit);
}
