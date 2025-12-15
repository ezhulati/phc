/**
 * UI translations for static strings
 */

export const languages = {
  en: 'English',
  es: 'Español',
};

export const defaultLang = 'en';

export const ui = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.abaTherapy': 'ABA Therapy',
    'nav.services': 'Services',
    'nav.careers': 'Careers',
    'nav.contact': 'Contact',
    'nav.schedule': 'Schedule a Consultation',

    // Common
    'common.readMore': 'Read More',
    'common.learnMore': 'Learn More',
    'common.viewAll': 'View All',
    'common.backTo': 'Back to',
    'common.close': 'Close',
    'common.menu': 'Menu',
    'common.search': 'Search',

    // Blog
    'blog.author': 'By',
    'blog.published': 'Published',
    'blog.updated': 'Updated',
    'blog.minRead': 'min read',
    'blog.relatedPosts': 'Related Articles',
    'blog.categories': 'Categories',
    'blog.tags': 'Tags',
    'blog.shareArticle': 'Share this article',
    'blog.tableOfContents': 'Table of Contents',

    // Locations
    'location.servicesIn': 'ABA Therapy Services in',
    'location.nearbyAreas': 'Nearby Service Areas',
    'location.insuranceAccepted': 'Insurance Accepted',
    'location.faqs': 'Frequently Asked Questions',
    'location.getStarted': 'Get Started Today',

    // Forms
    'form.firstName': 'First Name',
    'form.lastName': 'Last Name',
    'form.email': 'Email',
    'form.phone': 'Phone',
    'form.message': 'Message',
    'form.submit': 'Submit',
    'form.sending': 'Sending...',
    'form.success': 'Thank you! We will be in touch soon.',
    'form.error': 'Something went wrong. Please try again.',
    'form.required': 'Required',
    'form.invalidEmail': 'Please enter a valid email address',

    // Footer
    'footer.copyright': '© {year} Prospera Healthcare. All rights reserved.',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms & Conditions',

    // 404
    '404.title': 'Page Not Found',
    '404.message': 'The page you are looking for does not exist.',
    '404.backHome': 'Back to Home',

    // Accessibility
    'a11y.skipToContent': 'Skip to content',
    'a11y.openMenu': 'Open menu',
    'a11y.closeMenu': 'Close menu',
    'a11y.switchLanguage': 'Switch language',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.about': 'Acerca de',
    'nav.abaTherapy': 'Terapia ABA',
    'nav.services': 'Servicios',
    'nav.careers': 'Carreras',
    'nav.contact': 'Contacto',
    'nav.schedule': 'Programar una Consulta',

    // Common
    'common.readMore': 'Leer Más',
    'common.learnMore': 'Más Información',
    'common.viewAll': 'Ver Todo',
    'common.backTo': 'Volver a',
    'common.close': 'Cerrar',
    'common.menu': 'Menú',
    'common.search': 'Buscar',

    // Blog
    'blog.author': 'Por',
    'blog.published': 'Publicado',
    'blog.updated': 'Actualizado',
    'blog.minRead': 'min de lectura',
    'blog.relatedPosts': 'Artículos Relacionados',
    'blog.categories': 'Categorías',
    'blog.tags': 'Etiquetas',
    'blog.shareArticle': 'Compartir este artículo',
    'blog.tableOfContents': 'Tabla de Contenidos',

    // Locations
    'location.servicesIn': 'Servicios de Terapia ABA en',
    'location.nearbyAreas': 'Áreas de Servicio Cercanas',
    'location.insuranceAccepted': 'Seguros Aceptados',
    'location.faqs': 'Preguntas Frecuentes',
    'location.getStarted': 'Comience Hoy',

    // Forms
    'form.firstName': 'Nombre',
    'form.lastName': 'Apellido',
    'form.email': 'Correo Electrónico',
    'form.phone': 'Teléfono',
    'form.message': 'Mensaje',
    'form.submit': 'Enviar',
    'form.sending': 'Enviando...',
    'form.success': '¡Gracias! Nos pondremos en contacto pronto.',
    'form.error': 'Algo salió mal. Por favor, inténtelo de nuevo.',
    'form.required': 'Requerido',
    'form.invalidEmail': 'Por favor ingrese un correo electrónico válido',

    // Footer
    'footer.copyright': '© {year} Prospera Healthcare. Todos los derechos reservados.',
    'footer.privacy': 'Política de Privacidad',
    'footer.terms': 'Términos y Condiciones',

    // 404
    '404.title': 'Página No Encontrada',
    '404.message': 'La página que busca no existe.',
    '404.backHome': 'Volver al Inicio',

    // Accessibility
    'a11y.skipToContent': 'Saltar al contenido',
    'a11y.openMenu': 'Abrir menú',
    'a11y.closeMenu': 'Cerrar menú',
    'a11y.switchLanguage': 'Cambiar idioma',
  },
} as const;

export type UIKeys = keyof typeof ui.en;

/**
 * Get translation for a key
 */
export function t(lang: keyof typeof ui, key: UIKeys, params?: Record<string, string | number>): string {
  let text = ui[lang][key] || ui.en[key] || key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }

  return text;
}

/**
 * Get language from URL
 */
export function getLangFromUrl(url: URL): keyof typeof ui {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}
