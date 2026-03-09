'use client';
import { useState } from 'react';
import { budgetItems } from '@/data/mock';

const statusColors = {
  'Assigned': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  'Filed': 'bg-purple-100 text-purple-700 border-purple-200',
  'Draft': 'bg-gray-100 text-gray-600 border-gray-200',
  'Published': 'bg-green-100 text-green-700 border-green-200',
};

export default function BudgetPage() {
  const [view, setView] = useState('board');
  const [date, setDate] = useState('2026-03-09');
  const statuses = ['Assigned', 'In Progress', 'Filed', 'Published'];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="px-3 py-2 bg-white rounded-lg border border-ink-200 text-sm" />
        <div className="flex bg-white rounded-lg border border-ink-200 overflow-hidden">
          <button onClick={() => setView('board')} className={`px-3 py-2 text-xs font-medium ${view === 'board' ? 'bg-brand-50 text-brand-700' : 'text-ink-500'}`}>Kanban Board</button>
          <button onClick={() => setView('list')} className={`px-3 py-2 text-xs font-medium ${view === 'list' ? 'bg-brand-50 text-brand-700' : 'text-ink-500'}`}>List View</button>
          <button onClick={() => setView('calendar')} className={`px-3 py-2 text-xs font-medium ${view === 'calendar' ? 'bg-brand-50 text-brand-700' : 'text-ink-500'}`}>Calendar</button>
        </div>
        <div className="flex-1" />
        <button className="px-3 py-2 bg-white text-ink-600 text-sm rounded-lg border border-ink-200 hover:bg-ink-50">
          Export Budget PDF
        </button>
        <button className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-600">
          + Add Budget Line
        </button>
      </div>

      {/* Kanban Board */}
      {view === 'board' && (
        <div className="grid grid-cols-4 gap-4">
          {statuses.map(status => (
            <div key={status} className="kanban-column">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-ink-700">{status}</h3>
                <span className="text-xs bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full">
                  {budgetItems.filter(b => b.status === status).length}
                </span>
              </div>
              <div className="space-y-2">
                {budgetItems.filter(b => b.status === status).map(item => (
                  <div key={item.id} className={`bg-white rounded-lg p-3 shadow-sm border ${statusColors[status]} cursor-move hover:shadow-md transition-shadow`}>
                    <div className="text-sm font-medium text-ink-800 mb-1">{item.slug}</div>
                    <div className="text-xs text-ink-500 mb-2">{item.reporter} · {item.section}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 bg-ink-50 rounded text-ink-600">{item.type}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-ink-50 rounded text-ink-600">{item.targetLength}w</span>
                      {item.printFlag && <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 rounded text-orange-600">Print</span>}
                      {item.digitalFlag && <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 rounded text-blue-600">Web</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] text-ink-500 uppercase tracking-wider border-b border-ink-100 bg-ink-50/50">
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Reporter</th>
                <th className="px-4 py-3 font-medium">Section</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Length</th>
                <th className="px-4 py-3 font-medium">Print</th>
                <th className="px-4 py-3 font-medium">Web</th>
                <th className="px-4 py-3 font-medium">Site</th>
              </tr>
            </thead>
            <tbody>
              {budgetItems.map(item => (
                <tr key={item.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-ink-800">{item.slug}</td>
                  <td className="px-4 py-3 text-sm text-ink-600">{item.reporter}</td>
                  <td className="px-4 py-3 text-sm text-ink-600">{item.section}</td>
                  <td className="px-4 py-3 text-sm text-ink-600">{item.type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${statusColors[item.status]}`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600">{item.targetLength}w</td>
                  <td className="px-4 py-3 text-center">{item.printFlag ? '✓' : '—'}</td>
                  <td className="px-4 py-3 text-center">{item.digitalFlag ? '✓' : '—'}</td>
                  <td className="px-4 py-3 text-sm text-ink-600">{item.site}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-6">
          <div className="text-center text-sm text-ink-500 mb-4">Week of March 9, 2026</div>
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-ink-500 pb-2">{day}</div>
            ))}
            {[9,10,11,12,13,14,15].map(day => (
              <div key={day} className="min-h-[100px] border border-ink-100 rounded p-2">
                <div className="text-xs font-bold text-ink-700 mb-1">Mar {day}</div>
                {budgetItems.filter(b => b.date === `2026-03-${day.toString().padStart(2, '0')}`).map(item => (
                  <div key={item.id} className={`text-[10px] p-1 rounded mb-1 ${statusColors[item.status]}`}>
                    {item.slug}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Print Budget connection */}
      <div className="bg-gradient-to-r from-brand-950 to-brand-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <span>🖨️</span>
          <h3 className="text-sm font-bold">PrintManager Integration</h3>
        </div>
        <p className="text-sm text-white/70 mb-3">
          Stories marked for print are automatically synced to your PrintManager system. Budget line status updates flow both directions.
        </p>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs bg-white/10 text-white rounded-lg hover:bg-white/20">Sync Now</button>
          <button className="px-3 py-1.5 text-xs bg-white/10 text-white rounded-lg hover:bg-white/20">View Print Dummy</button>
        </div>
      </div>
    </div>
  );
}
