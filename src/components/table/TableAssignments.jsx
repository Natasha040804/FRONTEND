import React, { useState, useEffect, useMemo } from 'react';
import './table.scss';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { apiUrl } from '../../apiBase';
import TrackDelivery from '../delivery/TrackDelivery';
import { useAuth } from '../../context/authContext';

// Columns: Assignment ID, Assignment Type, Assigned By (Username), Assigned To, To Branch, Pickup Proof, Drop Off
// Drop Off opens detail card + form similar to generic detail pattern
const TableAssignments = ({ refreshKey = 0, searchTerm = '' }) => {
  const [assignments, setAssignments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewing, setViewing] = useState(null); // assignment being tracked
  const { getAuthHeaders } = useAuth();
  

  // Using a fixed dependency list to avoid HMR warnings about changing array size
  useEffect(() => {
    const controller = new AbortController();
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        // Use public active assignments to avoid auth 401 on dashboards
        const headers = await getAuthHeaders();
        const res = await fetch(apiUrl('/api/delivery-assignments/active'), { signal: controller.signal, credentials: 'include', headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const data = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
        // build quick lookup maps from fetched branches and users
        const branchMap = (branches || []).reduce((m, b) => { m[String(b.BranchID)] = b.BranchName; return m; }, {});
        const userMap = (users || []).reduce((m, u) => { m[String(u.Account_id || u.Account_id || u.Account_id)] = (u.Username || u.Username || u.Fullname || ''); return m; }, {});

        const rows = data.map((a, idx) => ({
          assignmentId: a.assignment_id || a.AssignmentID || a.assignmentId || a.id || `A-${1000 + idx}`,
          assignmentType: a.assignment_type || a.AssignmentType || '—',
          assignedBy: a.assigned_by_username || a.assigned_by_name || (a.assigned_by ? (userMap[String(a.assigned_by)] || a.assigned_by) : (a.AssignedBy || '—')),
          assignedTo: a.driver_name || a.assigned_to_name || a.assigned_to || a.AssignedTo || '—',
          toBranchName: a.to_branch_name || a.ToBranchName || (a.to_branch_id ? (branchMap[String(a.to_branch_id)] || a.to_branch_id) : '—'),

          pickupProof: a.item_image || a.pickup_image || null,
          dropOffStatus: a.status || a.DropOffStatus || a.dropOffStatus || 'Pending',
          fromBranchName: a.from_branch_name || a.FromBranchName || (a.from_branch_id ? (branchMap[String(a.from_branch_id)] || a.from_branch_id) : '—'),
          fromBranchId: a.from_branch_id || a.fromBranchId || a.from_branch || '—',
        }));
        setAssignments(rows.length ? rows : [
          { assignmentId: 'A-1001', assignedBy: 'Admin', assignedTo: 'Rider 01', dropOffStatus: 'Pending' },
          { assignmentId: 'A-1002', assignedBy: 'Auditor', assignedTo: 'Rider 02', dropOffStatus: 'Pending' },
          { assignmentId: 'A-1003', assignedBy: 'AE John', assignedTo: 'Rider 03', dropOffStatus: 'Pending' }
        ]);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Assignments fetch error:', err);
          setError('Failed to load assignments');
          setAssignments([
            { assignmentId: 'A-1001', assignedBy: 'Admin', assignedTo: 'Rider 01', dropOffStatus: 'Pending' },
            { assignmentId: 'A-1002', assignedBy: 'Auditor', assignedTo: 'Rider 02', dropOffStatus: 'Pending' },
            { assignmentId: 'A-1003', assignedBy: 'AE John', assignedTo: 'Rider 03', dropOffStatus: 'Pending' }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
    return () => controller.abort();
  }, [refreshKey, branches, users, getAuthHeaders]);

  // fetch branches and users lookup for display names (run once)
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const headers = await getAuthHeaders();
        const branchResp = await fetch(apiUrl('/api/users/branches'), {
          credentials: 'include',
          headers
        });
        if (branchResp.ok) {
          const b = await branchResp.json();
          if (b && b.success && Array.isArray(b.data)) setBranches(b.data);
        }
      } catch (e) {
        console.warn('Could not fetch branches for assignments table', e);
      }
      try {
        const headers = await getAuthHeaders();
        const usersResp = await fetch(apiUrl('/api/users'), {
          credentials: 'include',
          headers
        });
        if (usersResp.ok) {
          const u = await usersResp.json();
          if (Array.isArray(u)) setUsers(u);
          else if (u && Array.isArray(u.data)) setUsers(u.data);
        }
      } catch (e) {
        console.warn('Could not fetch users for assignments table', e);
      }
    };
    fetchLookups();
  }, [getAuthHeaders]);

  const filtered = useMemo(() => {
    if (!searchTerm) return assignments;
    const t = searchTerm.toLowerCase();
    return assignments.filter(a => [a.assignmentId, a.assignedBy, a.assignedTo].some(f => f && String(f).toLowerCase().includes(t)));
  }, [assignments, searchTerm]);    

  const closeTrack = () => setViewing(null);

  if (loading) return <div className="loading">Loading assignments...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <TableContainer 
        component={Paper} 
        className="table container"
        style={{ maxHeight: '100vh', overflow: 'auto', '--col-count': 7, '--col-width': '180px', '--first-col-width': '220px' }}
      >
        <Table aria-label="assignments table">
          <TableHead>
            <TableRow>
              <TableCell className="tableCell">Assignment ID</TableCell>
              <TableCell className="tableCell">Assigned By</TableCell>
              <TableCell className="tableCell">Assigned To</TableCell>
              <TableCell className="tableCell">Assignment Type</TableCell>
              <TableCell className="tableCell">Pick Up</TableCell>
              <TableCell className="tableCell">Drop Off</TableCell>
              <TableCell className="tableCell">View Location</TableCell>
        
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(a => (
              <TableRow key={a.assignmentId} className="clickable-row">
                <TableCell className="tableCell clickable">{a.assignmentId}</TableCell>
                <TableCell className="tableCell clickable">{a.assignedBy}</TableCell>
                <TableCell className="tableCell clickable">{a.assignedTo}</TableCell>
                <TableCell className="tableCell clickable">{a.assignmentType || '—'}</TableCell>
                <TableCell className="tableCell clickable">{a.fromBranchName || a.fromBranchId || '—'}</TableCell>
                <TableCell className="tableCell clickable">{a.toBranchName || '—'}</TableCell>
                <TableCell className="tableCell">
                  <button type="button" className="btn btn--primary" onClick={() => setViewing(a)}>View Location</button>
                </TableCell>
               
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {viewing && (
        <div className="detail-overlay">
          <div className="detail-card assignment-card" style={{ width: '95%', maxWidth: 1100 }}>
            <div className="detail-card__header">
              <div className="detail-card__title">
                <div className="detail-card__item-id">Tracking Assignment #{viewing.assignmentId}</div>
                <div className="detail-card__item-desc">{viewing.assignedTo || ''}</div>
              </div>
              <div className="detail-card__header-actions">
                <button className="detail-card__close-btn" onClick={closeTrack} aria-label="close">×</button>
              </div>
            </div>
            <div className="detail-card__sections" style={{ height: '70vh' }}>
              <TrackDelivery embedded assignmentId={viewing.assignmentId} onClose={closeTrack} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TableAssignments;
