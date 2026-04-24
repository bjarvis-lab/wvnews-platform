'use client';
// Self-serve form experience. Picker of all enabled types → dedicated form
// for the picked type → POST /api/submit → confirmation screen.
//
// Live price preview uses the same calculateTotal() the server uses, so
// what the user sees matches what they'll be charged (once Stripe is wired).

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { calculateTotal } from '@/lib/pricing-helpers';

const ALL_TYPES = [
  { key: 'obituary',     icon: '🕊️',  label: 'Obituary',          paid: true,  blurb: 'Memorialize a loved one.' },
  { key: 'classified',   icon: '📰',  label: 'Classified Ad',     paid: true,  blurb: 'For sale, jobs, real estate, services.' },
  { key: 'legal',        icon: '⚖️',  label: 'Legal Notice',      paid: true,  blurb: 'Public notices, foreclosures, name changes.' },
  { key: 'announcement', icon: '🎉',  label: 'Announcement',      paid: true,  blurb: 'Weddings, engagements, births, anniversaries.' },
  { key: 'letter',       icon: '✉️',  label: 'Letter to Editor',  paid: false, blurb: 'Share your perspective (500 words max).' },
  { key: 'tip',          icon: '🔍',  label: 'News Tip',          paid: false, blurb: 'Send the newsroom a lead — anonymous option.' },
  { key: 'event',        icon: '📅',  label: 'Community Event',   paid: false, blurb: 'Post to the community calendar.' },
  { key: 'advertise',    icon: '💼',  label: 'Advertise With Us', paid: false, blurb: 'Tell us about your business; a rep will follow up.' },
  { key: 'sportsScore',  icon: '🏆',  label: 'Sports Score',      paid: false, blurb: 'Coaches + volunteers: submit a final score.' },
  { key: 'photo',        icon: '📷',  label: 'Reader Photo',      paid: false, blurb: 'Weather, community, or sports photos.' },
];

