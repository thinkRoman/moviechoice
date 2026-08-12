'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Edit3, KeyRound, Mail, MessageCircle, Phone, RefreshCw, UserPlus, UserRound, X } from 'lucide-react';
import type { SafeAccessUser } from '@/lib/access';

const COUNTRY_CODES = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+1', country: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+31', country: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46', country: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: '+47', country: 'NO', flag: '🇳🇴', name: 'Norway' },
  { code: '+45', country: 'DK', flag: '🇩🇰', name: 'Denmark' },
  { code: '+358', country: 'FI', flag: '🇫🇮', name: 'Finland' },
  { code: '+351', country: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: '+48', country: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: '+27', country: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+60', country: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+63', country: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: '+62', country: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+66', country: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: '+84', country: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+234', country: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', country: 'KE', flag: '🇰🇪', name: 'Kenya' },
  { code: '+20', country: 'EG', flag: '🇪🇬', name: 'Egypt' },
  { code: '+212', country: 'MA', flag: '🇲🇦', name: 'Morocco' },
  { code: '+90', country: 'TR', flag: '🇹🇷', name: 'Turkey' },
  { code: '+92', country: 'PK', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', country: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+94', country: 'LK', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+977', country: 'NP', flag: '🇳🇵', name: 'Nepal' },
  { code: '+972', country: 'IL', flag: '🇮🇱', name: 'Israel' },
  { code: '+973', country: 'BH', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+974', country: 'QA', flag: '🇶🇦', name: 'Qatar' },
  { code: '+968', country: 'OM', flag: '🇴🇲', name: 'Oman' },
  { code: '+965', country: 'KW', flag: '🇰🇼', name: 'Kuwait' },
];

export default function UserAccessClient() {
  const [users, setUsers] = useState<SafeAccessUser[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [notifyVia, setNotifyVia] = useState<'email' | 'whatsapp' | 'both'>('email');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingUser, setEditingUser] = useState<SafeAccessUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCountryCode, setEditCountryCode] = useState('+1');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editNotifyVia, setEditNotifyVia] = useState<'email' | 'whatsapp' | 'both'>('email');
  const [editBusy, setEditBusy] = useState(false);

  async function loadUsers() {
    const response = await fetch('/api/settings/user-access', {
      cache: 'no-store',
      credentials: 'include',
    });
    if (response.ok) setUsers((await response.json()).users);
  }

  useEffect(() => {
    fetch('/api/settings/user-access', { cache: 'no-store', credentials: 'include' })
      .then(async (response) => {
        if (response.ok) setUsers((await response.json()).users);
        else setMessage('Could not load users.');
      })
      .catch(() => setMessage('Could not load users.'));
  }, []);

  async function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pin.length !== 6) {
      setMessage('Enter a 6-digit PIN to email with the invite.');
      return;
    }
    if (notifyVia === 'whatsapp' && !whatsappNumber) {
      setMessage('Enter a WhatsApp number or change notification to Email.');
      return;
    }
    setBusy(true);
    setMessage('');
    const response = await fetch('/api/settings/user-access', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        pin,
        countryCode,
        whatsappNumber: whatsappNumber.trim(),
        notifyVia,
      }),
    });
    const body = await response.json().catch(() => ({})) as {
      error?: string;
      message?: string;
      emailed?: boolean;
      pin?: string;
    };
    setBusy(false);
    if (response.ok) {
      setMessage(body.message || (body.emailed ? 'User added and PIN emailed.' : 'User added.'));
      setName('');
      setEmail('');
      setPin('');
      setWhatsappNumber('');
      setNotifyVia('email');
      await loadUsers();
      return;
    }
    setMessage(body.error || body.message || 'Could not invite user.');
  }

  async function setStatus(user: SafeAccessUser) {
    setBusy(true);
    const status = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const response = await fetch(`/api/settings/user-access/${user.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setMessage(response.ok ? `User ${status === 'ACTIVE' ? 'reactivated' : 'suspended'}.` : 'Could not update user.');
    setBusy(false);
    if (response.ok) await loadUsers();
  }

  async function regenerate(user: SafeAccessUser) {
    setBusy(true);
    const response = await fetch(`/api/settings/user-access/${user.id}/regenerate-pin`, {
      method: 'POST',
      credentials: 'include',
    });
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
    setMessage(response.ok ? (body.message || 'A new PIN was emailed.') : (body.error || 'Could not regenerate PIN.'));
    setBusy(false);
  }

  function openEdit(user: SafeAccessUser) {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditCountryCode(user.countryCode || '+1');
    setEditWhatsapp(user.whatsappNumber || '');
    setEditNotifyVia(user.notifyVia || 'email');
  }

  function closeEdit() {
    setEditingUser(null);
    setEditBusy(false);
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    if (editNotifyVia === 'whatsapp' && !editWhatsapp) {
      setMessage('Enter a WhatsApp number or change notification to Email.');
      return;
    }
    setEditBusy(true);
    const response = await fetch(`/api/settings/user-access/${editingUser.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName.trim(),
        email: editEmail.trim(),
        countryCode: editCountryCode,
        whatsappNumber: editWhatsapp.trim(),
        notifyVia: editNotifyVia,
      }),
    });
    const body = await response.json().catch(() => ({})) as { error?: string };
    setEditBusy(false);
    if (response.ok) {
      setMessage(`${editName}'s details updated.`);
      closeEdit();
      await loadUsers();
    } else {
      setMessage(body.error || 'Could not update user.');
    }
  }

  function getNotifyLabel(via: string) {
    switch (via) {
      case 'email': return 'Email only';
      case 'whatsapp': return 'WhatsApp only';
      case 'both': return 'Email + WhatsApp';
      default: return 'Email only';
    }
  }

  return (
    <main className="min-h-screen bg-[#08090d] px-4 pb-28 pt-6 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/settings" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>

        <h1 className="font-serif text-4xl font-bold tracking-tight">User Access</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
          Invite people with name, email, and a 6-digit PIN. Choose how to send the invite — email, WhatsApp, or both.
        </p>

        <form
          onSubmit={addUser}
          className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6"
        >
          {/* Name */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Name</span>
            <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3">
              <UserRound className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Alex"
                className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-zinc-600"
              />
            </span>
          </label>

          {/* Email */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Email</span>
            <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3">
              <Mail className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-zinc-600"
              />
            </span>
          </label>

          {/* PIN */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">6-digit PIN</span>
            <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3">
              <KeyRound className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                required
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full bg-transparent py-3.5 text-sm tracking-[0.35em] text-white outline-none placeholder:tracking-normal placeholder:text-zinc-600"
              />
            </span>
            <span className="mt-1.5 block text-xs text-zinc-500">This PIN is emailed to them and used to sign in.</span>
          </label>

          {/* WhatsApp Number (Optional) */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">WhatsApp (optional)</span>
            </div>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                className="w-36 shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-violet-400/60"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={`${c.code}-${c.country}`} value={c.code} className="bg-[#1a1525] text-white">
                    {c.flag} {c.code} ({c.country})
                  </option>
                ))}
              </select>
              <input
                type="tel"
                inputMode="numeric"
                value={whatsappNumber}
                onChange={(event) => setWhatsappNumber(event.target.value.replace(/[^\d]/g, ''))}
                placeholder="650 555 1234"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60"
              />
            </div>
          </div>

          {/* Notification Preference */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-zinc-500" />
              <MessageCircle className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">How to send the invite</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['email', 'whatsapp', 'both'] as const).map((via) => (
                <button
                  key={via}
                  type="button"
                  onClick={() => setNotifyVia(via)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    notifyVia === via
                      ? 'border border-violet-400/60 bg-violet-500/20 text-violet-100'
                      : 'border border-white/10 bg-white/[0.035] text-zinc-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {notifyVia === via && <Check className="h-3.5 w-3.5" />}
                  {via === 'email' && <><Mail className="h-3.5 w-3.5" /> Email</>}
                  {via === 'whatsapp' && <><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</>}
                  {via === 'both' && <><Mail className="h-3.5 w-3.5" /> + <MessageCircle className="h-3.5 w-3.5" /> Both</>}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {notifyVia === 'email' && 'PIN will be sent via email using Resend.'}
              {notifyVia === 'whatsapp' && 'PIN will be sent via WhatsApp message.'}
              {notifyVia === 'both' && 'PIN will be sent via both email and WhatsApp.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={busy || pin.length !== 6}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {busy ? 'Sending invite…' : `Add user and send via ${getNotifyLabel(notifyVia)}`}
          </button>
        </form>

        {message ? (
          <p className="mt-4 rounded-2xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
            {message}
          </p>
        ) : null}

        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-500">People</h2>
          {users.map((user) => (
            <div key={user.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{user.name}</p>
                  <p className="truncate text-sm text-zinc-400">{user.email}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {user.role} · {user.status}
                    </span>
                    {user.notifyVia && user.notifyVia !== 'email' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                        {user.notifyVia === 'whatsapp' ? '📱 WhatsApp' : '📧 + 📱 Both'}
                      </span>
                    ) : null}
                    {user.whatsappNumber ? (
                      <span className="text-xs text-zinc-500">
                        {COUNTRY_CODES.find((c) => c.code === user.countryCode)?.flag} {user.countryCode} {user.whatsappNumber}
                      </span>
                    ) : null}
                  </div>
                </div>
                {user.role === 'MEMBER' ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openEdit(user)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/25 disabled:opacity-50"
                    >
                      <Edit3 className="h-3 w-3" /> Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void regenerate(user)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-zinc-200 disabled:opacity-50"
                    >
                      <RefreshCw className="h-3 w-3" /> Resend new PIN
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void setStatus(user)}
                      className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-zinc-200 disabled:opacity-50"
                    >
                      {user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEdit} />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#14101e] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Edit {editingUser.name}</h2>
              <button
                type="button"
                onClick={closeEdit}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              {/* Name */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Name</span>
                <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3">
                  <UserRound className="h-4 w-4 shrink-0 text-zinc-500" />
                  <input
                    required
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className="w-full bg-transparent py-3.5 text-sm text-white outline-none"
                  />
                </span>
              </label>

              {/* Email */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Email</span>
                <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3">
                  <Mail className="h-4 w-4 shrink-0 text-zinc-500" />
                  <input
                    required
                    type="email"
                    value={editEmail}
                    onChange={(event) => setEditEmail(event.target.value)}
                    className="w-full bg-transparent py-3.5 text-sm text-white outline-none"
                  />
                </span>
              </label>

              {/* WhatsApp */}
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-zinc-500" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">WhatsApp</span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={editCountryCode}
                    onChange={(event) => setEditCountryCode(event.target.value)}
                    className="w-36 shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-violet-400/60"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={`${c.code}-${c.country}`} value={c.code} className="bg-[#1a1525] text-white">
                        {c.flag} {c.code} ({c.country})
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={editWhatsapp}
                    onChange={(event) => setEditWhatsapp(event.target.value.replace(/[^\d]/g, ''))}
                    placeholder="650 555 1234"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60"
                  />
                </div>
              </div>

              {/* Notification Preference */}
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-zinc-500" />
                  <MessageCircle className="h-4 w-4 text-zinc-500" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Weekly picks notification</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['email', 'whatsapp', 'both'] as const).map((via) => (
                    <button
                      key={via}
                      type="button"
                      onClick={() => setEditNotifyVia(via)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        editNotifyVia === via
                          ? 'border border-violet-400/60 bg-violet-500/20 text-violet-100'
                          : 'border border-white/10 bg-white/[0.035] text-zinc-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {editNotifyVia === via && <Check className="h-3.5 w-3.5" />}
                      {via === 'email' && <><Mail className="h-3.5 w-3.5" /> Email</>}
                      {via === 'whatsapp' && <><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</>}
                      {via === 'both' && <><Mail className="h-3.5 w-3.5" /> + <MessageCircle className="h-3.5 w-3.5" /> Both</>}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {editNotifyVia === 'email' && 'Weekly picks sent via email.'}
                  {editNotifyVia === 'whatsapp' && 'Weekly picks sent via WhatsApp.'}
                  {editNotifyVia === 'both' && 'Weekly picks sent via both channels.'}
                </p>
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editBusy}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {editBusy ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
