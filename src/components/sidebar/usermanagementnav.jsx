import "./navbar.scss";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { useState } from 'react';
import AddUserModal from '../modals/AddUserModal';

const UserManagementNavbar = ({ actions } = {}) => {
  const [showAdd, setShowAdd] = useState(false);

  const handleAddClick = () => {
    setShowAdd(true);
  };

  const handleAdded = (u) => {
    setShowAdd(false);
    if (actions && typeof actions.onAdded === 'function') actions.onAdded(u);
  };

  return (
    <div className="navbar">
      <div className="wrapper">
        <div className="search">
          <input type="text" placeholder="Search..." />
          <SearchOutlinedIcon />
        </div>
        <div className="items">
          <div className="actionGroup">
            <button
              type="button"
              className="actionBtn add"
              onClick={handleAddClick}
            >
              Add
            </button>
            <button
              type="button"
              className="actionBtn"
              onClick={() => actions?.onRefresh?.()}
              title="Refresh table"
            >
              Refresh
            </button>
            <button
              type="button"
              className="actionBtn update"
            >
              Update
            </button>
            <button
              type="button"
              className="actionBtn delete"
            >
              Delete
            </button>
          </div>
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

export default UserManagementNavbar;