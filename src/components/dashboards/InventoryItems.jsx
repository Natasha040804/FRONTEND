import React, { useState } from 'react';
import Sidebar from "../sidebar/sidebar";
import "./home.scss";
import Table from "../../components/table/Table"; 
import SearchBar from '../../components/search/SearchBar';
import AdminSaleForm from "../../components/forms/AdminSaleForm";
import Widget from "../../components/widget/Widgets";
import { useEffect } from 'react';
import { featuredService } from '../../services/featuredService';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/authContext';
const InventoryItems = () => {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showSaleForm, setShowSaleForm] = useState(false);


  const handleDataChanged = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowSaleForm(true);
  };

  const handleSaleSubmit = (saleData) => {
    console.log('Sale data:', saleData);
    // TODO: call API to update item status and sale amount
    setShowSaleForm(false);
    setSelectedItem(null);
    handleDataChanged();
    alert('Item marked as display successfully!');
  };

  const handleFormClose = () => {
    setShowSaleForm(false);
    setSelectedItem(null);
  };

  // Search state for filtering inventory items
  const [searchTerm, setSearchTerm] = useState('');

  // Inventory counts state
  const [invCounts, setInvCounts] = useState({ total: 0, vault: 0, display: 0, reclaimed: 0 });
  // Internal tracking for potential future loading/error UI
  const [countsLoading, setCountsLoading] = useState(true); // eslint-disable-line no-unused-vars
  const [countsError, setCountsError] = useState(null); // eslint-disable-line no-unused-vars

  useEffect(() => {
    let mounted = true;
    const loadCounts = async () => {
      try {
        setCountsLoading(true);
        setCountsError(null);
        const totals = await featuredService.getInventoryCounts();
        if (mounted) setInvCounts(totals);
      } catch (e) {
        if (mounted) setCountsError('Failed to load inventory counts');
      } finally {
        if (mounted) setCountsLoading(false);
      }
    };
    loadCounts();
    return () => { mounted = false; };
  }, [refreshKey]);

  const { dashboardData } = useDashboard();
  const { currentUser } = useAuth();
  const isAdmin = ((currentUser?.role || currentUser?.Role || '').toString().toLowerCase() === 'admin');

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        <div className="widgets">
          <Widget type="Items Count" count={invCounts.total} />
          <Widget type="Items in Vault" count={invCounts.vault} />
          <Widget type="Items on Display" count={invCounts.display} />
          <Widget type="Total Inventory Amount" amount={dashboardData.totalInventory.amount} diff={dashboardData.totalInventory.diff} link="View all inventory" />

        </div>
        
        <div className="listContainer">
          <div className="inventoryHeaderRow">
            <h2 className="listTitle">Pawn Inventory</h2>
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search inventory..." />
          </div>
          
          <Table 
            refreshKey={refreshKey} 
            onDataChanged={handleDataChanged}
            onUpdateItem={handleItemClick}
            detailView="adminForm"
            searchTerm={searchTerm}
            userIsAdmin={isAdmin}
          />
        </div>
        
        {showSaleForm && (
          <AdminSaleForm
            item={selectedItem}
            onSubmit={handleSaleSubmit}
            onClose={handleFormClose}
          />
        )}
      </div>
    </div>
  );
};

export default InventoryItems;
