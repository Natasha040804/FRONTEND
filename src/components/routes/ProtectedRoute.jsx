import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

/**
 * ProtectedRoute enforces authentication and optional role checks.
 * It tolerates different authContext shapes by checking common properties.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const auth = useAuth();

  // support multiple possible names used by different authContext implementations
  const currentUser = auth?.currentUser || auth?.user || auth?.authUser || null;
  const branchStatus = auth?.branchStatus;

  // If the auth provider is still checking/rehydrating, don't redirect yet.
  if (auth && auth.authChecked === false) {
    // Could render a loader here; returning null avoids flicker/redirect
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // normalize role values (accept 'AE' as shorthand for AccountExecutive)
  const normalizeRole = (r) => {
    if (!r) return '';
    const lower = (r || '').toString().toLowerCase();
    if (lower === 'ae') return 'accountexecutive';
    return lower;
  };

  const role = normalizeRole(currentUser.role || currentUser.Role || '');

  if (role === 'accountexecutive') {
    const requiresBranch = location.pathname !== '/branch-access';
    if (requiresBranch && (!branchStatus || branchStatus.status !== 'approved')) {
      return <Navigate to="/branch-access" replace state={{ from: location }} />;
    }
  }

  if (allowedRoles && Array.isArray(allowedRoles)) {
    const normalized = allowedRoles.map((r) => normalizeRole(r));
    if (!normalized.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}