import React, { useState, useEffect, useMemo } from 'react';
import './table.scss';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { getApiBase } from '../../apiBase';
import { useAuth } from '../../context/authContext';
import AssignmentDetailCard from './AssignmentDetailCard';

// History table for delivery assignments: show all statuses and full schema columns
const TableAssignmentHistory = ({ refreshKey = 0, searchTerm = '' }) => {
  const [rows, setRows] = useState([]);
  // lookups are fetched ad-hoc inside effect; no persistent state required
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE = getApiBase();
  const { getAuthHeaders, currentUser, branchStatus } = useAuth();

  const normalizedRole = ((currentUser?.role || currentUser?.Role || '') + '').toLowerCase();
  const detectBranchId = () => {
    const pick = (source) => {
      if (!source || typeof source !== 'object') return null;
      const direct = source.branchId || source.branch_id || source.BranchID || source.BranchId || null;
      if (direct) return String(direct);
      const nested = source.branch || source.Branch || source.data || null;
      if (nested) return pick(nested);
      return null;
    };
    return pick(branchStatus) || pick(currentUser) || pick(currentUser?.user) || null;
  };
  const aeBranchId = detectBranchId();

  const fmt = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
  };

  const parseItems = (items) => {
    if (!items) return null;
    if (typeof items === 'object') return items;
    try { return JSON.parse(items); } catch { return items; }
  };

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch lookups (branches, users) in parallel (public endpoints)
        const [bRes, uRes] = await Promise.all([
          fetch(`${API_BASE}/api/users/branches`, { signal: controller.signal, credentials: 'include' }),
          fetch(`${API_BASE}/api/users`, { signal: controller.signal, credentials: 'include' }),
        ]);
        const bJson = bRes.ok ? await bRes.json() : { data: [] };
        const uJson = uRes.ok ? await uRes.json() : [];
        const branchesArr = Array.isArray(bJson?.data) ? bJson.data : (Array.isArray(bJson) ? bJson : []);
        const usersArr = Array.isArray(uJson) ? uJson : [];
        // lookups kept local to this load cycle

        // Prefer the public 'all' history endpoint to include PENDING as well
        let data;
        const isAdminLike = ['admin', 'auditor'].includes(normalizedRole);
        const isAccountExecutive = normalizedRole === 'accountexecutive' || normalizedRole === 'ae';

        if (isAdminLike) {
          const allRes = await fetch(`${API_BASE}/api/delivery-assignments/all`, {
            credentials: 'include',
            signal: controller.signal,
          });
          if (allRes.ok) {
            data = await allRes.json();
          } else if (allRes.status !== 403) {
            throw new Error(`Failed to load assignments: ${allRes.status}`);
          }
        }

        if (!data && isAccountExecutive) {
          if (!aeBranchId) {
            setError('Branch session not available.');
          } else {
            const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
            const res = await fetch(`${API_BASE}/api/delivery-assignments/branch/${aeBranchId}`, {
              credentials: 'include',
              headers,
              signal: controller.signal,
            });
            if (res.ok) {
              data = await res.json();
            } else if (res.status !== 403) {
              throw new Error(`Failed to load branch assignments: ${res.status}`);
            }
          }
        }

        if (!data) {
          const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
          const res = await fetch(`${API_BASE}/api/delivery-assignments`, {
            method: 'GET',
            headers,
            credentials: 'include',
            signal: controller.signal,
          });
          if (res.ok) {
            data = await res.json();
          } else {
            const [r1, r2] = await Promise.all([
              fetch(`${API_BASE}/api/delivery-assignments/active`, { credentials: 'include', signal: controller.signal }),
              fetch(`${API_BASE}/api/delivery-assignments/completed`, { credentials: 'include', signal: controller.signal }),
            ]);
            const a1 = r1.ok ? await r1.json() : [];
            const a2 = r2.ok ? await r2.json() : [];
            data = [...(Array.isArray(a1) ? a1 : []), ...(Array.isArray(a2) ? a2 : [])];
          }
        }

        // Build quick lookup maps
        const branchMap = new Map((branchesArr || []).map(b => [b.BranchID, b.BranchName]));
        const userNameMap = new Map((usersArr || []).map(u => [u.Account_id, u.Fullname]));

        // Normalize various response shapes: plain array, {success, data:[]}, {data:[]}
        const normalize = (raw) => {
          if (Array.isArray(raw)) return raw;
          if (raw && Array.isArray(raw.data)) return raw.data;
          return [];
        };
        const mapped = normalize(data).map((a, i) => {
          const itemsParsed = parseItems(a.items);
          // Prefer server-provided names, else map from ids
          const assignedToName = a.driver_name || a.assigned_to_name || (a.assigned_to != null ? userNameMap.get(a.assigned_to) : null) || null;
          const assignedByName = a.assigned_by_name || (a.assigned_by != null ? userNameMap.get(a.assigned_by) : null) || null;
          const fromBranchName = a.from_branch_name || (a.from_branch_id != null ? branchMap.get(a.from_branch_id) : null) || null;
          const toBranchName = a.to_branch_name || (a.to_branch_id != null ? branchMap.get(a.to_branch_id) : null) || null;
          return {
            assignment_id: a.assignment_id ?? a.AssignmentID ?? a.id ?? i + 1,
            assigned_to: a.assigned_to ?? a.AssignedTo ?? null,
            assigned_by: a.assigned_by ?? a.AssignedBy ?? null,
            assigned_to_name: assignedToName,
            assigned_by_name: assignedByName,
            assignment_type: a.assignment_type ?? a.AssignmentType ?? null,
            from_location_type: a.from_location_type ?? a.FromLocationType ?? null,
            from_branch_id: a.from_branch_id ?? a.FromBranchID ?? null,
            from_branch_name: fromBranchName,
            to_location_type: a.to_location_type ?? a.ToLocationType ?? null,
            to_branch_id: a.to_branch_id ?? a.ToBranchID ?? null,
            to_branch_name: toBranchName,
            items: itemsParsed,
            amount: a.amount ?? null,
            status: a.status ?? null,
            notes: a.notes ?? null,
            created_at: a.created_at ?? null,
            updated_at: a.updated_at ?? null,
            due_date: a.due_date ?? null,
            dropoff_image: a.dropoff_image ?? null,
            delivered_at: a.delivered_at ?? null,
            item_image: a.item_image ?? null,
            pickup_verified_at: a.pickup_verified_at ?? null,
            current_latitude: a.current_latitude ?? null,
            current_longitude: a.current_longitude ?? null,
            location_updated_at: a.location_updated_at ?? null,
            capital_or_balance: a.capital_or_balance ?? null,
          };
        });
        setRows(mapped);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Assignments fetch error:', err);
          setError('Failed to load assignments');
          setRows([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [API_BASE, getAuthHeaders, refreshKey, normalizedRole, aeBranchId]);

  const filtered = useMemo(() => {
    if (!searchTerm) return rows;
    const t = searchTerm.toLowerCase();
    return rows.filter(r =>
      [r.assignment_id, r.assigned_by, r.assigned_to, r.status, r.assignment_type]
        .some(v => v != null && String(v).toLowerCase().includes(t))
    );
  }, [rows, searchTerm]);

  const [selected, setSelected] = useState(null);
  const closeModal = () => setSelected(null);
  const openModal = (row) => setSelected(row);

  if (loading) return <div className="loading">Loading assignments...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <TableContainer
        component={Paper}
        className="table container"
        style={{
          height: '75vh',
          maxHeight: '80vh',
          overflow: 'auto',
          '--col-count': 22,
          '--col-width': '200px',
          '--first-col-width': '160px'
        }}
      >
        <Table aria-label="assignment history table" size="small">
          <TableHead>
            <TableRow>
              <TableCell className="tableCell">Assignment ID</TableCell>
              <TableCell className="tableCell">Assigned To</TableCell>
              <TableCell className="tableCell">Assigned By</TableCell>
              <TableCell className="tableCell">Type</TableCell>
              <TableCell className="tableCell">From Branch</TableCell>
              <TableCell className="tableCell">To Branch</TableCell>
              <TableCell className="tableCell">Items</TableCell>
              <TableCell className="tableCell">Amount</TableCell>
              <TableCell className="tableCell">Status</TableCell>
              <TableCell className="tableCell">Notes</TableCell>
              <TableCell className="tableCell">Created At</TableCell>
              <TableCell className="tableCell">Updated At</TableCell>
              <TableCell className="tableCell">Delivered At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell className="tableCell" colSpan={18} align="center">
                  No assignments found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(r => (
              <TableRow
                key={r.assignment_id}
                className="clickable-row"
                hover
                style={{ cursor: 'pointer' }}
                onClick={() => openModal(r)}
              >
                <TableCell className="tableCell">{r.assignment_id}</TableCell>
                <TableCell className="tableCell">{r.assigned_to_name ?? r.assigned_to ?? '—'}</TableCell>
                <TableCell className="tableCell">{r.assigned_by_name ?? r.assigned_by ?? '—'}</TableCell>
                <TableCell className="tableCell">{r.assignment_type ?? '—'}</TableCell>
  
                <TableCell className="tableCell">{r.from_branch_name ?? r.from_branch_id ?? '—'}</TableCell>
              
                <TableCell className="tableCell">{r.to_branch_name ?? r.to_branch_id ?? '—'}</TableCell>
                <TableCell className="tableCell">
                  {Array.isArray(r.items)
                    ? `${r.items.length} item(s)`
                    : (r.items ? String(r.items) : '—')}
                </TableCell>
                <TableCell className="tableCell">{r.amount != null ? Number(r.amount).toFixed(2) : '—'}</TableCell>
                <TableCell className="tableCell">{r.status ?? '—'}</TableCell>
                <TableCell className="tableCell">{r.notes ? String(r.notes).slice(0, 60) : '—'}</TableCell>
                <TableCell className="tableCell">{fmt(r.created_at)}</TableCell>
                <TableCell className="tableCell">{fmt(r.updated_at)}</TableCell>

                <TableCell className="tableCell">{fmt(r.delivered_at)}</TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {selected && (
        <AssignmentDetailCard
          assignment={selected}
          onClose={closeModal}
          apiBase={API_BASE}
          formatDate={fmt}
        />
      )}
    </>
  );
};

export default TableAssignmentHistory;