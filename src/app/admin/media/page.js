'use client';
import { useState } from 'react';

const mockAssets = Array.from({ length: 18 }, (_, i) => ({
  id: `asset-${i+1}`,
  name: `IMG_${(2024 + Math.floor(i/6)).toString()}_${String(i*137+42).padStart(4, '0')}.jpg`,
  type: i % 5 === 0 ? 'video' : 'image',
  size: `${(Math.random() * 4 + 0.5).toFixed(1)} MB`,
  dimensions: `${1200 + Math.floor(Math.random()*800)}×${800 + Math.floor(Math.random()*400)}`,
  uploaded: `Mar ${9 - Math.floor(i/3)}, 2026`,
  usedIn: Math.floor(Math.random() * 5) + 1,
  tags: ['news', 'wv', 'local'][i % 3],
  altText: i % 2 === 0 ? 'AI-generated alt text available' : 'No alt text',
}));

export default function MediaPage() {
  const [view, setView] = useState('grid');
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <input type="text" placeholder="Search assets by keyword, tag, or filename..." className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-ink-200 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <select className="px-3 py-2 bg-white rounded-lg border border-ink-200 text-sm"><option>All Types</option><option>Images</option><option>Videos</option><option>Documents</option></select>
        <select className="px-3 py-2 bg-white rounded-lg border border-ink-200 text-sm"><option>All Sites</option><option>WVNews</option><option>Exponent</option></select>
        <div className="flex bg-white rounded-lg border border-ink-200 overflow-hidden">
          <button onClick={() => setView('grid')} className={`px-3 py-2 text-xs font-medium ${view === 'grid' ? 'bg-brand-50 text-brand-700' : 'text-ink-500'}`}>Grid</button>
          <button onClick={() => setView('list')} className={`px-3 py-2 text-xs font-medium ${view === 'list' ? 'bg-brand-50 text-brand-700' : 'text-ink-500'}`}>List</button>
        </div>
        <button className="px-3 py-2 bg-white text-ink-600 text-sm rounded-lg border border-ink-200 hover:bg-ink-50">Import from Google Drive</button>
        <button className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-600">Upload Files</button>
      </div>

      {/* Storage stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: '124,567' },
          { label: 'Storage Used', value: '287 GB' },
          { label: 'Monthly Cost', value: '$6.60' },
          { label: 'Avg. per Asset', value: '$0.00005' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg p-3 shadow-sm border border-ink-100">
            <div className="text-xs text-ink-500">{s.label}</div>
            <div className="text-lg font-bold text-ink-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {mockAssets.map(asset => (
          <div
            key={asset.id}
            onClick={() => setSelected(asset)}
            className={`group bg-white rounded-lg border overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${selected?.id === asset.id ? 'border-brand-500 ring-2 ring-brand-200' : 'border-ink-100'}`}
          >
            <div className={`aspect-square ${asset.type === 'video' ? 'bg-ink-800' : 'bg-ink-200'} relative`}>
              {asset.type === 'video' && <div className="absolute inset-0 flex items-center justify-center"><span className="text-3xl">▶</span></div>}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <input type="checkbox" className="rounded" />
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] font-medium text-ink-700 truncate">{asset.name}</div>
              <div className="text-[10px] text-ink-400">{asset.size} · {asset.uploaded}</div>
            </div>
          </div>
        ))}
      </div>

      {/* AI features callout */}
      <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
        <div className="flex items-center gap-2 mb-2">
          <span>🤖</span>
          <h3 className="text-sm font-bold text-brand-800">AI Media Tools</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button className="px-3 py-2 bg-white text-sm text-brand-700 rounded-lg border border-brand-200 hover:bg-brand-50">Auto-Generate Alt Text</button>
          <button className="px-3 py-2 bg-white text-sm text-brand-700 rounded-lg border border-brand-200 hover:bg-brand-50">Detect Duplicate Images</button>
          <button className="px-3 py-2 bg-white text-sm text-brand-700 rounded-lg border border-brand-200 hover:bg-brand-50">Bulk Auto-Tag</button>
          <button className="px-3 py-2 bg-white text-sm text-brand-700 rounded-lg border border-brand-200 hover:bg-brand-50">Face Detection for Captions</button>
        </div>
      </div>
    </div>
  );
}
