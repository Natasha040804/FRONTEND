import React, { useEffect, useRef, useState } from 'react';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import EditNoteIcon from '@mui/icons-material/EditNote';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useAuth } from '../../context/authContext';
import { getApiBase } from '../../apiBase';

const Notifications = () => {
  const { getAuthHeaders, user } = useAuth();
  const API_BASE = getApiBase();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const lastStatusesRef = useRef({});
  const lastRequestStatusesRef = useRef({});

  useEffect(() => {
    const onDocClick = (e) => {
      if (!notifRef.current) return;
      if (!notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    const normalizeAssignments = (payload) => {
      if (!payload) return [];
      if (Array.isArray(payload)) return payload;
      if (payload.data && Array.isArray(payload.data)) return payload.data;
      return [];
    };

    const checkForUpdates = async () => {
      try {
        const headers = await getAuthHeaders();
        try {
          const uid = user && (user.userId || user.id || user.Account_id || user.AccountId || user.AccountId);
          if (uid) headers['X-User-Id'] = String(uid);
        } catch (e) {}

        const assignmentsResp = await fetch(`${API_BASE}/api/delivery-assignments/my-assignments`, {
          credentials: 'include',
          headers
        });

        if (!mounted) return;

        const newNotifications = [];

        if (assignmentsResp.ok) {
          const assignmentsJson = await assignmentsResp.json();
          const items = normalizeAssignments(assignmentsJson);

          for (const a of items) {
            const id = a.assignment_id || a.assignmentId || a.id;
            const status = (a.status || '').toString().toUpperCase();
            const last = lastStatusesRef.current[id];

            if (last && last !== status) {
              if (status === 'IN_PROGRESS' || status === 'IN-PROGRESS' || status === 'INPROGRESS') {
                newNotifications.push({
                  type: 'assignment_in_progress',
                  title: 'Delivery In Progress',
                  body: `Assignment #${id} has been picked up by driver`,
                  assignmentId: id,
                  assignedTo: a.assigned_to || a.assignedTo || a.assignedName || a.driver || a.assignee || null,
                  timestamp: new Date().toISOString()
                });
              } else if (status === 'COMPLETED' || status === 'COMPLETE' || status === 'DONE') {
                newNotifications.push({
                  type: 'assignment_completed',
                  title: 'Delivery Completed',
                  body: `Assignment #${id} has been completed successfully`,
                  assignmentId: id,
                  assignedTo: a.assigned_to || a.assignedTo || a.assignedName || a.driver || a.assignee || null,
                  timestamp: new Date().toISOString()
                });
              } else if (status === 'CANCELLED' || status === 'CANCELED') {
                newNotifications.push({
                  type: 'assignment_cancelled',
                  title: 'Delivery Cancelled',
                  body: `Assignment #${id} has been cancelled`,
                  assignmentId: id,
                  timestamp: new Date().toISOString()
                });
              }
            }

            if (id) lastStatusesRef.current[id] = status;
          }
        }

        if (newNotifications.length > 0) {
          setNotifications(prev => [...newNotifications, ...prev]);
        }
      } catch (err) {
        // keep polling quiet on errors
        // console.debug('Notification poll error', err);
      }
    };

    (async () => {
      try {
        const headers = await getAuthHeaders();
        try {
          const uid = user && (user.userId || user.id || user.Account_id || user.AccountId || user.AccountId);
          if (uid) headers['X-User-Id'] = String(uid);
        } catch (e) {}

        const assignmentsResp = await fetch(`${API_BASE}/api/delivery-assignments/my-assignments`, { 
          credentials: 'include', 
          headers 
        });

        if (assignmentsResp.ok) {
          const json = await assignmentsResp.json();
          const items = normalizeAssignments(json);
          for (const a of items) {
            const id = a.assignment_id || a.assignmentId || a.id;
            const status = (a.status || '').toString().toUpperCase();
            if (id) lastStatusesRef.current[id] = status;
          }
        }
      } catch (e) {
        // ignore
      }
      intervalId = setInterval(checkForUpdates, 10000);
    })();

    return () => { 
      mounted = false; 
      if (intervalId) clearInterval(intervalId); 
    };
  }, [API_BASE, getAuthHeaders, user]);

  return (
    <div className="notifWrapper" ref={notifRef}>
      <button
        className="notifButton"
        type="button"
        aria-label="Notifications"
        aria-expanded={notifOpen}
        onClick={() => setNotifOpen((s) => !s)}
      >
        <NotificationsNoneIcon className="notifIcon" />
        {notifications.length > 0 && (
          <span className="notifBadge" aria-hidden="true">{notifications.length}</span>
        )}
      </button>

      {notifOpen && (
        <div className="notifPane" role="dialog" aria-label="Notifications panel">
          <div className="notifPaneHeader">
            <strong>Notifications</strong>
            <button className="clearBtn" type="button" onClick={() => setNotifications([])}>Clear</button>
          </div>
          <div className="notifList">
            {notifications.length === 0 ? (
              <div className="notifEmpty">No new notifications</div>
            ) : (
              notifications.map((n, idx) => {
                const isAssignment = n && (n.type === 'assignment_in_progress' || n.type === 'assignment_completed' || n.type === 'new_assignment');
                const isRequestUpdate = n && n.type === 'request_status_update';

                if (isAssignment) {
                  const assignmentId = n.assignmentId || n.assignment_id || n.id || '—';
                  const assignedTo = n.assignedTo || n.assigned_to || n.assignedName || n.assigned || n.body || 'Unassigned';
                  return (
                    <div key={idx} className={`notifItem notifAssignment ${n.type}`}>
                      <div className="notifRow">
                        <div className="notifAvatar">
                          {n.type === 'new_assignment' && <LocalShippingIcon />}
                          {n.type === 'assignment_in_progress' && <WorkHistoryIcon />}
                          {n.type === 'assignment_completed' && <VerifiedUserOutlinedIcon />}
                        </div>
                        <div className="notifContent">
                          <div className="notifHeading">{n.title}</div>
                          <div className="notifBody">{n.body}</div>
                          <div className="notifMeta">Assignment ID: <span className="metaValue">{assignmentId}</span></div>
                          {n.assignedTo && (
                            <div className="notifMeta">Assigned to: <span className="metaValue">{assignedTo}</span></div>
                          )}
                          {n.timestamp && (
                            <div className="notifTime">{new Date(n.timestamp).toLocaleTimeString()}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isRequestUpdate) {
                  return (
                    <div key={idx} className="notifItem notifRequest">
                      <div className="notifRow">
                        <div className="notifAvatar"><EditNoteIcon /></div>
                        <div className="notifContent">
                          <div className="notifHeading">{n.title}</div>
                          <div className="notifBody">{n.body}</div>
                          <div className="notifMeta">Request ID: <span className="metaValue">{n.requestId}</span></div>
                          <div className="notifMeta">Status: <span className="metaValue">{n.status}</span></div>
                          {n.timestamp && (
                            <div className="notifTime">{new Date(n.timestamp).toLocaleTimeString()}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="notifItem">
                    <div className="notifTitle">{n.title}</div>
                    <div className="notifBody">{n.body}</div>
                    {n.timestamp && (
                      <div className="notifTime">{new Date(n.timestamp).toLocaleTimeString()}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
