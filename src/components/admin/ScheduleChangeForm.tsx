import { useState } from 'react';

interface FormData {
  technician: string;
  client: string;
  bcba: string;
  date: string;
  cancellationDetails: string;
  whoCancelled: string;
  reason: string;
  makeupScheduled: string;
  makeupDetails: string;
  additionalDetails: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function ScheduleChangeForm() {
  const [formData, setFormData] = useState<FormData>({
    technician: '',
    client: '',
    bcba: '',
    date: '',
    cancellationDetails: '',
    whoCancelled: '',
    reason: '',
    makeupScheduled: '',
    makeupDetails: '',
    additionalDetails: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const whoCancelledOptions = [
    { value: '', label: 'Select...' },
    { value: 'technician', label: 'Technician' },
    { value: 'client', label: 'Client/Family' },
    { value: 'bcba', label: 'BCBA' },
    { value: 'company', label: 'Company' },
    { value: 'other', label: 'Other' },
  ];

  const makeupOptions = [
    { value: '', label: 'Select...' },
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'pending', label: 'Pending/TBD' },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.technician.trim()) {
      newErrors.technician = 'Technician name is required';
    }
    if (!formData.client.trim()) {
      newErrors.client = 'Client initials are required';
    }
    if (!formData.bcba.trim()) {
      newErrors.bcba = 'BCBA name is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.cancellationDetails.trim()) {
      newErrors.cancellationDetails = 'Cancellation/adjustment details are required';
    }
    if (!formData.whoCancelled) {
      newErrors.whoCancelled = 'Please select who cancelled/changed the session';
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }
    if (!formData.makeupScheduled) {
      newErrors.makeupScheduled = 'Please select if make-up sessions are scheduled';
    }
    if (!formData.makeupDetails.trim()) {
      newErrors.makeupDetails = 'Make-up session details are required (enter N/A if not applicable)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Submit to Formspree or your preferred form handler
      const response = await fetch('https://formspree.io/f/xzzzzzzz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          _subject: `Schedule Change Request - ${formData.technician}`,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          technician: '',
          client: '',
          bcba: '',
          date: '',
          cancellationDetails: '',
          whoCancelled: '',
          reason: '',
          makeupScheduled: '',
          makeupDetails: '',
          additionalDetails: '',
        });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = (hasError: boolean) =>
    `w-full min-h-[48px] px-4 py-3 text-base border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
      hasError
        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
        : 'border-neutral-300 hover:border-neutral-400'
    }`;

  const labelClasses = 'block text-sm font-medium text-neutral-700 mb-2';
  const errorClasses = 'mt-1 text-sm text-red-600';

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Success Message */}
      {submitStatus === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">Schedule change request submitted successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {submitStatus === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">There was an error submitting your request. Please try again.</p>
        </div>
      )}

      {/* Technician */}
      <div>
        <label htmlFor="technician" className={labelClasses}>
          Technician <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="technician"
          name="technician"
          value={formData.technician}
          onChange={handleChange}
          placeholder="Enter technician full name"
          className={inputClasses(!!errors.technician)}
          aria-invalid={!!errors.technician}
          aria-describedby={errors.technician ? 'technician-error' : undefined}
        />
        {errors.technician && (
          <p id="technician-error" className={errorClasses}>{errors.technician}</p>
        )}
      </div>

      {/* Client */}
      <div>
        <label htmlFor="client" className={labelClasses}>
          Client <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="client"
          name="client"
          value={formData.client}
          onChange={handleChange}
          placeholder="Enter client initials"
          className={inputClasses(!!errors.client)}
          aria-invalid={!!errors.client}
          aria-describedby={errors.client ? 'client-error' : undefined}
        />
        {errors.client && (
          <p id="client-error" className={errorClasses}>{errors.client}</p>
        )}
      </div>

      {/* BCBA */}
      <div>
        <label htmlFor="bcba" className={labelClasses}>
          BCBA <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="bcba"
          name="bcba"
          value={formData.bcba}
          onChange={handleChange}
          placeholder="Enter BCBA full name"
          className={inputClasses(!!errors.bcba)}
          aria-invalid={!!errors.bcba}
          aria-describedby={errors.bcba ? 'bcba-error' : undefined}
        />
        {errors.bcba && (
          <p id="bcba-error" className={errorClasses}>{errors.bcba}</p>
        )}
      </div>

