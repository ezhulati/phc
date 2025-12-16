/**
 * Schema.org JSON-LD generators for SEO
 */

import type { WPPost, WPLocation, WPPage } from '../graphql/types';
import { decodeHtmlEntities } from './get-page-data';

const ORGANIZATION = {
  '@type': 'Organization',
  name: 'Prospera Healthcare',
  url: 'https://prosperahealthcare.com',
  logo: 'https://prosperahealthcare.com/images/brand/Prospera_Blue_Green.png',
  sameAs: [],
};

/**
 * Organization Schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    ...ORGANIZATION,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      areaServed: 'US',
      availableLanguage: ['English', 'Spanish'],
    },
  };
}

/**
 * WebSite Schema
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Prospera Healthcare',
    url: 'https://prosperahealthcare.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://prosperahealthcare.com/?s={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Article Schema for blog posts
 */
export function generateArticleSchema(post: WPPost, canonicalUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: decodeHtmlEntities(post.title),
    description: post.seo?.metaDesc || post.excerpt?.replace(/<[^>]*>/g, '').slice(0, 160),
    image: post.featuredImage?.node?.sourceUrl,
    datePublished: post.date,
    dateModified: post.modified,
    author: {
      '@type': 'Person',
      name: post.author?.node?.name || 'Prospera Healthcare',
    },
    publisher: ORGANIZATION,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };
}

/**
 * LocalBusiness Schema for ABA therapy location pages
 */
export function generateLocalBusinessSchema(location: WPLocation, canonicalUrl: string) {
  const cityName = location.locationFields?.cityName ||
    location.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': canonicalUrl,
    name: `Prospera Healthcare - ${cityName} ABA Therapy`,
    description: location.seo?.metaDesc || `ABA therapy services in ${cityName}, Texas`,
    url: canonicalUrl,
    telephone: location.locationFields?.contactInfo?.phone,
    email: location.locationFields?.contactInfo?.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: cityName,
      addressRegion: 'TX',
      addressCountry: 'US',
    },
    openingHours: 'Mo-Fr 09:00-17:00',
    priceRange: '$$',
    image: location.featuredImage?.node?.sourceUrl,
    parentOrganization: ORGANIZATION,
  };
}

/**
 * FAQPage Schema
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer.replace(/<[^>]*>/g, ''), // Strip HTML
      },
    })),
  };
}

/**
 * BreadcrumbList Schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Service Schema for ABA therapy service pages
 */
export function generateServiceSchema(
  serviceName: string,
  description: string,
  canonicalUrl: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    description,
    provider: ORGANIZATION,
    areaServed: {
      '@type': 'State',
      name: 'Texas',
    },
    url: canonicalUrl,
  };
}

/**
 * WebPage Schema for generic pages
 */
export function generateWebPageSchema(page: WPPage, canonicalUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': canonicalUrl,
    name: page.title,
    description: page.seo?.metaDesc,
    url: canonicalUrl,
    isPartOf: {
      '@type': 'WebSite',
      url: 'https://prosperahealthcare.com',
    },
    publisher: ORGANIZATION,
  };
}
