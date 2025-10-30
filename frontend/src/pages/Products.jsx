import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../lib/api.js';

export default function Products() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  async function fetchPage(p) {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/products?page=${p}&limit=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setItems(result.data || []);
        setTotal(result.total || 0);
        setPage(result.page || p);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch (_) {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPage(1); }, []);

  const totalPages = useMemo(() => (total ? Math.max(1, Math.ceil(total / pageSize)) : 1), [total, pageSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 20, borderBottom: '1px solid #e1e5e9', background: 'white' }}>
        <h1 style={{ color: '#333', fontSize: '1.5em' }}>🛍️ Products</h1>
      </div>
      <div style={{ padding: 20, overflow: 'auto' }}>
        <div style={{ border: '1px solid #e1e5e9', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f7f7fb' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #e1e5e9' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #e1e5e9' }}>Price</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #e1e5e9' }}>Category ID</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} style={{ padding: 20, textAlign: 'center', color: '#666' }}>Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: 20, textAlign: 'center', color: '#666' }}>No products found</td></tr>
              ) : (
                items.map((p, i) => (
                  <tr key={i}>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f5' }}>{p.name || 'Unnamed Product'}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f5' }}>₹{p.price || 0}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f5' }}>{p.category_id || ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <div style={{ color: '#666' }}>Page {page} of {totalPages}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => fetchPage(1)} disabled={page === 1 || loading} style={{ padding: '8px 12px' }}>« First</button>
            <button onClick={() => fetchPage(page - 1)} disabled={page === 1 || loading} style={{ padding: '8px 12px' }}>‹ Prev</button>
            <button onClick={() => fetchPage(page + 1)} disabled={page >= totalPages || loading} style={{ padding: '8px 12px' }}>Next ›</button>
            <button onClick={() => fetchPage(totalPages)} disabled={page >= totalPages || loading} style={{ padding: '8px 12px' }}>Last »</button>
          </div>
        </div>
      </div>
    </div>
  );
}