      {/* Today's Date */}
      <div>
        <label htmlFor="date" className={labelClasses}>
          Today's date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className={inputClasses(!!errors.date)}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? 'date-error' : undefined}
        />
        {errors.date && (
          <p id="date-error" className={errorClasses}>{errors.date}</p>
        )}
      </div>

      {/* Cancellation and/or adjustment */}
      <div>
        <label htmlFor="cancellationDetails" className={labelClasses}>
          Cancellation and/or adjustment <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="cancellationDetails"
          name="cancellationDetails"
          value={formData.cancellationDetails}
          onChange={handleChange}
          placeholder="Example - Cancel 12/19/22 8pm or Adjust time for 12/19/22 from 8am to 3pm"
          className={inputClasses(!!errors.cancellationDetails)}
          aria-invalid={!!errors.cancellationDetails}
          aria-describedby={errors.cancellationDetails ? 'cancellationDetails-error' : undefined}
        />
        {errors.cancellationDetails && (
          <p id="cancellationDetails-error" className={errorClasses}>{errors.cancellationDetails}</p>
        )}
      </div>

      {/* Who cancelled/changed */}
      <div>
        <label htmlFor="whoCancelled" className={labelClasses}>
          Who cancelled/changed the session(s)? <span className="text-red-500">*</span>
        </label>
        <select
          id="whoCancelled"
          name="whoCancelled"
          value={formData.whoCancelled}
          onChange={handleChange}
          className={inputClasses(!!errors.whoCancelled)}
          aria-invalid={!!errors.whoCancelled}
          aria-describedby={errors.whoCancelled ? 'whoCancelled-error' : undefined}
        >
          {whoCancelledOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.whoCancelled && (
          <p id="whoCancelled-error" className={errorClasses}>{errors.whoCancelled}</p>
        )}
      </div>

      {/* Reason */}
      <div>
        <label htmlFor="reason" className={labelClasses}>
          Reason for cancellation and/or adjustment <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          placeholder="Example - Technician is ill, Client has Doctor's Appointment, Client Vacation, etc."
          className={inputClasses(!!errors.reason)}
          aria-invalid={!!errors.reason}
          aria-describedby={errors.reason ? 'reason-error' : undefined}
        />
        {errors.reason && (
          <p id="reason-error" className={errorClasses}>{errors.reason}</p>
        )}
      </div>

      {/* Make-up scheduled */}
      <div>
        <label htmlFor="makeupScheduled" className={labelClasses}>
          If your session was cancelled/adjusted, is/are there make-up session(s) scheduled? <span className="text-red-500">*</span>
        </label>
        <select
          id="makeupScheduled"
          name="makeupScheduled"
          value={formData.makeupScheduled}
          onChange={handleChange}
          className={inputClasses(!!errors.makeupScheduled)}
          aria-invalid={!!errors.makeupScheduled}
          aria-describedby={errors.makeupScheduled ? 'makeupScheduled-error' : undefined}
        >
          {makeupOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.makeupScheduled && (
          <p id="makeupScheduled-error" className={errorClasses}>{errors.makeupScheduled}</p>
        )}
      </div>

      {/* Make-up details */}
      <div>
        <label htmlFor="makeupDetails" className={labelClasses}>
          When is/are the make-up session(s) scheduled? <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="makeupDetails"
          name="makeupDetails"
          value={formData.makeupDetails}
          onChange={handleChange}
          placeholder="Example: Session changes: 12/3-12/7 extend end time by 1 hour; add 1/10 8am-12pm; N/A if not rescheduled."
          className={inputClasses(!!errors.makeupDetails)}
          aria-invalid={!!errors.makeupDetails}
          aria-describedby={errors.makeupDetails ? 'makeupDetails-error' : undefined}
        />
        {errors.makeupDetails && (
          <p id="makeupDetails-error" className={errorClasses}>{errors.makeupDetails}</p>
        )}
      </div>

      {/* Additional details */}
      <div>
        <label htmlFor="additionalDetails" className={labelClasses}>
          Additional details <span className="text-neutral-400">(optional)</span>
        </label>
        <textarea
          id="additionalDetails"
          name="additionalDetails"
          value={formData.additionalDetails}
          onChange={handleChange}
          placeholder="Any other relevant information..."
          rows={4}
          className={`${inputClasses(false)} resize-y`}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-[48px] px-6 py-3 text-base font-semibold text-white bg-primary-500 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
