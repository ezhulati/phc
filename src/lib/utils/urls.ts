/**
 * URL utilities for consistent link generation
 */

export type Locale = 'en' | 'es';

const SITE_URL = 'https://prosperahealthcare.com';

/**
 * Generate URL for a page
 */
export function getPageUrl(slug: string, locale: Locale = 'en'): string {
  const base = locale === 'es' ? '/es' : '';
  if (slug === '/' || slug === '') return base || '/';
  return `${base}/${slug}/`;
}

/**
 * Generate URL for a blog post
 * Blog posts are at root level (not /blog/)
 */
export function getPostUrl(slug: string, locale: Locale = 'en'): string {
  const base = locale === 'es' ? '/es' : '';
  return `${base}/${slug}/`;
}

/**
 * Generate URL for an ABA therapy location page
 */
export function getLocationUrl(citySlug: string, locale: Locale = 'en'): string {
  const base = locale === 'es' ? '/es/terapia-aba' : '/aba-therapy';
  return `${base}/texas/${citySlug}/`;
}

/**
 * Generate URL for a category archive
 */
export function getCategoryUrl(categorySlug: string, locale: Locale = 'en'): string {
  const base = locale === 'es' ? '/es/terapia-aba' : '/aba-therapy';
  return `${base}/${categorySlug}/`;
}

/**
 * Get the full canonical URL
 */
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Get the alternate language URL
 */
export function getAlternateUrl(currentUrl: string, targetLocale: Locale): string {
  if (targetLocale === 'es') {
    // Convert EN to ES
    if (currentUrl.startsWith('/aba-therapy/')) {
      return currentUrl.replace('/aba-therapy/', '/es/terapia-aba/');
    }
    return `/es${currentUrl}`;
  } else {
    // Convert ES to EN
    if (currentUrl.startsWith('/es/terapia-aba/')) {
      return currentUrl.replace('/es/terapia-aba/', '/aba-therapy/');
    }
    return currentUrl.replace(/^\/es/, '');
  }
}

/**
 * Check if URL is external
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith('http') && !url.includes('prosperahealthcare.com');
}

/**
 * Normalize WordPress URL to relative path
 */
export function normalizeWpUrl(url: string): string {
  if (!url) return '/';
  // Remove site URL to get relative path
  const cleaned = url
    .replace('https://prosperahealthcare.com', '')
    .replace('http://prosperahealthcare.com', '');
  return cleaned || '/';
}

/**
 * Get slug from WordPress URI
 */
export function getSlugFromUri(uri: string): string {
  return uri
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .split('/')
    .pop() || '';
}

/**
 * Detect locale from URL path
 */
export function getLocaleFromPath(path: string): Locale {
  return path.startsWith('/es/') || path === '/es' ? 'es' : 'en';
}
