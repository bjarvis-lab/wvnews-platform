'use client';
import { useState, useCallback, useRef } from 'react';
import { stories, sections, sites } from '@/data/mock';

// ─── MODULE TYPES (what editors can drag onto the page) ───
const MODULE_TYPES = {
  HERO_STORY: { id: 'hero', label: 'Hero Story', icon: '📰', color: '#1e3a5f', desc: 'Large featured story with image' },
  STORY_GRID: { id: 'grid', label: 'Story Grid', icon: '⊞', color: '#4c6ef5', desc: '2-4 stories in a grid row' },
  STORY_LIST: { id: 'list', label: 'Story List', icon: '☰', color: '#5c7cfa', desc: 'Vertical list of stories' },
  BREAKING_BAR: { id: 'breaking', label: 'Breaking Banner', icon: '🔴', color: '#c0392b', desc: 'Breaking news alert bar' },
  AD_ZONE: { id: 'ad', label: 'Ad Zone', icon: '💰', color: '#f59f00', desc: 'Google Ad Manager zone' },
  NEWSLETTER: { id: 'newsletter', label: 'Newsletter Signup', icon: '✉️', color: '#2d6a4f', desc: 'Email capture widget' },
  WEATHER: { id: 'weather', label: 'Weather', icon: '🌤️', color: '#74c0fc', desc: 'Local weather widget' },
  MOST_READ: { id: 'mostread', label: 'Most Read', icon: '🔥', color: '#e03131', desc: 'Top stories by traffic' },
  SECTION_HEADER: { id: 'section', label: 'Section Block', icon: '📁', color: '#7b2d8b', desc: 'Stories from a specific section' },
  SOCIAL_FEED: { id: 'social', label: 'Social Feed', icon: '📱', color: '#1877F2', desc: 'Embedded social posts' },
  E_EDITION: { id: 'eedition', label: 'E-Edition Promo', icon: '📰', color: '#343a40', desc: 'E-Edition preview card' },
  VIDEO_BLOCK: { id: 'video', label: 'Video Feature', icon: '🎥', color: '#e64980', desc: 'Featured video player' },
  CUSTOM_HTML: { id: 'html', label: 'Custom Block', icon: '🧩', color: '#868e96', desc: 'Custom embed or HTML' },
  OPINION_BLOCK: { id: 'opinion', label: 'Opinion/Editorial', icon: '💬', color: '#d4a843', desc: 'Opinion section block' },
  CLASSIFIEDS: { id: 'classifieds', label: 'Classifieds', icon: '📋', color: '#495057', desc: 'Classified ad listings' },
  SUBMISSION_CTA: { id: 'submit', label: 'Submit CTA', icon: '📝', color: '#2d6a4f', desc: 'Reader submission call-to-action' },
};

// ─── Initial layout (what the homepage looks like by default) ───
const DEFAULT_LAYOUT = [
  { id: 'mod-1', type: 'breaking', config: { enabled: true }, zone: 'full' },
  { id: 'mod-2', type: 'hero', config: { storyId: '5', autoRotate: false }, zone: 'main' },
  { id: 'mod-3', type: 'grid', config: { count: 3, section: 'all', showImages: true }, zone: 'main' },
  { id: 'mod-4', type: 'weather', config: { zip: '26301' }, zone: 'sidebar' },
  { id: 'mod-5', type: 'newsletter', config: { listId: 'daily-digest' }, zone: 'sidebar' },
  { id: 'mod-6', type: 'ad', config: { slot: 'leaderboard', size: '728x90', gamId: '/12345/homepage_top' }, zone: 'full' },
  { id: 'mod-7', type: 'section', config: { sectionId: 'sports', count: 4, layout: 'grid' }, zone: 'main' },
  { id: 'mod-8', type: 'mostread', config: { count: 5, period: '24h' }, zone: 'sidebar' },
  { id: 'mod-9', type: 'ad', config: { slot: 'sidebar-1', size: '300x250', gamId: '/12345/homepage_sidebar1' }, zone: 'sidebar' },
  { id: 'mod-10', type: 'section', config: { sectionId: 'opinion', count: 3, layout: 'list' }, zone: 'main' },
  { id: 'mod-11', type: 'eedition', config: {}, zone: 'sidebar' },
  { id: 'mod-12', type: 'ad', config: { slot: 'mid-content', size: '728x90', gamId: '/12345/homepage_mid' }, zone: 'full' },
  { id: 'mod-13', type: 'section', config: { sectionId: 'community', count: 4, layout: 'grid' }, zone: 'main' },
  { id: 'mod-14', type: 'submit', config: { forms: ['obituary', 'letter', 'tip', 'event'] }, zone: 'sidebar' },
  { id: 'mod-15', type: 'social', config: { platform: 'facebook' }, zone: 'sidebar' },
];

