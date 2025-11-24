import React, { useMemo, useEffect, useState } from 'react';
import './activitylogs.scss';
import { getApiBase } from '../../apiBase';

export default function ActivityLogsTable({ branchId, limit = 50 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE = getApiBase();

  const headers = useMemo(() => [
    { key: 'id', label: 'TRNSCTNID' },
    { key: 'branch', label: 'BRANCH' },
    { key: 'amount', label: 'AMOUNT' },
    { key: 'datetime', label: 'TIME AND DATE' },
    { key: 'accountExecutive', label: 'ACCOUNT EXECUTIVE' },
    { key: 'assigned', label: 'ASSIGNED' },
    { key: 'purpose', label: 'PURPOSE' },
  ], []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (branchId) params.append('branchId', String(branchId));
        if (limit) params.append('limit', String(limit));
        const res = await fetch(`${API_BASE}/api/activity/logs?${params.toString()}`, {
          credentials: 'include',
          signal: controller.signal,
        });
        const data = await res.json();
        if (!cancelled) {
          setRows((data && data.data) ? data.data : []);
        }
      } catch (e) {
        if (!cancelled && e.name !== 'AbortError') setError('Failed to load activity logs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchLogs();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [branchId, limit]);

  return (
    <div className="activity-table-wrapper">
      {loading && <div className="loading">Loading activity logs...</div>}
      {error && <div className="error">{error}</div>}
      <table className="activity-table" aria-label="Activity Logs">
        <thead>
          <tr>
            {headers.map(h => <th key={h.key}>{h.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {!loading && rows.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.branch}</td>
              <td>{Number(r.amount || 0).toLocaleString()}</td>
              <td>{r.datetime ? new Date(r.datetime).toLocaleString() : '—'}</td>
              <td>{r.accountExecutive}</td>
              <td>{r.assigned}</td>
              <td>{r.purpose}</td>
             
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
