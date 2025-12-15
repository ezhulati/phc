/**
 * Mobile Menu Component (React Island)
 * Slide-out navigation for mobile devices
 */

import { useState, useEffect, useRef } from 'react';

interface NavItem {
  label: string;
  href: string;
}

interface MobileMenuProps {
  navItems: NavItem[];
  ctaLabel: string;
  ctaHref: string;
  currentPath: string;
  lang: 'en' | 'es';
}

export default function MobileMenu({
  navItems,
  ctaLabel,
  ctaHref,
  currentPath,
  lang,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const menuLabel = lang === 'es' ? 'Menú' : 'Menu';
  const closeLabel = lang === 'es' ? 'Cerrar menú' : 'Close menu';
  const switchLang = lang === 'en' ? 'es' : 'en';
  const switchLabel = lang === 'en' ? 'Español' : 'English';

  // Calculate alternate URL
  const getAlternateUrl = () => {
    if (switchLang === 'es') {
      if (currentPath.startsWith('/aba-therapy/')) {
        return currentPath.replace('/aba-therapy/', '/es/terapia-aba/');
      }
      if (currentPath === '/') return '/es/';
      return `/es${currentPath}`;
    } else {
      if (currentPath.startsWith('/es/terapia-aba/')) {
        return currentPath.replace('/es/terapia-aba/', '/aba-therapy/');
      }
      if (currentPath === '/es/' || currentPath === '/es') return '/';
      return currentPath.replace(/^\/es/, '');
    }
  };

  return (
    <>
      {/* Hamburger Button - 48px min touch target per Practical UI */}
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="inline-flex items-center justify-center p-2.5 min-w-[48px] min-h-[48px] rounded-lg text-neutral-700 hover:text-primary-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? closeLabel : menuLabel}
      >
        <span className="sr-only">{isOpen ? closeLabel : menuLabel}</span>
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Menu */}
      <div
        ref={menuRef}
        id="mobile-menu"
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <span className="text-lg font-bold text-neutral-900">{menuLabel}</span>
            {/* Close button - 48px min touch target per Practical UI */}
            <button
              onClick={closeMenu}
              className="p-2.5 min-w-[48px] min-h-[48px] rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-center"
              aria-label={closeLabel}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4" aria-label="Mobile navigation">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  {/* Nav links - 48px min touch target per Practical UI */}
                  <a
                    href={item.href}
                    onClick={closeMenu}
                    className={`flex items-center px-4 min-h-[48px] rounded-lg text-base font-medium no-underline transition-colors ${
                      currentPath === item.href || currentPath.startsWith(item.href)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-700 hover:bg-neutral-50 hover:text-primary-600'
                    }`}
                    aria-current={currentPath === item.href ? 'page' : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer with CTA and Language Switch - 48px min touch targets per Practical UI */}
          <div className="p-4 border-t border-neutral-200 space-y-3">
            {/* Language Switch - Secondary button style */}
            <a
              href={getAlternateUrl()}
              onClick={closeMenu}
              className="flex items-center justify-center gap-2 w-full px-4 min-h-[48px] text-sm font-bold text-neutral-600 border-2 border-neutral-300 rounded-lg hover:border-primary-400 hover:text-primary-600 no-underline transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              {switchLabel}
            </a>

            {/* CTA Button - Primary button style */}
            <a
              href={ctaHref}
              onClick={closeMenu}
              className="flex items-center justify-center w-full px-4 min-h-[48px] text-base font-bold text-white bg-primary-500 rounded-lg hover:bg-primary-600 no-underline transition-colors"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
