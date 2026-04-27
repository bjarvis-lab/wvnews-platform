'use client';
import { useState } from 'react';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';

const plans = [
  {
    key: 'registered',
    name: 'Registered Free',
    price: '$0',
    period: '',
    features: ['5 free articles/month', 'Daily newsletter', 'Breaking news alerts', 'Comment on stories'],
    available: true,
  },
  {
    key: 'all-access',
    name: 'Digital All-Access',
    price: '$9.99',
    period: '/month',
    features: ['Unlimited articles', 'All newsletters', 'Ad-light experience', 'Exclusive content', 'E-Edition access', 'Gift 5 articles/month'],
    available: false,
    featured: true,
  },
  {
    key: 'print-digital',
    name: 'Print + Digital',
    price: '$14.99',
    period: '/month',
    features: ['Everything in Digital', 'Daily print delivery', 'Sunday edition', 'Print subscriber deals', 'PrintManager sync'],
    available: false,
  },
  {
    key: 'e-edition-only',
    name: 'E-Edition Only',
    price: '$6.99',
    period: '/month',
    features: ['Digital newspaper replica', 'Page-flipper viewer', 'Searchable archive', 'PDF download', 'Mobile reader'],
    available: false,
  },
];

export default function SubscribePage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-ink-900 mb-3">Support Local Journalism</h1>
          <p className="text-lg text-ink-600 max-w-2xl mx-auto">Your subscription funds the reporters, photographers, and editors who cover West Virginia every single day.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 items-start">
          {plans.map(plan => <PlanCard key={plan.key} plan={plan} />)}
        </div>

        <div className="text-center text-xs text-ink-400">
          <p>Free registration unlocks 5 premium articles per month plus daily newsletters. Paid plans launch alongside Stripe billing — drop your email above and we&apos;ll let you know when they&apos;re live.</p>
          <p className="mt-1">Questions? Contact us at subscriptions@wvnews.com or call (304) 626-1400.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function PlanCard({ plan }) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [message, setMessage] = useState('');

  const titleColor = plan.featured ? 'text-white' : 'text-ink-900';
  const subColor = plan.featured ? 'text-white/60' : 'text-ink-500';
  const bullet = plan.featured ? 'text-gold-400' : 'text-green-500';
  const cardClass = plan.featured
    ? 'bg-brand-950 text-white ring-2 ring-gold-400 shadow-xl'
    : 'bg-white border border-ink-200 shadow-sm';

  async function submit(e) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, plan: plan.key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setStatus('sent');
      setMessage(data.message || 'Check your inbox for a sign-in link.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  return (
    <div className={`rounded-xl p-5 ${cardClass}`}>
      {plan.featured && <div className="text-[10px] font-bold uppercase tracking-widest text-gold-400 mb-2">Most Popular</div>}
      <h3 className={`font-display text-lg font-bold ${titleColor}`}>{plan.name}</h3>
      <div className="my-3">
        <span className={`text-3xl font-bold ${titleColor}`}>{plan.price}</span>
        <span className={`text-sm ${subColor}`}>{plan.period}</span>
      </div>
      <ul className="space-y-2 mb-5">
        {plan.features.map(f => (
          <li key={f} className={`text-sm flex items-start gap-2 ${plan.featured ? 'text-white/80' : 'text-ink-600'}`}>
            <span className={bullet}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      {!plan.available ? (
        <div className={`text-center text-xs font-semibold py-2 rounded-lg ${plan.featured ? 'bg-white/10 text-white/70' : 'bg-ink-100 text-ink-500'}`}>
          Coming soon — Stripe billing in progress
        </div>
      ) : status === 'sent' ? (
        <div className={`text-xs text-center font-semibold rounded-lg py-3 ${plan.featured ? 'bg-white/10 text-white' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message}
        </div>
      ) : !showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors ${
            plan.featured
              ? 'bg-gold-500 text-brand-950 hover:bg-gold-400'
              : 'bg-brand-950 text-white hover:bg-brand-800'
          }`}
        >
          Register Free
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-2">
          <input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded border border-ink-200 outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded border border-ink-200 outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${
              plan.featured ? 'bg-gold-500 text-brand-950 hover:bg-gold-400' : 'bg-brand-950 text-white hover:bg-brand-800'
            } disabled:opacity-60`}
          >
            {status === 'sending' ? 'Sending sign-in link…' : 'Send my sign-in link'}
          </button>
          {status === 'error' && (
            <p className="text-xs text-red-600 mt-1">{message}</p>
          )}
          <p className="text-[10px] text-center text-ink-400">We&apos;ll email you a one-click sign-in link.</p>
        </form>
      )}
    </div>
  );
}
