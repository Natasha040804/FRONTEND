import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from "../sidebar/sidebar";
import "./home.scss";
import "../delivery/delivery.scss"; // extra styles for logisticsContainer override
import Widget from "../../components/widget/admininventorywidgets";
import PersonnelCard from "../personnel/PersonnelCard";
import AssignDeliveryCard from "./AssignDeliveryCard";
import TrackDelivery from "../delivery/TrackDelivery";
import "../personnel/personnel.scss";
import { useAuth } from '../../context/authContext';
import { getApiBase } from '../../apiBase';


const DeliveryRequests = () => {
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, standby: 0, assigned: 0 });
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [forceTrack, setForceTrack] = useState(false);
  const { currentUser } = useAuth();

  // Determine the status field to inspect/update based on the logged-in user's role
  const getStatusField = useCallback(() => {
    // Normalize role: handle role/Role, spaces and underscores
    const normalizedRole = (currentUser?.role || currentUser?.Role || '')
      .toString()
      .toLowerCase()
      .replace(/[\s_]+/g, '');
    switch (normalizedRole) {
      case 'auditor':
        return 'auditor_logistics_status';
      case 'accountexecutive':
        return 'AccountExecutive_logistics_status';
      default:
        return 'logistics_status';
    }
  }, [currentUser]);

  const fetchLogisticsPersonnel = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const API_BASE = getApiBase();
      const { getAuthHeaders } = useAuth();
      const headers = await getAuthHeaders({'Content-Type':'application/json'});
      const response = await fetch(`${API_BASE ? API_BASE : ''}/api/users/role/Logistics`, { headers, credentials:'include' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Failed to fetch data');

      const statusField = getStatusField();

      // Use the appropriate status field based on current user's role
      const transformed = (result.data || []).map((account) => {
        // Get the status from the appropriate field, default to 'STANDBY' if not set
        const statusValue = account[statusField] || 'STANDBY';
        const status = statusValue.toLowerCase();

        return {
          id: account.Account_id,
          name: account.Fullname,
          status: status,
          photoUrl: account.Photo || `https://i.pravatar.cc/150?img=${account.Account_id % 70}`,
          employeeId: account.EmployeeID,
          contact: account.Contact,
          email: account.Email,
          branch: account.BranchID,
          accountData: account,
        };
      });

      setPersonnel(transformed);
      const standbyCount = transformed.filter((p) => p.status === 'standby').length;
      const assignedCount = transformed.filter((p) => p.status === 'assigned').length;
      setStats({ total: transformed.length, standby: standbyCount, assigned: assignedCount });
    } catch (err) {
      console.error('Error fetching logistics personnel:', err);
      setError(err.message);
      setPersonnel([]);
      setStats({ total: 0, standby: 0, assigned: 0 });
    } finally {
      setLoading(false);
    }
  }, [getStatusField]);

  // Update a personnel's role-specific logistics status
  const updatePersonnelStatus = useCallback(async (personnelId, newStatus) => {
    try {
      const statusField = getStatusField();
      console.log('[DeliveryRequests] Updating status field', statusField, 'to', newStatus, 'for', personnelId);
      const response = await fetch(`/api/users/${personnelId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [statusField]: newStatus.toUpperCase() })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return await response.json();
    } catch (error) {
      console.error('Error updating personnel status:', error);
      throw error;
    }
  }, [getStatusField]);

  // Fetch data when component mounts or currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchLogisticsPersonnel();
    }
  }, [currentUser, fetchLogisticsPersonnel]);

  const handlePersonnelClick = useCallback((person) => {
    // Requirement: do not auto-open TrackDelivery from personnel card, even if assigned.
    setForceTrack(false);
    setSelectedPersonnel(selectedPersonnel?.id === person.id ? null : person);
  }, [selectedPersonnel]);

  const handleCloseAssignment = useCallback(() => {
    setSelectedPersonnel(null);
  }, []);

  const handleAssignmentComplete = useCallback(async () => {
    try {
      if (selectedPersonnel) {
        // Update the personnel status to 'assigned' for the current user's role
        await updatePersonnelStatus(selectedPersonnel.id, 'assigned');
      }
      // Refresh the personnel list to update statuses
      fetchLogisticsPersonnel();
      setSelectedPersonnel(null);
    } catch (error) {
      console.error('Error completing assignment:', error);
      alert('Error updating personnel status');
    }
  }, [selectedPersonnel, updatePersonnelStatus, fetchLogisticsPersonnel]);

  // Auto-refresh every 30 seconds, but pause while a personnel is selected
  useEffect(() => {
    if (selectedPersonnel) return;
    const interval = setInterval(() => {
      fetchLogisticsPersonnel();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedPersonnel, fetchLogisticsPersonnel]);

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="dashboardContainer">
          <div className="loading">Loading logistics personnel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        <div className="widgets">
          <Widget type="Logistics Personnel" count={stats.total} />
          <Widget type="Standby" count={stats.standby} />
          <Widget type="Assigned" count={stats.assigned} />

        </div>

  <div className="listContainer logisticsContainer">
          <div className="listTitle" style={{ color: 'white' }}>
            Logistics Personnel  
            
          </div>
          {error && (
            <div className="warning-message">
              ⚠️ Failed to load personnel data: {error}
              <button onClick={fetchLogisticsPersonnel} className="retry-btn">Retry</button>
            </div>
          )}
          <div className="personnel-legend">
            <span>Status:</span>
            <span className="dot standby"></span>
            <span>Standby ({stats.standby})</span>
            <span className="dot assigned" style={{ marginLeft: 16 }}></span>
            <span>Assigned ({stats.assigned})</span>
            
          </div>
          {personnel.length === 0 && !loading ? (
            <div className="no-personnel">{error ? 'Failed to load logistics personnel' : 'No logistics personnel found in the database.'}</div>
          ) : (
            <div className="personnel-layout">
              {personnel.map((p) => (
                <div key={p.id} className="personnel-with-assignment">
                  <PersonnelCard
                    name={p.name}
                    photoUrl={p.photoUrl}
                    status={p.status}
                    employeeId={p.employeeId}
                    onClick={() => handlePersonnelClick(p)}
                    isSelected={selectedPersonnel?.id === p.id}
                    branch={p.branch}
                  />

                  {selectedPersonnel?.id === p.id && (
                    (forceTrack) ? (
                      <div className="tracking-embed-wrapper">
                        <TrackDelivery
                          embedded
                          onClose={handleCloseAssignment}
                          personnelId={p.id}
                          name={p.name}
                          status={p.status}
                        />
                      </div>
                    ) : (
                      <AssignDeliveryCard
                        personnel={selectedPersonnel}
                        onClose={handleCloseAssignment}
                        onAssignmentComplete={handleAssignmentComplete}
                      />
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryRequests;
