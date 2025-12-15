// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://prosperahealthcare.com',
  output: 'static',

  integrations: [
    react(),
    tailwind(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          es: 'es-MX',
        },
      },
      filter: (page) => !page.includes('/admin'),
    }),
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false, // EN at root, ES at /es/
    },
  },

  image: {
    domains: ['prosperahealthcare.com'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.prosperahealthcare.com' },
    ],
  },

  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
  }),
});
