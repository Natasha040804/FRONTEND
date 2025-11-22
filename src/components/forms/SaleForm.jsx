import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/authContext';
import './SaleForm.scss';

const SaleForm = ({ item, onSubmit, onClose }) => {
  const { currentUser } = useContext(AuthContext);
  const saleAmount = parseFloat(item.SaleAmount || item.Amount || 0);
  const [formData, setFormData] = useState({
    salePrice: saleAmount,           // Sale Amount (read-only) -> tbl_sales.SalePrice
    payment: saleAmount,             // Payment (editable) -> tbl_sales.Payment
    changeAmount: 0,                 // Change (auto) -> tbl_sales.ChangeAmount
    saleDate: new Date().toISOString().split('T')[0],
    customerName: '',
    buyerContact: '',
    paymentMethod: 'Cash',
    accountExecutive: currentUser?.username || currentUser?.name || currentUser?.AccountExecutive || '', // read-only
    accountId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calc change when payment changes
  useEffect(() => {
    const paymentNum = parseFloat(formData.payment) || 0;
    const change = paymentNum - saleAmount;
    setFormData(prev => ({ ...prev, changeAmount: change > 0 ? parseFloat(change.toFixed(2)) : 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.payment, saleAmount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Prevent changing computed or read-only fields
    if (name === 'accountExecutive' || name === 'salePrice' || name === 'changeAmount') {
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.payment || !formData.customerName) {
      alert('Please fill in required fields: Payment and Customer Name');
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit({
        itemId: item.Items_id,
        ...formData
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sale-form-overlay">
      <div className="sale-form-container">
        <div className="sale-form-header">
          <h2>Process Sale Transaction</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="item-details-section">
          <h3>Item Information</h3>
          <div className="item-details">
            <p><strong>Item ID:</strong> {item.Items_id}</p>
            <p><strong>Description:</strong> {item.ItemDescription || item.Model || 'N/A'}</p>
            <p><strong>Serial Number:</strong> {item.ItemSerialNumber || 'N/A'}</p>
            <p><strong>Original Price:</strong> ${(item.SaleAmount || item.Amount || 0).toLocaleString()}</p>
            <p><strong>Current Status:</strong> {item.ItemStatus}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="sale-form">
          <div className="form-sections">
            <div className="form-section">
              <h4>Payment Details</h4>
              
              <div className="form-group">
                <label>Sale Amount</label>
                <input
                  type="number"
                  name="salePrice"
                  value={formData.salePrice}
                  onChange={handleChange}
                  step="0.01"
                  readOnly
                  className="readonly-field"
                />
                <div className="field-note">Set from item data</div>
              </div>

              <div className="form-group">
                <label data-required="*">Payment</label>
                <input
                  type="number"
                  name="payment"
                  value={formData.payment}
                  onChange={handleChange}
                  step="0.01"
                  required
                  placeholder="Enter payment amount"
                  className={parseFloat(formData.payment || 0) < saleAmount ? 'insufficient-payment' : ''}
                />
                <div className="field-note">
                  {parseFloat(formData.payment || 0) < saleAmount ? (
                    <span className="error-text">❌ Insufficient payment. Need ${(saleAmount - (parseFloat(formData.payment) || 0)).toLocaleString()} more.</span>
                  ) : (parseFloat(formData.payment || 0) === saleAmount ? (
                    <span className="success-text">✅ Exact payment</span>
                  ) : (
                    <span className="info-text">Payment includes change</span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Change</label>
                <input
                  type="number"
                  name="changeAmount"
                  value={formData.changeAmount}
                  onChange={handleChange}
                  step="0.01"
                  readOnly
                  className={`readonly-field ${formData.changeAmount > 0 ? 'change-due' : 'no-change'}`}
                />
                <div className="field-note">
                  {formData.changeAmount > 0 ? (
                    <span className="warning-text">⚠️ Give ${formData.changeAmount.toLocaleString()} change</span>
                  ) : (
                    <span>No change due</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label data-required="*">Sale Date</label>
                <input
                  type="date"
                  name="saleDate"
                  value={formData.saleDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                  <option value="Digital Wallet">Digital Wallet</option>
                </select>
              </div>

              <div className="form-group">
                <label>Account Executive</label>
                <input
                  type="text"
                  name="accountExecutive"
                  value={formData.accountExecutive}
                  onChange={handleChange}
                  readOnly
                  className="readonly-field"
                  title="Automatically set to your username"
                />
                <div className="field-note">Automatically set to your account</div>
              </div>
            </div>

            <div className="form-section">
              <h4>Customer Information</h4>
              
              <div className="form-group">
                <label data-required="*">Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  placeholder="Enter customer full name"
                />
              </div>

              <div className="form-group">
                <label>Customer Contact</label>
                <input
                  type="text"
                  name="buyerContact"
                  value={formData.buyerContact}
                  onChange={handleChange}
                  placeholder="Phone number or email"
                />
              </div>

              <div className="form-group">
                <label>Account ID</label>
                <input
                  type="number"
                  name="accountId"
                  value={formData.accountId}
                  onChange={handleChange}
                  placeholder="Optional account reference"
                />
              </div>
            </div>
          </div>

          <div className="payment-summary">
            <div className="summary-item">
              <span>Sale Amount:</span>
              <span className="amount">${saleAmount.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span>Payment Received:</span>
              <span className="amount">${(parseFloat(formData.payment) || 0).toLocaleString()}</span>
            </div>
            <div className="summary-item total">
              <span>Change Due:</span>
              <span className={`amount ${formData.changeAmount > 0 ? 'change-due' : ''}`}>
                ${formData.changeAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button 
              type="submit" 
              className={`btn-submit ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting || (parseFloat(formData.payment || 0) < saleAmount)}
            >
              {isSubmitting ? '' : 'Complete Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaleForm;
