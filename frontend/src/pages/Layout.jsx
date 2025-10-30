import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const navItems = [
    { to: '/chat', key: '/chat', label: 'Chat', icon: '💬' },
    { to: '/products', key: '/products', label: 'Products', icon: '🛍️' },
    { to: '/categories', key: '/categories', label: 'Categories', icon: '📂' },
    { to: '/orders', key: '/orders', label: 'My Orders', icon: '📦' }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f5f5', overflow: 'hidden' }}>
      <div style={{ width: 300, background: 'white', borderRight: '1px solid #e1e5e9', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #e1e5e9', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h2 style={{ fontSize: '1.3em', marginBottom: 6 }}>E-Commerce</h2>
          <p style={{ opacity: 0.9 }}>{user?.email || 'User'}</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
          {navItems.map(item => {
            const active = location.pathname === item.key;
            return (
              <Link key={item.key} to={item.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ padding: '12px 15px', margin: '5px 0', borderRadius: 8, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', background: active ? '#667eea' : 'transparent', color: active ? 'white' : 'inherit' }}>
                  <span style={{ fontSize: '1.2em' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
        <button onClick={logout} style={{ padding: 15, margin: 10, background: '#dc3545', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
        <Outlet />
      </div>
    </div>
  );
}


