import { useState } from 'react';

interface City {
  name: string;
  slug: string;
  region: string;
}

interface Region {
  name: string;
  nameEs: string;
  slug: string;
}

interface Props {
  region: Region;
  cities: City[];
  lang: 'en' | 'es';
}

export default function FooterRegionAccordion({ region, cities, lang }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const regionCities = cities.filter(city => city.region === region.slug);
  const regionName = lang === 'es' ? region.nameEs : region.name;

  return (
    <div className="border-b border-neutral-800 sm:border-0">
      {/* Accordion Header - clickable on mobile, static on desktop */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 sm:py-0 sm:mb-2 sm:cursor-default"
        aria-expanded={isOpen}
      >
        <a
          href={`/contact/${region.slug}/`}
          onClick={(e) => e.stopPropagation()}
          className="text-primary-400 hover:text-primary-300 transition-colors no-underline inline-flex items-center gap-1 font-medium text-sm"
        >
          {regionName}
          <svg className="w-3 h-3 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
        {/* Chevron - only visible on mobile */}
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform sm:hidden ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* City List - collapsible on mobile, always visible on desktop */}
      <ul
        className={`flex flex-wrap items-center gap-x-1 gap-y-0 overflow-hidden transition-all duration-200 sm:max-h-none sm:opacity-100 sm:pb-0 ${
          isOpen ? 'max-h-96 opacity-100 pb-3' : 'max-h-0 opacity-0 sm:max-h-none sm:opacity-100'
        }`}
      >
        {regionCities.map((city, index) => (
          <li key={city.slug} className="flex items-center">
            <a
              href={`/aba-therapy/texas/${city.slug}/`}
              className="py-1 px-0.5 text-xs text-neutral-400 hover:text-white transition-colors no-underline whitespace-nowrap"
            >
              {city.name}
            </a>
            {index < regionCities.length - 1 && (
              <span className="text-neutral-600 select-none text-xs" aria-hidden="true">·</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
