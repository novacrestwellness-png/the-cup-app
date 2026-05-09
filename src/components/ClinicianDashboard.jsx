import React, { useState, useEffect } from 'react';
import { Droplet, Apple, Pill, Wind, TrendingUp, LogOut, User, Eye, Calendar, Heart, Flame, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ClinicianDashboard({ session, onViewClient }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({}); // keyed by client user_id

  useEffect(() => {
    async function load() {
      // Get linked clients
      const { data: linkRows } = await supabase
        .from('clinician_links')
        .select('client_user_id, client_label')
        .eq('clinician_user_id', session.user.id);

      if (!linkRows) {
        setLoading(false);
        return;
      }

      setLinks(linkRows);

      // For each client, pull last 14 days of entries to compute engagement stats
      const statsObj = {};
      for (const link of linkRows) {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
        const startDate = fourteenDaysAgo.toISOString().split('T')[0];

        const { data: entries } = await supabase
          .from('daily_entries')
          .select('entry_date, payload')
          .eq('user_id', link.client_user_id)
          .gte('entry_date', startDate)
          .order('entry_date', { ascending: false });

        statsObj[link.client_user_id] = computeStats(entries || []);
      }
      setStats(statsObj);
      setLoading(false);
    }
    load();
  }, [session.user.id]);

  function computeStats(entries) {
    const last7 = entries.filter(e => {
      const d = new Date(e.entry_date + 'T12:00');
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 6);
      return d >= cutoff;
    });
    const filledDays = entries.length;
    const avgWater = filledDays ? Math.round(entries.reduce((s, e) => s + (e.payload.water || 0), 0) / filledDays * 10) / 10 : 0;
    const avgMeals = filledDays ? Math.round(entries.reduce((s, e) => s + (e.payload.meals || 0), 0) / filledDays * 10) / 10 : 0;
    const totalDoses = entries.reduce((s, e) => {
      const m = e.payload.meds || {};
      return s + [m.quetiapineMorning, m.quetiapineAfternoon, m.quetiapineEvening,
                  m.quetiapineBedtime, m.buspironeMorning, m.buspironeBedtime].filter(Boolean).length;
    }, 0);
    const possibleDoses = filledDays * 6;
    const groundingDays = entries.filter(e => e.payload.groundingDone).length;
    const actionDays = entries.filter(e => e.payload.actionTaken?.trim()).length;
    const last7Count = last7.length;
    const lastEntryDate = entries[0]?.entry_date || null;

    return {
      daysLogged14: filledDays,
      daysLogged7: last7Count,
      avgWater,
      avgMeals,
      medCompliance: possibleDoses ? Math.round(totalDoses / possibleDoses * 100) : 0,
      groundingDays,
      actionDays,
      lastEntryDate
    };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen pb-12" style={{
      background: 'linear-gradient(180deg, #1a0f0a 0%, #2d1810 40%, #3d2418 100%)',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        .display-font { font-family: 'Fraunces', serif; }
      `}</style>

      <div className="px-5 pt-8 pb-6">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-amber-200/50 text-xs uppercase tracking-[0.2em] mb-1">Clinician view</p>
            <h1 className="display-font text-amber-50 text-3xl">Engagement dashboard</h1>
          </div>
          <button onClick={signOut} className="text-amber-200/40 hover:text-amber-200/80">
            <LogOut size={16} />
          </button>
        </div>
        <p className="text-amber-200/60 text-sm mt-2">
          {session.user.email}
        </p>
      </div>

      <div className="px-5">
        {loading ? (
          <div className="text-amber-100/60 text-sm">loading clients...</div>
        ) : links.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(251, 191, 36, 0.15)' }}>
            <p className="text-amber-100 text-sm mb-2">No clients linked yet.</p>
            <p className="text-amber-200/60 text-xs">
              Link a client by adding a row to the <code className="text-amber-300">clinician_links</code> table in Supabase.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map(link => {
              const s = stats[link.client_user_id] || {};
              const lastEntryDays = s.lastEntryDate
                ? Math.floor((new Date() - new Date(s.lastEntryDate + 'T12:00')) / (1000 * 60 * 60 * 24))
                : null;
              return (
                <div key={link.client_user_id} className="rounded-3xl p-5" style={{
                  background: 'linear-gradient(135deg, rgba(120, 53, 15, 0.3), rgba(69, 26, 3, 0.3))',
                  border: '1px solid rgba(251, 191, 36, 0.15)'
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                        background: 'linear-gradient(135deg, #fbbf24, #d97706)'
                      }}>
                        <User size={18} className="text-amber-950" />
                      </div>
                      <div>
                        <p className="text-amber-50 font-medium">{link.client_label || 'Client'}</p>
                        <p className="text-amber-200/50 text-[11px]">
                          {lastEntryDays === null ? 'No entries yet'
                            : lastEntryDays === 0 ? 'Last logged today'
                            : lastEntryDays === 1 ? 'Last logged yesterday'
                            : `Last logged ${lastEntryDays} days ago`}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => onViewClient(link.client_user_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fef3c7' }}>
                      <Eye size={12} />
                      view
                    </button>
                  </div>

                  {/* Engagement: did she show up */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <MetricBox icon={<Calendar size={14} className="text-amber-300" />}
                      label="Days logged" value={`${s.daysLogged7 || 0}/7`} note="last week" />
                    <MetricBox icon={<Calendar size={14} className="text-amber-300" />}
                      label="14-day total" value={`${s.daysLogged14 || 0}/14`} note="entries" />
                  </div>

                  {/* Foundation metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <MetricBox icon={<Droplet size={14} className="text-blue-300" />}
                      label="Avg water" value={`${s.avgWater || 0}/8`} note="cups/day" />
                    <MetricBox icon={<Apple size={14} className="text-rose-300" />}
                      label="Avg meals" value={`${s.avgMeals || 0}`} note="per day" />
                    <MetricBox icon={<Pill size={14} className="text-purple-300" />}
                      label="Med compliance" value={`${s.medCompliance || 0}%`} note="14-day avg" />
                    <MetricBox icon={<Wind size={14} className="text-amber-300" />}
                      label="Grounding" value={`${s.groundingDays || 0}`} note={`of ${s.daysLogged14 || 0} days`} />
                  </div>

                  {/* The action metric */}
                  <div className="rounded-xl p-3" style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(180, 83, 9, 0.08))',
                    border: '1px solid rgba(251, 191, 36, 0.25)'
                  }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-amber-300" />
                        <span className="display-font italic text-amber-50 text-sm">Action days</span>
                      </div>
                      <span className="display-font text-amber-50 text-lg">{s.actionDays || 0}<span className="text-amber-200/40 text-xs"> / {s.daysLogged14 || 0}</span></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 rounded-2xl p-4" style={{
          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(251, 191, 36, 0.1)'
        }}>
          <p className="text-amber-200/50 text-[11px] leading-relaxed">
            <strong className="text-amber-200/70">Note:</strong> This dashboard shows engagement and self-care metrics only.
            Clients' personal journal entries (gratitudes, intentions, feeling notes, action descriptions) are visible
            in the "view" mode for read-only review during sessions but are the client's own personal space, not part
            of the clinical record.
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ icon, label, value, note }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(251, 191, 36, 0.06)' }}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}<span className="text-amber-200/60 text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="display-font text-amber-50 text-xl">{value}</p>
      <p className="text-amber-200/40 text-[10px]">{note}</p>
    </div>
  );
}
