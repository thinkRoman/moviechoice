'use client';

import { FormEvent, useEffect, useState } from 'react';

interface Take {
  id: string;
  authorName: string;
  body: string;
  sharedWithFamily: boolean;
  mine: boolean;
  createdAt: string;
}

export default function FamilyTakes({
  mediaType,
  tmdbId,
}: {
  mediaType: 'movie' | 'tv';
  tmdbId: number;
}) {
  const [takes, setTakes] = useState<Take[]>([]);
  const [body, setBody] = useState('');
  const [sharedWithFamily, setSharedWithFamily] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    const response = await fetch(`/api/family-takes?mediaType=${mediaType}&tmdbId=${tmdbId}`, { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json() as { takes: Take[] };
    setTakes(payload.takes || []);
  }

  useEffect(() => {
    void load();
  }, [mediaType, tmdbId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setMessage('');
    const response = await fetch('/api/family-takes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaType, tmdbId, body, sharedWithFamily }),
    });
    setBusy(false);
    if (!response.ok) {
      setMessage('Could not post your take.');
      return;
    }
    setBody('');
    await load();
  }

  return (
    <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
      <h4 className="text-sm font-black text-zinc-900">Family Takes</h4>
      <form onSubmit={submit} className="mt-3 space-y-2">
        <div className="flex gap-2">
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={280}
            placeholder="Add your take..."
            className="min-h-11 flex-1 rounded-xl border border-violet-100 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-violet-300"
          />
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className="rounded-xl bg-violet-600 px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            Post
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
          <input
            type="checkbox"
            checked={sharedWithFamily}
            onChange={(event) => setSharedWithFamily(event.target.checked)}
            className="accent-violet-600"
          />
          Share with family (uncheck to keep private)
        </label>
      </form>
      {message ? <p className="mt-2 text-xs text-rose-600">{message}</p> : null}
      <ul className="mt-3 space-y-2">
        {takes.map((take) => (
          <li key={take.id} className="rounded-xl bg-white/80 px-3 py-2 text-sm text-zinc-700">
            <span className="font-bold text-zinc-900">{take.authorName}</span>
            <span className="text-zinc-400"> · </span>
            {take.body}
          </li>
        ))}
      </ul>
    </div>
  );
}
