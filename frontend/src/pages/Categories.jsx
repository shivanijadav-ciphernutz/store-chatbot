import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../lib/api.js';

export default function Categories() {
  const [all, setAll] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/categories`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      setAll(result.success ? (result.data || []) : []);
    } catch (_) {
      setAll([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const total = all.length;
  const totalPages = useMemo(() => (total ? Math.max(1, Math.ceil(total / pageSize)) : 1), [total, pageSize]);
  const items = useMemo(() => {
    const start = (page - 1) * pageSize;
    return all.slice(start, start + pageSize);
  }, [all, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 20, borderBottom: '1px solid #e1e5e9', background: 'white' }}>
        <h1 style={{ color: '#333', fontSize: '1.5em' }}>📂 Categories</h1>
      </div>
      <div style={{ padding: 20, overflow: 'auto' }}>
        <div style={{ border: '1px solid #e1e5e9', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f7f7fb' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #e1e5e9' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #e1e5e9' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={2} style={{ padding: 20, textAlign: 'center', color: '#666' }}>Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={2} style={{ padding: 20, textAlign: 'center', color: '#666' }}>No categories found</td></tr>
              ) : (
                items.map((c, i) => (
                  <tr key={i}>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f5' }}>{c.name || 'Unnamed Category'}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f5' }}>{c.description || ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <div style={{ color: '#666' }}>Page {page} of {totalPages} • {total} total</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={pageSize} onChange={(e)=>{ setPageSize(parseInt(e.target.value, 10)); setPage(1); }}>
              {[10,20,50,100].map(sz => (<option key={sz} value={sz}>{sz}/page</option>))}
            </select>
            <button onClick={() => setPage(1)} disabled={page === 1 || loading} style={{ padding: '8px 12px' }}>« First</button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1 || loading} style={{ padding: '8px 12px' }}>‹ Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages || loading} style={{ padding: '8px 12px' }}>Next ›</button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages || loading} style={{ padding: '8px 12px' }}>Last »</button>
          </div>
        </div>
      </div>
    </div>
  );
}


