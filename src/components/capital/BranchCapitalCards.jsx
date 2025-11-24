import React, { useEffect, useState, useMemo, useCallback } from 'react';
import './capitalInventory.scss';
import { getApiBase } from '../../apiBase';

export default function BranchCapitalCards({ fetcher }) {
  const API_BASE = getApiBase();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('name');
  // Removed Min % filter to always show all branches
  const [selected, setSelected] = useState(null);
  const [branchDetails, setBranchDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Auditor can fetch all branches without restrictions
  const fetchBranches = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/branches`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch branches');
    return res.json();
  }, [API_BASE]);

  // Fetch current capital for all branches (uses latest Current_Capital per branch)
  const fetchAllCurrentCapital = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/capital/current-capital`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch current capital data');
    return res.json();
 }, [API_BASE]);

  // Auditor can fetch ALL transactions for selected branch (no permission checks) + current capital
  const fetchBranchDetails = useCallback(async (branchId) => {
    setDetailsLoading(true);
    try {
      // Fetch all data without branch restrictions
      const [loansRes, redeemsRes, salesRes, currentCapitalRes] = await Promise.all([
        fetch(`${API_BASE}/api/auditor/branches/${branchId}/loans`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/auditor/branches/${branchId}/redeems`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/auditor/branches/${branchId}/sales`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/capital/branches/${branchId}/current-capital`, { credentials: 'include' })
      ]);

      const loans = await loansRes.json();
      const redeems = await redeemsRes.json();
      const sales = await salesRes.json();
      const currentCapital = await currentCapitalRes.json();

      return {
        loans: loans || [],
        redeems: redeems || [],
        sales: sales || [],
        currentCapital: currentCapital || 0
      };
    } catch (error) {
      console.error('Error fetching branch details:', error);
      throw error;
    } finally {
      setDetailsLoading(false);
    }
  }, [API_BASE]);

  // Calculate financial totals (same as before)
  const calculateFinancials = (loans, redeems, sales, currentCapital) => {
    const totalActiveLoans = loans
      .filter(loan => loan.Status === 'ACTIVE' || loan.Status === 'EXTENDED')
      .reduce((sum, loan) => sum + parseFloat(loan.LoanAmount || 0), 0);

    const totalRedeems = redeems.reduce((sum, redeem) =>
      sum + parseFloat(redeem.PaymentAmount || 0), 0);

    const totalSales = sales.reduce((sum, sale) =>
      sum + parseFloat(sale.SalePrice || 0), 0);

    // With running Current_Capital stored in tbl_capital, balance sums directly
    const totalBalance = parseFloat(currentCapital || 0) + totalSales + totalRedeems;

    return {
      totalActiveLoans,
      totalRedeems,
      totalSales,
      currentCapital: parseFloat(currentCapital || 0),
      totalBalance
    };
  };

  // Combine transactions for the table
  const combineTransactions = (loans, redeems, sales) => {
    const loanTransactions = loans.map(loan => ({
      type: 'Loan',
      amount: parseFloat(loan.LoanAmount || 0),
      itemId: loan.LoanID,
      date: loan.LoanDate,
      reference: `LOAN-${loan.LoanID}`,
      customer: loan.CustomerName
    }));

    const redeemTransactions = redeems.map(redeem => ({
      type: 'Redeem',
      amount: parseFloat(redeem.PaymentAmount || 0),
      itemId: redeem.RedeemID,
      date: redeem.PaymentDate,
      reference: `REDEEM-${redeem.RedeemID}`,
      customer: 'Redeemed Loan'
    }));

    const saleTransactions = sales.map(sale => ({
      type: 'Sale',
      amount: parseFloat(sale.SalePrice || 0),
      itemId: sale.Items_id,
      date: sale.SaleDate,
      reference: `SALE-${sale.SaleID}`,
      customer: sale.CustomerName
    }));

    return [...loanTransactions, ...redeemTransactions, ...saleTransactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 15);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError('');

        if (fetcher) {
          const data = await fetcher();
          if (!active) return;
          setItems(data || []);
        } else {
          // Auditor: Fetch ALL branches
          const branches = await fetchBranches();
          if (!active) return;
          
          // Fetch current capital for all branches
          let capitalData = [];
          try {
            capitalData = await fetchAllCurrentCapital();
          } catch (e) {
            console.warn('Could not fetch current capital data, using fallback');
            capitalData = branches.map(branch => ({ 
              BranchID: branch.BranchID, 
              Current_Capital: 0 
            }));
          }

          const enrichedBranches = branches.map(branch => {
            const cap = capitalData.find(c => c.BranchID === branch.BranchID) || {};
            return {
              ...branch,
              name: branch.BranchName,
              displayName: branch.BranchName,
              capital: cap.Current_Capital || 0,
              target: 70000,
            };
          });
          
          if (active) setItems(enrichedBranches);
        }
      } catch (e) {
        console.error('Error loading branches/current capital:', e);
        if (active) setError('Failed to load branch data');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [fetchAllCurrentCapital, fetchBranches, fetcher]);

  // Fetch branch details when a branch is selected (Auditor view)
  useEffect(() => {
    if (selected) {
      fetchBranchDetails(selected.BranchID)
        .then(details => setBranchDetails(details))
        .catch(err => {
          console.error('Error loading branch details:', err);
          setBranchDetails(null);
        });
    } else {
      setBranchDetails(null);
    }
  }, [fetchBranchDetails, selected]);

  const enriched = useMemo(() => {
    return items.map(b => {
      const percent = b.target ? Math.round((b.capital / b.target) * 100) : 0;
      return {
        ...b,
        percent: Math.min(100, percent),
        name: b.displayName || b.BranchName || b.BranchCode || b.name,
      };
    });
  }, [items]);

  const sorted = useMemo(() => {
    const arr = [...enriched];
    switch (sort) {
      case 'percent':
        arr.sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name));
        break;
      case 'capital':
        arr.sort((a, b) => b.capital - a.capital || a.name.localeCompare(b.name));
        break;
      default:
        arr.sort((a, b) => a.name.localeCompare(b.name));
    }
    return arr;
  }, [enriched, sort]);

  const skeletons = new Array(24).fill(0);

  const progressClass = (p) => {
    if (p >= 90) return 'good';
    if (p < 60) return 'warn';
    return 'mid';
  };

  const closeModal = () => {
    setSelected(null);
    setBranchDetails(null);
  };

  // Calculated financial figures and recent transactions for selected branch
  const financials = branchDetails ? calculateFinancials(
    branchDetails.loans,
    branchDetails.redeems,
    branchDetails.sales,
    branchDetails.currentCapital
  ) : null;

  const transactions = branchDetails ? combineTransactions(
    branchDetails.loans,
    branchDetails.redeems,
    branchDetails.sales
  ) : [];

  return (
    <div className="capital-wrapper">
      <div className="capital-toolbar">
        <div className="group">
          <label>Sort:&nbsp;
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="name">Name (A-Z)</option>
              <option value="percent">Percent</option>
              <option value="capital">Capital</option>
            </select>
          </label>
        </div>
        <div className="group">Branches: {sorted.length}</div>
        {error && <div className="capital-cards-error inline">{error}</div>}
      </div>

      {loading ? (
        <div className="capital-cards-grid" aria-label="Loading branch capital">
          {skeletons.map((_, i) => (
            <div key={i} className="capital-card skeleton" aria-hidden="true">
              <div className="capital-card-icon placeholder" />
              <div className="capital-card-body">
                <div className="capital-card-title placeholder-line" />
                <div className="capital-card-values placeholder-line short" />
                <div className="capital-progress placeholder-bar" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="capital-cards-grid" aria-label="Branch capital overview">
          {sorted.map((b) => {
            const pct = b.percent;
            return (
              <button
                key={b.BranchID}
                className={`capital-card clickable ${progressClass(pct)}`}
                onClick={() => setSelected(b)}
                type="button"
                aria-label={`${b.name} ${pct}% of target`}
              >
                <div className="capital-card-icon" aria-hidden="true">
                  {b.Active ? '🏠' : '⏸️'}
                </div>
                <div className="capital-card-body">
                  <div className="capital-card-title" title={b.name}>{b.name}</div>
                  <div className="capital-card-code" style={{ fontSize: '0.65rem', opacity: 0.7 }}>
                    {b.BranchCode}
                  </div>
                  <div className="capital-card-values">₱{(b.capital || 0).toLocaleString()} <span className="slash">/</span> ₱{(b.target || 0).toLocaleString()}</div>
                  <div className={`capital-progress ${progressClass(pct)}`} aria-label={`${pct}% of target`}>
                    <div className="capital-progress-bar" style={{ width: pct + '%' }} />
                  </div>
                  <div className="capital-progress-label">{pct}%</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="capital-modal-overlay fullscreen-overlay" role="dialog" aria-modal="true" aria-label={selected.name} onClick={closeModal}>
          <div className="capital-modal fullscreen-modal" onClick={e => e.stopPropagation()}>
            <div className="capital-modal-header">
              <h3>{selected.BranchName} ({selected.BranchCode}) - Auditor View</h3>
              <button className="close-btn" onClick={closeModal} aria-label="Close">×</button>
            </div>
            <div className="capital-modal-body fullscreen-body">
              {detailsLoading ? (
                <div className="loading-details">Loading branch details...</div>
              ) : (
                <div className="branch-detail-layout fullscreen-layout">
                  {/* Left Column - Branch Info & Transactions */}
                  <div className="branch-transactions fullscreen-transactions">
                    <div className="branch-info-card">
                      <h4>Branch Information</h4>
                      <div className="branch-info-grid">
                        <div className="info-item">
                          <strong>Address:</strong> 
                          <span>{selected.Address}</span>
                        </div>
                        <div className="info-item">
                          <strong>Status:</strong>
                          <span className={`status-badge ${selected.Active ? 'active' : 'inactive'}`}>
                            {selected.Active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="info-item">
                          <strong>Branch Code:</strong>
                          <span>{selected.BranchCode}</span>
                        </div>
                        <div className="info-item">
                          <strong>Capital Target:</strong>
                          <span>₱{(selected.target || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="transactions-section fullscreen-transactions-section">
                      <div className="section-header">
                        <h4>Recent Transactions (Auditor View)</h4>
                        <div className="transaction-count">
                          {transactions.length} transactions
                        </div>
                      </div>
                      
                      <div className="table-container fullscreen-table-container">
                        <table className="branch-tx-table fullscreen-table">
                          <thead>
                            <tr>
                              <th width="100px">Type</th>
                              <th width="120px">Amount</th>
                              <th width="140px">Reference</th>
                              <th width="200px">Customer</th>
                              <th width="120px">Date</th>
                              <th width="100px">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.length > 0 ? (
                              transactions.map((transaction, i) => (
                                <tr key={i} className="transaction-row">
                                  <td>
                                    <span className={`tx-type ${transaction.type.toLowerCase()}`}>
                                      {transaction.type}
                                    </span>
                                  </td>
                                  <td className="amount-cell">
                                    ₱{transaction.amount.toLocaleString()}
                                  </td>
                                  <td className="reference-cell">
                                    <code>{transaction.reference}</code>
                                  </td>
                                  <td className="customer-cell" title={transaction.customer}>
                                    {transaction.customer || 'N/A'}
                                  </td>
                                  <td className="date-cell">
                                    {transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td>
                                    <span className="status-indicator active">
                                      Completed
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6" className="no-data">
                                  <div className="no-data-content">
                                    <span className="no-data-icon">📝</span>
                                    <p>No transactions found for this branch</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Financial Summary */}
                  <aside className="branch-stats-panel fullscreen-stats">
                    <div className="stats-header">
                      <h4>Financial Summary</h4>
                      <div className="last-updated">As of {new Date().toLocaleDateString()}</div>
                    </div>
                    
                    <div className="stat-block highlight">
                      <div className="stat-icon">💵</div>
                      <div className="stat-content">
                        <h4>Cash On Hand</h4>
                        <div className="stat-main">₱{financials ? financials.totalBalance.toLocaleString() : '0'}</div>
                        <div className="stat-description">Total available funds</div>
                      </div>
                    </div>

                    <div className="stat-block">
                      <div className="stat-icon">🏦</div>
                      <div className="stat-content">
                        <h4>Cash For Pawn</h4>
                        <div className="stat-main">₱{financials ? financials.currentCapital.toLocaleString() : '0'}</div>
                        <div className="stat-description">Available for new loans</div>
                      </div>
                    </div>

                    <div className="stat-block">
                      <div className="stat-icon">🛒</div>
                      <div className="stat-content">
                        <h4>Total Sales</h4>
                        <div className="stat-main">₱{financials ? financials.totalSales.toLocaleString() : '0'}</div>
                        <div className="stat-description">All-time sales</div>
                      </div>
                    </div>

                    <div className="stat-block">
                      <div className="stat-icon">📄</div>
                      <div className="stat-content">
                        <h4>Active Pawns</h4>
                        <div className="stat-main">₱{financials ? financials.totalActiveLoans.toLocaleString() : '0'}</div>
                        <div className="stat-description">Current loan portfolio</div>
                      </div>
                    </div>

                    <div className="stat-block">
                      <div className="stat-icon">🔄</div>
                      <div className="stat-content">
                        <h4>Total Claims</h4>
                        <div className="stat-main">₱{financials ? financials.totalRedeems.toLocaleString() : '0'}</div>
                        <div className="stat-description">Loan repayments</div>
                      </div>
                    </div>

                    <div className="stats-footer">
                      <div className="performance-indicator">
                        <div className="performance-label">Target Progress</div>
                        <div className="performance-value">
                          {selected.target ? Math.round((selected.capital / selected.target) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </div>
            <div className="capital-modal-footer">
              <button type="button" className="modal-action secondary">Export Report</button>
              <button type="button" className="modal-action" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
