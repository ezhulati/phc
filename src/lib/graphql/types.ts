/**
 * TypeScript interfaces for WordPress GraphQL data
 */

// Common Types
export interface FeaturedImage {
  node: {
    sourceUrl: string;
    altText: string;
    mediaDetails?: {
      width: number;
      height: number;
    };
  };
}

export interface SEOData {
  title: string;
  metaDesc: string;
  opengraphTitle?: string;
  opengraphDescription?: string;
  opengraphImage?: {
    sourceUrl: string;
    mediaDetails?: {
      width: number;
      height: number;
    };
  };
  canonical?: string;
  metaRobotsNoindex?: string;
  metaRobotsNofollow?: string;
  schema?: {
    raw: string;
  };
  readingTime?: number;
}

export interface LanguageInfo {
  code: string;
  locale: string;
}

export interface Translation {
  slug: string;
  uri: string;
  language: {
    code: string;
  };
}

export interface Author {
  node: {
    name: string;
    avatar?: {
      url: string;
    };
    description?: string;
  };
}

export interface Category {
  name: string;
  slug: string;
  uri: string;
}

export interface Tag {
  name: string;
  slug: string;
}

// Page Type
export interface WPPage {
  id: string;
  databaseId: number;
  slug: string;
  uri: string;
  title: string;
  content: string;
  date: string;
  modified: string;
  language?: LanguageInfo;
  translations?: Translation[];
  featuredImage?: FeaturedImage;
  seo?: SEOData;
  template?: {
    templateName: string;
  };
}

// Post Type (Blog Articles)
export interface WPPost {
  id: string;
  databaseId: number;
  slug: string;
  uri: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  modified: string;
  author?: Author;
  categories?: {
    nodes: Category[];
  };
  tags?: {
    nodes: Tag[];
  };
  language?: LanguageInfo;
  translations?: Translation[];
  featuredImage?: FeaturedImage;
  seo?: SEOData;
}

// ABA Therapy Location Type
export interface WPLocation {
  id: string;
  databaseId: number;
  slug: string;
  uri: string;
  title: string;
  content: string;
  language?: LanguageInfo;
  translations?: Translation[];
  featuredImage?: FeaturedImage;
  seo?: SEOData;
  // ACF Fields (will be populated via GraphQL)
  locationFields?: {
    cityName?: string;
    stateName?: string;
    region?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    metaDescription?: string;
    services?: Array<{
      title: string;
      description: string;
      icon?: string;
    }>;
    faqs?: Array<{
      question: string;
      answer: string;
    }>;
    nearbyLocations?: Array<{
      slug: string;
      title: string;
    }>;
    insuranceProviders?: Array<{
      name: string;
      logo?: {
        sourceUrl: string;
      };
    }>;
    contactInfo?: {
      phone?: string;
      email?: string;
      address?: string;
    };
  };
}

// Category Archive Type
export interface WPCategory {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  uri: string;
  description?: string;
  count?: number;
  language?: LanguageInfo;
  translations?: Translation[];
  seo?: SEOData;
  posts?: {
    nodes: WPPost[];
  };
}

// Menu Types
export interface MenuItem {
  id: string;
  label: string;
  url: string;
  target?: string;
  cssClasses?: string[];
  parentId?: string;
  childItems?: {
    nodes: MenuItem[];
  };
}

export interface WPMenu {
  id: string;
  name: string;
  menuItems: {
    nodes: MenuItem[];
  };
}

// Site Settings
export interface SiteSettings {
  generalSettings: {
    title: string;
    description: string;
    url: string;
  };
}

// Page Info for pagination
export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

// Response Types
export interface PagesResponse {
  pages: {
    nodes: WPPage[];
    pageInfo: PageInfo;
  };
}

export interface PostsResponse {
  posts: {
    nodes: WPPost[];
    pageInfo: PageInfo;
  };
}

export interface LocationsResponse {
  abaTherapyLocations?: {
    nodes: WPLocation[];
    pageInfo: PageInfo;
  };
  // Fallback if CPT is registered differently
  abaTherapies?: {
    nodes: WPLocation[];
    pageInfo: PageInfo;
  };
}

export interface CategoriesResponse {
  categories: {
    nodes: WPCategory[];
  };
}

export interface MenusResponse {
  menus: {
    nodes: WPMenu[];
  };
}

export interface MenuResponse {
  menu: WPMenu;
}

export interface SiteSettingsResponse {
  generalSettings: SiteSettings['generalSettings'];
}
