'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// One row in the production queue + the modal used to upload a creative for
// the corresponding order. The modal POSTs the file to /api/ads/upload which
// writes to Firebase Storage and stamps the order's artworkUrl/artworkStatus.

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtUSD = (n) => typeof n === 'number' ? `$${n.toLocaleString()}` : '—';

export default function AdOrderRow({ order }) {
  const [open, setOpen] = useState(false);
  const status = order.print?.artworkStatus || 'Unassigned';

  const statusTone =
    status.toLowerCase().includes('graphics') ? 'bg-gold-100 text-gold-900' :
    status.toLowerCase().includes('pending')  ? 'bg-emerald-100 text-emerald-800' :
                                                'bg-ink-100 text-ink-700';

  return (
    <>
      <tr className="hover:bg-ink-50/50">
        <td className="px-5 py-4">
          <div className="font-semibold text-ink-900">{order.aname || '(no name)'}</div>
          {order.desc && <div className="text-xs text-ink-500 truncate max-w-[280px]" title={order.desc}>{order.desc}</div>}
        </td>
        <td className="px-5 py-4 font-mono text-xs text-ink-600">{order.adNum || '—'}</td>
        <td className="px-5 py-4 text-ink-700">
          <div>{order.type || '—'}</div>
          {order.print?.sz && (
            <div className="text-xs text-ink-500">
              {order.print.sz}{order.print.color ? ' · color' : ' · b&w'}
              {order.print.sec && <> · {order.print.sec}</>}
            </div>
          )}
        </td>
        <td className="px-5 py-4 text-ink-600">
          <div>{fmtDate(order.startDate)}</div>
          {order.endDate && order.endDate !== order.startDate && (
            <div className="text-xs text-ink-500">through {fmtDate(order.endDate)}</div>
          )}
        </td>
        <td className="px-5 py-4">
          <span className={`px-2 py-1 text-xs font-semibold rounded ${statusTone}`}>
            {status}
          </span>
        </td>
        <td className="px-5 py-4 text-right font-semibold">{fmtUSD(order.amt)}</td>
        <td className="px-5 py-4 text-right">
          <button
            onClick={() => setOpen(true)}
            className="px-3 py-1.5 bg-brand-700 text-white text-xs font-semibold rounded hover:bg-brand-600"
          >
            Upload →
          </button>
        </td>
      </tr>
      {open && <UploadModal order={order} onClose={() => setOpen(false)} />}
    </>
  );
}

function UploadModal({ order, onClose }) {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState(order.artworkNotes || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setUploading(true);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('orderId', order.id);
    fd.append('notes', notes);

    try {
      const res = await fetch('/api/ads/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      router.refresh();
      onClose();
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-ink-500 uppercase tracking-wider">Ad #{order.adNum}</div>
            <h3 className="font-display text-lg font-bold text-ink-900">{order.aname}</h3>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 text-xl">✕</button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Order summary */}
          <div className="bg-ink-50 rounded-lg p-3 text-xs space-y-1">
            <div><span className="text-ink-500">Type:</span> {order.type}</div>
            {order.print?.sz && <div><span className="text-ink-500">Size:</span> {order.print.sz}{order.print.color ? ', color' : ', b&w'}</div>}
            {order.print?.sec && <div><span className="text-ink-500">Section:</span> {order.print.sec}</div>}
            {order.startDate && <div><span className="text-ink-500">Runs:</span> {order.startDate}</div>}
            {order.desc && <div><span className="text-ink-500">Copy:</span> {order.desc}</div>}
          </div>

          {/* File input */}
          <label className="block">
            <span className="text-xs font-semibold text-ink-700">Creative file *</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.ai,.eps,.tiff,.psd"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="mt-1 w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-brand-50 file:text-brand-800 file:font-semibold hover:file:bg-brand-100"
              required
            />
            <span className="text-[11px] text-ink-500 mt-1 block">PDF, PNG, JPG, AI, EPS, TIFF, PSD · Max 25 MB</span>
          </label>

          {/* Notes */}
          <label className="block">
            <span className="text-xs font-semibold text-ink-700">Notes for sales / billing</span>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Proof sent to client, awaiting approval…"
            />
          </label>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-800 text-xs rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-ink-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="px-4 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload & mark complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
