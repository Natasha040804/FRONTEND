import "./sidebar.scss";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StoreIcon from "@mui/icons-material/Store";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import PersonIcon from '@mui/icons-material/Person';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SellIcon from '@mui/icons-material/Sell';
import EditNoteIcon from '@mui/icons-material/EditNote';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { Link } from "react-router-dom";
import { DarkModeContext } from "../../context/darkModeContext";
import { useContext, useState } from "react";
import { useAuth } from '../../context/authContext';

const Sidebar = () => {
  const { dispatch } = useContext(DarkModeContext);
  const { logout, user } = useAuth();
  // only one section open at a time: 'inventory' | 'delivery' | null
  const [openSection, setOpenSection] = useState(null);
  const role = user && user.role ? user.role.toLowerCase() : '';
  
  // Function to determine dashboard route based on user role
  const getDashboardRoute = () => {
    const role = user && user.role ? user.role.toLowerCase() : '';
    switch(role) {
      case 'admin':
        return '/dashboards/Admindashboard';
      case 'auditor':
        return '/dashboards/Auditordashboard';
      case 'accountexecutive':
        return '/dashboards/AEdashboard';
      default:
        return '/'; // fallback route to login
    }
  };

  return (
    <div className="sidebar">
      <div className="top">
        <div className="brand">
          <Link to={getDashboardRoute()} style={{ textDecoration: "none" }}>
            <span className="logo">MZE CELLULAR</span>
          </Link>

          
        </div>

        <div className="userInfo">
          <div className="avatar">
            {user && (user.Photo || user.photo) ? (
              <img src={user.Photo || user.photo} alt="avatar" />
            ) : (
              <div className="initials">
                {user && user.fullName ? user.fullName.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() : 'GU'}
              </div>
            )}
          </div>
          <div className="meta">
            <div className="userFullName">
              {user && user.fullName ? user.fullName : 'Guest User'}
            </div>
            <div className="roleLabel">
              {user && user.role ? user.role.toUpperCase() : 'GUEST'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="center">
        <ul>
          <li>
            <Link to={getDashboardRoute()} style={{ textDecoration: "none" }}>
              <button className="menuButton" type="button">
                <DashboardIcon className="icon" />
                <span>Dashboard</span>
              </button>
            </Link>
          </li>
          {['admin','auditor','accountexecutive'].includes(role) && (
            <li>
              <Link to="/messages" style={{ textDecoration: "none" }}>
                <button className="menuButton" type="button">
                  <ChatBubbleOutlineIcon className="icon" />
                  <span>Messages</span>
                </button>
              </Link>
            </li>
          )}
         
          <li>
            
            <button
              className="menuButton"
              type="button"
              onClick={() => setOpenSection(openSection === 'inventory' ? null : 'inventory')}
              aria-expanded={openSection === 'inventory'}
            >
              <StoreIcon className="icon" />
              <span>Inventory</span>
            </button>
          </li>
          <ul className={`submenu ${openSection === 'inventory' ? 'open' : ''}`} aria-hidden={openSection !== 'inventory'}>
            {
              (() => {
                const showItems = role === 'admin' || role === 'accountexecutive' || role === 'auditor';
                if (!showItems) return null;
                let itemsRoute = '/inventory-items';
                if (role === 'admin') itemsRoute = '/inventory-items';
                else if (role === 'accountexecutive') itemsRoute = '/branchinventory';
                else if (role === 'auditor') itemsRoute = '/inventory-items';
                return (
                  <li>
                    <Link to={itemsRoute} style={{ textDecoration: "none" }}>
                      <button className="menuButton subitem" type="button">
                        <PhoneAndroidIcon className="subicon" aria-hidden="true"/>Items
                      </button>
                    </Link>
                  </li>
                );
              })()
            }
            {(() => {
              if (role !== 'accountexecutive') return null;
              return (
                <>
                  <li>
                    <Link to="/loan" style={{ textDecoration: 'none' }}>
                      <button className="menuButton subitem" type="button">
                        <MonetizationOnIcon className="subicon" aria-hidden="true"/>Pawn
                      </button>
                    </Link>
                  </li>
                  <li>
                    <Link to="/redeem" style={{ textDecoration: 'none' }}>
                      <button className="menuButton subitem" type="button">
                        <MonetizationOnIcon className="subicon" aria-hidden="true"/>Vault
                      </button>
                    </Link>
                  </li>
                  <li>
                    <Link to="/sale" style={{ textDecoration: 'none' }}>
                      <button className="menuButton subitem" type="button">
                        <SellIcon className="subicon" aria-hidden="true"/>Display
                      </button>
                    </Link>
                  </li>
                </>
              );
            })()}
            {
              (() => {
                if (role !== 'accountexecutive' && role !== 'auditor') return null;
                const capitalRoute = role === 'accountexecutive' ? '/dashboards/branchCash' : '/capital-inventory';
                return (
                  <li>
                    <Link to={capitalRoute} style={{ textDecoration: "none" }}>
                      <button className="menuButton subitem" type="button">
                        <StoreIcon className="subicon" aria-hidden="true"/>Balance
                      </button>
                    </Link>
                  </li>
                );
              })()
            }
            
          </ul>
          <li>
            <button
              className="menuButton"
              type="button"
              onClick={() => setOpenSection(openSection === 'delivery' ? null : 'delivery')}
              aria-expanded={openSection === 'delivery'}
            >
              <LocalShippingIcon className="icon" />
              <span>Deliveries</span>
            </button>
          </li>
          <ul className={`submenu ${openSection === 'delivery' ? 'open' : ''}`} aria-hidden={openSection !== 'delivery'}>
            <li>
              <Link to="/delivery-requests">
                <button className="menuButton subitem" type="button">
                  <PersonIcon className="subicon" aria-hidden="true"/>Logistics
                </button>
              </Link>
            </li>
            <li>
              <Link to="/logistics-assignments">
                <button className="menuButton subitem" type="button">
                  <EditNoteIcon className="subicon" aria-hidden="true"/>Logistics Assignments
                </button>
              </Link>
            </li>
            <li>
              <Link to="/logistics-deliveries">
                <button className="menuButton subitem" type="button">
                  <WorkHistoryIcon className="subicon" aria-hidden="true"/>Logistics Deliveries
                </button>
              </Link>
            </li>
            
            
            
          </ul>
         
          {user && user.role && user.role.toLowerCase() === 'admin' && (
            <>
              <li>
                <button
                  className="menuButton"
                  type="button"
                  onClick={() => setOpenSection(openSection === 'userMgmt' ? null : 'userMgmt')}
                  aria-expanded={openSection === 'userMgmt'}
                >
                  <SupervisorAccountIcon className="icon" />
                  <span>User Management</span>
                </button>
              </li>
              <ul
                className={`submenu ${openSection === 'userMgmt' ? 'open' : ''}`}
                aria-hidden={openSection !== 'userMgmt'}
              >
                <li>
                  <Link to="/user-management" style={{ textDecoration: "none" }}>
                    <button className="menuButton subitem" type="button">
                      <PeopleAltOutlinedIcon className="subicon" aria-hidden="true" /> Users
                    </button>
                  </Link>
                </li>
                <li>
                  <Link to="/user-approvals" style={{ textDecoration: "none" }}>
                    <button className="menuButton subitem" type="button">
                      <VerifiedUserOutlinedIcon className="subicon" aria-hidden="true" /> User Approval
                    </button>
                  </Link>
                </li>
                  {/* ✅ NEW: Messages Button */}
            <li>
              
            </li>
              </ul>
             
            
            </>
          )}
          {/* Profile and Logout moved to bottom area so they remain pinned */}
        </ul>
      </div>
      <div className="bottom">
        <div className="colorOptions">
          <div
            className="colorOption"
            onClick={() => dispatch({ type: "LIGHT" })}
            role="button"
            aria-label="Light theme"
            tabIndex={0}
          />
          <div
            className="colorOption"
            onClick={() => dispatch({ type: "DARK" })}
            role="button"
            aria-label="Dark theme"
            tabIndex={0}
          />
        </div>

        <div className="bottomActions">
          
          <button className="menuButton" type="button" onClick={() => logout()}>
            <ExitToAppIcon className="icon" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;