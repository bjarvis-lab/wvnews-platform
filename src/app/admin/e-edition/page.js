'use client';

export default function EEditionAdminPage() {
  const editions = [
    { id: 'e1', date: 'Mar 9, 2026', publication: 'Exponent Telegram', pages: 24, status: 'Live', views: 342, downloads: 89 },
    { id: 'e2', date: 'Mar 8, 2026', publication: 'Exponent Telegram', pages: 28, status: 'Archived', views: 567, downloads: 134 },
    { id: 'e3', date: 'Mar 9, 2026', publication: 'WVNews', pages: 32, status: 'Live', views: 890, downloads: 245 },
    { id: 'e4', date: 'Mar 8, 2026', publication: 'WVNews', pages: 36, status: 'Archived', views: 1240, downloads: 312 },
    { id: 'e5', date: 'Mar 7, 2026', publication: 'WVNews', pages: 28, status: 'Archived', views: 980, downloads: 278 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'E-Edition Subscribers', value: '780' },
          { label: 'Today\'s Views', value: '1,232' },
          { label: 'Avg. Time Reading', value: '8:45' },
          { label: 'Revenue (MTD)', value: '$5,450' },
        ].map(s => (
          <div key={s.label} className="stat-card bg-white rounded-lg p-4 shadow-sm border border-ink-100">
            <div className="text-xs text-ink-500">{s.label}</div>
            <div className="text-xl font-bold text-ink-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
        <h3 className="text-sm font-bold text-ink-800 mb-3">Upload New E-Edition</h3>
        <div className="border-2 border-dashed border-ink-200 rounded-lg p-8 text-center hover:border-brand-400 transition-colors cursor-pointer">
          <div className="text-3xl mb-2">📄</div>
          <div className="text-sm text-ink-600 font-medium">Drop your print edition PDF here</div>
          <div className="text-xs text-ink-400 mt-1">or click to browse · Max 200MB</div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <select className="px-3 py-2 bg-ink-50 rounded-lg border border-ink-200 text-sm"><option>WVNews</option><option>Exponent Telegram</option></select>
          <input type="date" className="px-3 py-2 bg-ink-50 rounded-lg border border-ink-200 text-sm" defaultValue="2026-03-09" />
          <button className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-600">Upload & Process</button>
        </div>
        <p className="text-xs text-ink-400 mt-2">The system will auto-generate page thumbnails, extract text for search, and notify E-Edition subscribers via email.</p>
      </div>

      {/* Editions list */}
      <div className="bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[11px] text-ink-500 uppercase tracking-wider border-b border-ink-100 bg-ink-50/50">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Publication</th>
              <th className="px-4 py-3 font-medium text-right">Pages</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Views</th>
              <th className="px-4 py-3 font-medium text-right">Downloads</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {editions.map(ed => (
              <tr key={ed.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                <td className="px-4 py-3 text-sm font-medium text-ink-800">{ed.date}</td>
                <td className="px-4 py-3 text-sm text-ink-600">{ed.publication}</td>
                <td className="px-4 py-3 text-sm text-right text-ink-600">{ed.pages}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-bold rounded ${ed.status === 'Live' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{ed.status}</span></td>
                <td className="px-4 py-3 text-sm text-right text-ink-700">{ed.views}</td>
                <td className="px-4 py-3 text-sm text-right text-ink-700">{ed.downloads}</td>
                <td className="px-4 py-3"><button className="text-xs text-brand-700 hover:underline">Preview</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
