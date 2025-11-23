
import "./widget.scss";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import InventoryIcon from "@mui/icons-material/Inventory";
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/authContext';
import { getApiBase } from '../../apiBase';
import capitalService from '../../services/capitalService';

const Widget = ({ type = "", count }) => {
  let data;
  const [value, setValue] = useState(typeof count === 'number' ? count : null);
  const [loading, setLoading] = useState(false);
  const { currentUser, branchStatus, getAuthHeaders } = useAuth();
  const API_BASE = getApiBase();

  // Helper: format currency (Philippine peso)
  const formatCurrency = (n) => {
    if (n == null) return '₱0.00';
    const num = Number(n) || 0;
    return num.toLocaleString(undefined, { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 });
  };

  const branchId = useMemo(() => {
    const pick = (source) => {
      if (!source || typeof source !== 'object') return null;
      const direct = source.branch_id || source.BranchID || source.branchId || source.BranchId || null;
      if (direct) return String(direct);
      const nested = source.branch || source.Branch || null;
      if (nested) {
        const nestedId = pick(nested);
        if (nestedId) return String(nestedId);
      }
      const dataNode = source.data || source.payload || null;
      if (dataNode) {
        const dataId = pick(dataNode);
        if (dataId) return String(dataId);
      }
      return null;
    };
    return pick(branchStatus) || pick(currentUser) || pick(currentUser?.user) || null;
  }, [branchStatus, currentUser]);

  // Fetch branch items when widget types request branch totals
  useEffect(() => {
    let mounted = true;
    const fetchBranchTotals = async () => {
      if (!(type === 'Branch Total Item' || type === 'Branch Total Items Amount')) return;
      setLoading(true);
      try {
        const params = branchId ? `?branchId=${branchId}` : '';
        const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
        const resp = await fetch(`${API_BASE}/api/items${params}`, { credentials: 'include', headers });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const items = await resp.json();
        if (!mounted) return;
        if (Array.isArray(items)) {
          // Only count items that are in vault or on display. Exclude Sold, Redeemed, etc.
          const filtered = items.filter(it => {
            const st = (it.ItemStatus || it.itemStatus || '').toString().toLowerCase();
            return st === 'vault' || st === 'display';
          });

          if (type === 'Branch Total Item') {
            setValue(filtered.length);
          } else if (type === 'Branch Total Items Amount') {
            const total = filtered.reduce((s, it) => {
              const amt = parseFloat(it.Amount || it.amount || 0) || 0;
              return s + amt;
            }, 0);
            setValue(total);
          }
        } else {
          if (type === 'Branch Total Item') setValue(0);
          if (type === 'Branch Total Items Amount') setValue(0);
        }
      } catch (err) {
        console.error('Widget fetch error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchBranchTotals();
    return () => { mounted = false; };
  }, [type, branchId, getAuthHeaders, API_BASE]);

  // Fetch branch current capital when needed
  useEffect(() => {
    let active = true;
    const fetchCurrentCapital = async () => {
      if (type !== 'Branch Current Capital') return;
      if (!branchId) {
        // Branch context not ready yet; wait for next update
        return;
      }
      setLoading(true);
      try {
        const capital = await capitalService.getBranchCurrentCapital(branchId);
        if (!active) return;
        setValue(Number(capital) || 0);
      } catch (err) {
        console.error('Widget capital fetch error:', err);
        if (active) setValue(0);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchCurrentCapital();
    return () => {
      active = false;
    };
  }, [type, branchId]);
  // diff removed from visual display per updated design

  switch (type) {
    case 'Branch Total Item':
      data = {
        title: 'TOTAL ITEMS',
        isMoney: false,
        
      };
      break;
    case 'Branch Total Items Amount':
      data = {
        title: 'INVENTORY AMOUNT',
        isMoney: true,
      };
      break;
    case 'Branch Current Capital':
      data = {
        title: 'CURRENT CAPITAL',
        isMoney: true,
      };
      break;
    case "item":
      data = {
        title: "TOTAL ITEMS",
        isMoney: false,
        link: "See all items",
        icon: (
          <PersonOutlinedIcon
            className="icon"
            style={{
              color: "crimson",
              backgroundColor: "rgba(255, 0, 0, 0.2)",
            }}
          />
        ),
      };
      break;
    case "itemsamount":
      data = {
        title: "Total Amount of Items",
        isMoney: false,
        link: "View all orders",
        icon: (
          <ShoppingCartOutlinedIcon
            className="icon"
            style={{
              backgroundColor: "rgba(218, 165, 32, 0.2)",
              color: "goldenrod",
            }}
          />
        ),
      };
      break;
    case "Items Count":
      data = {
        title: "ITEMS COUNT",
        isMoney: false,
        icon: (
          <InventoryIcon
            className="icon"
            style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#3b82f6" }}
          />
        ),
      };
      break;
    case "Items in Vault":
      data = {
        title: "IN VAULT",
        isMoney: false,
        icon: (
          <AccountBalanceWalletOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(147,51,234,0.15)", color: "#9333ea" }}
          />
        ),
      };
      break;
    case "Items on Display":
      data = {
        title: "ON DISPLAY",
        isMoney: false,
        icon: (
          <ShoppingCartOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981" }}
          />
        ),
      };
      break;
    case "Items Reclaimed":
      data = {
        title: "REDEEMED",
        isMoney: false,
        icon: (
          <MonetizationOnOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(220,38,38,0.15)", color: "#dc2626" }}
          />
        ),
      };
      break;
    case "New Entries":
      data = {
        title: "EARNINGS",
        isMoney: true,
        link: "View net earnings",
        icon: (
          <MonetizationOnOutlinedIcon
            className="icon"
            style={{ backgroundColor: "rgba(0, 128, 0, 0.2)", color: "green" }}
          />
        ),
      };
      break;
    case "balance":
      data = {
        title: "BALANCE",
        isMoney: true,
        link: "See details",
        icon: (
          <AccountBalanceWalletOutlinedIcon
            className="icon"
            style={{
              backgroundColor: "rgba(128, 0, 128, 0.2)",
              color: "purple",
            }}
          />
        ),
      };
      break;
    case 'Logistics Personnel':
      data = {
        title: 'LOGISTICS PERSONNEL',
        isMoney: false,
       
        icon: (
          <PersonOutlinedIcon
            className="icon"
            style={{ backgroundColor: 'rgba(96, 33, 243, 0.15)', color: '#f5d109' }}
          />
        ),
      };
      break;
    case 'Total Assignments':
      data = {
        title: 'TOTAL ASSIGNMENTS',
        isMoney: false,
        icon: (
          <InventoryIcon
            className="icon"
            style={{ backgroundColor: 'rgba(82,13,82,0.12)', color: '#520d52' }}
          />
        ),
      };
      break;
    case 'Item transfer':
      data = {
        title: 'ITEM TRANSFER',
        isMoney: false,
        icon: (
          <SwapHorizIcon
            className="icon"
            style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}
          />
        ),
      };
      break;
    case 'Cash-In':
      data = {
        title: 'CASH-IN',
        isMoney: true,
        icon: (
          <LocalAtmIcon
            className="icon"
            style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}
          />
        ),
      };
      break;
    case 'Cash-Out':
      data = {
        title: 'CASH-OUT',
        isMoney: true,
        icon: (
          <AccountBalanceWalletOutlinedIcon
            className="icon"
            style={{ backgroundColor: 'rgba(220,38,38,0.12)', color: '#dc2626' }}
          />
        ),
      };
      break;
    case 'Standby':
      data = {
        title: 'STANDBY',
        isMoney: false,
       
        icon: (
          <PersonOutlinedIcon
            className="icon"
            style={{ backgroundColor: 'rgba(96, 33, 243, 0.15)', color: '#f56709ff' }}
          />
        ),
      };
      break;
    case 'Assigned':
      data = {
        title: 'ASSIGNED',
        isMoney: false,
      
        icon: (
          <PersonOutlinedIcon
            className="icon"
            style={{ backgroundColor: 'rgba(96, 33, 243, 0.15)', color: '#53ff5bff' }}
          />
        ),
      };
      break;
    case 'Pending Deliveries':
      data = {
        title: 'PENDING DELIVERIES',
        isMoney: false,
    
        icon: (
          <ShoppingCartOutlinedIcon
            className="icon"
            style={{ backgroundColor: 'rgba(66, 133, 244, 0.2)', color: '#4285F4' }}
          />
        ),
      };
      break;
    default:
      console.warn(`Widget: unknown type "${type}" — rendering fallback`);
      data = {
        title: (type || 'N/A').toString().toUpperCase(),
        isMoney: false,
        icon: (
          <PersonOutlinedIcon
            className="icon"
            style={{ color: '#ccc', backgroundColor: 'transparent' }}
          />
        ),
      };
      break;
  }

  // Guard: ensure data exists so we don't read properties of undefined
  if (!data) {
    console.warn(`Widget: unknown type "${type}" — rendering fallback`);
    data = {
      title: "N/A",
      isMoney: false,
      link: "",
      icon: (
        <PersonOutlinedIcon
          className="icon"
          style={{ color: "#ccc", backgroundColor: "transparent" }}
        />
      ),
    };
  }

  const displayValue = (() => {
    if (loading) return '...';
    if (value != null) {
      return data && data.isMoney ? formatCurrency(value) : String(value);
    }
    if (typeof count === 'number') return data && data.isMoney ? formatCurrency(count) : String(count);
    return data && data.isMoney ? formatCurrency(0) : '0';
  })();

  return (
    <div className="widget">
      <div className="left">
        <span className="title">{data.title}</span>
        <span className="counter">{data.isMoney && ''}{displayValue}</span>
        <span className="link">{data.link}</span>
      </div>
      <div className="right">
        {data.icon}
      </div>
    </div>
  );
};

export default Widget;
