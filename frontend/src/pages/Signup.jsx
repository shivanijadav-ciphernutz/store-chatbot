import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../lib/api.js';

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  function validate() {
    const e = {};
    if (name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email address';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSuccess('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      } else {
        setErrors({ email: result.message || 'Signup failed. Please try again.' });
      }
    } catch (_) {
      setErrors({ email: 'Network error. Please try again.' });
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
          <h1 style={{ color: '#333', fontSize: '2em', marginBottom: 10 }}>🚀 Sign Up</h1>
          <p style={{ color: '#666' }}>Create your account to get started</p>
        </div>
        {success ? (
          <div style={{ background: '#d4edda', color: '#155724', padding: 12, borderRadius: 8, marginBottom: 20 }}>{success}</div>
        ) : null}
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: 8, color: '#333', fontWeight: 600 }}>Full Name</label>
            <input id="name" required placeholder="Enter your name" value={name} onChange={(e)=>setName(e.target.value)}
              style={{ width: '100%', padding: '12px 15px', border: '2px solid #e1e5e9', borderRadius: 8, fontSize: 16 }} />
            {errors.name ? <div style={{ color: '#dc3545', fontSize: 14, marginTop: 6 }}>{errors.name}</div> : null}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: 8, color: '#333', fontWeight: 600 }}>Email</label>
            <input id="email" type="email" required placeholder="Enter your email" value={email} onChange={(e)=>setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 15px', border: '2px solid #e1e5e9', borderRadius: 8, fontSize: 16 }} />
            {errors.email ? <div style={{ color: '#dc3545', fontSize: 14, marginTop: 6 }}>{errors.email}</div> : null}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: 8, color: '#333', fontWeight: 600 }}>Password</label>
            <input id="password" type="password" required placeholder="Enter your password" value={password} onChange={(e)=>setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 15px', border: '2px solid #e1e5e9', borderRadius: 8, fontSize: 16 }} />
            {errors.password ? <div style={{ color: '#dc3545', fontSize: 14, marginTop: 6 }}>{errors.password}</div> : null}
          </div>
          <div style={{ marginBottom: 10 }}>
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: 8, color: '#333', fontWeight: 600 }}>Confirm Password</label>
            <input id="confirmPassword" type="password" required placeholder="Confirm your password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 15px', border: '2px solid #e1e5e9', borderRadius: 8, fontSize: 16 }} />
            {errors.confirmPassword ? <div style={{ color: '#dc3545', fontSize: 14, marginTop: 6 }}>{errors.confirmPassword}</div> : null}
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 15, marginTop: 14, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
          Already have an account? <Link to="/login" style={{ color: '#667eea', fontWeight: 600 }}>Login here</Link>
        </div>
      </div>
    </div>
  );
}


