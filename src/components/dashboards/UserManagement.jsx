import Sidebar from "../sidebar/sidebar";
import "./home.scss";
import UsersTable from "../../components/table/UsersTable"; 
import Widget from "../widget/Widgets";
import { useState, useCallback, useEffect } from 'react';
import SearchBar from '../../components/search/SearchBar';
import { userService } from '../../services/userService';
import AddUserModal from '../../components/modals/AddUserModal';

const UserManagement = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // User counts state
  const [counts, setCounts] = useState({ total: 0, admin: 0, auditor: 0, ae: 0 });
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadCounts = async () => {
      try {
        const [total, admin, auditor, ae] = await Promise.all([
          userService.getTotalUsersCount(),
          userService.getCountByRole('Admin'),
          userService.getCountByRole('Auditor'),
          userService.getCountByRole('AccountExecutive'),
        ]);
        if (mounted) setCounts({ total, admin, auditor, ae });
      } catch (e) {
        if (mounted) setCounts({ total: 0, admin: 0, auditor: 0, ae: 0 });
      }
    };
    loadCounts();
    return () => { mounted = false; };
  }, [refreshKey]);

  // Local modal state moved from navbar component
  const [showAdd, setShowAdd] = useState(false);
  const handleAddClick = () => setShowAdd(true);
  const handleAdded = (u) => { setShowAdd(false); bumpRefresh(); };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        <div className="widgets">
          <Widget type="Total Users" count={counts.total} diff={0} />
          <Widget type="Admin Users" count={counts.admin} diff={0} />
          <Widget type="Auditor Users" count={counts.auditor} diff={0} />
          <Widget type="Account Executives" count={counts.ae} diff={0} />
        </div>
        <div className="listContainer">
          <div className="userActionsBar">
            <div className="left">
              <SearchBar value={userSearch} onChange={setUserSearch} placeholder="Search users..." />
            </div>
            <div className="right actionGroup">
              <button type="button" className="actionBtn add" onClick={handleAddClick}>Add</button>
              <button type="button" className="actionBtn" onClick={bumpRefresh} title="Refresh table">Refresh</button>
              <button type="button" className="actionBtn update" disabled>Update</button>
              <button type="button" className="actionBtn delete" disabled>Delete</button>
            </div>
          </div>
          <UsersTable refreshKey={refreshKey} searchTerm={userSearch} />
        </div>
      </div>
      {showAdd && (
        <AddUserModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
};

export default UserManagement;