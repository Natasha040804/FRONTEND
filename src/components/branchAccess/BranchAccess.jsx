import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import styles from './BranchAccess.module.css';
import { getApiBase } from '../../apiBase';
const API_BASE = getApiBase();

const BranchAccess = () => {
  const { user, refreshBranchStatus, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not Account Executive (normalize various role values)
  useEffect(() => {
    const role = (user?.role || user?.Role || '').toLowerCase();
    if (user && role && role !== 'accountexecutive' && role !== 'ae') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Load branches
  useEffect(() => {
    const loadBranches = async () => {
      try {
        console.log('Loading branches...');
        const resp = await fetch(`${API_BASE}/api/branches`, { 
          credentials: 'include' 
        });
        
        if (!resp.ok) {
          throw new Error(`Failed to load branches: ${resp.status}`);
        }
        
        const data = await resp.json();
        console.log('Branches loaded:', data);
        setBranches(data);
        if (data.length > 0) setSelectedBranch(data[0].BranchID);
      } catch (err) {
        console.error('Branch load error:', err);
        setError(err.message);
      }
    };
    loadBranches();
  }, []);

  // Submit request - UPDATED ENDPOINT
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBranch) return;

    setLoading(true);
    setError('');
    try {
      console.log('Submitting request for branch:', selectedBranch);
      
      const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
      const resp = await fetch(`${API_BASE}/api/branch-access/request`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ branchId: parseInt(selectedBranch, 10) })
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${resp.status}`);
      }

      const result = await resp.json();
      console.log('Request submitted successfully:', result);
      
      // Refresh status after submission
      if (refreshBranchStatus) {
        await refreshBranchStatus();
      }
      
      alert('Request sent to Admin!');
    } catch (err) {
      console.error('Submit `error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check status - UPDATED ENDPOINT
  const handleRefreshStatus = async () => {
    try {
      console.log('Refreshing status...');
      const headers = await getAuthHeaders();
      const resp = await fetch(`${API_BASE}/api/branch-access/my-status`, {
        credentials: 'include',
        headers
      });
      
      if (!resp.ok) {
        throw new Error(`Status check failed: ${resp.status}`);
      }
      
      const status = await resp.json();
      console.log('Current status:', status);
      
      // Update your status display here
      if (refreshBranchStatus) {
        await refreshBranchStatus();
      }
    } catch (err) {
      console.error('Status refresh error:', err);
      setError(err.message);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>
        <h1>Request Branch Access</h1>
        <p>Select a branch to request access:</p>

        {error && (
          <div style={{ 
            color: '#b00020', 
            backgroundColor: '#ffebee',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="branch-select">Select Branch:</label>
          <select 
            id="branch-select"
            value={selectedBranch} 
            onChange={(e) => setSelectedBranch(e.target.value)}
            disabled={loading || branches.length === 0}
            style={{ 
              width: '100%',
              padding: '8px',
              marginBottom: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          >
            {branches.length === 0 && (
              <option value="">Loading branches...</option>
            )}
            {branches.map(branch => (
              <option key={branch.BranchID} value={branch.BranchID}>
                {branch.BranchName} - {branch.City} ({branch.BranchCode})
              </option>
            ))}
          </select>

          <button 
            type="submit" 
            disabled={loading || !selectedBranch || branches.length === 0}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Submitting...' : 'Request Access'}
          </button>
        </form>

        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            onClick={handleRefreshStatus}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Check Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchAccess;