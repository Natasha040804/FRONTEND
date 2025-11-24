import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBase } from '../apiBase';

export const AuthContext = createContext();
// API base is computed dynamically via getApiBase()

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [branchStatus, setBranchStatus] = useState(null);
  // Dev fallback: hold access token to send as Authorization header when cookies fail
  const [accessToken, setAccessToken] = useState(null);
  const navigate = useNavigate();

  // Dynamic base: localhost -> explicit backend, production -> same-origin
  const API_BASE = getApiBase();

  const ensureAccessToken = async () => {
    if (accessToken) return accessToken;
    try {
      const resp = await fetch(`${API_BASE}/api/refresh-token`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data && data.accessToken) {
        setAccessToken(data.accessToken);
        try { localStorage.setItem('accessToken', data.accessToken); } catch (e) {}
        return data.accessToken;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Build headers with Authorization if we have/obtain a token
  const getAuthHeaders = async (base = {}) => {
    let token = accessToken;
    if (!token) {
      try {
        const stored = localStorage.getItem('accessToken');
        if (stored) {
          token = stored;
          setAccessToken(stored);
        }
      } catch (e) {}
    }
    if (!token) token = await ensureAccessToken();
    const headers = { ...base };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // Check AE branch status
  const refreshBranchStatus = async () => {
    try {
      console.log('Refreshing branch status...');
      const headers = await getAuthHeaders();
      const resp = await fetch(`${API_BASE}/api/branch-access/my-status`, {
        credentials: 'include',
        headers
      });
      
      if (!resp.ok) {
        console.log('Branch status not found or error:', resp.status);
        setBranchStatus({ status: 'none' });
        return { status: 'none' };
      }
      
      const data = await resp.json();
      console.log('Branch status loaded:', data);
      setBranchStatus(data);
      return data;
    } catch (err) {
      console.error('Branch status fetch error:', err);
      setBranchStatus({ status: 'none' });
      return { status: 'none' };
    }
  };

  const login = async (credentials) => {
    try {
      setError('');
      console.log('Attempting login for:', credentials.username);
      // prefer new auth endpoint; fall back to legacy if needed
      let response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      if (response.status === 404) {
        // fallback to legacy login route
        response = await fetch(`${API_BASE}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
          credentials: 'include'
        });
      }

      // Detect 405 or HTML response indicating misconfigured API_BASE (frontend host instead of backend)
      if (response.status === 405 && (API_BASE === '' || API_BASE == null)) {
        console.error('Received 405 from relative login endpoint, likely hitting frontend instead of backend. Set REACT_APP_API_BASE or window.__API_BASE__.');
        throw new Error('API base URL not configured. Please set REACT_APP_API_BASE to your backend domain.');
      }

      // Check content type to avoid parsing HTML as JSON
      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        // Provide clearer diagnostic when HTML encountered
        if (/<!doctype html>/i.test(text)) {
          console.error('HTML received instead of JSON (likely wrong host).');
          throw new Error('Backend unreachable: API base misconfigured.');
        }
        console.error('Non-JSON response:', text);
        throw new Error(text || 'Unexpected error');
      }

      if (!response.ok) {
        console.error('Login failed with status:', response.status, data);
        throw new Error(data.error || 'Login Failed');
      }

      console.log('Login successful, user data:', data);

      // Determine backend role value (may come as Role or role)
      const backendRole = data.Role || data.role || '';
      const normalizedRole = (backendRole || '').toString().toLowerCase() === 'ae' || (backendRole === 'AccountExecutive')
        ? 'AccountExecutive'
        : backendRole;

      const userObj = {
        userId: data.userID || data.id || data.Account_id,
        username: data.username || data.Username || credentials.username,
        // keep both forms: display original Role and normalized role for internal checks
        Role: backendRole,
        role: normalizedRole,
        fullName: data.fullName || data.fullname || data.Fullname || data.name || credentials.username,
        BranchID: data.BranchID || data.branchId || data.branchid || null,
        Email: data.Email || data.email || null,
        Photo: data.Photo || data.photo || null,
      };

      // expose under both names for compatibility
      setCurrentUser(userObj);
      try { localStorage.setItem('user', JSON.stringify(userObj)); } catch (e) {}
      // persist minimal user info so refresh keeps the session client-side
      try {
        localStorage.setItem('user', JSON.stringify(userObj));
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          localStorage.setItem('accessToken', data.accessToken);
        }
      } catch (e) {
        // ignore storage errors
      }
      setError(null);

      if ((normalizedRole || '').toString().toLowerCase() === 'accountexecutive') {
        console.log('User is AE, checking branch status...');
        const status = await refreshBranchStatus();
        console.log('AE branch status:', status);
        if (status.status === 'approved') {
          navigate('/dashboards/AEdashboard');
        } else {
          navigate('/branch-access');
        }
      } else {
        setBranchStatus(null);
        console.log('User is not AE, role:', normalizedRole);
        switch (normalizedRole.toLowerCase()) {
          case 'admin':
            navigate('/dashboards/Admindashboard');
            break;
          case 'auditor':
            navigate('/dashboards/Auditordashboard');
            break;
          default:
            navigate('/');
        }
      }

      return userObj;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    }
  };
    
  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/logout`,{
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setCurrentUser(null);
    setBranchStatus(null);
    try { localStorage.removeItem('user'); } catch (e) {}
    navigate('/');
  };
   
  // on mount, attempt to rehydrate auth state
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      // restore access token fallback if present
      try {
        const storedToken = localStorage.getItem('accessToken');
        if (storedToken) setAccessToken(storedToken);
      } catch (e) {
        // ignore
      }
      // prefer server-validated session if available
      try {
        console.log('Checking existing session...');
        // Try new auth check endpoint first; fallback to legacy /api/me
        let resp = await fetch(`${API_BASE}/api/auth/check`, { credentials: 'include' });
        if (resp.status === 404) {
          resp = await fetch(`${API_BASE}/api/me`, { credentials: 'include' });
        }
        if (resp.ok) {
          const data = await resp.json();
          console.log('Session found:', data);
          const backendRole = data.Role || data.role || '';
          const normalizedRole = (backendRole || '').toString().toLowerCase() === 'ae' || (backendRole === 'AccountExecutive')
            ? 'AccountExecutive'
            : backendRole;
          const serverUser = {
            userId: data.userID || data.id || data.Account_id,
            username: data.username || data.user || data.Username || '',
            Role: backendRole,
            role: normalizedRole,
            fullName: data.fullName || data.fullname || data.Fullname || data.name || '' ,
            BranchID: data.BranchID || data.branchId || null
          };
          if (mounted) {
            setCurrentUser(serverUser);
            try { localStorage.setItem('user', JSON.stringify(serverUser)); } catch (e) {}
            if ((serverUser.role || '').toLowerCase() === 'accountexecutive') {
              await refreshBranchStatus();
            } else {
              setBranchStatus(null);
            }
            setAuthChecked(true);
          }
          return;
        } else {
          console.log('No valid session found, status:', resp.status);
        }
      } catch (e) {
        console.error('Error checking session:', e);
        // ignore network errors and fallback to localStorage
      }

      // fallback: restore from localStorage (best-effort)
      try {
        const stored = localStorage.getItem('user');
        if (stored && mounted) {
          const storedUser = JSON.parse(stored);
          console.log('Restoring user from localStorage:', storedUser);
          setCurrentUser(storedUser);
          if ((storedUser.role || '').toLowerCase() === 'accountexecutive') {
            await refreshBranchStatus();
          } else {
            setBranchStatus(null);
          }
        }
      } catch (e) {
        console.error('Error restoring from localStorage:', e);
      } finally {
        if (mounted) setAuthChecked(true);
      }
    };
    init();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ 
      // provide both shapes for backward compatibility
  currentUser,
  user: currentUser,
  setCurrentUser,
      error,
      login, 
      logout,
      setError, // Optional: allow components to clear errors
      authChecked,
      branchStatus,
      refreshBranchStatus,
      accessToken,
      getAuthHeaders
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
