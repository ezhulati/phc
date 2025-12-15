/**
 * GraphQL Queries for ABA Therapy Location Pages (Custom Post Type)
 * Using contentNodes query for the aba-therapy CPT
 * Note: Content fetched via REST API due to custom GraphQL schema
 */

import { fetchGraphQL } from '../client';
import type { WPLocation } from '../types';

interface LocationNode {
  id: string;
  databaseId: number;
  slug: string;
  title: string;
  featuredImage?: {
    node?: {
      sourceUrl: string;
      altText?: string;
    };
  };
}

interface ContentNodesResponse {
  contentNodes: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: LocationNode[];
  };
}

interface SingleLocationResponse {
  aBATherapy: LocationNode | null;
}

// Query without content field (uses REST API for content)
const GET_ALL_LOCATIONS_QUERY = `
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

const GET_LOCATION_BY_SLUG_QUERY = `
  query GetLocationBySlug($id: ID!) {
    aBATherapy(id: $id, idType: SLUG) {
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
`;

/**
 * Fetch location content from WordPress REST API
 */
export async function fetchLocationContent(databaseId: number): Promise<string> {
  if (!databaseId) return '';
  try {
    const response = await fetch(
      `https://prosperahealthcare.com/wp-json/wp/v2/aba-therapy/${databaseId}?_fields=content`
    );
    if (!response.ok) return '';
    const data = await response.json();
    return data?.content?.rendered || '';
  } catch (error) {
    console.error('Error fetching location content:', error);
    return '';
  }
}

/**
 * Fetch all ABA therapy location pages
 */
export async function getAllLocations(_language?: 'EN' | 'ES'): Promise<WPLocation[]> {
  const allLocations: WPLocation[] = [];
  let hasNextPage = true;
  let endCursor: string | null = null;

  try {
    while (hasNextPage) {
      const data = await fetchGraphQL<ContentNodesResponse>(GET_ALL_LOCATIONS_QUERY, {
        after: endCursor,
      });

      const nodes = data.contentNodes?.nodes || [];

      for (const node of nodes) {
        if (node.slug) {
          allLocations.push({
            id: node.id,
            databaseId: node.databaseId || 0,
            slug: node.slug,
            uri: `/aba-therapy/texas/${node.slug}/`,
            title: node.title || '',
            content: '', // Will be fetched separately if needed
            featuredImage: node.featuredImage,
          });
        }
      }

      hasNextPage = data.contentNodes?.pageInfo?.hasNextPage || false;
      endCursor = data.contentNodes?.pageInfo?.endCursor || null;
    }

    return allLocations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

/**
 * Fetch a single location by slug (with content from REST API)
 */
export async function getLocationBySlug(slug: string): Promise<WPLocation | null> {
  try {
    const data = await fetchGraphQL<SingleLocationResponse>(GET_LOCATION_BY_SLUG_QUERY, { id: slug });

    if (!data.aBATherapy) return null;

    const node = data.aBATherapy;
    const content = await fetchLocationContent(node.databaseId);

    return {
      id: node.id,
      databaseId: node.databaseId || 0,
      slug: node.slug,
      uri: `/aba-therapy/texas/${node.slug}/`,
      title: node.title || '',
      content,
      featuredImage: node.featuredImage,
    };
  } catch (error) {
    console.error('Error fetching location by slug:', error);
    return null;
  }
}

/**
 * Get all location slugs for static path generation
 */
export async function getAllLocationSlugs(): Promise<string[]> {
  const locations = await getAllLocations();
  return locations.map((location) => location.slug);
}

/**
 * Extract city name from location title or slug
 */
export function getCityFromLocation(location: WPLocation): string {
  // Use title if available
  if (location.title) {
    return location.title;
  }
  // Fall back to formatting the slug
  return location.slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
