import React, { useState, useEffect } from 'react';
import './AdminSaleForm.scss';
import { getApiBase } from '../../apiBase';

const AdminSaleForm = ({ item, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    saleAmount: '',
    saleDate: new Date().toISOString().split('T')[0]
  });

  const [canDisplay, setCanDisplay] = useState(false);
  const [loading, setLoading] = useState(false);
  const API_BASE = getApiBase();

  // Check if item can be displayed (past due date + 8 days penalty period)
  useEffect(() => {
    if (item && item.DueDate) {
      const dueDate = new Date(item.DueDate);
      const penaltyEndDate = new Date(dueDate);
      penaltyEndDate.setDate(penaltyEndDate.getDate() + 8); // Due date + 8 days
      const today = new Date();
      
      setCanDisplay(today > penaltyEndDate);
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.saleAmount || parseFloat(formData.saleAmount) <= 0) {
      alert('Please enter a valid sale amount');
      return;
    }

    if (!canDisplay) {
      alert('This item cannot be displayed yet. It must be past the due date plus 8 days penalty period.');
      return;
    }

    setLoading(true);

    try {
      // API call to update the item status to 'Display'
      const response = await fetch(`${API_BASE}/api/items/${item.Items_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ItemStatus: 'Display',
          SaleAmount: parseFloat(formData.saleAmount),
          SaleDate: formData.saleDate,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update item status');
      }

      await response.json();
      // Call the onSubmit prop to refresh the parent component
      onSubmit({
        ...formData,
        itemId: item.Items_id,
        newStatus: 'Display'
      });

      alert('Item successfully marked as Display!');

    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPenaltyEndDate = () => {
    if (!item?.DueDate) return null;
    const dueDate = new Date(item.DueDate);
    const penaltyEndDate = new Date(dueDate);
    penaltyEndDate.setDate(penaltyEndDate.getDate() + 8);
    return penaltyEndDate.toLocaleDateString();
  };

  const getDaysUntilDisplay = () => {
    if (!item?.DueDate) return 0;
    const dueDate = new Date(item.DueDate);
    const penaltyEndDate = new Date(dueDate);
    penaltyEndDate.setDate(penaltyEndDate.getDate() + 8);
    const today = new Date();
    const daysLeft = Math.ceil((penaltyEndDate - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const isAlreadyDisplay = (item?.ItemStatus || '').toString().toLowerCase() === 'display';

  return (
    <div className="form-overlay">
      <div className="form-container admin-sale-form">
        <div className="form-header">
          <h2>Admin - Item Sale & Display</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="item-info">
          <h3>Item Information (Read Only)</h3>
          <div className="item-details-grid">
            <div className="detail-group">
              <label>Item ID</label>
              <div className="detail-value">{item?.Items_id}</div>
            </div>
            <div className="detail-group">
              <label>Serial Number</label>
              <div className="detail-value">{item?.ItemSerialNumber || '—'}</div>
            </div>
            <div className="detail-group">
              <label>Brand/Model</label>
              <div className="detail-value">{item?.Brand || '—'} {item?.Model || '—'}</div>
            </div>
            <div className="detail-group">
              <label>Classification</label>
              <div className="detail-value">{item?.Classification || '—'}</div>
            </div>
            <div className="detail-group">
              <label>Current Status</label>
              <div className={`detail-value status-badge ${item?.ItemStatus?.toLowerCase()}`}>
                {item?.ItemStatus || '—'}
              </div>
            </div>
            <div className="detail-group">
              <label>Loan Amount</label>
              <div className="detail-value">₱{parseFloat(item?.Amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="detail-group">
              <label>Customer</label>
              <div className="detail-value">{item?.Customer || '—'}</div>
            </div>
            <div className="detail-group">
              <label>Due Date</label>
              <div className="detail-value">{item?.DueDate ? new Date(item.DueDate).toLocaleDateString() : '—'}</div>
            </div>
            <div className="detail-group">
              <label>Penalty End Date</label>
              <div className="detail-value">{getPenaltyEndDate() || '—'}</div>
            </div>
            <div className="detail-group">
              <label>Loan Agreement #</label>
              <div className="detail-value">{item?.LoanAgreementNumber || '—'}</div>
            </div>
            <div className="detail-group">
              <label>Account Executive</label>
              <div className="detail-value">{item?.AccountExecutive || '—'}</div>
            </div>
          </div>

          {/* Display eligibility / status information */}
          {isAlreadyDisplay ? (
            <div className="eligibility-info eligible">
              <div className="eligibility-message">
                <span className="icon">ℹ️</span>
                This item is already marked as "Display" in the system. No sale action is needed here.
              </div>
            </div>
          ) : (
            <div className={`eligibility-info ${canDisplay ? 'eligible' : 'not-eligible'}`}>
              {canDisplay ? (
                <div className="eligibility-message">
                  <span className="icon">✓</span>
                  This item is eligible for display. The penalty period has ended.
                </div>
              ) : (
                <div className="eligibility-message">
                  <span className="icon">⏳</span>
                  This item cannot be displayed yet. {getDaysUntilDisplay()} day(s) remaining in penalty period.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hide sale form inputs when already Display */}
        {!isAlreadyDisplay && (
          <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Sale Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Sale Amount *</label>
                <input
                  type="number"
                  name="saleAmount"
                  value={formData.saleAmount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  placeholder="Enter sale amount"
                />
                <div className="field-description">
                  Enter the final sale price for this item
                </div>
              </div>

              <div className="form-group">
                <label>Sale Date *</label>
                <input
                  type="date"
                  name="saleDate"
                  value={formData.saleDate}
                  onChange={handleChange}
                  required
                />
                <div className="field-description">
                  Date when item is being marked for display
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button 
                type="submit" 
                className={`btn-display ${!canDisplay ? 'disabled' : ''}`}
                disabled={!canDisplay || loading}
              >
                {loading ? 'Processing...' : 'Mark as Display'}
              </button>
            </div>

            {!canDisplay && (
              <div className="warning-message">
                <strong>Note:</strong> The "Mark as Display" button will only be enabled after the penalty period ends (due date + 8 days).
              </div>
            )}

            {canDisplay && (
              <div className="info-message">
                <strong>Action:</strong> This will update the item status from "<strong>{item?.ItemStatus}</strong>" to "<strong>Display</strong>" in the system.
              </div>
            )}
          </div>
          </form>
        )}

        {isAlreadyDisplay && (
          <div style={{ padding: '24px' }}>
            <div className="info-message">
              <strong>Info:</strong> This item is already in Display status. If you need to change any record details, edit the item from the inventory list instead.
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-cancel" onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSaleForm;
