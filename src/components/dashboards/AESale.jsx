import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from "../sidebar/sidebar";

import "./home.scss";
import Widget from "../../components/widget/Widgets";
import List from "../../components/table/Table";
import SaleForm from "../../components/forms/SaleForm";
import { useAuth } from "../../context/authContext";
import { getApiBase } from "../../apiBase";

const AESale = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [displayStats, setDisplayStats] = useState({ count: 0, amount: 0 });
  const { currentUser, branchStatus, getAuthHeaders } = useAuth();
  const API_BASE = getApiBase();

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

  useEffect(() => {
    let active = true;

    const loadDisplayStats = async () => {
      try {
        const params = new URLSearchParams();
        params.append('status', 'Display');
        if (branchId) params.append('branchId', branchId);

        const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
        const url = `${API_BASE}/api/items${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url, { credentials: 'include', headers });
        if (!res.ok) throw new Error(`Failed to fetch display items (${res.status})`);
        const items = await res.json();
        if (!active) return;

        const normalized = Array.isArray(items) ? items : [];
        const displayItems = normalized.filter(it => {
          const status = (it.ItemStatus || it.itemStatus || '').toString().toLowerCase();
          if (status !== 'display') return false;
          if (branchId) {
            const itemBranch = it.BranchID ?? it.branch_id ?? it.branchId ?? it.BranchId ?? it.branch ?? null;
            if (!itemBranch) return false;
            return String(itemBranch) === branchId;
          }
          return true;
        });

        const count = displayItems.length;
        const amount = displayItems.reduce((sum, it) => {
          const raw = it.SaleAmount ?? it.saleAmount ?? it.Amount ?? it.amount ?? 0;
          const value = parseFloat(raw);
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0);

        setDisplayStats({ count, amount });
      } catch (err) {
        console.error('Display stats fetch error:', err);
        if (active) setDisplayStats({ count: 0, amount: 0 });
      }
    };

    loadDisplayStats();

    return () => {
      active = false;
    };
  }, [refreshKey, branchId, getAuthHeaders, API_BASE]);

  const handleDataChanged = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleRowClick = (item) => {
    // Only allow selling items with 'Display' status
    if ((item.ItemStatus || '').toString().toLowerCase() !== 'display') {
      alert('Only items with "Display" status can be sold. Please select an item with Display status.');
      return;
    }

    setSelectedItem(item);
    setShowSaleForm(true);
  };

  const handleSaleSubmit = async (saleData) => {
    try {
      const response = await fetch(`/api/items/${saleData.itemId}/sell`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(saleData)
      });

      if (!response.ok) throw new Error('Failed to process sale');
  await response.json();

  // Refresh the list and close form
      handleDataChanged();
      setShowSaleForm(false);
      setSelectedItem(null);

      alert('Sale completed successfully!');
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error processing sale. Please try again.');
    }
  };

  const handleFormClose = () => {
    setShowSaleForm(false);
    setSelectedItem(null);
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        <div className="widgets">
          <Widget type="Branch Display Count" count={displayStats.count} />
          <Widget type="Branch Display Amount" amount={displayStats.amount} />
        </div>
        <div className="listContainer">
          <div className="listTitle">Items Available for Sale</div>
          <List
            refreshKey={refreshKey}
            onRowClick={handleRowClick}
            statusFilter="Display"
          />
        </div>

        {showSaleForm && selectedItem && (
          <SaleForm
            item={selectedItem}
            onSubmit={handleSaleSubmit}
            onClose={handleFormClose}
          />
        )}
      </div>
    </div>
  );
};

export default AESale;