import Sidebar from "../sidebar/sidebar";
import "./home.scss";
import { useEffect, useRef, useState, useCallback } from 'react';
import { getApiBase } from '../../apiBase';
import { useAuth } from '../../context/authContext';
import ApprovalCard from "../card/ApprovalCard";

const UserApproval = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load data with better error handling
  const { getAuthHeaders } = useAuth();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading admin data...');
      const API_BASE = getApiBase();
      if (!API_BASE) {
        console.error('[UserApproval] Missing API base URL. Set REACT_APP_API_BASE or window.__API_BASE__');
        setError('API base URL not configured');
        setLoading(false);
        return;
      }
      const headers = await getAuthHeaders({ Accept: 'application/json' });
      const pendingUrl = `${API_BASE}/api/branch-access/pending`;
      const sessionsUrl = `${API_BASE}/api/branch-access/active-sessions`;
      console.log('[UserApproval] Fetching:', { pendingUrl, sessionsUrl, headers: Object.keys(headers || {}) });
      const [pendingResp, sessionsResp] = await Promise.all([
        fetch(pendingUrl, { credentials: 'include', headers }),
        fetch(sessionsUrl, { credentials: 'include', headers })
      ]);
      console.log('[UserApproval] Responses:', {
        pendingStatus: pendingResp.status,
        pendingCT: pendingResp.headers.get('content-type'),
        sessionsStatus: sessionsResp.status,
        sessionsCT: sessionsResp.headers.get('content-type')
      });

      if (!pendingResp.ok) {
        const txt = await pendingResp.text();
        console.warn('[UserApproval] Pending non-ok body (truncated):', txt.slice(0,200));
        let parsed; try { parsed = JSON.parse(txt); } catch (_) {}
        throw new Error((parsed && parsed.error) || `Failed pending (${pendingResp.status})`);
      }

      if (!sessionsResp.ok) {
        const txt = await sessionsResp.text();
        console.warn('[UserApproval] Sessions non-ok body (truncated):', txt.slice(0,200));
        let parsed; try { parsed = JSON.parse(txt); } catch (_) {}
        throw new Error((parsed && parsed.error) || `Failed sessions (${sessionsResp.status})`);
      }

      const pendingCt = pendingResp.headers.get('content-type') || '';
      const sessionsCt = sessionsResp.headers.get('content-type') || '';
      if (!pendingCt.includes('application/json')) {
        const txt = await pendingResp.text();
        console.error('[UserApproval] Pending HTML fallback? First 200 chars:', txt.slice(0,200));
        throw new Error('Pending non-JSON: ' + pendingCt);
      }
      if (!sessionsCt.includes('application/json')) {
        const txt = await sessionsResp.text();
        console.error('[UserApproval] Sessions HTML fallback? First 200 chars:', txt.slice(0,200));
        throw new Error('Sessions non-JSON: ' + sessionsCt);
      }
      const pendingData = await pendingResp.json();
      const sessionsData = await sessionsResp.json();

      console.log('Pending requests:', pendingData);
      console.log('Active sessions:', sessionsData);

      setPendingRequests(Array.isArray(pendingData) ? pendingData : []);
      setActiveSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Unable to load data');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Auto-refresh effect
  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadingRef = useRef(loading);
  const busyRef = useRef(busyId);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    busyRef.current = busyId;
  }, [busyId]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const interval = setInterval(() => {
      if (!loadingRef.current && !busyRef.current) {
        console.log('Auto-refreshing data...');
        loadData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  // Handle approve with better error handling
  const handleApprove = async (id, durationHours = 12) => {
    try {
      setBusyId(id);
      setError('');
      
      console.log(`Approving request ${id} for ${durationHours} hours`);
      const API_BASE = getApiBase();
      if (!API_BASE) throw new Error('API base URL not configured');
      const headers = await getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const resp = await fetch(`${API_BASE}/api/branch-access/approve/${id}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ durationHours })
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Approve failed: ${resp.status}`);
      }

      const result = await resp.json();
      console.log('Approve successful:', result);
      
      await loadData();
    } catch (err) {
      console.error('Approve error:', err);
      setError(err.message || 'Failed to approve request');
    } finally {
      setBusyId(null);
    }
  };

  // Handle deny with better error handling
  const handleDeny = async (id, reason = 'Not needed') => {
    try {
      setBusyId(id);
      setError('');
      
      console.log(`Denying request ${id}, reason: ${reason}`);
      const API_BASE = getApiBase();
      if (!API_BASE) throw new Error('API base URL not configured');
      const headers = await getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const resp = await fetch(`${API_BASE}/api/branch-access/deny/${id}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ reason })
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Deny failed: ${resp.status}`);
      }

      const result = await resp.json();
      console.log('Deny successful:', result);
      
      await loadData();
    } catch (err) {
      console.error('Deny error:', err);
      setError(err.message || 'Failed to deny request');
    } finally {
      setBusyId(null);
    }
  };

  // FIXED: Handle end session - using session ID instead of accountExecutiveId
  const handleEndSession = async (sessionId) => {
    try {
      setBusyId(sessionId);
      setError('');
      
      console.log(`Ending session ${sessionId}`);
      const API_BASE = getApiBase();
      if (!API_BASE) throw new Error('API base URL not configured');
      const headers = await getAuthHeaders({ Accept: 'application/json' });
      const resp = await fetch(`${API_BASE}/api/branch-access/end-session/${sessionId}`, {
        method: 'POST',
        credentials: 'include',
        headers
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to end session: ${resp.status}`);
      }

      const result = await resp.json();
      console.log('End session successful:', result);
      
      await loadData();
    } catch (err) {
      console.error('End session error:', err);
      setError(err.message || 'Failed to end session');
    } finally {
      setBusyId(null);
    }
  };

  // Clear error
  const clearError = () => setError('');

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
  };

  // Manual refresh
  const handleManualRefresh = () => {
    if (!loading && !busyId) {
      loadData();
    }
  };

  // Helper function to get display name for session
  const getSessionDisplayName = (session) => {
    return session.username || 
           session.accountName || 
           session.fullname || 
           `Account Executive #${session.accountExecutiveId || session.id}`;
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        
        {/* Error Display */}
        {error && (
          <div style={{ 
            color: '#b00020', 
            backgroundColor: '#ffebee',
            padding: '12px 16px',
            margin: '16px',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{error}</span>
            <button 
              onClick={clearError}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#b00020',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0 8px'
              }}
            >
              ×
            </button>
          </div>
        )}
        
        {/* Control Panel */}
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px',
          margin: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={handleManualRefresh} 
              disabled={loading || busyId}
              style={{ 
                padding: '8px 16px', 
                cursor: loading || busyId ? 'not-allowed' : 'pointer',
                backgroundColor: loading || busyId ? '#ccc' : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>↻</span>
              {loading ? 'Refreshing...' : 'Refresh Now'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="auto-refresh"
                checked={autoRefresh}
                onChange={toggleAutoRefresh}
                disabled={loading || busyId}
              />
              <label htmlFor="auto-refresh" style={{ cursor: 'pointer' }}>
                Auto-refresh every 30 seconds
              </label>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '14px',
            color: '#666'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: autoRefresh ? '#4caf50' : '#ccc',
              animation: autoRefresh ? 'pulse 2s infinite' : 'none'
            }} />
            <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="listContainer">
          <div className="listTitle">
            Pending Branch Access Requests
            {!loading && (
              <span style={{ 
                fontSize: '14px', 
                color: '#666', 
                marginLeft: '12px',
                fontWeight: 'normal'
              }}>
                ({pendingRequests.length} pending)
              </span>
            )}
          </div>
          
          <div className="approvalGrid">
            {loading && (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                gridColumn: '1 / -1' 
              }}>
                <div>Loading requests and sessions...</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  Auto-refresh: {autoRefresh ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            )}
            
            {!loading && pendingRequests.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#666',
                gridColumn: '1 / -1'
              }}>
                No pending requests.
              </div>
            )}
            
            {!loading && pendingRequests.map((request) => (
              <ApprovalCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onDeny={handleDeny}
                busyId={busyId}
              />
            ))}
          </div>
        </div>

        {/* Active Sessions - FIXED */}
        <div className="listContainer">
          <div className="listTitle">
            Active Sessions
            {!loading && (
              <span style={{ 
                fontSize: '14px', 
                color: '#666', 
                marginLeft: '12px',
                fontWeight: 'normal'
              }}>
                ({activeSessions.length} active)
              </span>
            )}
          </div>
          
          {!loading && activeSessions.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666' 
            }}>
              No active sessions.
            </div>
          ) : (
            <div style={{ padding: '16px' }}>
              {activeSessions.map((session) => (
                <div 
                  key={session.id} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: 8,
                    backgroundColor: '#fafafa',
                    marginBottom: 12,
                    position: 'relative'
                  }}
                >
                  {/* Session status indicator */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      fontSize: '10px',
                      color: '#666',
                      background: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: '16px' }}>
                      {/* FIXED: Use username instead of undefined accountName */}
                      {getSessionDisplayName(session)}
                    </div>
                    <div style={{ color: '#666', marginBottom: 4 }}>
                      <strong>Branch:</strong> {session.BranchName || `Branch #${session.branchId}`}
                    </div>
                    {/* REMOVED: Email field since it's not available */}
                    <div style={{ fontSize: 14, color: '#888' }}>
                      <strong>Active until:</strong> {session.active_until ? 
                        new Date(session.active_until).toLocaleString() : 
                        'No expiration set'
                      }
                    </div>
                  </div>
                  
                  {/* FIXED: Use session.id instead of accountExecutiveId */}
                  <button
                    onClick={() => handleEndSession(session.id)}
                    disabled={busyId === session.id}
                    style={{
                      padding: '8px 16px',
                      cursor: busyId === session.id ? 'not-allowed' : 'pointer',
                      backgroundColor: busyId === session.id ? '#ccc' : '#d32f2f',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 14,
                      minWidth: '100px'
                    }}
                  >
                    {busyId === session.id ? 'Ending...' : 'End Session'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Add some CSS for the pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default UserApproval;
