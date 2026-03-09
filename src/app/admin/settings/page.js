'use client';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {['General', 'Integrations', 'Paywall & Access', 'Email & Notifications', 'Security', 'API & Webhooks'].map(section => (
        <div key={section} className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
          <h3 className="text-sm font-bold text-ink-800 mb-4">{section}</h3>
          {section === 'General' && (
            <div className="space-y-3">
              <div><label className="text-xs text-ink-500 block mb-1">Site Name</label><input className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm" defaultValue="WVNews" /></div>
              <div><label className="text-xs text-ink-500 block mb-1">Site URL</label><input className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm" defaultValue="https://wvnews.com" /></div>
              <div><label className="text-xs text-ink-500 block mb-1">Time Zone</label><select className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm"><option>Eastern Time (ET)</option></select></div>
            </div>
          )}
          {section === 'Integrations' && (
            <div className="space-y-3">
              {[
                { name: 'Google Analytics 4', status: 'Connected', id: 'G-XXXXXXXXXX' },
                { name: 'Constant Contact', status: 'Connected', id: '62,400 contacts' },
                { name: 'Stripe', status: 'Connected', id: '3,240 subscribers' },
                { name: 'Google Drive', status: 'Connected', id: 'Newsroom Drive' },
                { name: 'Google Docs', status: 'Connected', id: 'Story Import' },
                { name: 'PrintManager', status: 'Pending Setup', id: 'API bridge' },
                { name: 'Google Search Console', status: 'Connected', id: '5 properties' },
              ].map(i => (
                <div key={i.name} className="flex items-center justify-between py-2 border-b border-ink-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-ink-800">{i.name}</div>
                    <div className="text-xs text-ink-500">{i.id}</div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${i.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{i.status}</span>
                </div>
              ))}
            </div>
          )}
          {section === 'Paywall & Access' && (
            <div className="space-y-3">
              <div><label className="text-xs text-ink-500 block mb-1">Free articles before registration wall</label><input type="number" className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm" defaultValue="3" /></div>
              <div><label className="text-xs text-ink-500 block mb-1">Free articles for registered users (metered)</label><input type="number" className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm" defaultValue="5" /></div>
              <div><label className="text-xs text-ink-500 block mb-1">Teaser word count before paywall</label><input type="number" className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm" defaultValue="200" /></div>
            </div>
          )}
          {section === 'Security' && (
            <div className="space-y-2 text-sm text-ink-600">
              <div className="flex items-center gap-2"><span className="text-green-500">✓</span> HTTPS enforced on all domains</div>
              <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Role-based access control enabled</div>
              <div className="flex items-center gap-2"><span className="text-green-500">✓</span> API rate limiting active</div>
              <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Automated backups: daily + point-in-time</div>
              <div className="flex items-center gap-2"><span className="text-green-500">✓</span> GDPR/CCPA compliance tools active</div>
            </div>
          )}
          {(section === 'Email & Notifications' || section === 'API & Webhooks') && (
            <p className="text-sm text-ink-500">Configuration panel for {section.toLowerCase()}. Connect your SendGrid, PagerDuty, and webhook endpoints here.</p>
          )}
        </div>
      ))}
    </div>
  );
}