export default function SubmitClient({ pricing, initialType }) {
  const [type, setType] = useState(initialType);
  const [confirmation, setConfirmation] = useState(null);

  const enabledTypes = useMemo(() => {
    if (!pricing) return ALL_TYPES;
    return ALL_TYPES.filter(t => pricing[t.key]?.enabled !== false);
  }, [pricing]);

  if (confirmation) {
    return <ConfirmationScreen confirmation={confirmation} onDone={() => { setConfirmation(null); setType(null); }} />;
  }

  if (!type) {
    return <Picker types={enabledTypes} onPick={setType} />;
  }

  return (
    <Form
      type={type}
      pricing={pricing}
      onBack={() => setType(null)}
      onSubmitted={setConfirmation}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Picker
// ─────────────────────────────────────────────────────────────────────────

function Picker({ types, onPick }) {
  const paid = types.filter(t => t.paid);
  const free = types.filter(t => !t.paid);

  return (
    <div>
      <h1 className="font-display text-4xl font-bold text-ink-900">Reader Services</h1>
      <p className="text-ink-600 mt-2">Anything you want to send us starts here.</p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-ink-900 mb-4">Place & Pay</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paid.map(t => (
            <button
              key={t.key}
              onClick={() => onPick(t.key)}
              className="text-left bg-white p-5 rounded-xl border border-ink-200 hover:border-brand-400 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-2">{t.icon}</div>
              <div className="font-display text-lg font-bold text-ink-900">{t.label}</div>
              <p className="text-sm text-ink-600 mt-1">{t.blurb}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-ink-900 mb-4">Free to Submit</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {free.map(t => (
            <button
              key={t.key}
              onClick={() => onPick(t.key)}
              className="text-left bg-white p-5 rounded-xl border border-ink-200 hover:border-brand-400 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="font-display text-base font-bold text-ink-900">{t.label}</div>
              <p className="text-xs text-ink-600 mt-1">{t.blurb}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-14 p-5 bg-white rounded-xl border border-ink-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-ink-900">Already a subscriber?</h3>
            <p className="text-sm text-ink-600">Manage your account, billing, and newsletter preferences.</p>
          </div>
          <Link href="/account" className="px-5 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 whitespace-nowrap">
            My Account →
          </Link>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Form — dispatches rendering by type
// ─────────────────────────────────────────────────────────────────────────

function Form({ type, pricing, onBack, onSubmitted }) {
  const meta = ALL_TYPES.find(t => t.key === type);
  const cfg = pricing?.[type] || null;

  const [fields, setFields] = useState({});
  const [selections, setSelections] = useState({});
  const [contact, setContact] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const total = meta.paid && pricing ? calculateTotal(type, pricing, selections) : 0;

  function update(k, v)    { setFields(prev => ({ ...prev, [k]: v })); }
  function select(k, v)    { setSelections(prev => ({ ...prev, [k]: v })); }
  function toggleAddOn(k, v) {
    setSelections(prev => ({
      ...prev,
      addOns: { ...(prev.addOns || {}), [k]: v },
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, fields, selections, contact }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      onSubmitted({ type, meta, ...data });
    } catch (err) {
      setError(err.message || 'Submission failed');
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button onClick={onBack} className="text-xs text-ink-500 hover:text-ink-900 mb-3">← Back to all services</button>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">{meta.icon}</span>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">{meta.label}</h1>
          {cfg?.description && <p className="text-ink-600 text-sm">{cfg.description}</p>}
        </div>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-ink-200 p-6 space-y-4">
          {renderFields({ type, cfg, fields, update, selections, select, toggleAddOn })}
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-ink-200 p-5">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Contact</div>
            <div className="mt-3 space-y-2">
              <input required placeholder="Your name" value={contact.name} onChange={e => setContact(c => ({ ...c, name: e.target.value }))} className="w-full px-3 py-2 border border-ink-200 rounded text-sm" />
              <input required type="email" placeholder="Your email *" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} className="w-full px-3 py-2 border border-ink-200 rounded text-sm" />
              <input placeholder="Phone (optional)" value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} className="w-full px-3 py-2 border border-ink-200 rounded text-sm" />
            </div>
            <p className="text-[11px] text-ink-500 mt-2">We use your email only to confirm this submission.</p>
          </div>

          {meta.paid && (
            <div className="bg-gradient-to-br from-brand-50 to-gold-50 rounded-xl border border-brand-200 p-5">
              <div className="text-xs font-semibold text-ink-600 uppercase tracking-wider">Total</div>
              <div className="font-display text-4xl font-bold text-ink-900 mt-1">${total.toFixed(2)}</div>
              {cfg?.notes && <p className="text-[11px] text-ink-600 mt-2">{cfg.notes}</p>}
              <p className="text-[11px] text-ink-500 mt-2">
                You&apos;ll be invoiced or redirected to secure checkout after submitting.
              </p>
            </div>
          )}

          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-5 py-3 bg-brand-700 text-white font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : meta.paid ? `Submit & Pay $${total.toFixed(2)}` : 'Submit'}
          </button>
        </aside>
      </form>
    </div>
  );
}

function renderFields({ type, cfg, fields, update, selections, select, toggleAddOn }) {
  if (type === 'obituary') return <ObitFields fields={fields} update={update} cfg={cfg} selections={selections} toggleAddOn={toggleAddOn} />;
  if (type === 'classified') return <ClassifiedFields fields={fields} update={update} cfg={cfg} selections={selections} select={select} toggleAddOn={toggleAddOn} />;
  if (type === 'legal') return <LegalFields fields={fields} update={update} cfg={cfg} selections={selections} select={select} toggleAddOn={toggleAddOn} />;
  if (type === 'announcement') return <AnnouncementFields fields={fields} update={update} cfg={cfg} selections={selections} select={select} toggleAddOn={toggleAddOn} />;
  if (type === 'letter') return <LetterFields fields={fields} update={update} cfg={cfg} />;
  if (type === 'tip') return <TipFields fields={fields} update={update} />;
  if (type === 'event') return <EventFields fields={fields} update={update} />;
  if (type === 'advertise') return <AdvertiseFields fields={fields} update={update} />;
  if (type === 'sportsScore') return <SportsScoreFields fields={fields} update={update} />;
  if (type === 'photo') return <PhotoFields fields={fields} update={update} cfg={cfg} />;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Individual form types
// ─────────────────────────────────────────────────────────────────────────

function Text({ label, required, ...rest }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-700">{label}{required && ' *'}</span>
      <input {...rest} required={required} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
    </label>
  );
}
function Textarea({ label, required, rows = 6, ...rest }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-700">{label}{required && ' *'}</span>
      <textarea {...rest} rows={rows} required={required} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
    </label>
  );
}
function AddOns({ addOns, selections, toggleAddOn }) {
  if (!addOns) return null;
  return (
    <div className="pt-3 border-t border-ink-100">
      <div className="text-xs font-semibold text-ink-600 uppercase tracking-wider mb-2">Add-ons</div>
      <div className="space-y-2">
        {Object.entries(addOns).map(([key, a]) => (
          <label key={key} className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={!!selections?.addOns?.[key]} onChange={e => toggleAddOn(key, e.target.checked)} />
            <span className="flex-1 text-ink-700">{a.label}</span>
            <span className="font-semibold text-ink-900">+${a.price}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ObitFields({ fields, update, cfg, selections, toggleAddOn }) {
  return (
    <>
      <Text label="Full name of deceased" required value={fields.name || ''} onChange={e => update('name', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Text label="Date of birth" required type="date" value={fields.dob || ''} onChange={e => update('dob', e.target.value)} />
        <Text label="Date of death" required type="date" value={fields.dod || ''} onChange={e => update('dod', e.target.value)} />
      </div>
      <Text label="City / town" required value={fields.city || ''} onChange={e => update('city', e.target.value)} />
      <Textarea label="Obituary text" required rows={8} value={fields.text || ''} onChange={e => update('text', e.target.value)} />
      <Text label="Funeral home (if any)" value={fields.funeral || ''} onChange={e => update('funeral', e.target.value)} />
      <Text label="Photo URL (temporary — upload support coming)" value={fields.photoUrl || ''} onChange={e => update('photoUrl', e.target.value)} />
      <AddOns addOns={cfg?.addOns} selections={selections} toggleAddOn={toggleAddOn} />
    </>
  );
}

function ClassifiedFields({ fields, update, cfg, selections, select, toggleAddOn }) {
  return (
    <>
      <label className="block">
        <span className="text-xs font-semibold text-ink-700">Category *</span>
        <select required value={fields.category || ''} onChange={e => update('category', e.target.value)} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white">
          <option value="">Choose…</option>
          {(cfg?.categories || []).map(c => <option key={c}>{c}</option>)}
        </select>
      </label>
      <Textarea label="Ad text" required rows={4} value={fields.text || ''} onChange={e => update('text', e.target.value)} />
      <AddOns addOns={cfg?.addOns} selections={selections} toggleAddOn={toggleAddOn} />
    </>
  );
}

function LegalFields({ fields, update, cfg, selections, select, toggleAddOn }) {
  const lines = selections.lines || cfg?.minimumLines || 8;
  return (
    <>
      <Text label="Notice title / case number" required value={fields.title || ''} onChange={e => update('title', e.target.value)} />
      <label className="block">
        <span className="text-xs font-semibold text-ink-700">Notice type *</span>
        <select required value={fields.type || ''} onChange={e => update('type', e.target.value)} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white">
          <option value="">Choose…</option>
          {['Foreclosure', 'Name change', 'Estate / probate', 'Public hearing', 'Bid notice', 'Other'].map(x => <option key={x}>{x}</option>)}
        </select>
      </label>
      <Textarea label="Legal text" required rows={10} value={fields.text || ''} onChange={e => update('text', e.target.value)} />
      <Text label="Number of print runs required" type="number" min="1" value={fields.runsReq || 1} onChange={e => update('runsReq', Number(e.target.value))} />
      <label className="block">
        <span className="text-xs font-semibold text-ink-700">Estimated lines (min {cfg?.minimumLines || 8})</span>
        <input type="number" min={cfg?.minimumLines || 8} value={lines} onChange={e => select('lines', Number(e.target.value))} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm" />
        <span className="text-[11px] text-ink-500">At ${cfg?.perLinePrice || 0}/line.</span>
      </label>
      <AddOns addOns={cfg?.addOns} selections={selections} toggleAddOn={toggleAddOn} />
    </>
  );
}

function AnnouncementFields({ fields, update, cfg, selections, select, toggleAddOn }) {
  return (
    <>
      <label className="block">
        <span className="text-xs font-semibold text-ink-700">Announcement type *</span>
        <select required value={selections.announcementType || ''} onChange={e => select('announcementType', e.target.value)} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white">
          <option value="">Choose…</option>
          {Object.entries(cfg?.types || {}).map(([k, t]) => (
            <option key={k} value={k}>{t.label} — ${t.price}</option>
          ))}
        </select>
      </label>
      <Text label="Names / subject (e.g. John & Jane Doe)" required value={fields.subject || ''} onChange={e => update('subject', e.target.value)} />
      <Text label="Event date" type="date" value={fields.eventDate || ''} onChange={e => update('eventDate', e.target.value)} />
      <Textarea label="Announcement text" required rows={8} value={fields.text || ''} onChange={e => update('text', e.target.value)} />
      <Text label="Photo URL (upload support coming)" value={fields.photoUrl || ''} onChange={e => update('photoUrl', e.target.value)} />
      <AddOns addOns={cfg?.addOns} selections={selections} toggleAddOn={toggleAddOn} />
    </>
  );
}

function LetterFields({ fields, update, cfg }) {
  const limit = cfg?.wordLimit || 500;
  const count = (fields.text || '').trim().split(/\s+/).filter(Boolean).length;
  return (
    <>
      <Text label="City / town" required value={fields.city || ''} onChange={e => update('city', e.target.value)} />
      <Text label="Subject" required value={fields.subject || ''} onChange={e => update('subject', e.target.value)} />
      <label className="block">
        <span className="text-xs font-semibold text-ink-700">Your letter *</span>
        <textarea required rows={10} value={fields.text || ''} onChange={e => update('text', e.target.value)} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
        <span className={`text-[11px] ${count > limit ? 'text-red-600 font-bold' : 'text-ink-500'}`}>{count} / {limit} words</span>
      </label>
    </>
  );
}

function TipFields({ fields, update }) {
  return (
    <>
      <Textarea label="What happened? Include what, where, when, and who." required rows={8} value={fields.text || ''} onChange={e => update('text', e.target.value)} />
      <Text label="Documents / photos (URL for now)" value={fields.attachmentUrl || ''} onChange={e => update('attachmentUrl', e.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!fields.anonymous} onChange={e => update('anonymous', e.target.checked)} />
        <span>Submit anonymously — don&apos;t share my name with the reporter</span>
      </label>
    </>
  );
}

function EventFields({ fields, update }) {
  return (
    <>
      <Text label="Event name" required value={fields.name || ''} onChange={e => update('name', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Text label="Date" type="date" required value={fields.date || ''} onChange={e => update('date', e.target.value)} />
        <Text label="Time" required value={fields.time || ''} onChange={e => update('time', e.target.value)} placeholder="7:00 PM" />
      </div>
      <Text label="Location" required value={fields.location || ''} onChange={e => update('location', e.target.value)} />
      <Textarea label="Description" required rows={5} value={fields.description || ''} onChange={e => update('description', e.target.value)} />
      <Text label="Event image URL (upload support coming)" value={fields.imageUrl || ''} onChange={e => update('imageUrl', e.target.value)} />
    </>
  );
}

function AdvertiseFields({ fields, update }) {
  return (
    <>
      <Text label="Business name" required value={fields.business || ''} onChange={e => update('business', e.target.value)} />
      <Text label="Website" value={fields.website || ''} onChange={e => update('website', e.target.value)} />
      <label className="block">
        <span className="text-xs font-semibold text-ink-700">Budget range</span>
        <select value={fields.budget || ''} onChange={e => update('budget', e.target.value)} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white">
          <option value="">Choose…</option>
          {['Under $500', '$500–$1,500', '$1,500–$5,000', '$5,000+', 'Not sure'].map(x => <option key={x}>{x}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-ink-700">Interested in</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {['Print display ad', 'Web display ad', 'Sponsored content', 'Newsletter sponsorship', 'Social campaign', 'Special section'].map(x => (
            <label key={x} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={(fields.interests || []).includes(x)}
                onChange={e => {
                  const set = new Set(fields.interests || []);
                  e.target.checked ? set.add(x) : set.delete(x);
                  update('interests', [...set]);
                }}
              />
              {x}
            </label>
          ))}
        </div>
      </label>
      <Textarea label="Tell us about your goals" rows={4} value={fields.goals || ''} onChange={e => update('goals', e.target.value)} />
    </>
  );
}

function SportsScoreFields({ fields, update }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Text label="Sport" required value={fields.sport || ''} onChange={e => update('sport', e.target.value)} placeholder="Football" />
        <Text label="Level" value={fields.level || ''} onChange={e => update('level', e.target.value)} placeholder="Varsity" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Text label="Home team" required value={fields.homeTeam || ''} onChange={e => update('homeTeam', e.target.value)} />
        <Text label="Away team" required value={fields.awayTeam || ''} onChange={e => update('awayTeam', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Text label="Home score" required type="number" value={fields.homeScore ?? ''} onChange={e => update('homeScore', e.target.value)} />
        <Text label="Away score" required type="number" value={fields.awayScore ?? ''} onChange={e => update('awayScore', e.target.value)} />
      </div>
      <Text label="Date played" type="date" required value={fields.datePlayed || ''} onChange={e => update('datePlayed', e.target.value)} />
      <Textarea label="Game summary / stat leaders (optional)" rows={4} value={fields.summary || ''} onChange={e => update('summary', e.target.value)} />
    </>
  );
}

function PhotoFields({ fields, update, cfg }) {
  return (
    <>
      <Text label="Photo title / caption" required value={fields.caption || ''} onChange={e => update('caption', e.target.value)} />
      <Text label="Location where photo was taken" value={fields.location || ''} onChange={e => update('location', e.target.value)} />
      <Text label="Date taken" type="date" value={fields.dateTaken || ''} onChange={e => update('dateTaken', e.target.value)} />
      <Text label="Photo URL *" required value={fields.photoUrl || ''} onChange={e => update('photoUrl', e.target.value)} placeholder="Paste a link to your photo (upload support coming)" />
      <label className="flex items-start gap-2 text-sm">
        <input required type="checkbox" checked={!!fields.rightsGrant} onChange={e => update('rightsGrant', e.target.checked)} />
        <span className="text-xs text-ink-600">
          I certify this is my original photo and grant WV News a non-exclusive license to publish and promote it. Max {cfg?.maxMB || 20} MB.
        </span>
      </label>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Confirmation
// ─────────────────────────────────────────────────────────────────────────

function ConfirmationScreen({ confirmation, onDone }) {
  const { meta, requiresPayment, amount, id } = confirmation;
  return (
    <div className="bg-white rounded-xl border border-ink-200 p-10 text-center max-w-2xl mx-auto">
      <div className="text-6xl mb-4">{meta.icon}</div>
      <h2 className="font-display text-3xl font-bold text-ink-900">
        {requiresPayment ? 'Submission received — payment next' : 'Submission received'}
      </h2>
      <p className="text-ink-600 mt-3">
        {requiresPayment
          ? <>Your {meta.label.toLowerCase()} is saved in our queue as <code className="text-xs bg-ink-100 px-1.5 py-0.5 rounded font-mono">{id}</code>. We&apos;ll email you a secure payment link shortly (${amount.toFixed(2)}).</>
          : <>Thanks — we&apos;ve got it. Confirmation ID: <code className="text-xs bg-ink-100 px-1.5 py-0.5 rounded font-mono">{id}</code>. A staff member will review and reach out if we need anything else.</>
        }
      </p>
      <div className="mt-8 flex gap-3 justify-center">
        <button onClick={onDone} className="px-5 py-2.5 bg-brand-700 text-white font-semibold rounded-lg hover:bg-brand-600">
          Submit another
        </button>
        <Link href="/" className="px-5 py-2.5 bg-white text-ink-700 font-semibold rounded-lg border border-ink-200 hover:bg-ink-50">
          Back to home
        </Link>
      </div>
    </div>
  );
}
