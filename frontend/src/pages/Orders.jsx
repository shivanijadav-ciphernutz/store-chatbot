import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../lib/api.js';

export default function Orders() {
  const [all, setAll] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/orders`, { headers: { Authorization: `Bearer ${token}` } });
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
        <h1 style={{ color: '#333', fontSize: '1.5em' }}>📦 My Orders</h1>
      </div>
      <div style={{ padding: 20, overflow: 'auto' }}>
        <div style={{ border: '1px solid #e1e5e9', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f7f7fb' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #e1e5e9' }}>Order #</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #e1e5e9' }}>Total</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #e1e5e9' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #e1e5e9' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#666' }}>Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#666' }}>No orders found</td></tr>
              ) : (
                items.map((o, i) => (
                  <tr key={i}>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f5' }}>#{String(o._id || '').slice(-6)}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f5' }}>₹{o.total_price || 0}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f5' }}>
                      <span style={{ padding: '5px 10px', borderRadius: 15, fontWeight: 600, fontSize: '0.85em', background: '#d4edda', color: '#155724' }}>
                        {String(o.order_status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f5' }}>{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</td>
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
              {[10,20,50].map(sz => (<option key={sz} value={sz}>{sz}/page</option>))}
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


