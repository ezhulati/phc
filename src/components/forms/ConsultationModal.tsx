/**
 * Consultation Modal Component (React Island)
 * Popup modal with consultation form
 */

import { useState, useEffect, useRef } from 'react';
import ContactForm from './ContactForm';

interface ConsultationModalProps {
  lang?: 'en' | 'es';
  triggerText?: string;
  formEndpoint?: string;
}

export default function ConsultationModal({
  lang = 'en',
  triggerText,
  formEndpoint,
}: ConsultationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const defaultTrigger = lang === 'es' ? 'Programar una Consulta' : 'Schedule a Consultation';
  const closeLabel = lang === 'es' ? 'Cerrar' : 'Close';
  const modalTitle = lang === 'es' ? 'Programe su Consulta Gratuita' : 'Schedule Your Free Consultation';

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
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
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

  const openModal = () => setIsOpen(true);

  const closeModal = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      {/* Trigger Button - Primary style, 48px min touch target per Practical UI */}
      <button
        ref={triggerRef}
        onClick={openModal}
        className="inline-flex items-center justify-center px-6 min-h-[48px] text-base font-bold text-white bg-primary-500 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        aria-haspopup="dialog"
      >
        {triggerText || defaultTrigger}
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <div
            ref={modalRef}
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 bg-white border-b border-neutral-200 rounded-t-2xl">
              <h2
                id="modal-title"
                className="text-xl md:text-2xl font-bold text-neutral-900"
              >
                {modalTitle}
              </h2>
              {/* Close button - 48px min touch target per Practical UI */}
              <button
                onClick={closeModal}
                className="p-2.5 min-w-[48px] min-h-[48px] flex items-center justify-center text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={closeLabel}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-neutral-600 mb-6">
                {lang === 'es'
                  ? 'Complete el formulario a continuación y uno de nuestros especialistas se comunicará con usted dentro de las 24 horas.'
                  : 'Fill out the form below and one of our specialists will contact you within 24 hours.'}
              </p>

              <ContactForm lang={lang} formEndpoint={formEndpoint} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
