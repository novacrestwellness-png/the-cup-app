import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Tracker from './components/Tracker';
import ClinicianDashboard from './components/ClinicianDashboard';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [viewingClient, setViewingClient] = useState(null); // { id, label }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    setProfile(data || { role: 'client' });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a0f0a' }}>
        <div className="text-amber-100/70 text-sm tracking-wider">loading...</div>
      </div>
    );
  }

  if (!session) return <Auth />;

  if (profile?.role === 'clinician') {
    if (viewingClient) {
      return <Tracker
        session={session}
        isClinicianView={true}
        viewingClientId={viewingClient.id}
        viewingClientLabel={viewingClient.label}
        onBack={() => setViewingClient(null)} />;
    }
    return <ClinicianDashboard
      session={session}
      onViewClient={(id, label) => setViewingClient({ id, label })} />;
  }

  return <Tracker session={session} />;
}
