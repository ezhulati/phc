/**
 * Date formatting utilities
 */

import type { Locale } from './urls';

/**
 * Format date for display
 */
export function formatDate(
  dateString: string,
  locale: Locale = 'en',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const date = new Date(dateString);
  const localeCode = locale === 'es' ? 'es-MX' : 'en-US';
  return date.toLocaleDateString(localeCode, options);
}

/**
 * Format date as ISO string for datetime attributes
 */
export function formatISODate(dateString: string): string {
  return new Date(dateString).toISOString();
}

/**
 * Get relative time (e.g., "2 days ago")
 */
export function getRelativeTime(dateString: string, locale: Locale = 'en'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat(locale === 'es' ? 'es' : 'en', {
    numeric: 'auto',
  });

  if (diffDays === 0) {
    return rtf.format(0, 'day');
  } else if (diffDays < 7) {
    return rtf.format(-diffDays, 'day');
  } else if (diffDays < 30) {
    return rtf.format(-Math.floor(diffDays / 7), 'week');
  } else if (diffDays < 365) {
    return rtf.format(-Math.floor(diffDays / 30), 'month');
  } else {
    return rtf.format(-Math.floor(diffDays / 365), 'year');
  }
}

/**
 * Calculate reading time from content
 */
export function calculateReadingTime(content: string, locale: Locale = 'en'): string {
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, '');
  // Average reading speed: 200 words per minute
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);

  if (locale === 'es') {
    return `${minutes} min de lectura`;
  }
  return `${minutes} min read`;
}