// ─── Module Preview Component ───
function ModulePreview({ mod, isSelected, onSelect, onMoveUp, onMoveDown, onDelete, isFirst, isLast }) {
  const typeInfo = Object.values(MODULE_TYPES).find(t => t.id === mod.type);
  const zoneLabel = mod.zone === 'full' ? 'Full Width' : mod.zone === 'main' ? 'Main Column' : 'Sidebar';

  return (
    <div
      onClick={() => onSelect(mod.id)}
      className={`group relative rounded-lg border-2 p-3 cursor-pointer transition-all ${
        isSelected
          ? 'border-brand-500 bg-brand-50 shadow-md ring-2 ring-brand-200'
          : 'border-ink-200 bg-white hover:border-ink-300 hover:shadow-sm'
      }`}
    >
      {/* Drag handle */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-ink-300">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
        </svg>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
          style={{ background: typeInfo?.color || '#868e96' }}>
          {typeInfo?.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-ink-800">{typeInfo?.label || mod.type}</div>
          <div className="text-[10px] text-ink-500 truncate">
            {mod.type === 'ad' && `GAM: ${mod.config.gamId || 'Not set'} · ${mod.config.size}`}
            {mod.type === 'section' && `${sections.find(s => s.id === mod.config.sectionId)?.name || 'Section'} · ${mod.config.count} stories`}
            {mod.type === 'hero' && `Story: ${stories.find(s => s.id === mod.config.storyId)?.headline?.substring(0, 40) || 'Auto-select'}...`}
            {mod.type === 'grid' && `${mod.config.count} stories · ${mod.config.section === 'all' ? 'All sections' : mod.config.section}`}
            {mod.type === 'newsletter' && 'Daily Digest signup'}
            {mod.type === 'mostread' && `Top ${mod.config.count} · Last ${mod.config.period}`}
            {mod.type === 'weather' && `ZIP: ${mod.config.zip}`}
            {mod.type === 'breaking' && 'Auto from breaking stories'}
            {mod.type === 'eedition' && 'Today\'s edition preview'}
            {mod.type === 'submit' && `${mod.config.forms?.length || 0} forms linked`}
            {mod.type === 'social' && mod.config.platform}
          </div>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-ink-100 text-ink-500 font-medium uppercase tracking-wider flex-shrink-0">
          {zoneLabel}
        </span>
      </div>

      {/* Action buttons */}
      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isFirst && (
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(mod.id); }}
            className="w-6 h-6 rounded bg-ink-100 hover:bg-ink-200 flex items-center justify-center text-ink-500 text-xs">↑</button>
        )}
        {!isLast && (
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(mod.id); }}
            className="w-6 h-6 rounded bg-ink-100 hover:bg-ink-200 flex items-center justify-center text-ink-500 text-xs">↓</button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onDelete(mod.id); }}
          className="w-6 h-6 rounded bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-500 text-xs">✕</button>
      </div>
    </div>
  );
}

