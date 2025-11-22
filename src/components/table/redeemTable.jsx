// AERedeem.jsx
import React, { useState } from 'react';
import Sidebar from "../sidebar/sidebar";
import "../dashboards/home.scss";
import Widget from "../widget/Widgets";
import List from "./Table";
import RedeemForm from "../forms/RedeemForm"; // The new redeem form
import Navbar from "../sidebar/Navbar";

const AERedeem = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRedeemForm, setShowRedeemForm] = useState(false);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowRedeemForm(true);
  };

  const handleRedeemSubmit = (redeemData) => {
    console.log('Redeem data:', redeemData);
    // Make API call to process the redeem
    // Example: fetch('/api/redeems', { method: 'POST', body: JSON.stringify(redeemData) })
    
    // Close the form after submission
    setShowRedeemForm(false);
    setSelectedItem(null);
    
    // Show success message or refresh data
    alert('Redeem processed successfully!');
  };

  const handleFormClose = () => {
    setShowRedeemForm(false);
    setSelectedItem(null);
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        <Navbar />
        <div className="widgets">
          <Widget type="user" />
          <Widget type="order" />
          <Widget type="earning" />
          <Widget type="balance" />
        </div>
        <div className="listContainer">
          <div className="listTitle">Items Available for Redemption</div>
          {/* Pass the handleItemClick to override the default detail view */}
          <List onUpdateItem={handleItemClick} />
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