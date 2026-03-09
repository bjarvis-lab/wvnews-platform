'use client';
import { useState } from 'react';

const IMPORT_SOURCES = [
  { id: 'blox-xml', label: 'BLOX XML Export', icon: '📦', desc: 'Import stories, assets, and metadata from a BLOX XML/JSON export file', formats: '.xml, .json' },
  { id: 'csv', label: 'CSV / Spreadsheet', icon: '📊', desc: 'Import stories from a CSV with columns: headline, body, section, date, author', formats: '.csv, .tsv, .xlsx' },
  { id: 'wordpress', label: 'WordPress WXR', icon: '🔵', desc: 'Import from WordPress export file (WXR format)', formats: '.xml' },
  { id: 'google-docs', label: 'Google Drive Folder', icon: '📁', desc: 'Import all Google Docs from a shared Drive folder as stories', formats: 'Drive URL' },
  { id: 'rss', label: 'RSS Feed Scrape', icon: '📡', desc: 'Pull recent stories from any RSS feed URL', formats: 'Feed URL' },
  { id: 'manual', label: 'Bulk Paste', icon: '📋', desc: 'Paste multiple stories in a structured format', formats: 'Text' },
];

export default function ImportPage() {
  const [source, setSource] = useState('blox-xml');
  const [step, setStep] = useState(1); // 1: choose source, 2: upload/configure, 3: preview, 4: importing, 5: done
  const [files, setFiles] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [driveUrl, setDriveUrl] = useState('');
  const [rssUrl, setRssUrl] = useState('');

  const simulatePreview = () => {
    setPreviewData({
      totalStories: 1247,
      totalAssets: 3842,
      totalAuthors: 18,
      sections: ['News (412)', 'Sports (287)', 'Opinion (134)', 'Business (98)', 'Crime (156)', 'Lifestyle (87)', 'Education (73)'],
      dateRange: 'Feb 9, 2026 — Mar 9, 2026',
      sampleStories: [
        { headline: 'County Commission Approves New Water Treatment Plant', section: 'News', date: 'Mar 8, 2026', author: 'Jennifer Walsh' },
        { headline: 'Mountaineers Fall to Iowa State in OT', section: 'Sports', date: 'Mar 7, 2026', author: 'Marcus Cole' },
        { headline: 'New Restaurant Opens Downtown on Main Street', section: 'Lifestyle', date: 'Mar 6, 2026', author: 'Amy Chen' },
        { headline: 'School Board Votes to Increase Teacher Pay', section: 'Education', date: 'Mar 5, 2026', author: 'Sarah Mitchell' },
        { headline: 'Police Arrest Two in Connection with Theft Ring', section: 'Crime', date: 'Mar 5, 2026', author: 'Tom Bradley' },
      ],
    });
    setStep(3);
  };

  const simulateImport = async () => {
    setStep(4);
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 60));
      setImportProgress(i);
    }
    setImportStats({
      storiesImported: 1247,
      assetsImported: 3842,
      urlRedirects: 1247,
      errors: 3,
      time: '4 minutes 12 seconds',
    });
    setStep(5);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-950 to-brand-800 rounded-xl p-5 text-white">
        <h2 className="text-lg font-display font-bold mb-1">Content Import & Migration</h2>
        <p className="text-sm text-white/70">Import stories, assets, and metadata from BLOX, WordPress, Google Drive, RSS feeds, or CSV files.</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {['Source', 'Upload', 'Preview', 'Import', 'Done'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step > i + 1 ? 'bg-green-500 text-white' :
              step === i + 1 ? 'bg-brand-700 text-white' :
              'bg-ink-200 text-ink-500'
            }`}>{step > i + 1 ? '✓' : i + 1}</div>
            <span className={`text-xs font-medium ${step === i + 1 ? 'text-ink-900' : 'text-ink-400'}`}>{label}</span>
            {i < 4 && <div className="w-8 h-px bg-ink-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Choose source */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-ink-800">Choose Import Source</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {IMPORT_SOURCES.map(src => (
              <button key={src.id} onClick={() => { setSource(src.id); setStep(2); }}
                className={`p-4 rounded-xl border text-left transition-all hover:shadow-md ${
                  source === src.id ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-ink-300'
                }`}>
                <div className="text-2xl mb-2">{src.icon}</div>
                <div className="text-sm font-bold text-ink-800">{src.label}</div>
                <div className="text-xs text-ink-500 mt-1">{src.desc}</div>
                <div className="text-[10px] text-ink-400 mt-2">Accepts: {src.formats}</div>
              </button>
            ))}
          </div>

          {/* How to get your BLOX data */}
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <h4 className="text-sm font-bold text-yellow-800 mb-2">📋 How to Get Your Last Month&apos;s Content from BLOX</h4>
            <ol className="space-y-2 text-xs text-yellow-900">
              <li><strong>Option 1 — BLOX Admin Export:</strong> Log into your BLOX admin → Go to Assets → Filter by date range (last 30 days) → Click Export → Choose XML or JSON format → Download the file and upload it here.</li>
              <li><strong>Option 2 — Contact TownNews Support:</strong> Email support@townnews.com and request a full data export of your sites for the last 30 days. They typically provide XML files within 1-2 business days. Ask for stories, images, and user data.</li>
              <li><strong>Option 3 — RSS Feed:</strong> Your BLOX site has RSS feeds at <code>wvnews.com/search/?f=rss</code>. This gives you the last ~100 stories. Select &quot;RSS Feed Scrape&quot; above and enter your feed URLs.</li>
              <li><strong>Option 4 — Google Drive Archive:</strong> If your team saves stories in Google Drive, share the folder with our platform and we&apos;ll import all docs as stories.</li>
              <li><strong>Option 5 — Spreadsheet:</strong> Export your BLOX content list to a spreadsheet (CSV). Include columns for headline, body text, section, author, publish date, and image URL. Upload the CSV here.</li>
            </ol>
          </div>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep(1)} className="text-xs text-brand-700 hover:underline">← Back</button>
            <h3 className="text-sm font-bold text-ink-800">
              Upload: {IMPORT_SOURCES.find(s => s.id === source)?.label}
            </h3>
          </div>

          {(source === 'blox-xml' || source === 'csv' || source === 'wordpress') && (
            <div className="bg-white rounded-xl border-2 border-dashed border-ink-300 p-12 text-center hover:border-brand-400 transition-colors cursor-pointer">
              <div className="text-4xl mb-3">📄</div>
              <div className="text-sm font-medium text-ink-600">Drop your {IMPORT_SOURCES.find(s => s.id === source)?.formats} file(s) here</div>
              <div className="text-xs text-ink-400 mt-1">or click to browse · Max 500MB per file</div>
              <input type="file" className="hidden" accept={IMPORT_SOURCES.find(s => s.id === source)?.formats} />
            </div>
          )}

          {source === 'google-docs' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-ink-500 block mb-1">Google Drive Folder URL</label>
                <input value={driveUrl} onChange={e => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-2 bg-white border border-ink-200 rounded-lg text-sm" />
              </div>
              <p className="text-xs text-ink-500">Make sure the folder is shared with <strong>wvnews-platform@your-project.iam.gserviceaccount.com</strong></p>
            </div>
          )}

          {source === 'rss' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-ink-500 block mb-1">RSS Feed URL(s)</label>
                <textarea value={rssUrl} onChange={e => setRssUrl(e.target.value)}
                  placeholder="https://wvnews.com/search/?f=rss&#10;https://exponenttelegram.com/search/?f=rss"
                  className="w-full h-24 px-3 py-2 bg-white border border-ink-200 rounded-lg text-sm" />
              </div>
              <p className="text-xs text-ink-500">Enter one URL per line. RSS feeds typically return the last 50-100 articles.</p>
            </div>
          )}

          {/* Import settings */}
          <div className="bg-ink-50 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-bold text-ink-700">Import Settings</h4>
            <label className="flex items-center gap-2 text-xs text-ink-700">
              <input type="checkbox" defaultChecked /> Import all associated images and assets
            </label>
            <label className="flex items-center gap-2 text-xs text-ink-700">
              <input type="checkbox" defaultChecked /> Generate 301 redirect map (old URLs → new URLs)
            </label>
            <label className="flex items-center gap-2 text-xs text-ink-700">
              <input type="checkbox" defaultChecked /> Auto-generate SEO meta descriptions with AI
            </label>
            <label className="flex items-center gap-2 text-xs text-ink-700">
              <input type="checkbox" defaultChecked /> Auto-tag stories with AI topic detection
            </label>
            <label className="flex items-center gap-2 text-xs text-ink-700">
              <input type="checkbox" /> Publish immediately (otherwise import as Drafts)
            </label>
            <div>
              <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider block mb-1">Default Site</label>
              <select className="px-2 py-1.5 bg-white border border-ink-200 rounded text-xs">
                <option>WVNews</option>
                <option>Exponent Telegram</option>
                <option>Weston Democrat</option>
              </select>
            </div>
          </div>

          <button onClick={simulatePreview}
            className="w-full py-3 bg-brand-700 text-white text-sm font-bold rounded-xl hover:bg-brand-600">
            Scan & Preview →
          </button>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && previewData && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep(2)} className="text-xs text-brand-700 hover:underline">← Back</button>
            <h3 className="text-sm font-bold text-ink-800">Import Preview</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border border-ink-100"><div className="text-xs text-ink-500">Stories</div><div className="text-xl font-bold text-ink-900">{previewData.totalStories.toLocaleString()}</div></div>
            <div className="bg-white rounded-lg p-3 border border-ink-100"><div className="text-xs text-ink-500">Assets</div><div className="text-xl font-bold text-ink-900">{previewData.totalAssets.toLocaleString()}</div></div>
            <div className="bg-white rounded-lg p-3 border border-ink-100"><div className="text-xs text-ink-500">Authors</div><div className="text-xl font-bold text-ink-900">{previewData.totalAuthors}</div></div>
            <div className="bg-white rounded-lg p-3 border border-ink-100"><div className="text-xs text-ink-500">Date Range</div><div className="text-sm font-bold text-ink-900">{previewData.dateRange}</div></div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-ink-100">
            <h4 className="text-xs font-bold text-ink-500 mb-2">Sections Detected</h4>
            <div className="flex flex-wrap gap-2">
              {previewData.sections.map(s => (
                <span key={s} className="px-2 py-1 bg-brand-50 text-brand-700 text-xs rounded-lg">{s}</span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-ink-100">
            <h4 className="text-xs font-bold text-ink-500 mb-2">Sample Stories (first 5)</h4>
            <div className="space-y-2">
              {previewData.sampleStories.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-ink-50 last:border-0">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink-800">{s.headline}</div>
                    <div className="text-xs text-ink-500">{s.author} · {s.section} · {s.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={simulateImport}
            className="w-full py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-500">
            ✅ Import {previewData.totalStories.toLocaleString()} Stories & {previewData.totalAssets.toLocaleString()} Assets
          </button>
        </div>
      )}

      {/* Step 4: Importing */}
      {step === 4 && (
        <div className="bg-white rounded-xl p-8 border border-ink-100 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h3 className="text-lg font-display font-bold text-ink-900 mb-2">Importing Content...</h3>
          <div className="max-w-md mx-auto mb-4">
            <div className="h-3 bg-ink-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }} />
            </div>
            <div className="text-sm font-medium text-ink-700 mt-2">{importProgress}%</div>
          </div>
          <div className="text-xs text-ink-500">
            {importProgress < 30 && 'Parsing export file...'}
            {importProgress >= 30 && importProgress < 60 && 'Importing stories and generating URLs...'}
            {importProgress >= 60 && importProgress < 80 && 'Downloading and processing images...'}
            {importProgress >= 80 && importProgress < 95 && 'Running AI auto-tagging and SEO generation...'}
            {importProgress >= 95 && 'Building 301 redirect map...'}
          </div>
        </div>
      )}

      {/* Step 5: Done */}
      {step === 5 && importStats && (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-xl p-6 border border-green-200 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-xl font-display font-bold text-green-800 mb-2">Import Complete!</h3>
            <p className="text-sm text-green-700">Your content has been imported successfully.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white rounded-lg p-3 border border-ink-100 text-center"><div className="text-xs text-ink-500">Stories</div><div className="text-xl font-bold text-green-600">{importStats.storiesImported.toLocaleString()}</div></div>
            <div className="bg-white rounded-lg p-3 border border-ink-100 text-center"><div className="text-xs text-ink-500">Assets</div><div className="text-xl font-bold text-green-600">{importStats.assetsImported.toLocaleString()}</div></div>
            <div className="bg-white rounded-lg p-3 border border-ink-100 text-center"><div className="text-xs text-ink-500">Redirects</div><div className="text-xl font-bold text-green-600">{importStats.urlRedirects.toLocaleString()}</div></div>
            <div className="bg-white rounded-lg p-3 border border-ink-100 text-center"><div className="text-xs text-ink-500">Errors</div><div className="text-xl font-bold text-red-500">{importStats.errors}</div></div>
            <div className="bg-white rounded-lg p-3 border border-ink-100 text-center"><div className="text-xs text-ink-500">Time</div><div className="text-sm font-bold text-ink-900">{importStats.time}</div></div>
          </div>

          <div className="flex gap-3">
            <a href="/admin/stories" className="flex-1 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg text-center hover:bg-brand-600">View Imported Stories →</a>
            <button onClick={() => { setStep(1); setImportStats(null); setPreviewData(null); setImportProgress(0); }}
              className="flex-1 py-2 bg-white text-ink-700 text-sm font-medium rounded-lg border border-ink-200 hover:bg-ink-50">Import More Content</button>
          </div>
        </div>
      )}
    </div>
  );
}
