/**
 * Contact Form Component (React Island)
 * Accessible form with validation, submits to Formspree
 */

import { useState, type FormEvent } from 'react';

interface ContactFormProps {
  lang?: 'en' | 'es';
  formEndpoint?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
}

const translations = {
  en: {
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    message: 'Message',
    submit: 'Send Message',
    sending: 'Sending...',
    success: 'Thank you! We will be in touch soon.',
    error: 'Something went wrong. Please try again.',
    requiredLegend: '* Required fields',
    // Error messages follow Practical UI: What's wrong + How to fix
    requiredFirstName: 'Please enter your first name',
    requiredLastName: 'Please enter your last name',
    requiredEmail: 'Please enter your email address',
    requiredMessage: 'Please enter a message',
    invalidEmail: 'Please enter a valid email (e.g., name@example.com)',
    invalidPhone: 'Please enter a valid phone number (e.g., 555-123-4567)',
  },
  es: {
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    message: 'Mensaje',
    submit: 'Enviar Mensaje',
    sending: 'Enviando...',
    success: '¡Gracias! Nos pondremos en contacto pronto.',
    error: 'Algo salió mal. Por favor, inténtelo de nuevo.',
    requiredLegend: '* Campos requeridos',
    requiredFirstName: 'Por favor ingrese su nombre',
    requiredLastName: 'Por favor ingrese su apellido',
    requiredEmail: 'Por favor ingrese su correo electrónico',
    requiredMessage: 'Por favor ingrese un mensaje',
    invalidEmail: 'Por favor ingrese un correo válido (ej: nombre@ejemplo.com)',
    invalidPhone: 'Por favor ingrese un teléfono válido (ej: 555-123-4567)',
  },
};

export default function ContactForm({
  lang = 'en',
  formEndpoint = 'https://formspree.io/f/YOUR_FORM_ID',
}: ContactFormProps) {
  const t = translations[lang];

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Per Practical UI: Error messages explain what's wrong + how to fix
    if (!formData.firstName.trim()) {
      newErrors.firstName = t.requiredFirstName;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t.requiredLastName;
    }

    if (!formData.email.trim()) {
      newErrors.email = t.requiredEmail;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.invalidEmail;
    }

    if (formData.phone && !/^[\d\s\-+()]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t.invalidPhone;
    }

    if (!formData.message.trim()) {
      newErrors.message = t.requiredMessage;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch(formEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Required fields legend per Practical UI */}
      <p className="text-sm text-neutral-600">{t.requiredLegend}</p>

      {/* Success Message */}
      {submitStatus === 'success' && (
        <div
          className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg"
          role="alert"
        >
          {t.success}
        </div>
      )}

      {/* Error Message */}
      {submitStatus === 'error' && (
        <div
          className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg"
          role="alert"
        >
          {t.error}
        </div>
      )}

      {/* Name Fields - Related short fields can be multi-column per Practical UI */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-base font-bold text-neutral-700 mb-2"
          >
            {t.firstName} <span className="text-red-500">*</span>
          </label>
          {/* Input - 48px min touch target per Practical UI */}
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            className={`w-full px-4 min-h-[48px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.firstName ? 'border-red-500' : 'border-neutral-300'
            }`}
          />
          {errors.firstName && (
            <p id="firstName-error" className="mt-1 text-sm text-red-600">
              {errors.firstName}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-base font-bold text-neutral-700 mb-2"
          >
            {t.lastName} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            className={`w-full px-4 min-h-[48px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.lastName ? 'border-red-500' : 'border-neutral-300'
            }`}
          />
          {errors.lastName && (
            <p id="lastName-error" className="mt-1 text-sm text-red-600">
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-base font-bold text-neutral-700 mb-2"
        >
          {t.email} <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`w-full px-4 min-h-[48px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.email ? 'border-red-500' : 'border-neutral-300'
          }`}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      {/* Phone - Optional field marked per Practical UI */}
      <div>
        <label
          htmlFor="phone"
          className="block text-base font-bold text-neutral-700 mb-2"
        >
          {t.phone} <span className="text-neutral-500 font-normal">({lang === 'es' ? 'opcional' : 'optional'})</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
          className={`w-full px-4 min-h-[48px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.phone ? 'border-red-500' : 'border-neutral-300'
          }`}
        />
        {errors.phone && (
          <p id="phone-error" className="mt-1 text-sm text-red-600">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-base font-bold text-neutral-700 mb-2"
        >
          {t.message} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={formData.message}
          onChange={handleChange}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y ${
            errors.message ? 'border-red-500' : 'border-neutral-300'
          }`}
        />
        {errors.message && (
          <p id="message-error" className="mt-1 text-sm text-red-600">
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit Button - Primary style, 48px min touch target per Practical UI */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full md:w-auto px-8 min-h-[48px] text-base font-bold text-white bg-primary-500 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? t.sending : t.submit}
      </button>
    </form>
  );
}
