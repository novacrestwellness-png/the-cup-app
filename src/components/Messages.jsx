import React, { useState, useEffect, useRef } from 'react';
import { Send, Heart, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Messages({ session, threadWithUserId, threadWithLabel, isClinician }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const myUserId = session.user.id;

  // Load messages in this thread
  useEffect(() => {
    if (!threadWithUserId) return;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_user_id.eq.${myUserId},recipient_user_id.eq.${threadWithUserId}),and(sender_user_id.eq.${threadWithUserId},recipient_user_id.eq.${myUserId})`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
        // Mark this thread as "seen" by storing the latest message timestamp
        if (data.length > 0) {
          const latest = data[data.length - 1].created_at;
          localStorage.setItem(`thread_seen_${threadWithUserId}`, latest);
        }
      }
      setLoading(false);
    }
    load();

    // Poll every 15 seconds for new messages while the page is open
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [myUserId, threadWithUserId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_user_id: myUserId,
          recipient_user_id: threadWithUserId,
          body: text
        })
        .select()
        .single();
      if (!error && data) {
        setMessages(prev => [...prev, data]);
        setDraft('');
        localStorage.setItem(`thread_seen_${threadWithUserId}`, data.created_at);
      } else if (error) {
        console.error('Send failed:', error);
        alert('Could not send. Try again.');
      }
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // Group messages by date for date dividers
  function getMessagesWithDateDividers() {
    const result = [];
    let lastDate = null;
    for (const msg of messages) {
      const dateKey = new Date(msg.created_at).toISOString().split('T')[0];
      if (dateKey !== lastDate) {
        result.push({ type: 'divider', dateKey, id: `div-${dateKey}` });
        lastDate = dateKey;
      }
      result.push({ type: 'msg', ...msg });
    }
    return result;
  }

  function formatDateDivider(dateKey) {
    const d = new Date(dateKey + 'T12:00');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];

    if (dateKey === today) return 'Today';
    if (dateKey === yesterdayKey) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  const items = getMessagesWithDateDividers();

  return (
    <div className="relative z-10 px-5 space-y-4 pb-32">
      {/* Header */}
      <div>
        <div className="flex items-baseline gap-2 mb-1">
          <h2 className="display-font text-amber-50 text-2xl">Notes</h2>
          <span className="text-amber-200/40 text-xs italic">
            {isClinician ? `with ${threadWithLabel}` : 'with Dr. Will'}
          </span>
        </div>
        <p className="text-amber-200/50 text-xs italic">
          {isClinician
            ? 'Quick encouragement and check-ins. Real work happens in session.'
            : 'Encouragement and check-ins between sessions.'}
        </p>
      </div>

      {/* Crisis disclaimer banner */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-2.5" style={{
        background: 'rgba(244, 63, 94, 0.08)',
        border: '1px solid rgba(244, 63, 94, 0.2)'
      }}>
        <AlertCircle size={14} className="text-rose-300 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-rose-100 text-[11px] leading-relaxed">
            <strong className="text-rose-200">Not for crisis support.</strong> If you're in crisis, call <strong>988</strong> or Philly Crisis Line <strong>215-685-6440</strong>.
          </p>
        </div>
      </div>

      {/* Message thread */}
      <div
        ref={scrollRef}
        className="rounded-3xl p-4 space-y-3 overflow-y-auto"
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(251, 191, 36, 0.1)',
          minHeight: '300px',
          maxHeight: '60vh'
        }}
      >
        {loading ? (
          <p className="text-amber-200/40 text-sm text-center py-8 italic">loading...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Heart size={24} className="text-rose-300/40 mx-auto mb-3" />
            <p className="text-amber-200/50 text-sm italic">
              {isClinician
                ? 'No notes yet. Send a word of encouragement to get started.'
                : 'No notes yet. Dr. Will can send you encouragement here.'}
            </p>
          </div>
        ) : (
          items.map(item => {
            if (item.type === 'divider') {
              return (
                <div key={item.id} className="text-center py-2">
                  <span className="text-amber-200/40 text-[10px] uppercase tracking-widest">
                    {formatDateDivider(item.dateKey)}
                  </span>
                </div>
              );
            }
            const isMine = item.sender_user_id === myUserId;
            return (
              <div
                key={item.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-2.5"
                  style={{
                    background: isMine
                      ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                      : 'rgba(255,255,255,0.06)',
                    border: isMine ? 'none' : '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap break-words"
                    style={{ color: isMine ? '#451a03' : '#fef3c7' }}
                  >
                    {item.body}
                  </p>
                  <p
                    className="text-[10px] mt-1"
                    style={{ color: isMine ? 'rgba(69, 26, 3, 0.6)' : 'rgba(254, 243, 199, 0.4)' }}
                  >
                    {formatTime(item.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Compose box */}
      <div className="rounded-2xl p-3" style={{
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(251, 191, 36, 0.2)'
      }}>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value.slice(0, 500))}
          onKeyDown={handleKeyDown}
          placeholder={isClinician
            ? "A note for her... (e.g., 'Saw you logged 3 days in a row — that's real')"
            : "A note for Dr. Will... (a question, an update, something good)"}
          className="input-warm w-full px-3 py-2.5 rounded-xl text-sm resize-none mb-2"
          rows="3"
          maxLength="500"
        />
        <div className="flex items-center justify-between">
          <span className={`text-[11px] ${draft.length > 450 ? 'text-rose-300' : 'text-amber-200/40'}`}>
            {draft.length}/500
          </span>
          <button
            onClick={send}
            disabled={!draft.trim() || sending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #d97706)',
              color: '#451a03'
            }}
          >
            <Send size={13} />
            {sending ? 'sending...' : 'send'}
          </button>
        </div>
      </div>

      {/* Quick prompts for clinician (optional helpful starters) */}
      {isClinician && messages.length === 0 && (
        <div className="rounded-2xl p-4" style={{
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(251, 191, 36, 0.08)'
        }}>
          <p className="text-amber-200/50 text-[11px] uppercase tracking-widest mb-2">Quick starters</p>
          <div className="space-y-1.5">
            {[
              "Saw you showed up today. That counts.",
              "How's the medication feeling this week?",
              "Reminder: one cup of water is a win."
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => setDraft(prompt)}
                className="block w-full text-left text-amber-100/80 text-xs italic px-3 py-2 rounded-lg hover:bg-amber-200/5"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
