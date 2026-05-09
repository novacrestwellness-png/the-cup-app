import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo('Check your email to confirm your account, then sign in.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{
      background: 'linear-gradient(180deg, #1a0f0a 0%, #2d1810 40%, #3d2418 100%)',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
        .display-font { font-family: 'Fraunces', serif; }
      `}</style>

      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-amber-200/50 text-xs uppercase tracking-[0.3em] mb-3">welcome to</p>
          <h1 className="display-font text-amber-50 text-5xl italic">The Cup</h1>
          <p className="text-amber-200/60 text-sm mt-3 italic display-font">A space to fill, daily.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3.5 rounded-xl text-amber-50 text-sm focus:outline-none"
            style={{
              background: 'rgba(251, 191, 36, 0.04)',
              border: '1px solid rgba(251, 191, 36, 0.2)'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3.5 rounded-xl text-amber-50 text-sm focus:outline-none"
            style={{
              background: 'rgba(251, 191, 36, 0.04)',
              border: '1px solid rgba(251, 191, 36, 0.2)'
            }}
          />

          {error && (
            <div className="px-4 py-2.5 rounded-xl text-rose-200 text-xs"
                 style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
              {error}
            </div>
          )}
          {info && (
            <div className="px-4 py-2.5 rounded-xl text-emerald-200 text-xs"
                 style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-medium text-amber-950 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
          >
            {loading ? '...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo(''); }}
          className="w-full text-center mt-6 text-amber-200/60 text-sm"
        >
          {mode === 'signin' ? "First time? Create an account" : 'Already have one? Sign in'}
        </button>
      </div>
    </div>
  );
}
