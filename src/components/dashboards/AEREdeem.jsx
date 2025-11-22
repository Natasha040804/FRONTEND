// AERedeem.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from "../sidebar/sidebar";
import "./home.scss";
import Widget from "../widget/Widgets";
import List from "../table/Table";
import RedeemForm from "../forms/RedeemForm"; // The new redeem form
import { useAuth } from "../../context/authContext";
import { getApiBase } from "../../apiBase";

const API_BASE = getApiBase();

const AERedeem = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRedeemForm, setShowRedeemForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { getAuthHeaders } = useAuth();
  const { currentUser, branchStatus } = useAuth();
  const [vaultCount, setVaultCount] = useState(null);
  const [vaultTotalAmount, setVaultTotalAmount] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchVaultTotals = async () => {
      try {
        const branchId = (branchStatus && branchStatus.branch_id) || (currentUser && (currentUser.BranchID || currentUser.branchId)) || null;
        const params = [];
        if (branchId) params.push(`branchId=${branchId}`);
        // ask backend to filter by status=VAULT if supported
        params.push(`status=VAULT`);
        const qs = params.length ? `?${params.join('&')}` : '';
        const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
        const resp = await fetch(`${API_BASE}/api/items${qs}`, { credentials: 'include', headers });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const items = await resp.json();
        if (!mounted) return;
        if (Array.isArray(items)) {
          setVaultCount(items.length);
          const total = items.reduce((s, it) => s + (parseFloat(it.Amount || it.amount || 0) || 0), 0);
          setVaultTotalAmount(total);
        } else {
          setVaultCount(0);
          setVaultTotalAmount(0);
        }
      } catch (err) {
        console.error('Failed to fetch vault totals:', err);
        if (mounted) {
          setVaultCount(0);
          setVaultTotalAmount(0);
        }
      }
    };

    fetchVaultTotals();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, branchStatus]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowRedeemForm(true);
  };

  const handleRedeemSubmit = async (redeemData) => {
    try {
      if (!selectedItem) throw new Error('No item selected');

      // Normalize numeric values (strip currency if present)
      const toNumber = (v) => {
        if (v == null) return null;
        const s = String(v).replace(/[^0-9.-]/g, '');
        const n = parseFloat(s);
        return isNaN(n) ? null : n;
      };

      // Normalize date-only (YYYY-MM-DD)
      const toDateOnly = (v) => {
        if (!v) return null;
        return String(v).substring(0, 10);
      };

      // Map UI RedeemType to DB enum (both cases are redemption of the item)
      const mappedRedeemType = 'REDEMPTION';

      const payload = {
        // Items API provides `LoanAgreementNumber`; backend expects a LoanID
        // numeric identifier. Use LoanAgreementNumber as the LoanID source.
        LoanID: redeemData.LoanID || selectedItem.LoanAgreementNumber || null,
        BranchID: redeemData.BranchID || selectedItem.BranchID || null,
        RedeemType: mappedRedeemType,
        PaymentAmount: toNumber(redeemData.PaymentAmount),
        InterestAmount: toNumber(redeemData.InterestAmount),
        PenaltyRate: toNumber(redeemData.PenaltyRate),
        PenaltyAmount: toNumber(redeemData.PenaltyAmount),
        PenaltyTotal: toNumber(redeemData.PenaltyTotal),
        LoanAmount: toNumber(redeemData.LoanAmount),
        LoanDate: toDateOnly(redeemData.LoanDate || selectedItem.LoanDate),
        DueDate: toDateOnly(redeemData.DueDate || selectedItem.DueDate),
        PaymentDate: toDateOnly(redeemData.PaymentDate),
        Items_id: selectedItem.Items_id
      };

      const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
      const resp = await fetch(`${API_BASE}/api/redeems`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `HTTP ${resp.status}`);
      }

      const result = await resp.json().catch(() => ({}));
      console.log('Redeem processed:', result);

      // Refresh list
      setRefreshKey((k) => k + 1);

      // Close modal
      setShowRedeemForm(false);
      setSelectedItem(null);

      alert('Redemption processed successfully! Item marked as Redeemed.');
    } catch (err) {
      console.error('Redeem submit failed:', err);
      alert(err.message || 'Failed to process redemption');
    }
  };

  const handleFormClose = () => {
    setShowRedeemForm(false);
    setSelectedItem(null);
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        <div className="widgets">
          <Widget type="Branch Vault Count" count={vaultCount} />
          <Widget type="Branch Vault TotalAmount" amount={vaultTotalAmount} />
        </div>
        <div className="listContainer">
          <List
            key={refreshKey}
            onRowClick={handleItemClick}
            actionButtonText="Redeem"
            statusFilter="VAULT"
          />
        </div>
        
        {showRedeemForm && (
          <RedeemForm
            item={selectedItem}
            onSubmit={handleRedeemSubmit}
            onClose={handleFormClose}
          />
        )}
      </div>
    </div>
  );
};

export default AERedeem;