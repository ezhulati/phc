/**
 * FAQ Accordion Component (React Island)
 * Accessible accordion for FAQ sections
 */

import { useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqs: FAQ[];
  lang?: 'en' | 'es';
  initialOpen?: number;
}

export default function FAQAccordion({ faqs, lang = 'en', initialOpen }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(initialOpen ?? null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        const itemId = `faq-${index}`;
        const headerId = `faq-header-${index}`;
        const panelId = `faq-panel-${index}`;

        return (
          <div
            key={itemId}
            className="border border-neutral-200 rounded-xl overflow-hidden bg-white"
          >
            {/* FAQ button - min 48px touch target per Practical UI */}
            <button
              id={headerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleItem(index)}
              className="w-full flex items-center justify-between gap-4 p-5 min-h-[64px] text-left hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="font-bold text-neutral-900 text-base md:text-lg">
                {faq.question}
              </span>
              <span
                className={`flex-shrink-0 w-6 h-6 text-primary-500 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              hidden={!isOpen}
              className={`overflow-hidden transition-all duration-200 ${
                isOpen ? 'max-h-[1000px]' : 'max-h-0'
              }`}
            >
              <div className="p-5 pt-0 text-neutral-600 leading-relaxed">
                {/* Handle HTML content from WordPress */}
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
