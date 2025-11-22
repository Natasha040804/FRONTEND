// components/forms/RedeemForm.jsx
import React, { useState, useEffect } from 'react';
import './RedeemForm.scss';

const RedeemForm = ({ item, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    LoanID: '',
    BranchID: '',
    RedeemType: 'ON DUE',
    PaymentAmount: '',
    InterestAmount: '',
    PenaltyRate: '0.00',
    PenaltyAmount: '',
    PenaltyTotal: '',
    LoanAmount: '',
    LoanDate: '',
    DueDate: '',
    PaymentDate: ''
  });

  // Fixed penalty rate - 5%
  const FIXED_PENALTY_RATE = 5.00;

  // Calculate redeem type and penalty based on dueDate, paymentDate and loanAmount
  const calculateRedeemTypeAndPenalty = (dueDate, paymentDate, loanAmount) => {
    const due = dueDate ? new Date(dueDate) : null;
    const payment = paymentDate ? new Date(paymentDate) : null;
    const today = new Date();

    const comparisonDate = payment || today;

    if (!due) {
      // If no due date, assume no penalty
      return {
        redeemType: 'ON DUE',
        penaltyRate: '0.00',
        penaltyAmount: '0.00',
        penaltyTotal: '0.00'
      };
    }

    if (comparisonDate <= due) {
      return {
        redeemType: 'ON DUE',
        penaltyRate: '0.00',
        penaltyAmount: '0.00',
        penaltyTotal: '0.00'
      };
    }

    // Penalized - fixed 5% of loan amount
    const amt = parseFloat(loanAmount) || 0;
    const penaltyAmount = ((amt * FIXED_PENALTY_RATE) / 100).toFixed(2);
    return {
      redeemType: 'PENALIZED',
      penaltyRate: FIXED_PENALTY_RATE.toFixed(2),
      penaltyAmount: penaltyAmount,
      penaltyTotal: penaltyAmount
    };
  };

  // Helper: inclusive day count between two YYYY-MM-DD dates
  const daysBetweenInclusive = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    // normalize to midnight to avoid DST/timezone issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diff = end.getTime() - start.getTime();
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.floor(diff / msPerDay) + 1; // inclusive (starts on loan date)
    return Math.max(0, days);
  };

  useEffect(() => {
    if (item) {
      const today = new Date().toISOString().split('T')[0];
      const { redeemType, penaltyRate, penaltyAmount, penaltyTotal } =
        calculateRedeemTypeAndPenalty(item.DueDate, today, item.Amount);

      setFormData({
        // LoanAgreementNumber is the field returned by the items API and
        // corresponds to the loan identifier used elsewhere in the system.
        LoanID: item.LoanAgreementNumber || '',
        BranchID: item.BranchID || '',
        RedeemType: redeemType,
        PaymentAmount: '',
        // Will be recalculated as accrued interest (daily interest * days since loan date)
        InterestAmount: item.InterestAmount || '0.00',
        PenaltyRate: penaltyRate,
        PenaltyAmount: penaltyAmount,
        PenaltyTotal: penaltyTotal,
        LoanAmount: item.Amount || '0.00',
        LoanDate: item.LoanDate || '',
        DueDate: item.DueDate || '',
        PaymentDate: today
      });
    }
  }, [item]);

  // Recalculate when payment date changes
  useEffect(() => {
    if (formData.PaymentDate && formData.DueDate) {
      const { redeemType, penaltyRate, penaltyAmount, penaltyTotal } =
        calculateRedeemTypeAndPenalty(formData.DueDate, formData.PaymentDate, formData.LoanAmount);

      setFormData(prev => ({
        ...prev,
        RedeemType: redeemType,
        PenaltyRate: penaltyRate,
        PenaltyAmount: penaltyAmount,
        PenaltyTotal: penaltyTotal
      }));
    }
  }, [formData.PaymentDate, formData.DueDate, formData.LoanAmount]);

  // Derived values for interest and totals (computed each render for accuracy)
  const todayStr = new Date().toISOString().split('T')[0];
  const loanDateStr = formData.LoanDate || item?.LoanDate || '';
  const paymentDateStr = formData.PaymentDate || todayStr;
  // Treat item.InterestAmount as the daily interest amount in currency
  const dailyInterestAmount = (() => {
    const raw = item?.InterestAmount ?? formData.InterestAmount ?? '0';
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  })();
  const elapsedDays = daysBetweenInclusive(loanDateStr, paymentDateStr);
  const accruedInterest = Number((dailyInterestAmount * elapsedDays).toFixed(2));

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Only allow changing PaymentAmount and PaymentDate
    if (name === 'PaymentAmount' || name === 'PaymentDate') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate total amount due
    const totalDue = 
      parseFloat(formData.LoanAmount || 0) + 
      parseFloat(formData.InterestAmount || 0) + 
      parseFloat(formData.PenaltyTotal || 0);
    
    const paymentAmt = parseFloat(formData.PaymentAmount || 0);

    if (isNaN(paymentAmt) || paymentAmt < totalDue) {
      alert(`Payment amount must be at least ₱${totalDue.toFixed(2)}`);
      return;
    }

    const submitData = {
      ...formData,
      TotalDue: totalDue
    };

    onSubmit(submitData);
  };

  const calculateTotalDue = () => {
    return (
      parseFloat(formData.LoanAmount || 0) +
      accruedInterest +
      parseFloat(formData.PenaltyTotal || 0)
    ).toFixed(2);
  };

  return (
    <div className="form-overlay">
      <div className="form-container redeem-form">
        <div className="form-header">
          <h2>Redeem Item</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="item-info">
          <h3>Item Information</h3>
          <div className="item-details">
            <p><strong>Item ID:</strong> {item?.Items_id}</p>
            <p><strong>Serial Number:</strong> {item?.ItemSerialNumber}</p>
            <p><strong>Brand/Model:</strong> {item?.Brand} {item?.Model}</p>
            <p><strong>Loan Amount:</strong> ₱{item?.Amount}</p>
            <p><strong>Customer:</strong> {item?.Customer}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Claiming Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Claim Type</label>
                <input
                  type="text"
                  name="RedeemType"
                  value={formData.RedeemType}
                  readOnly
                  className={`readonly ${formData.RedeemType === 'PENALIZED' ? 'penalized' : 'on-due'}`}
                />
                <div className="field-description">
                  {formData.RedeemType === 'PENALIZED'
                    ? 'Item is past due - penalty applied'
                    : 'Item is on or before due date - no penalty'}
                </div>
              </div>

              <div className="form-group">
                <label>Payment Date *</label>
                <input
                  type="date"
                  name="PaymentDate"
                  value={formData.PaymentDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Penalty Rate</label>
                <input
                  type="text"
                  name="PenaltyRate"
                  value={`${formData.PenaltyRate}%`}
                  readOnly
                  className="readonly"
                />
                <div className="field-description">
                  {formData.PenaltyRate !== '0.00' ? 'Fixed 5% penalty for overdue items' : ''}
                </div>
              </div>

              <div className="form-group">
                <label>Penalty Amount</label>
                <input
                  type="text"
                  name="PenaltyAmount"
                  value={`₱${formData.PenaltyAmount || '0.00'}`}
                  readOnly
                  className="readonly"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Payment Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Loan Amount</label>
                <input
                  type="text"
                  name="LoanAmount"
                  value={`₱${formData.LoanAmount || '0.00'}`}
                  readOnly
                  className="readonly"
                />
              </div>

              <div className="form-group">
                <label>Interest Amount</label>
                <input
                  type="text"
                  name="InterestAmount"
                  value={`₱${formData.InterestAmount || '0.00'}`}
                  readOnly
                  className="readonly"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Total Penalty</label>
                <input
                  type="text"
                  name="PenaltyTotal"
                  value={`₱${formData.PenaltyTotal || '0.00'}`}
                  readOnly
                  className="readonly"
                />
              </div>

              <div className="form-group">
                <label>Payment Amount *</label>
                <input
                  type="number"
                  name="PaymentAmount"
                  value={formData.PaymentAmount}
                  onChange={handleChange}
                  step="0.01"
                  min={parseFloat(calculateTotalDue())}
                  required
                  placeholder={`Enter payment amount (min ₱${calculateTotalDue()})`}
                />
              </div>
            </div>

            <div className="total-due">
              <label>Total Amount Due:</label>
              <span className="total-amount">₱{calculateTotalDue()}</span>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Process Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RedeemForm;