// ─── Visual Preview of Layout ───
function LayoutVisualPreview({ layout }) {
  const mainMods = layout.filter(m => m.zone === 'main');
  const sidebarMods = layout.filter(m => m.zone === 'sidebar');
  const fullMods = layout.filter(m => m.zone === 'full');

  const renderMiniBlock = (mod, i) => {
    const typeInfo = Object.values(MODULE_TYPES).find(t => t.id === mod.type);
    const heights = { hero: 'h-20', grid: 'h-14', list: 'h-16', ad: 'h-8', section: 'h-14', breaking: 'h-5', newsletter: 'h-10', weather: 'h-8', mostread: 'h-14', eedition: 'h-10', social: 'h-10', video: 'h-16', submit: 'h-10', opinion: 'h-12', classifieds: 'h-8', html: 'h-10' };
    return (
      <div key={mod.id} className={`${heights[mod.type] || 'h-8'} rounded flex items-center justify-center text-[8px] text-white font-bold`}
        style={{ background: typeInfo?.color || '#adb5bd' }}>
        {typeInfo?.icon} {typeInfo?.label}
      </div>
    );
  };

  return (
    <div className="bg-ink-100 rounded-xl p-3 space-y-1">
      <div className="text-[10px] font-bold text-ink-500 uppercase tracking-wider text-center mb-2">Live Preview</div>
      {/* Full-width blocks interspersed */}
      {layout.filter(m => m.zone === 'full').slice(0, 1).map(renderMiniBlock)}

      {/* Hero + top */}
      {layout.filter(m => m.zone === 'main').slice(0, 1).map(renderMiniBlock)}

      {/* Main + Sidebar grid */}
      <div className="grid grid-cols-3 gap-1">
        <div className="col-span-2 space-y-1">
          {mainMods.slice(1).map(renderMiniBlock)}
          {fullMods.slice(1).map(renderMiniBlock)}
        </div>
        <div className="space-y-1">
          {sidebarMods.map(renderMiniBlock)}
        </div>
      </div>
    </div>
  );
}

