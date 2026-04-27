'use client';

import { useState } from 'react';

export default function SendClaimButton({ subscriberId, alreadySent }) {
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  async function send(force = false) {
    setState('sending');
    try {
      const res = await fetch(`/api/subscribers/${encodeURIComponent(subscriberId)}/send-claim${force ? '?force=1' : ''}`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setState('sent');
    } catch (err) {
      setState('error');
      setErrorMsg(err.message);
    }
  }

  if (state === 'sent') {
    return <span className="px-2 py-1 text-xs text-green-700 bg-green-50 rounded">Sent ✓</span>;
  }
  if (state === 'error') {
    return (
      <button
        onClick={() => send(true)}
        className="px-2 py-1 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded"
        title={errorMsg}
      >
        Retry
      </button>
    );
  }
  return (
    <button
      onClick={() => send(alreadySent)}
      disabled={state === 'sending'}
      className="px-2 py-1 text-xs text-brand-700 bg-brand-50 hover:bg-brand-100 rounded disabled:opacity-50"
    >
      {state === 'sending' ? 'Sending…' : alreadySent ? 'Resend claim' : 'Send claim email'}
    </button>
  );
}
