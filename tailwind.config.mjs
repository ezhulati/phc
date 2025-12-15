/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#edfcfc',
          100: '#d2f7f8',
          200: '#aaeef0',
          300: '#70e0e5',
          400: '#4ebcc3',
          500: '#3aa5ad',
          600: '#2d8690',
          700: '#2a6c74',
          800: '#295961',
          900: '#264a52',
          950: '#143036',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      /* Fluid Typography - clamp(min, preferred, max) for smooth scaling */
      fontSize: {
        /* Fine print - use sparingly (11-12px) */
        tiny: ['clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)', { lineHeight: '1.4', letterSpacing: '0.025em' }],
        /* Captions, meta info (13-15px) */
        small: ['clamp(0.8125rem, 0.75rem + 0.25vw, 0.9375rem)', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        /* Short UI text: buttons, labels, nav (14-16px) */
        sm: ['clamp(0.875rem, 0.825rem + 0.2vw, 1rem)', { lineHeight: '1.5' }],
        /* Body text (16-18px) */
        base: ['clamp(1rem, 0.95rem + 0.2vw, 1.125rem)', { lineHeight: '1.5' }],
        /* H4, Card titles (18-22px) */
        lg: ['clamp(1.125rem, 1rem + 0.5vw, 1.375rem)', { lineHeight: '1.35' }],
        /* H3, Subsection headings (20-26px) */
        xl: ['clamp(1.25rem, 1.1rem + 0.75vw, 1.625rem)', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        /* H2, Section headings (24-32px) */
        '2xl': ['clamp(1.5rem, 1.25rem + 1vw, 2rem)', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        /* H1, Page titles (30-40px) */
        '3xl': ['clamp(1.875rem, 1.5rem + 1.5vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        /* Display text - hero sections (36-48px) */
        '4xl': ['clamp(2.25rem, 1.75rem + 2vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        /* Large display (40-56px) */
        '5xl': ['clamp(2.5rem, 2rem + 2.5vw, 3.5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
      },
      /* Letter Spacing per Practical UI */
      letterSpacing: {
        tighter: '-0.03em',  /* Very large display (44px+) */
        tight: '-0.02em',    /* Large headings (28-35px) */
        normal: '0',         /* Body text */
        wide: '0.025em',     /* Small text */
        wider: '0.05em',     /* UPPERCASE text */
        widest: '0.1em',     /* UPPERCASE labels */
      },
      /* Line Heights per Practical UI - Decrease as font size increases */
      lineHeight: {
        none: '1',
        tight: '1.1',      /* Display/very large text (44px+) */
        snug: '1.2',       /* Large headings (28-35px) */
        heading: '1.3',    /* Medium headings (22-28px) */
        normal: '1.5',     /* Body text - WCAG 2.1 AA minimum */
        relaxed: '1.625',  /* Long-form reading */
        loose: '1.75',     /* Extra comfortable reading */
      },
      /* Max width for optimal line length (45-75ch) */
      maxWidth: {
        prose: '65ch',
        'prose-narrow': '55ch',
        'prose-wide': '75ch',
      },
      spacing: {
        18: '4.5rem',
        112: '28rem',
        128: '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
