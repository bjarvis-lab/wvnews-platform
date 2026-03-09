'use client';
import PublicHeader from '@/components/public/Header';
import Footer from '@/components/public/Footer';

const plans = [
  { name: 'Registered Free', price: '$0', period: '', features: ['5 free articles/month', 'Daily newsletter', 'Breaking news alerts', 'Comment on stories'], cta: 'Register Free', featured: false },
  { name: 'Digital All-Access', price: '$9.99', period: '/month', features: ['Unlimited articles', 'All newsletters', 'Ad-light experience', 'Exclusive content', 'E-Edition access', 'Gift 5 articles/month'], cta: 'Start Free Trial', featured: true },
  { name: 'Print + Digital', price: '$14.99', period: '/month', features: ['Everything in Digital', 'Daily print delivery', 'Sunday edition', 'Print subscriber deals', 'PrintManager sync'], cta: 'Subscribe', featured: false },
  { name: 'E-Edition Only', price: '$6.99', period: '/month', features: ['Digital newspaper replica', 'Page-flipper viewer', 'Searchable archive', 'PDF download', 'Mobile reader'], cta: 'Start Reading', featured: false },
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {plans.map(plan => (
            <div key={plan.name} className={`rounded-xl p-5 ${plan.featured ? 'bg-brand-950 text-white ring-2 ring-gold-400 shadow-xl' : 'bg-white border border-ink-200 shadow-sm'}`}>
              {plan.featured && <div className="text-[10px] font-bold uppercase tracking-widest text-gold-400 mb-2">Most Popular</div>}
              <h3 className={`font-display text-lg font-bold ${plan.featured ? 'text-white' : 'text-ink-900'}`}>{plan.name}</h3>
              <div className="my-3">
                <span className={`text-3xl font-bold ${plan.featured ? 'text-white' : 'text-ink-900'}`}>{plan.price}</span>
                <span className={`text-sm ${plan.featured ? 'text-white/60' : 'text-ink-500'}`}>{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map(f => (
                  <li key={f} className={`text-sm flex items-start gap-2 ${plan.featured ? 'text-white/80' : 'text-ink-600'}`}>
                    <span className={plan.featured ? 'text-gold-400' : 'text-green-500'}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors ${
                plan.featured
                  ? 'bg-gold-500 text-brand-950 hover:bg-gold-400'
                  : 'bg-brand-950 text-white hover:bg-brand-800'
              }`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Payment security */}
        <div className="text-center text-xs text-ink-400">
          <p>Secure payments powered by Stripe. Cancel anytime. All subscriptions include a 7-day free trial.</p>
          <p className="mt-1">Questions? Contact us at subscriptions@wvnews.com or call (304) 626-1400.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
