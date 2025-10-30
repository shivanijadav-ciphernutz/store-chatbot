import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../lib/api.js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) navigate('/chat', { replace: true });
        else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (_) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    })();
  }, [navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const result = await res.json();
      if (result.success) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        navigate('/chat', { replace: true });
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch (_) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20
    }}>
      <div style={{ background: 'white', borderRadius: 15, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: 40, maxWidth: 450, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ color: '#333', fontSize: '2em', marginBottom: 10 }}>🔐 Login</h1>
          <p style={{ color: '#666' }}>Welcome back! Please login to continue</p>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: 8, color: '#333', fontWeight: 600 }}>Email</label>
            <input id="email" type="email" required placeholder="Enter your email" value={email} onChange={(e)=>setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 15px', border: '2px solid #e1e5e9', borderRadius: 8, fontSize: 16 }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: 8, color: '#333', fontWeight: 600 }}>Password</label>
            <input id="password" type="password" required placeholder="Enter your password" value={password} onChange={(e)=>setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 15px', border: '2px solid #e1e5e9', borderRadius: 8, fontSize: 16 }} />
          </div>
          {error ? <div style={{ color: '#dc3545', fontSize: 14, marginTop: 6 }}>{error}</div> : null}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 15, marginTop: 14, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#667eea', fontWeight: 600 }}>Sign up here</Link>
        </div>
      </div>
    </div>
  );
}


