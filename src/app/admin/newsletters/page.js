'use client';
import { newsletters } from '@/data/mock';

export default function NewslettersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex-1" />
        <button className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-600">+ New Newsletter</button>
      </div>

      {/* Newsletter list */}
      <div className="bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[11px] text-ink-500 uppercase tracking-wider border-b border-ink-100 bg-ink-50/50">
              <th className="px-4 py-3 font-medium">Newsletter</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium text-right">Subscribers</th>
              <th className="px-4 py-3 font-medium">Last Sent</th>
              <th className="px-4 py-3 font-medium text-right">Open Rate</th>
              <th className="px-4 py-3 font-medium text-right">Click Rate</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {newsletters.map(nl => (
              <tr key={nl.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                <td className="px-4 py-3 text-sm font-medium text-ink-800">{nl.name}</td>
                <td className="px-4 py-3 text-sm text-ink-600">{nl.type}</td>
                <td className="px-4 py-3 text-sm text-ink-700 text-right font-medium">{nl.subscribers.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-ink-600">{nl.lastSent}</td>
                <td className="px-4 py-3 text-sm text-ink-700 text-right font-medium">{nl.openRate}</td>
                <td className="px-4 py-3 text-sm text-ink-700 text-right font-medium">{nl.clickRate}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-bold rounded ${nl.status === 'Sent' ? 'bg-green-100 text-green-700' : nl.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{nl.status}</span></td>
                <td className="px-4 py-3"><button className="text-xs text-brand-700 hover:underline">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Auto-build feature */}
      <div className="bg-brand-50 rounded-xl p-5 border border-brand-100">
        <div className="flex items-center gap-2 mb-2">
          <span>🤖</span>
          <h3 className="text-sm font-bold text-brand-800">AI Newsletter Builder</h3>
        </div>
        <p className="text-sm text-ink-600 mb-3">Automatically assemble newsletters from today&apos;s top stories. AI writes the intro copy and selects the best stories per section.</p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-brand-700 text-white text-sm rounded-lg hover:bg-brand-600">Auto-Build Daily Digest</button>
          <button className="px-4 py-2 bg-white text-brand-700 text-sm rounded-lg border border-brand-200 hover:bg-brand-50">Preview Template</button>
        </div>
      </div>

      {/* Constant Contact sync */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
        <h3 className="text-sm font-bold text-ink-800 mb-3">Constant Contact Integration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-ink-50 rounded-lg">
            <div className="text-xs text-ink-500">Total Email Lists</div>
            <div className="text-lg font-bold text-ink-900">12</div>
          </div>
          <div className="p-3 bg-ink-50 rounded-lg">
            <div className="text-xs text-ink-500">Total Contacts</div>
            <div className="text-lg font-bold text-ink-900">62,400</div>
          </div>
          <div className="p-3 bg-ink-50 rounded-lg">
            <div className="text-xs text-ink-500">Last Sync</div>
            <div className="text-lg font-bold text-ink-900">2 min ago</div>
          </div>
        </div>
      </div>
    </div>
  );
}
