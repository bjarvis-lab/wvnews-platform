'use client';
import { useState } from 'react';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const forms = {
  obituary: { title: 'Submit an Obituary', price: '$75', fields: [
    { label: 'Full Name of Deceased', type: 'text', required: true },
    { label: 'Date of Birth', type: 'date', required: true },
    { label: 'Date of Death', type: 'date', required: true },
    { label: 'City/Town', type: 'text', required: true },
    { label: 'Obituary Text', type: 'textarea', required: true },
    { label: 'Photo', type: 'file', required: false },
    { label: 'Your Name (Submitter)', type: 'text', required: true },
    { label: 'Your Email', type: 'email', required: true },
  ]},
  letter: { title: 'Letter to the Editor', fields: [
    { label: 'Your Full Name', type: 'text', required: true },
    { label: 'Your Email', type: 'email', required: true },
    { label: 'City/Town', type: 'text', required: true },
    { label: 'Subject', type: 'text', required: true },
    { label: 'Your Letter (500 words max)', type: 'textarea', required: true },
  ]},
  tip: { title: 'Send a News Tip', fields: [
    { label: 'Your Name (optional)', type: 'text', required: false },
    { label: 'Your Email or Phone', type: 'text', required: false },
    { label: 'What happened?', type: 'textarea', required: true },
    { label: 'Photos or Documents', type: 'file', required: false },
  ]},
  event: { title: 'Submit an Event', fields: [
    { label: 'Event Name', type: 'text', required: true },
    { label: 'Date', type: 'date', required: true },
    { label: 'Time', type: 'text', required: true },
    { label: 'Location', type: 'text', required: true },
    { label: 'Description', type: 'textarea', required: true },
    { label: 'Contact Email', type: 'email', required: true },
    { label: 'Event Image', type: 'file', required: false },
  ]},
  classified: { title: 'Place a Classified Ad', price: '$25', fields: [
    { label: 'Ad Category', type: 'select', options: ['For Sale', 'Help Wanted', 'Services', 'Real Estate', 'Vehicles', 'Other'], required: true },
    { label: 'Ad Text', type: 'textarea', required: true },
    { label: 'Your Name', type: 'text', required: true },
    { label: 'Contact Phone', type: 'text', required: true },
    { label: 'Contact Email', type: 'email', required: true },
    { label: 'Photo (optional)', type: 'file', required: false },
  ]},
  advertise: { title: 'Advertise With Us', fields: [
    { label: 'Business Name', type: 'text', required: true },
    { label: 'Contact Name', type: 'text', required: true },
    { label: 'Email', type: 'email', required: true },
    { label: 'Phone', type: 'text', required: true },
    { label: 'What are you interested in?', type: 'select', options: ['Display Ads', 'Sponsored Content', 'Print Ads', 'Package Deal', 'Other'], required: true },
    { label: 'Budget Range', type: 'select', options: ['Under $500', '$500 - $1,000', '$1,000 - $5,000', 'Over $5,000'], required: false },
    { label: 'Tell us about your goals', type: 'textarea', required: false },
  ]},
};

function SubmitFormContent() {
  const searchParams = useSearchParams();
  const formType = searchParams.get('form') || 'tip';
  const form = forms[formType] || forms.tip;
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen">
        <PublicHeader />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="font-display text-2xl font-bold text-ink-900 mb-2">Submission Received!</h1>
          <p className="text-ink-600">Thank you for your submission. Our team will review it shortly. You will receive a confirmation email.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-ink-900 mb-2">{form.title}</h1>
        {form.price && <p className="text-sm text-ink-500 mb-4">Submission fee: <strong>{form.price}</strong> (paid securely via Stripe)</p>}
        {!form.price && <p className="text-sm text-ink-500 mb-4">Free submission — no payment required.</p>}

        <div className="bg-white rounded-xl p-6 shadow-sm border border-ink-100 space-y-4">
          {form.fields.map((field, i) => (
            <div key={i}>
              <label className="text-sm font-medium text-ink-700 block mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm h-32 resize-none" />
              ) : field.type === 'select' ? (
                <select className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm">
                  <option>Select...</option>
                  {field.options?.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : field.type === 'file' ? (
                <div className="border-2 border-dashed border-ink-200 rounded-lg p-4 text-center text-sm text-ink-400 hover:border-brand-400 cursor-pointer">
                  Click to upload or drag & drop
                </div>
              ) : (
                <input type={field.type} className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm" />
              )}
            </div>
          ))}

          {/* reCAPTCHA placeholder */}
          <div className="bg-ink-50 rounded-lg p-3 flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5" />
            <span className="text-sm text-ink-600">I&apos;m not a robot</span>
            <span className="text-[10px] text-ink-400 ml-auto">reCAPTCHA</span>
          </div>

          <button onClick={() => setSubmitted(true)} className="w-full py-3 bg-brand-950 text-white text-sm font-bold rounded-lg hover:bg-brand-800 transition-colors">
            {form.price ? `Submit & Pay ${form.price}` : 'Submit'}
          </button>
        </div>

        {/* Other forms */}
        <div className="mt-8">
          <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider mb-3">Other Submission Forms</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(forms).filter(([k]) => k !== formType).map(([key, f]) => (
              <a key={key} href={`/submit?form=${key}`} className="px-3 py-2 bg-white border border-ink-200 rounded-lg text-sm text-ink-700 hover:bg-brand-50 hover:border-brand-200 transition-colors">
                {f.title} {f.price && <span className="text-ink-400">({f.price})</span>}
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-ink-500">Loading form...</div>}>
      <SubmitFormContent />
    </Suspense>
  );
}
