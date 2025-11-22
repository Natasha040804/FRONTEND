import React, { useState } from 'react';
import Sidebar from "../sidebar/sidebar";

import "./home.scss";
import Widget from "../../components/widget/Widgets";
import List from "../../components/table/Table";
import SaleForm from "../../components/forms/SaleForm";

const AESale = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showSaleForm, setShowSaleForm] = useState(false);

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
          <Widget type="Branch Display Count" />
          <Widget type="Branch Display Amount" />
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