// ─── Module Config Panel ───
function ModuleConfig({ mod, onUpdate }) {
  if (!mod) return (
    <div className="flex items-center justify-center h-full text-ink-400 text-sm">
      Select a module to configure
    </div>
  );

  const typeInfo = Object.values(MODULE_TYPES).find(t => t.id === mod.type);

  const updateConfig = (key, value) => {
    onUpdate(mod.id, { ...mod.config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-ink-200">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
          style={{ background: typeInfo?.color }}>
          {typeInfo?.icon}
        </div>
        <div>
          <div className="text-sm font-bold text-ink-800">{typeInfo?.label}</div>
          <div className="text-[10px] text-ink-500">{typeInfo?.desc}</div>
        </div>
      </div>

      {/* Zone selector */}
      <div>
        <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Display Zone</label>
        <select value={mod.zone} onChange={(e) => onUpdate(mod.id, mod.config, e.target.value)}
          className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs">
          <option value="full">Full Width</option>
          <option value="main">Main Column (2/3)</option>
          <option value="sidebar">Sidebar (1/3)</option>
        </select>
      </div>

      {/* Type-specific config */}
      {mod.type === 'hero' && (
        <>
          <div>
            <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Story</label>
            <select value={mod.config.storyId || ''} onChange={e => updateConfig('storyId', e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs">
              <option value="">Auto-select (latest featured)</option>
              {stories.map(s => <option key={s.id} value={s.id}>{s.headline.substring(0, 60)}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-700">
            <input type="checkbox" checked={mod.config.autoRotate || false} onChange={e => updateConfig('autoRotate', e.target.checked)} />
            Auto-rotate hero every 30 seconds
          </label>
        </>
      )}

      {mod.type === 'grid' && (
        <>
          <div>
            <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Number of Stories</label>
            <select value={mod.config.count} onChange={e => updateConfig('count', parseInt(e.target.value))}
              className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs">
              {[2,3,4].map(n => <option key={n} value={n}>{n} stories</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Section Filter</label>
            <select value={mod.config.section || 'all'} onChange={e => updateConfig('section', e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs">
              <option value="all">All Sections</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-700">
            <input type="checkbox" checked={mod.config.showImages !== false} onChange={e => updateConfig('showImages', e.target.checked)} />
            Show thumbnail images
          </label>
        </>
      )}

      {mod.type === 'section' && (
        <>
          <div>
            <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Section</label>
            <select value={mod.config.sectionId || ''} onChange={e => updateConfig('sectionId', e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs">
              {sections.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Stories to Show</label>
            <select value={mod.config.count} onChange={e => updateConfig('count', parseInt(e.target.value))}
              className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs">
              {[3,4,5,6,8].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Layout</label>
            <select value={mod.config.layout || 'grid'} onChange={e => updateConfig('layout', e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs">
              <option value="grid">Grid (with images)</option>
              <option value="list">List (headlines only)</option>
              <option value="featured">1 large + 3 small</option>
            </select>
          </div>
        </>
      )}

      {mod.type === 'ad' && (
        <>
          <div>
            <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Google Ad Manager Unit Path</label>
            <input value={mod.config.gamId || ''} onChange={e => updateConfig('gamId', e.target.value)}
              placeholder="/network_id/ad_unit_name"
              className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Ad Size</label>
            <select value={mod.config.size || '728x90'} onChange={e => updateConfig('size', e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs">
              <option value="728x90">Leaderboard (728×90)</option>
              <option value="300x250">Medium Rectangle (300×250)</option>
              <option value="300x600">Half Page (300×600)</option>
              <option value="320x50">Mobile Banner (320×50)</option>
              <option value="970x250">Billboard (970×250)</option>
              <option value="responsive">Responsive / Fluid</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Slot Name</label>
            <input value={mod.config.slot || ''} onChange={e => updateConfig('slot', e.target.value)}
              placeholder="homepage_top"
              className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs" />
          </div>
          <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200 text-[10px] text-yellow-800">
            💡 This connects directly to your Google Ad Manager account. Self-service ad bookings from advertisers will auto-schedule into GAM when their campaign is approved.
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-700">
            <input type="checkbox" checked={mod.config.selfServeEnabled || false} onChange={e => updateConfig('selfServeEnabled', e.target.checked)} />
            Allow self-service advertisers to target this zone
          </label>
          <label className="flex items-center gap-2 text-xs text-ink-700">
            <input type="checkbox" checked={mod.config.houseAd || false} onChange={e => updateConfig('houseAd', e.target.checked)} />
            Show house ads when no paid creative is available
          </label>
        </>
      )}

      {mod.type === 'mostread' && (
        <>
          <div>
            <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Number of Stories</label>
            <select value={mod.config.count} onChange={e => updateConfig('count', parseInt(e.target.value))}
              className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs">
              {[3,5,8,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Time Period</label>
            <select value={mod.config.period} onChange={e => updateConfig('period', e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs">
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </>
      )}

      {mod.type === 'newsletter' && (
        <div>
          <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Constant Contact List</label>
          <select value={mod.config.listId || 'daily-digest'} onChange={e => updateConfig('listId', e.target.value)}
            className="w-full px-2 py-1.5 bg-white border border-ink-200 rounded text-xs">
            <option value="daily-digest">Daily Digest</option>
            <option value="breaking">Breaking News</option>
            <option value="sports">Sports Wrap</option>
            <option value="business">Business Report</option>
          </select>
        </div>
      )}

      {mod.type === 'submit' && (
        <div>
          <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Forms to Show</label>
          {['obituary', 'letter', 'tip', 'event', 'classified', 'photo', 'advertise'].map(f => (
            <label key={f} className="flex items-center gap-2 text-xs text-ink-700 py-0.5">
              <input type="checkbox" checked={mod.config.forms?.includes(f) || false}
                onChange={e => {
                  const cur = mod.config.forms || [];
                  updateConfig('forms', e.target.checked ? [...cur, f] : cur.filter(x => x !== f));
                }} />
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN LAYOUT BUILDER PAGE ───
export default function LayoutBuilderPage() {
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [selectedId, setSelectedId] = useState(null);
  const [site, setSite] = useState('wvnews');
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const selectedMod = layout.find(m => m.id === selectedId);

  const moveUp = useCallback((id) => {
    setLayout(prev => {
      const idx = prev.findIndex(m => m.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
    setHasChanges(true);
  }, []);

  const moveDown = useCallback((id) => {
    setLayout(prev => {
      const idx = prev.findIndex(m => m.id === id);
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
    setHasChanges(true);
  }, []);

  const deleteModule = useCallback((id) => {
    setLayout(prev => prev.filter(m => m.id !== id));
    if (selectedId === id) setSelectedId(null);
    setHasChanges(true);
  }, [selectedId]);

  const addModule = useCallback((typeId) => {
    const newMod = {
      id: `mod-${Date.now()}`,
      type: typeId,
      config: typeId === 'ad' ? { slot: '', size: '300x250', gamId: '', selfServeEnabled: true, houseAd: true } :
             typeId === 'section' ? { sectionId: 'news', count: 4, layout: 'grid' } :
             typeId === 'grid' ? { count: 3, section: 'all', showImages: true } :
             typeId === 'hero' ? { storyId: '', autoRotate: false } :
             typeId === 'mostread' ? { count: 5, period: '24h' } :
             typeId === 'newsletter' ? { listId: 'daily-digest' } :
             typeId === 'weather' ? { zip: '26301' } :
             typeId === 'submit' ? { forms: ['obituary', 'letter', 'tip'] } :
             {},
      zone: ['ad', 'breaking'].includes(typeId) ? 'full' :
            ['weather', 'newsletter', 'mostread', 'eedition', 'social', 'submit'].includes(typeId) ? 'sidebar' : 'main',
    };
    setLayout(prev => [...prev, newMod]);
    setSelectedId(newMod.id);
    setShowAddPanel(false);
    setHasChanges(true);
  }, []);

  const updateModule = useCallback((id, newConfig, newZone) => {
    setLayout(prev => prev.map(m => m.id === id ? { ...m, config: newConfig, zone: newZone || m.zone } : m));
    setHasChanges(true);
  }, []);

  const handleSave = () => {
    // In production: POST to /api/layout with the layout JSON
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={site} onChange={e => setSite(e.target.value)}
          className="px-3 py-2 bg-white rounded-lg border border-ink-200 text-sm">
          {sites.map(s => <option key={s.id} value={s.id}>{s.name} Homepage</option>)}
        </select>
        <select className="px-3 py-2 bg-white rounded-lg border border-ink-200 text-sm">
          <option>Homepage Layout</option>
          <option>Section Page Template</option>
          <option>Article Page Template</option>
        </select>
        <div className="flex-1" />
        {saved && <span className="text-green-600 text-sm font-medium">✓ Layout saved!</span>}
        {hasChanges && <span className="text-yellow-600 text-xs">Unsaved changes</span>}
        <button onClick={() => setLayout(DEFAULT_LAYOUT)}
          className="px-3 py-2 bg-white text-ink-600 text-sm rounded-lg border border-ink-200 hover:bg-ink-50">
          Reset to Default
        </button>
        <button onClick={handleSave}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${hasChanges ? 'bg-brand-700 text-white hover:bg-brand-600' : 'bg-ink-200 text-ink-500'}`}>
          Publish Layout
        </button>
      </div>

      {/* Info bar */}
      <div className="bg-brand-50 rounded-lg p-3 border border-brand-100 flex items-center gap-3">
        <span className="text-lg">🧱</span>
        <div className="flex-1">
          <div className="text-sm font-bold text-brand-800">Drag-and-Drop Layout Builder</div>
          <div className="text-xs text-ink-600">Rearrange modules using the arrow buttons. Click any module to configure it. No HTML editing required — changes go live when you hit Publish.</div>
        </div>
      </div>

      {/* Main Builder */}
      <div className="grid grid-cols-12 gap-4">
        {/* Module List (left) */}
        <div className="col-span-5 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-ink-800">{layout.length} Modules</h3>
            <button onClick={() => setShowAddPanel(!showAddPanel)}
              className="px-3 py-1.5 bg-brand-700 text-white text-xs font-medium rounded-lg hover:bg-brand-600">
              + Add Module
            </button>
          </div>

          {/* Add Module Panel */}
          {showAddPanel && (
            <div className="bg-white rounded-xl border border-ink-200 p-3 shadow-lg mb-2">
              <div className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Choose a Module Type</div>
              <div className="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto">
                {Object.values(MODULE_TYPES).map(type => (
                  <button key={type.id} onClick={() => addModule(type.id)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-ink-100 hover:border-brand-300 hover:bg-brand-50 transition-colors">
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-[10px] font-medium text-ink-700 text-center leading-tight">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Module Stack */}
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {layout.map((mod, i) => (
              <ModulePreview
                key={mod.id}
                mod={mod}
                isSelected={selectedId === mod.id}
                onSelect={setSelectedId}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                onDelete={deleteModule}
                isFirst={i === 0}
                isLast={i === layout.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Config Panel (middle) */}
        <div className="col-span-4 bg-white rounded-xl border border-ink-200 p-4 max-h-[70vh] overflow-y-auto">
          <h3 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Module Settings</h3>
          <ModuleConfig mod={selectedMod} onUpdate={updateModule} />
        </div>

        {/* Visual Preview (right) */}
        <div className="col-span-3">
          <div className="sticky top-0">
            <LayoutVisualPreview layout={layout} />
            <div className="mt-3 text-center">
              <a href="/" target="_blank" className="text-xs text-brand-700 hover:underline">
                Preview full page →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
