'use client';
import { sites } from '@/data/mock';

export default function SitesPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map(site => (
          <div key={site.id} className="bg-white rounded-xl p-5 shadow-sm border border-ink-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-display font-bold" style={{ background: site.color }}>
                {site.logo}
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-800">{site.name}</h3>
                <div className="text-xs text-ink-500">{site.domain}</div>
              </div>
              {site.primary && <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-gold-400 text-brand-950 rounded">Primary</span>}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 bg-ink-50 rounded text-center">
                <div className="text-xs text-ink-500">Stories</div>
                <div className="text-sm font-bold text-ink-900">{Math.floor(Math.random()*5000+1000)}</div>
              </div>
              <div className="p-2 bg-ink-50 rounded text-center">
                <div className="text-xs text-ink-500">Subscribers</div>
                <div className="text-sm font-bold text-ink-900">{Math.floor(Math.random()*2000+500)}</div>
              </div>
              <div className="p-2 bg-ink-50 rounded text-center">
                <div className="text-xs text-ink-500">Traffic</div>
                <div className="text-sm font-bold text-ink-900">{Math.floor(Math.random()*50+10)}K</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-2 py-1.5 text-xs bg-brand-50 text-brand-700 rounded hover:bg-brand-100">Settings</button>
              <button className="flex-1 px-2 py-1.5 text-xs bg-ink-50 text-ink-600 rounded hover:bg-ink-100">View Site</button>
            </div>
          </div>
        ))}
        <div className="bg-ink-50 rounded-xl p-5 border-2 border-dashed border-ink-200 flex items-center justify-center cursor-pointer hover:border-brand-400 transition-colors">
          <div className="text-center">
            <div className="text-2xl mb-1">+</div>
            <div className="text-sm font-medium text-ink-600">Add New Site</div>
          </div>
        </div>
      </div>
    </div>
  );
}
