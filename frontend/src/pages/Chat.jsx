import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../lib/api.js';

function useAuthUser() {
  return useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);
}

export default function Chat() {
  const navigate = useNavigate();
  const user = useAuthUser();
  const [messages, setMessages] = useState([{
    id: 'welcome', role: 'assistant', content: (
      'Hello! I\'m your shopping assistant. I can help you: \n' +
      '- Browse products and categories\n- View your orders\n- Place new orders\n- Perform database operations in natural language\n\n' +
      'Try asking: "Show me all products" or "What are my orders?"'
    )
  }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // local state only for chat page

  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login', { replace: true }); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/verify`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login', { replace: true });
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate]);

  // no sidebar switching here; separate routes handle other pages

  async function sendMessage() {
    const message = input.trim();
    if (!message || sending) return;
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: message }]);
    setInput('');
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: message })
      });
      const result = await res.json();
      if (result.success) {
        const isHtml = !!(result.response?.dbcall);
        const assistantContent = isHtml ? (result.response?.data ?? '') : (result.response?.summary ?? '');
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: String(assistantContent), isHtml }
        ]);
      } else {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${result.message || 'Something went wrong'}` }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `Network error: ${e.message}` }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 20, borderBottom: '1px solid #e1e5e9', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#333', fontSize: '1.5em' }}>💬 Chat Assistant</h1>
        <p>Ask me anything about products, categories, or orders!</p>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#f9f9f9' }}>
        {messages.map(m => (
          <div key={m.id} style={{ marginBottom: 15, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '70%', padding: '12px 16px', borderRadius: 12, background: m.role === 'user' ? '#667eea' : 'white', color: m.role === 'user' ? 'white' : '#333', border: m.role === 'user' ? 'none' : '1px solid #e1e5e9', whiteSpace: 'pre-wrap' }}>
              {m.isHtml && m.role !== 'user' ? (
                <div dangerouslySetInnerHTML={{ __html: m.content }} />
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div style={{ marginBottom: 15, display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ maxWidth: '70%', padding: '12px 16px', borderRadius: 12, background: 'white', color: '#666', border: '1px solid #e1e5e9', fontStyle: 'italic' }}>
              Assistant is typing...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div style={{ padding: 20, borderTop: '1px solid #e1e5e9', background: 'white' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <textarea rows={2} value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } }}
            placeholder="Type your message here..." style={{ flex: 1, padding: '12px 15px', border: '2px solid #e1e5e9', borderRadius: 8, fontSize: 16, fontFamily: 'inherit', resize: 'none' }} />
          <button disabled={sending} onClick={sendMessage} style={{ padding: '12px 25px', background: '#667eea', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>{sending ? 'Sending...' : 'Send'}</button>
        </div>
      </div>
    </div>
  );
}


