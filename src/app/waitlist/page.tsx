'use client'
import React, { useState } from 'react';

export default function WaitlistAdminPage() {
  const [password, setPassword] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSubmitted(false);
    try {
      const res = await fetch('/api/waitlist-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails);
        setSubmitted(true);
      } else {
        setError('Incorrect password or failed to fetch waitlist.');
      }
    } catch {
      setError('Failed to fetch waitlist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white/10 border border-white/20 rounded-2xl shadow-xl p-8 max-w-md w-full backdrop-blur-lg">
        <h1 className="text-2xl font-bold text-white mb-6 text-center font-bebas tracking-wide">Waitlist Admin</h1>
        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="px-4 py-3 rounded-lg bg-white/20 border border-saffron/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-saffron"
            />
            <button
              type="submit"
              className="bg-saffron text-primary px-6 py-3 rounded-lg font-semibold shadow hover:bg-saffron/90 transition-colors"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'View Waitlist'}
            </button>
            {error && <div className="text-red-400 text-center mt-2">{error}</div>}
          </form>
        ) : (
          <div>
            <h2 className="text-lg font-bold text-saffron mb-4 text-center">Waitlist Emails</h2>
            <div className="bg-white/10 rounded-lg p-4 max-h-96 overflow-y-auto text-white text-sm">
              {emails.length === 0 ? (
                <div className="text-center text-white/60">No emails yet.</div>
              ) : (
                <ul className="space-y-1">
                  {emails.map((email, i) => (
                    <li key={i} className="break-all">{email}</li>
                  ))}
                </ul>
              )}
            </div>
            <button
              className="mt-6 w-full bg-saffron text-primary px-6 py-3 rounded-lg font-semibold shadow hover:bg-saffron/90 transition-colors"
              onClick={() => { setSubmitted(false); setPassword(''); setEmails([]); }}
            >
              Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 