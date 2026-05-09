import React, { useState, useEffect } from 'react';
import { Droplet, Apple, Pill, Wind, Moon, Heart, Sparkles, TrendingUp, Check, ChevronLeft, ChevronRight, Flame, Star, LogOut, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Tracker({ session, isClinicianView, viewingClientId, onBack }) {
  const [view, setView] = useState('today');
  const [today, setToday] = useState(getDateKey(new Date()));
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientEmail, setClientEmail] = useState('');

  const userId = isClinicianView ? viewingClientId : session.user.id;

  function getDateKey(date) {
    return date.toISOString().split('T')[0];
  }

  function defaultDay() {
    return {
      water: 0,
      meals: 0,
      meds: {
        quetiapineMorning: false,
        quetiapineAfternoon: false,
        quetiapineEvening: false,
        quetiapineBedtime: false,
        buspironeMorning: false,
        buspironeBedtime: false
      },
      multivitamin: false,
      movement: '',
      sleep: '',
      groundingDone: false,
      gratitude: ['', '', ''],
      intention: '',
      affirmation: '',
      feelingNote: '',
      actionTaken: '',
      mood: 0
    };
  }

  function getTodayData() {
    return data[today] || defaultDay();
  }

  function medsCount(d) {
    const m = d.meds || {};
    return [m.quetiapineMorning, m.quetiapineAfternoon, m.quetiapineEvening,
            m.quetiapineBedtime, m.buspironeMorning, m.buspironeBedtime].filter(Boolean).length;
  }

  // Load all entries for this user
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false });
      if (!error && rows) {
        const loaded = {};
        rows.forEach(r => {
          loaded[r.entry_date] = r.payload;
        });
        setData(loaded);
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  async function updateToday(updates) {
    if (isClinicianView) return; // read-only
    const current = getTodayData();
    const updated = { ...current, ...updates };
    const newData = { ...data, [today]: updated };
    setData(newData);
    setSaving(true);
    try {
      await supabase.from('daily_entries').upsert({
        user_id: userId,
        entry_date: today,
        payload: updated,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,entry_date' });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setSaving(false), 600);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const t = getTodayData();

  function foundationScore(d) {
    let score = 0;
    score += Math.min(d.water || 0, 8) * 6.25;
    if (d.meals >= 1) score += 10;
    if (d.meals >= 2) score += 5;
    score += (medsCount(d) / 6) * 20;
    if (d.multivitamin) score += 10;
    if (d.movement) score += 5;
    return Math.min(Math.round(score), 100);
  }

  function mindScore(d) {
    let score = 0;
    const filledGratitude = (d.gratitude || []).filter(g => g && g.trim()).length;
    score += filledGratitude * 20;
    if (d.intention?.trim()) score += 15;
    if (d.affirmation?.trim()) score += 10;
    if (d.actionTaken?.trim()) score += 15;
    return Math.min(Math.round(score), 100);
  }

  const fScore = foundationScore(t);
  const mScore = mindScore(t);
  const overallScore = Math.round((fScore + mScore) / 2);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a0f0a' }}>
        <div className="text-amber-100/70 text-sm tracking-wider">loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{
      background: 'linear-gradient(180deg, #1a0f0a 0%, #2d1810 40%, #3d2418 100%)',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        .display-font { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
        @keyframes shimmer { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes ripple { 0% { transform: translateY(0) scaleX(1); } 50% { transform: translateY(-2px) scaleX(1.02); } 100% { transform: translateY(0) scaleX(1); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.2); } 50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.4); } }
        .cup-water { animation: ripple 3s ease-in-out infinite; }
        .star-shimmer { animation: shimmer 2s ease-in-out infinite; }
        .glow-effect { animation: glow 3s ease-in-out infinite; }
        .input-warm { background: rgba(251, 191, 36, 0.04); border: 1px solid rgba(251, 191, 36, 0.15); color: #fef3c7; transition: all 0.2s; }
        .input-warm:focus { outline: none; border-color: rgba(251, 191, 36, 0.5); background: rgba(251, 191, 36, 0.08); }
        .input-warm::placeholder { color: rgba(254, 243, 199, 0.35); }
        .nav-pill { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .check-button { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .check-button:active { transform: scale(0.96); }
        .grain { position: fixed; inset: 0; opacity: 0.04; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
      `}</style>

      <div className="grain"></div>

      {/* Clinician view banner */}
      {isClinicianView && (
        <div className="relative z-10 px-5 pt-4">
          <div className="rounded-xl px-4 py-2.5 flex items-center justify-between" style={{
            background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)'
          }}>
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-amber-300" />
              <span className="text-amber-100 text-xs">Viewing client (read-only)</span>
            </div>
            <button onClick={onBack} className="text-amber-200 text-xs underline">back</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 px-5 pt-6 pb-6">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-amber-200/50 text-xs uppercase tracking-[0.2em] mb-1">
              {new Date(today + 'T12:00').toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
            <h1 className="display-font text-amber-50 text-3xl leading-none">
              {new Date(today + 'T12:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {saving && (
              <div className="flex items-center gap-1.5 text-amber-300/60 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-300 star-shimmer"></div>
                saved
              </div>
            )}
            {!isClinicianView && (
              <button onClick={signOut} className="text-amber-200/40 hover:text-amber-200/80">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
        <p className="display-font italic text-amber-200/70 text-base mt-3 leading-snug">
          {getGreeting()}
        </p>
      </div>

      {/* Nav */}
      <div className="relative z-10 px-5 mb-6">
        <div className="flex gap-1.5 p-1 rounded-full" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'Week' },
            { id: 'reflect', label: 'Reflect' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`nav-pill flex-1 py-2.5 px-4 rounded-full text-sm font-medium ${
                view === tab.id ? 'bg-amber-100 text-amber-950' : 'text-amber-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'today' && (
        <div className="relative z-10 px-5 space-y-5">
          {/* The Cup */}
          <div className="relative rounded-3xl p-6 overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(120, 53, 15, 0.4), rgba(69, 26, 3, 0.4))',
            border: '1px solid rgba(251, 191, 36, 0.15)'
          }}>
            <div className="flex items-center gap-5">
              <div className="relative w-24 h-32 flex-shrink-0">
                <svg viewBox="0 0 100 130" className="w-full h-full">
                  <defs>
                    <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
                    </linearGradient>
                    <clipPath id="cupClip">
                      <path d="M 18 18 L 82 18 L 76 118 Q 76 122 72 122 L 28 122 Q 24 122 24 118 Z" />
                    </clipPath>
                  </defs>
                  <path d="M 18 18 L 82 18 L 76 118 Q 76 122 72 122 L 28 122 Q 24 122 24 118 Z"
                    fill="none" stroke="rgba(251, 191, 36, 0.4)" strokeWidth="1.5" />
                  <g clipPath="url(#cupClip)">
                    <rect x="0" y={130 - (overallScore * 1.0)} width="100" height="130"
                      fill="url(#waterGrad)" className="cup-water" />
                  </g>
                  <ellipse cx="50" cy="18" rx="32" ry="3" fill="rgba(251, 191, 36, 0.3)" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-amber-200/50 text-[11px] uppercase tracking-widest mb-1">Your Cup Today</p>
                <p className="display-font text-amber-50 text-4xl leading-none mb-2">{overallScore}<span className="text-amber-200/40 text-2xl">%</span></p>
                <p className="text-amber-100/70 text-xs leading-relaxed">
                  {overallScore < 30 && "Start where you are. Even one sip counts."}
                  {overallScore >= 30 && overallScore < 60 && "You're filling. Keep going."}
                  {overallScore >= 60 && overallScore < 85 && "Look at you. Cup's getting full."}
                  {overallScore >= 85 && "You showed up for yourself today. ✨"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-5 pt-5 border-t border-amber-200/10">
              <div>
                <p className="text-amber-200/40 text-[10px] uppercase tracking-widest">Body</p>
                <p className="display-font text-amber-50 text-xl mt-0.5">{fScore}%</p>
              </div>
              <div>
                <p className="text-amber-200/40 text-[10px] uppercase tracking-widest">Mind</p>
                <p className="display-font text-amber-50 text-xl mt-0.5">{mScore}%</p>
              </div>
            </div>
          </div>

          {/* Body section */}
          <div>
            <div className="flex items-baseline gap-2 mb-3 px-1">
              <span className="display-font text-amber-100 text-xl">Body first</span>
              <span className="text-amber-200/40 text-xs italic">— before everything else</span>
            </div>

            {/* Water */}
            <div className="rounded-2xl p-5 mb-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251, 191, 36, 0.08)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <Droplet size={18} className="text-blue-300" />
                  <span className="text-amber-50 font-medium">Water</span>
                </div>
                <span className="text-amber-200/60 text-sm">{t.water || 0} of 8 cups</span>
              </div>
              <div className="flex gap-1.5">
                {[...Array(8)].map((_, i) => (
                  <button key={i}
                    onClick={() => updateToday({ water: i < (t.water || 0) ? i : i + 1 })}
                    className="check-button flex-1 h-9 rounded-lg"
                    style={{
                      background: i < (t.water || 0) ? 'linear-gradient(135deg, #60a5fa, #3b82f6)' : 'rgba(255,255,255,0.05)',
                      border: i < (t.water || 0) ? 'none' : '1px solid rgba(255,255,255,0.1)'
                    }} />
                ))}
              </div>
              <p className="text-amber-200/40 text-[11px] mt-2.5 italic">Tap a cup. Anxiety lives in dehydration.</p>
            </div>

            {/* Meals */}
            <div className="rounded-2xl p-5 mb-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251, 191, 36, 0.08)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <Apple size={18} className="text-rose-300" />
                  <span className="text-amber-50 font-medium">Meals eaten</span>
                </div>
                <span className="text-amber-200/60 text-sm">{t.meals || 0} today</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map(n => (
                  <button key={n}
                    onClick={() => updateToday({ meals: t.meals === n ? n - 1 : n })}
                    className="check-button flex-1 py-3 rounded-xl text-sm font-medium"
                    style={{
                      background: (t.meals || 0) >= n ? 'linear-gradient(135deg, #fb923c, #f97316)' : 'rgba(255,255,255,0.05)',
                      color: (t.meals || 0) >= n ? '#fff' : 'rgba(254, 243, 199, 0.5)',
                      border: (t.meals || 0) >= n ? 'none' : '1px solid rgba(255,255,255,0.1)'
                    }}>
                    {n} {n === 1 ? 'meal' : 'meals'}
                  </button>
                ))}
              </div>
              <p className="text-amber-200/40 text-[11px] mt-2.5 italic">Even one. OMAD counts. Just eat something.</p>
            </div>

            {/* Multivitamin */}
            <button onClick={() => updateToday({ multivitamin: !t.multivitamin })}
              className="check-button w-full rounded-2xl p-4 mb-3 text-left"
              style={{
                background: t.multivitamin ? 'linear-gradient(135deg, #84cc16, #65a30d)' : 'rgba(0,0,0,0.25)',
                border: t.multivitamin ? 'none' : '1px solid rgba(251, 191, 36, 0.08)'
              }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={18} className={t.multivitamin ? 'text-white' : 'text-lime-300'} />
                  <div>
                    <p className={`text-sm font-medium ${t.multivitamin ? 'text-white' : 'text-amber-50'}`}>Multivitamin</p>
                    <p className={`text-[11px] ${t.multivitamin ? 'text-white/80' : 'text-amber-200/40'}`}>
                      {t.multivitamin ? 'Done ✓' : "Especially when you don't eat much"}
                    </p>
                  </div>
                </div>
                {t.multivitamin && <Check size={20} className="text-white" />}
              </div>
            </button>

            {/* Med schedule */}
            <div className="rounded-2xl p-5 mb-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251, 191, 36, 0.08)' }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5">
                  <Pill size={18} className="text-purple-300" />
                  <span className="text-amber-50 font-medium">Medication schedule</span>
                </div>
                <span className="display-font text-purple-200/80 text-sm">{medsCount(t)}<span className="text-purple-200/40 text-xs"> / 6</span></span>
              </div>
              <p className="text-amber-200/40 text-[11px] italic mb-4">Tap each dose when you take it.</p>

              <div className="mb-3">
                <p className="text-amber-200/60 text-[10px] uppercase tracking-widest mb-1.5">☀ Morning</p>
                <div className="grid grid-cols-2 gap-2">
                  <MedDoseButton label="Seroquel 50mg" hint="tap when taken" taken={t.meds?.quetiapineMorning} color="purple"
                    onClick={() => updateToday({ meds: { ...t.meds, quetiapineMorning: !t.meds?.quetiapineMorning } })} />
                  <MedDoseButton label="Buspirone 10mg" hint="tap when taken" taken={t.meds?.buspironeMorning} color="sky"
                    onClick={() => updateToday({ meds: { ...t.meds, buspironeMorning: !t.meds?.buspironeMorning } })} />
                </div>
              </div>
              <div className="mb-3">
                <p className="text-amber-200/60 text-[10px] uppercase tracking-widest mb-1.5">◐ Afternoon</p>
                <MedDoseButton fullWidth label="Seroquel 50mg" hint="tap when taken" taken={t.meds?.quetiapineAfternoon} color="purple"
                  onClick={() => updateToday({ meds: { ...t.meds, quetiapineAfternoon: !t.meds?.quetiapineAfternoon } })} />
              </div>
              <div className="mb-3">
                <p className="text-amber-200/60 text-[10px] uppercase tracking-widest mb-1.5">☾ Evening</p>
                <MedDoseButton fullWidth label="Seroquel 50mg" hint="tap when taken" taken={t.meds?.quetiapineEvening} color="purple"
                  onClick={() => updateToday({ meds: { ...t.meds, quetiapineEvening: !t.meds?.quetiapineEvening } })} />
              </div>
              <div>
                <p className="text-amber-200/60 text-[10px] uppercase tracking-widest mb-1.5">★ Bedtime</p>
                <div className="grid grid-cols-2 gap-2">
                  <MedDoseButton label="Seroquel 200mg" hint="helps with sleep" taken={t.meds?.quetiapineBedtime} color="indigo"
                    onClick={() => updateToday({ meds: { ...t.meds, quetiapineBedtime: !t.meds?.quetiapineBedtime } })} />
                  <MedDoseButton label="Buspirone 10mg" hint="tap when taken" taken={t.meds?.buspironeBedtime} color="sky"
                    onClick={() => updateToday({ meds: { ...t.meds, buspironeBedtime: !t.meds?.buspironeBedtime } })} />
                </div>
              </div>
            </div>

            {/* Movement */}
            <div className="rounded-2xl p-5 mb-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251, 191, 36, 0.08)' }}>
              <div className="flex items-center gap-2.5 mb-3">
                <Wind size={18} className="text-teal-300" />
                <span className="text-amber-50 font-medium">Movement / cleaning / outside</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {['Walked', 'Cleaned', 'Stretched', 'Went outside'].map(option => (
                  <button key={option}
                    onClick={() => updateToday({ movement: t.movement === option ? '' : option })}
                    className="check-button py-2.5 px-3 rounded-xl text-sm"
                    style={{
                      background: t.movement === option ? 'linear-gradient(135deg, #2dd4bf, #14b8a6)' : 'rgba(255,255,255,0.05)',
                      color: t.movement === option ? '#fff' : 'rgba(254, 243, 199, 0.7)',
                      border: t.movement === option ? 'none' : '1px solid rgba(255,255,255,0.1)'
                    }}>
                    {option}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="or write something else..."
                value={t.movement && !['Walked', 'Cleaned', 'Stretched', 'Went outside'].includes(t.movement) ? t.movement : ''}
                onChange={e => updateToday({ movement: e.target.value })}
                className="input-warm w-full px-4 py-2.5 rounded-xl text-sm" />
            </div>

            {/* Sleep */}
            <div className="rounded-2xl p-5 mb-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251, 191, 36, 0.08)' }}>
              <div className="flex items-center gap-2.5 mb-3">
                <Moon size={18} className="text-indigo-300" />
                <span className="text-amber-50 font-medium">Last night's sleep</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: 'rough', label: 'Rough', color: '#ef4444' },
                  { val: 'broken', label: 'Broken', color: '#f97316' },
                  { val: 'okay', label: 'Okay', color: '#eab308' },
                  { val: 'rested', label: 'Rested', color: '#84cc16' }
                ].map(opt => (
                  <button key={opt.val}
                    onClick={() => updateToday({ sleep: t.sleep === opt.val ? '' : opt.val })}
                    className="check-button py-3 rounded-xl text-xs font-medium"
                    style={{
                      background: t.sleep === opt.val ? opt.color : 'rgba(255,255,255,0.05)',
                      color: t.sleep === opt.val ? '#fff' : 'rgba(254, 243, 199, 0.6)',
                      border: t.sleep === opt.val ? 'none' : '1px solid rgba(255,255,255,0.1)'
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grounding */}
            <button onClick={() => updateToday({ groundingDone: !t.groundingDone })}
              className="check-button w-full rounded-2xl p-5 text-left"
              style={{
                background: t.groundingDone ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(0,0,0,0.25)',
                border: t.groundingDone ? 'none' : '1px solid rgba(251, 191, 36, 0.08)'
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Wind size={18} className={t.groundingDone ? 'text-white' : 'text-amber-300'} />
                    <span className={`font-medium ${t.groundingDone ? 'text-white' : 'text-amber-50'}`}>
                      Grounding or breathing
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1.5 ${t.groundingDone ? 'text-white/80' : 'text-amber-200/40'}`}>
                    5-4-3-2-1 senses. 4-7-8 breath. Even once today.
                  </p>
                </div>
                {t.groundingDone && <Check size={22} className="text-white" />}
              </div>
            </button>
          </div>

          {/* Fill the cup section */}
          <div className="pt-2">
            <div className="flex items-baseline gap-2 mb-3 px-1">
              <span className="display-font text-amber-100 text-xl">Fill the cup</span>
              <span className="text-amber-200/40 text-xs italic">— what you're putting in</span>
            </div>

            <div className="rounded-2xl p-5 mb-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251, 191, 36, 0.08)' }}>
              <div className="flex items-center gap-2.5 mb-3">
                <Heart size={18} className="text-rose-300" />
                <span className="text-amber-50 font-medium">Three good things today</span>
              </div>
              <div className="space-y-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{
                      background: t.gratitude?.[i]?.trim() ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(251, 191, 36, 0.2)'
                    }}>
                      <Star size={11} className={t.gratitude?.[i]?.trim() ? 'text-amber-300 star-shimmer' : 'text-amber-200/30'} fill={t.gratitude?.[i]?.trim() ? 'currentColor' : 'none'} />
                    </div>
                    <input type="text"
                      placeholder={`Something good — ${i === 0 ? 'small is fine' : i === 1 ? 'a person, a moment' : 'something about you'}`}
                      value={t.gratitude?.[i] || ''}
                      onChange={e => {
                        const newG = [...(t.gratitude || ['', '', ''])];
                        newG[i] = e.target.value;
                        updateToday({ gratitude: newG });
                      }}
                      className="input-warm flex-1 px-4 py-2.5 rounded-xl text-sm" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5 mb-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251, 191, 36, 0.08)' }}>
              <div className="flex items-center gap-2.5 mb-3">
                <Flame size={18} className="text-orange-300" />
                <span className="text-amber-50 font-medium">Today's intention</span>
              </div>
              <input type="text" placeholder="What I'm choosing to focus on today..."
                value={t.intention || ''}
                onChange={e => updateToday({ intention: e.target.value })}
                className="input-warm w-full px-4 py-3 rounded-xl text-sm" />
              <p className="text-amber-200/40 text-[11px] mt-2 italic">Not a problem to fix. Something to move toward.</p>
            </div>

            <div className="rounded-2xl p-5 mb-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251, 191, 36, 0.08)' }}>
              <div className="flex items-center gap-2.5 mb-3">
                <Sparkles size={18} className="text-yellow-300" />
                <span className="text-amber-50 font-medium">"I am..." statement</span>
              </div>
              <input type="text" placeholder="I am... (capable, learning, here, enough...)"
                value={t.affirmation || ''}
                onChange={e => updateToday({ affirmation: e.target.value })}
                className="input-warm w-full px-4 py-3 rounded-xl text-sm" />
              <p className="text-amber-200/40 text-[11px] mt-2 italic">Affirm the good you already are.</p>
            </div>
          </div>

          {/* Honest check-in */}
          <div className="pt-2">
            <div className="flex items-baseline gap-2 mb-3 px-1">
              <span className="display-font text-amber-100 text-xl">Honest check-in</span>
              <span className="text-amber-200/40 text-xs italic">— brief, not the whole story</span>
            </div>

            <div className="rounded-2xl p-5 mb-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251, 191, 36, 0.08)' }}>
              <p className="text-amber-50 font-medium mb-3 text-sm">How's the day feeling? <span className="text-amber-200/40 font-normal">(1 hard – 5 good)</span></p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n}
                    onClick={() => updateToday({ mood: t.mood === n ? 0 : n })}
                    className="check-button flex-1 aspect-square rounded-2xl text-lg font-medium"
                    style={{
                      background: t.mood === n
                        ? `linear-gradient(135deg, ${['#dc2626','#ea580c','#eab308','#84cc16','#10b981'][n-1]}, ${['#991b1b','#c2410c','#ca8a04','#65a30d','#059669'][n-1]})`
                        : 'rgba(255,255,255,0.05)',
                      color: t.mood === n ? '#fff' : 'rgba(254, 243, 199, 0.5)',
                      border: t.mood === n ? 'none' : '1px solid rgba(255,255,255,0.1)'
                    }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5 mb-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251, 191, 36, 0.08)' }}>
              <p className="text-amber-50 font-medium mb-2 text-sm">If something's on your chest <span className="text-amber-200/40 font-normal">(one or two sentences)</span></p>
              <textarea placeholder="Brief — we'll go deeper in session."
                value={t.feelingNote || ''}
                onChange={e => updateToday({ feelingNote: e.target.value })}
                className="input-warm w-full px-4 py-3 rounded-xl text-sm resize-none"
                rows="2" maxLength="280" />
              <p className="text-amber-200/40 text-[11px] mt-1.5 text-right">{(t.feelingNote || '').length}/280</p>
            </div>

            <div className="rounded-2xl p-5 glow-effect" style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(180, 83, 9, 0.1))',
              border: '1px solid rgba(251, 191, 36, 0.3)'
            }}>
              <div className="flex items-center gap-2.5 mb-2">
                <TrendingUp size={18} className="text-amber-300" />
                <span className="display-font text-amber-50 font-medium italic">What I DID about it</span>
              </div>
              <p className="text-amber-200/60 text-[11px] mb-3 leading-relaxed">
                One concrete thing — even tiny. Walked away. Drank water. Texted someone. Used a coping skill. Showed up here.
              </p>
              <textarea placeholder="Today I..."
                value={t.actionTaken || ''}
                onChange={e => updateToday({ actionTaken: e.target.value })}
                className="input-warm w-full px-4 py-3 rounded-xl text-sm resize-none"
                rows="2" />
            </div>
          </div>

          <div className="text-center pt-4 pb-2">
            <p className="display-font italic text-amber-200/50 text-sm">
              "Argue for your possibilities, not your limitations."
            </p>
          </div>
        </div>
      )}

      {view === 'week' && <WeekView data={data} foundationScore={foundationScore} mindScore={mindScore} medsCount={medsCount} setToday={setToday} setView={setView} />}
      {view === 'reflect' && <ReflectView data={data} />}

      {/* Date nav */}
      <div className="fixed bottom-4 left-4 right-4 z-20">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-full backdrop-blur-md" style={{
          background: 'rgba(26, 15, 10, 0.85)', border: '1px solid rgba(251, 191, 36, 0.2)'
        }}>
          <button onClick={() => {
              const d = new Date(today + 'T12:00');
              d.setDate(d.getDate() - 1);
              setToday(getDateKey(d));
            }} className="p-1.5 rounded-full hover:bg-amber-200/10">
            <ChevronLeft size={16} className="text-amber-200" />
          </button>
          <button onClick={() => setToday(getDateKey(new Date()))}
            className="text-amber-100 text-xs font-medium px-3">
            {today === getDateKey(new Date()) ? 'TODAY' : new Date(today + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </button>
          <button onClick={() => {
              const d = new Date(today + 'T12:00');
              d.setDate(d.getDate() + 1);
              const newKey = getDateKey(d);
              if (newKey <= getDateKey(new Date())) setToday(newKey);
            }} className="p-1.5 rounded-full hover:bg-amber-200/10"
            disabled={today >= getDateKey(new Date())}>
            <ChevronRight size={16} className="text-amber-200" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MedDoseButton({ label, hint, taken, color, onClick, fullWidth }) {
  const grads = {
    purple: 'linear-gradient(135deg, #c084fc, #9333ea)',
    sky: 'linear-gradient(135deg, #38bdf8, #0284c7)',
    indigo: 'linear-gradient(135deg, #818cf8, #6366f1)'
  };
  return (
    <button onClick={onClick}
      className={`check-button rounded-xl p-3 text-left ${fullWidth ? 'w-full' : ''}`}
      style={{
        background: taken ? grads[color] : 'rgba(255,255,255,0.04)',
        border: taken ? 'none' : '1px solid rgba(255,255,255,0.08)'
      }}>
      <p className={`text-xs font-medium ${taken ? 'text-white' : 'text-amber-50'}`}>{label}</p>
      <p className={`text-[10px] mt-0.5 ${taken ? 'text-white/70' : 'text-amber-200/40'}`}>
        {taken ? 'Taken ✓' : hint}
      </p>
    </button>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  const messages = {
    morning: ["Soft start. One thing at a time.", "You woke up. That counts.", "Begin where you are.", "Small steps. That's the work."],
    afternoon: ["You're in it. Keep going.", "Pause. Breathe. Continue.", "Halfway is somewhere.", "Check in with yourself."],
    evening: ["What did you fill your cup with?", "The day held you.", "Wind it down. Be soft.", "You made it through."],
    night: ["Rest is part of the work.", "Tomorrow gets a fresh page.", "You showed up. That's enough.", "Let the day go."]
  };
  let key = 'morning';
  if (h >= 12 && h < 17) key = 'afternoon';
  else if (h >= 17 && h < 21) key = 'evening';
  else if (h >= 21 || h < 5) key = 'night';
  const arr = messages[key];
  return arr[new Date().getDate() % arr.length];
}

function WeekView({ data, foundationScore, mindScore, medsCount, setToday, setView }) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ key, date: d, data: data[key] });
  }
  const filledDays = days.filter(d => d.data);
  const avgWater = filledDays.length ? Math.round(filledDays.reduce((s, d) => s + (d.data.water || 0), 0) / filledDays.length * 10) / 10 : 0;
  const avgMeals = filledDays.length ? Math.round(filledDays.reduce((s, d) => s + (d.data.meals || 0), 0) / filledDays.length * 10) / 10 : 0;
  const totalMedDoses = filledDays.reduce((s, d) => s + medsCount(d.data), 0);
  const possibleMedDoses = filledDays.length * 6;
  const fullMedDays = filledDays.filter(d => medsCount(d.data) === 6).length;
  const groundingDays = filledDays.filter(d => d.data.groundingDone).length;
  const actionDays = filledDays.filter(d => d.data.actionTaken?.trim()).length;

  return (
    <div className="relative z-10 px-5 space-y-5">
      <div>
        <h2 className="display-font text-amber-50 text-2xl mb-1">7-day view</h2>
        <p className="text-amber-200/50 text-xs">Patterns matter more than perfect days.</p>
      </div>

      <div className="rounded-3xl p-5" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(251, 191, 36, 0.1)' }}>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map(d => {
            const score = d.data ? Math.round((foundationScore(d.data) + mindScore(d.data)) / 2) : 0;
            return (
              <button key={d.key} onClick={() => { setToday(d.key); setView('today'); }} className="flex flex-col items-center gap-2">
                <p className="text-amber-200/50 text-[10px] uppercase">{d.date.toLocaleDateString('en-US', { weekday: 'narrow' })}</p>
                <div className="w-full aspect-square rounded-xl flex items-center justify-center" style={{
                  background: d.data
                    ? `linear-gradient(180deg, rgba(251, 191, 36, ${0.1 + score / 200}) 0%, rgba(217, 119, 6, ${0.05 + score / 200}) 100%)`
                    : 'rgba(255,255,255,0.03)',
                  border: d.data ? `1px solid rgba(251, 191, 36, ${0.2 + score / 200})` : '1px solid rgba(255,255,255,0.05)'
                }}>
                  <span className={`display-font text-sm ${d.data ? 'text-amber-50' : 'text-amber-200/20'}`}>
                    {d.data ? score : '·'}
                  </span>
                </div>
                <p className="text-amber-200/40 text-[10px]">{d.date.getDate()}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Droplet size={16} className="text-blue-300" />} label="Avg water" value={`${avgWater}/8`} note="cups per day" />
        <StatCard icon={<Apple size={16} className="text-rose-300" />} label="Avg meals" value={`${avgMeals}`} note="per day" />
        <StatCard icon={<Pill size={16} className="text-purple-300" />} label="Med compliance" value={`${possibleMedDoses ? Math.round(totalMedDoses / possibleMedDoses * 100) : 0}%`} note={`${totalMedDoses}/${possibleMedDoses} doses`} />
        <StatCard icon={<Wind size={16} className="text-amber-300" />} label="Grounding" value={`${groundingDays}/${filledDays.length || 0}`} note="practiced" />
      </div>

      <div className="rounded-2xl p-4" style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(126, 34, 206, 0.05))',
        border: '1px solid rgba(168, 85, 247, 0.25)'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Pill size={16} className="text-purple-300" />
            <span className="text-amber-50 text-sm font-medium">Full schedule days</span>
          </div>
          <span className="display-font text-amber-50 text-xl">{fullMedDays}<span className="text-purple-200/40 text-sm"> / {filledDays.length || 0}</span></span>
        </div>
        <p className="text-amber-200/50 text-[11px] mt-1.5">All 6 doses taken (3× Seroquel 50mg, 1× Seroquel 200mg, 2× Buspirone)</p>
      </div>

      <div className="rounded-2xl p-5" style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(180, 83, 9, 0.1))',
        border: '1px solid rgba(251, 191, 36, 0.3)'
      }}>
        <div className="flex items-center gap-2.5 mb-2">
          <TrendingUp size={18} className="text-amber-300" />
          <span className="display-font italic text-amber-50 font-medium">Action days</span>
        </div>
        <p className="display-font text-amber-50 text-3xl">{actionDays}<span className="text-amber-200/40 text-xl"> of {filledDays.length || 7}</span></p>
        <p className="text-amber-200/60 text-xs mt-2 leading-relaxed">
          Days you wrote down something you actually DID. This is the muscle we're building.
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, note }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251, 191, 36, 0.08)' }}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-amber-200/60 text-[11px] uppercase tracking-wider">{label}</span></div>
      <p className="display-font text-amber-50 text-2xl">{value}</p>
      <p className="text-amber-200/40 text-[11px] mt-0.5">{note}</p>
    </div>
  );
}

function ReflectView({ data }) {
  const days = Object.entries(data).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
  const allGratitude = days.flatMap(([key, d]) =>
    (d.gratitude || []).filter(g => g && g.trim()).map(g => ({ key, text: g }))
  ).slice(0, 20);
  const allActions = days.filter(([_, d]) => d.actionTaken?.trim()).map(([key, d]) => ({ key, text: d.actionTaken })).slice(0, 10);
  const allIntentions = days.filter(([_, d]) => d.intention?.trim()).map(([key, d]) => ({ key, text: d.intention })).slice(0, 10);

  return (
    <div className="relative z-10 px-5 space-y-5">
      <div>
        <h2 className="display-font text-amber-50 text-2xl mb-1">Reflect</h2>
        <p className="text-amber-200/50 text-xs italic">Receipts of who you are when you're paying attention.</p>
      </div>

      <div className="rounded-3xl p-5" style={{
        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1), rgba(190, 18, 60, 0.05))',
        border: '1px solid rgba(244, 63, 94, 0.2)'
      }}>
        <div className="flex items-center gap-2 mb-4">
          <Heart size={18} className="text-rose-300" />
          <span className="display-font text-amber-50 text-lg">Good things, lately</span>
        </div>
        {allGratitude.length === 0 ? (
          <p className="text-amber-200/40 text-sm italic">Your good things will show up here as you log them.</p>
        ) : (
          <div className="space-y-2.5">
            {allGratitude.map((g, i) => (
              <div key={i} className="flex items-start gap-2.5 pb-2.5 border-b border-rose-200/10 last:border-0 last:pb-0">
                <Star size={12} className="text-amber-300 mt-1 flex-shrink-0" fill="currentColor" />
                <div className="flex-1">
                  <p className="text-amber-50 text-sm leading-relaxed">{g.text}</p>
                  <p className="text-amber-200/30 text-[10px] mt-0.5">{new Date(g.key + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl p-5" style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(180, 83, 9, 0.05))',
        border: '1px solid rgba(251, 191, 36, 0.25)'
      }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-amber-300" />
          <span className="display-font text-amber-50 text-lg italic">Things you did</span>
        </div>
        {allActions.length === 0 ? (
          <p className="text-amber-200/40 text-sm italic">Concrete actions you took will appear here. This is the proof.</p>
        ) : (
          <div className="space-y-2.5">
            {allActions.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5 pb-2.5 border-b border-amber-200/10 last:border-0 last:pb-0">
                <Check size={14} className="text-amber-300 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-amber-50 text-sm leading-relaxed">{a.text}</p>
                  <p className="text-amber-200/30 text-[10px] mt-0.5">{new Date(a.key + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl p-5" style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(194, 65, 12, 0.05))',
        border: '1px solid rgba(249, 115, 22, 0.2)'
      }}>
        <div className="flex items-center gap-2 mb-4">
          <Flame size={18} className="text-orange-300" />
          <span className="display-font text-amber-50 text-lg">What you've been moving toward</span>
        </div>
        {allIntentions.length === 0 ? (
          <p className="text-amber-200/40 text-sm italic">Your intentions will collect here.</p>
        ) : (
          <div className="space-y-2">
            {allIntentions.map((it, i) => (
              <div key={i} className="flex items-baseline gap-2.5 pb-2 border-b border-orange-200/10 last:border-0 last:pb-0">
                <span className="text-orange-300/60 text-[10px]">{new Date(it.key + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <p className="text-amber-50 text-sm leading-relaxed flex-1">{it.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center py-4">
        <p className="display-font italic text-amber-200/50 text-sm">
          "Empty the cup of what isn't serving you. Fill it with what does."
        </p>
      </div>
    </div>
  );
}
