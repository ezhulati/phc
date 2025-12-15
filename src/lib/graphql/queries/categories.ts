/**
 * GraphQL Queries for WordPress Categories
 */

import { fetchGraphQL } from '../client';
import type { WPCategory, CategoriesResponse } from '../types';

const GET_ALL_CATEGORIES_QUERY = `
  query GetAllCategories {
    categories(first: 100, where: { hideEmpty: true }) {
      nodes {
        id
        databaseId
        name
        slug
        uri
        description
        count
      }
    }
  }
`;

const GET_CATEGORY_BY_SLUG_QUERY = `
  query GetCategoryBySlug($slug: ID!) {
    category(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      uri
      description
      count
      posts(first: 50) {
        nodes {
          id
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
  }
`;

const GET_CATEGORY_WITH_POSTS_QUERY = `
  query GetCategoryWithPosts($slug: ID!, $first: Int = 20, $after: String) {
    category(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      uri
      description
      count
      posts(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          slug
          title
          excerpt
          date
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

/**
 * Fetch all categories
 */
export async function getAllCategories(): Promise<WPCategory[]> {
  const data = await fetchGraphQL<CategoriesResponse>(GET_ALL_CATEGORIES_QUERY);
  return data.categories.nodes;
}

/**
 * Fetch a single category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<WPCategory | null> {
  const data = await fetchGraphQL<{ category: WPCategory | null }>(GET_CATEGORY_BY_SLUG_QUERY, { slug });
  return data.category;
}

/**
 * Fetch category with paginated posts
 */
export async function getCategoryWithPosts(
  slug: string,
  first = 20,
  after?: string
): Promise<WPCategory | null> {
  const data = await fetchGraphQL<{ category: WPCategory | null }>(GET_CATEGORY_WITH_POSTS_QUERY, {
    slug,
    first,
    after,
  });
  return data.category;
}

/**
 * Get all category slugs for static path generation
 */
export async function getAllCategorySlugs(): Promise<string[]> {
  const categories = await getAllCategories();
  return categories.map((cat) => cat.slug);
}

/**
 * Get categories for ABA therapy section
 * These are the main content categories shown in the ABA therapy hub
 */
export async function getABACategories(): Promise<WPCategory[]> {
  const allCategories = await getAllCategories();

  // Filter to only ABA-related categories
  // Based on sitemap: costs-insurance, parenting-tips, health-and-care, community, autism
  const abaCategories = [
    'aba-therapy',
    'costs-insurance',
    'parenting-tips',
    'health-and-care',
    'community',
    'autism',
    'social-skills',
  ];

  return allCategories.filter((cat) =>
    abaCategories.includes(cat.slug) ||
    cat.uri?.includes('/aba-therapy/')
  );
}
