/**
 * Utility to get page data from pre-fetched JSON
 */
import pagesData from '@/data/pages.json';
import type { WPPage } from '@/lib/graphql/types';

const pages = pagesData as WPPage[];

/**
 * Get page data by slug from pre-fetched JSON
 */
export function getPageBySlug(slug: string): WPPage | undefined {
  return pages.find(p => p.slug === slug);
}

/**
 * Get page data by ID from pre-fetched JSON
 */
export function getPageById(id: number): WPPage | undefined {
  return pages.find(p => p.databaseId === id);
}

/**
 * Decode HTML entities in a string
 */
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '—')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"');
}
