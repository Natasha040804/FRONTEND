import React, { useEffect, useState } from 'react';
import '../delivery/delivery.scss';
import ApiService from '../../utils/api';
import { useAuth } from '../../context/authContext';

const AssignDeliveryCard = ({ personnel, onClose, onAssignmentComplete }) => {
  const [branches, setBranches] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const { currentUser, branchStatus } = useAuth();
  const [branchCapitals, setBranchCapitals] = useState({}); // branchId -> { current_capital }

  const [formData, setFormData] = useState({
    from_branch_id: '',
    to_branch_id: '',
    priority: 'medium',
    notes: '',
    capital_or_balance: '',
    amount: ''
  });

  // Determine if current user is Auditor (check both role/Role, handle AE alias)
  const normalizedRole = ((currentUser?.role || currentUser?.Role || '') + '').toLowerCase();
  const isAuditor = normalizedRole === 'auditor';
  const isAccountExecutive = normalizedRole === 'accountexecutive' || normalizedRole === 'ae' || normalizedRole.includes('account') || normalizedRole.includes('executive');

  useEffect(() => {
    fetchBranches();
    fetchInventoryItems();
  }, []);

  // Fetch branch capital data once branches loaded
  useEffect(() => {
    if (branches.length > 0) {
      fetchBranchCapitals();
    }
  }, [branches]);

  // If user is Account Executive, default the "From" branch to their active branch and lock it
  useEffect(() => {
    if (!isAccountExecutive) return;
    // Debug + robust detection: prefer branchStatus but accept many possible keys
    try {
      // show helpful debug info in console (remove later if noisy)
      // eslint-disable-next-line no-console
      console.debug('AssignDeliveryCard: determining AE branch', { branchStatus, currentUser });
    } catch (e) {}

    const tryGetBranchIdFrom = (obj) => {
      if (!obj) return null;
      return obj.branch_id || obj.BranchID || obj.branchId || obj.BranchId || (obj.branch && (obj.branch.BranchID || obj.branch.branchId)) || (obj.data && (obj.data.branchId || obj.data.BranchID)) || null;
    };

    const bs = tryGetBranchIdFrom(branchStatus);
    const cu = tryGetBranchIdFrom(currentUser) || tryGetBranchIdFrom(currentUser?.user) || null;
    const branchId = bs || cu;
    if (branchId) {
      setFormData((prev) => ({ ...prev, from_branch_id: String(branchId) }));
      // Clear any previously selected items since we're switching the source
      setSelectedItems([]);
    } else {
      // eslint-disable-next-line no-console
      console.debug('AssignDeliveryCard: no AE branch found yet', { bs, cu, branchStatus, currentUser });
    }
  }, [isAccountExecutive, currentUser, branchStatus]);

  const fetchBranches = async () => {
    try {
      const result = await ApiService.get('/api/users/branches');
      if (result && result.success) {
        setBranches(result.data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchBranchCapitals = async () => {
    try {
      // Use existing backend endpoint: /api/capital/current-capital
      const result = await ApiService.get('/api/capital/current-capital');
      let rows = [];
      if (Array.isArray(result)) {
        rows = result;
      } else if (result && result.success && Array.isArray(result.data)) {
        rows = result.data;
      }
      if (!rows.length) return;
      const map = rows.reduce((acc, row) => {
        const id = String(row.BranchID || row.branch_id || row.id || '');
        if (id) {
          acc[id] = {
            BranchID: id,
            current_capital: row.current_capital ?? row.Current_Capital ?? row.capital ?? 0,
          };
        }
        return acc;
      }, {});
      setBranchCapitals(map);
    } catch (error) {
      console.error('Error fetching branch capitals:', error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      // Try primary items endpoint
      let result = await ApiService.get('/api/items');

      // Fallback to alternative route if needed
      if (!Array.isArray(result)) {
        try { result = await ApiService.get('/api/inventory/items'); } catch (_) {}
      }

      // Debug logs for visibility
      console.log('API Response:', result);
      console.log('Number of items:', Array.isArray(result) ? result.length : 'Not an array');

      if (Array.isArray(result)) {
        // Filter out Sold and Redeemed on the client as a safety net
        const availableItems = result.filter(item => item.ItemStatus !== 'Sold' && item.ItemStatus !== 'Redeemed');
        console.log('Available items after filtering:', availableItems.length);
        console.log('Item statuses in available items:', [...new Set(availableItems.map(item => item.ItemStatus))]);
        setInventoryItems(availableItems);
      } else if (result && result.success && Array.isArray(result.data)) {
        const availableItems = result.data.filter(item => item.ItemStatus !== 'Sold' && item.ItemStatus !== 'Redeemed');
        setInventoryItems(availableItems);
      } else {
        setInventoryItems([]);
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      // Secondary fallback endpoint (if provided by backend)
      try {
        const fallbackResult = await ApiService.get('/api/users/items-inventory');
        if (fallbackResult && fallbackResult.success) {
          const availableItems = fallbackResult.data.filter(item => item.ItemStatus !== 'Sold' && item.ItemStatus !== 'Redeemed');
          setInventoryItems(availableItems);
          return;
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }

      setInventoryItems([]);
    }
  };

  // Get branch name by ID
  const getBranchName = (branchId) => {
    if (branchId === 'office') return 'Main Office';
    const branch = branches.find(b => String(b.BranchID) === String(branchId));
    return branch ? branch.BranchName : `Branch ${branchId}`;
  };

  // Get current capital for a branch
  const getBranchCapital = (branchId) => {
    if (!branchId || branchId === 'office') return 0;
    const row = branchCapitals[String(branchId)];
    return row ? (row.current_capital ?? row.capital ?? 0) : 0;
  };

  // Predict new capital after assignment (for auditor Cash In only reduces from source)
  const calculateNewCapital = () => {
    if (!isAuditor) return null;
    if (!formData.from_branch_id || formData.from_branch_id === 'office') return null;
    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) return null;
    if (formData.capital_or_balance === 'capital') {
      const current = getBranchCapital(formData.from_branch_id);
      return Math.max(0, current - amt);
    }
    return null; // Cash Out does not reduce capital here
  };

  // Filter items based on search term AND selected "From" branch
  const filteredItems = inventoryItems.filter((item) => {
    // First filter by selected "From" branch if one is selected
    if (formData.from_branch_id && formData.from_branch_id !== 'office') {
      if (String(item.BranchID) !== String(formData.from_branch_id)) {
        return false;
      }
    }

    // Then filter by search term
    const q = searchTerm.toLowerCase();
    const idStr = (item.Items_id != null ? String(item.Items_id) : '').toLowerCase();
    const branchStr = getBranchName(item.BranchID).toLowerCase();
    const modelStr = (item.Model || item.ModelNumber || '').toLowerCase();
  const brandStr = (item.Brand || '').toLowerCase();
  const serialStr = (item.ItemSerialNumber || '').toLowerCase();
  const classificationStr = (item.Classification || '').toLowerCase();
  const statusStr = (item.ItemStatus || '').toLowerCase();
    
    return (
      idStr.includes(q) ||
      branchStr.includes(q) ||
      modelStr.includes(q) ||
      brandStr.includes(q) ||
      serialStr.includes(q) ||
      classificationStr.includes(q) ||
      statusStr.includes(q)
    );
  });

  const handleItemSelect = (item) => {
    if (!selectedItems.find((s) => s.Items_id === item.Items_id)) {
      setSelectedItems((prev) => [...prev, { ...item, transferQuantity: 1 }]);
    }
  };

  const handleItemRemove = (itemsId) => {
    setSelectedItems((prev) => prev.filter((i) => i.Items_id !== itemsId));
  };

  // Update quantity for selected items
  const updateItemQuantity = (itemsId, quantity) => {
    setSelectedItems((prev) => prev.map((item) =>
      item.Items_id === itemsId ? { ...item, transferQuantity: Math.max(1, quantity) } : item
    ));
  };

  // Reset table filter when "From" branch changes
  const handleFromBranchChange = (value) => {
    setFormData((prev) => ({ ...prev, from_branch_id: value }));
    // Clear selected items when branch changes since they might not be available in the new branch
    setSelectedItems([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Auditor-specific validation
    if (isAuditor) {
      if (!formData.capital_or_balance) {
        alert('Please select Capital or Get Balance');
        setLoading(false);
        return;
      }
      const amt = parseFloat(formData.amount);
      if (!amt || amt <= 0) {
        alert('Please enter a valid amount');
        setLoading(false);
        return;
      }
    }

    try {
      const resolveLocation = (val) => {
        if (!val || val === 'office') return { type: 'OFFICE', branchId: null };
        const n = Number(val);
        return { type: 'BRANCH', branchId: Number.isFinite(n) ? n : null };
      };

      const fromLoc = resolveLocation(formData.from_branch_id);
      const toLoc = resolveLocation(formData.to_branch_id);
      // Decide assignment type
      let assignmentType = 'ITEM_TRANSFER';
      if (isAuditor) {
        assignmentType = formData.capital_or_balance === 'capital'
          ? 'CAPITAL_DELIVERY'
          : 'BALANCE_DELIVERY';
      }

      const assignmentData = {
        assigned_to: personnel.id,
        from_location_type: fromLoc.type,
        from_branch_id: fromLoc.branchId,
        to_location_type: toLoc.type,
        to_branch_id: toLoc.branchId,
        items: selectedItems.map(item => ({
          item_id: item.Items_id,
          name: `${item.Brand || ''} ${item.Model || item.ModelNumber || ''}`.trim(),
          quantity: item.transferQuantity || 1
        })),
        priority: formData.priority,
        notes: formData.notes,
        assignment_type: assignmentType,
        ...(isAuditor && {
          capital_or_balance: formData.capital_or_balance,
          amount: parseFloat(formData.amount)
        })
      };

      const result = await ApiService.post('/api/users/delivery-assignments', assignmentData);
      if (result.success) {
        alert('Delivery assignment created successfully!');
        onAssignmentComplete();
      } else {
        alert('Error creating assignment: ' + (result.error || result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Error creating assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assign-delivery-popup">
      <div className="popup-header">
        <div className="personnel-info-compact">
          <img src={personnel.photoUrl} alt={personnel.name} className="avatar-small" />
          <div className="personnel-details">
            <span className="personnel-name">{personnel.name}</span>
            <span className="personnel-id">{personnel.employeeId}</span>
          </div>
        </div>
        <button className="btn-close-popup" onClick={onClose}>×</button>
      </div>

      <div className="popup-content">
        <form onSubmit={handleSubmit} className="popup-form">
          {/* Route Section */}
          <div className="form-section-popup">
            <div className="route-selectors">
              <div className="route-group">
                <label>From</label>
                <select
                  value={formData.from_branch_id}
                  onChange={(e) => handleFromBranchChange(e.target.value)}
                  required
                  disabled={isAccountExecutive}
                  title={isAccountExecutive ? 'From branch is fixed to your assigned branch' : ''}
                  className="route-select"
                >
                  <option value="">Select Location</option>
                  {branches.map((branch) => (
                    <option key={branch.BranchID} value={branch.BranchID}>
                      {branch.BranchName}
                    </option>
                  ))}
                  <option value="office">Main Office</option>
                </select>
                {isAuditor && formData.from_branch_id && formData.from_branch_id !== 'office' && (
                  <div className="branch-capital-info">
                    <small>
                      Current Capital: <strong>${getBranchCapital(formData.from_branch_id).toLocaleString()}</strong>
                      {formData.capital_or_balance === 'capital' && formData.amount && calculateNewCapital() !== null && (
                        <span>
                          {' '}→ New Capital: <strong>${calculateNewCapital().toLocaleString()}</strong>
                          {' '}(-${parseFloat(formData.amount).toLocaleString()})
                        </span>
                      )}
                    </small>
                  </div>
                )}
              </div>

              <div className="route-arrow">→</div>

              <div className="route-group">
                <label>To</label>
                <select
                  value={formData.to_branch_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, to_branch_id: e.target.value }))}
                  required
                  className="route-select"
                >
                  <option value="">Select Location</option>
                  {branches.map((branch) => (
                    <option key={branch.BranchID} value={branch.BranchID}>
                      {branch.BranchName}
                    </option>
                  ))}
                  <option value="office">Main Office</option>
                </select>
                {isAuditor && formData.to_branch_id && formData.to_branch_id !== 'office' && formData.capital_or_balance && formData.amount && (
                  <div className="branch-capital-info">
                    <small>
                      Current Capital: <strong>${getBranchCapital(formData.to_branch_id).toLocaleString()}</strong>
                      <span>
                        {' '}→ After Completion: <strong>${(getBranchCapital(formData.to_branch_id) + parseFloat(formData.amount || 0)).toLocaleString()}</strong>
                        {' '}(+${parseFloat(formData.amount || 0).toLocaleString()})
                      </span>
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>

            {/* Auditor-specific capital / balance fields */}
            {isAuditor && (
              <div className="form-section-popup">
                <div className="auditor-fields">
                  <div className="auditor-field-group">
                    <div className="auditor-field">
                      <label>Capital or Get Balance *</label>
                      <select
                        value={formData.capital_or_balance}
                        onChange={(e) => setFormData(prev => ({ ...prev, capital_or_balance: e.target.value }))}
                        required
                        className="auditor-select"
                      >
                        <option value="">Select Option</option>
                        <option value="capital">Cash In</option>
                        <option value="get_balance">Cash Out</option>
                      </select>
                    </div>
                    <div className="auditor-field">
                      <label>Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Enter amount"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        required
                        className="auditor-amount-input"
                      />
                    </div>
                  </div>
                  <div className="auditor-note">
                    <small>
                      {formData.capital_or_balance === 'capital'
                        ? 'This will create a CAPITAL_DELIVERY assignment (Cash In)'
                        : formData.capital_or_balance === 'get_balance'
                          ? 'This will create a BALANCE_DELIVERY assignment (Cash Out)'
                          : 'Select an option to determine assignment type'}
                    </small>
                  </div>
                </div>
              </div>
            )}
          
          {/* Search Box */}
          {!isAuditor && (
            <div className="form-section-popup">
              <div className="search-section">
                <label>Search Items</label>
                <div className="search-box-popup">
                  <input
                    type="text"
                    placeholder="Type ID, branch, model, brand, serial, or status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input-popup"
                  />
                  <span className="search-icon">🔍</span>
                </div>
              </div>
            </div>
          )}

          {/* Items Table Information */}
          {!isAuditor && (
            <div className="form-section-popup">
              <div className="table-info-header">
                <div className="table-stats">
                  <span>Total Items: <strong>{inventoryItems.length}</strong></span>
                  <span>Filtered: <strong>{filteredItems.length}</strong></span>
                  {formData.from_branch_id && (
                    <span>From Branch: <strong>{getBranchName(formData.from_branch_id)}</strong></span>
                  )}
                </div>
                <button 
                  type="button" 
                  className="btn-refresh"
                  onClick={fetchInventoryItems}
                  title="Refresh items"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          )}

          {/* Items Table (from tbl_ItemsInventory) */}
          {!isAuditor ? (
            <div className="form-section-popup">
              <div className="items-table-section">
                <div className="table-header-info">
                  <label>Available Items</label>
                  {formData.from_branch_id && (
                    <span className="item-count">
                      {filteredItems.length} items found in {getBranchName(formData.from_branch_id)}
                    </span>
                  )}
                </div>
                <div className="table-container-popup">
                  <table className="items-table-popup">
                    <thead>
                      <tr>
                        <th>Item ID</th>
                        <th>Branch</th>
                        <th>Model</th>
                        <th>Brand</th>
                        <th>Serial Number</th>
                        <th>Classification</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr key={item.Items_id} className="table-row-popup">
                          <td className="item-id-popup">#{item.Items_id}</td>
                          <td className="branch-name-popup">{getBranchName(item.BranchID)}</td>
                          <td>{item.Model || item.ModelNumber || '-'}</td>
                          <td>{item.Brand || '-'}</td>
                          <td className="serial-number-popup">{item.ItemSerialNumber || '-'}</td>
                          <td className="classification-popup">{item.Classification || '-'}</td>
                          <td className="status-popup">
                            <span className={`item-status ${item.ItemStatus?.toLowerCase() || ''}`}>
                              {item.ItemStatus || '-'}
                            </span>
                          </td>
                          <td className="item-action-popup">
                            <button
                              type="button"
                              className={`btn-action-popup ${
                                selectedItems.find((s) => s.Items_id === item.Items_id) ? 'added' : ''
                              }`}
                              onClick={() => handleItemSelect(item)}
                              disabled={selectedItems.find((s) => s.Items_id === item.Items_id)}
                            >
                              {selectedItems.find((s) => s.Items_id === item.Items_id) ? 'Added' : 'Add'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredItems.length === 0 && (
                    <div className="no-items-popup">
                      {formData.from_branch_id 
                        ? `No items found in ${getBranchName(formData.from_branch_id)} matching your search`
                        : 'Please select a "From" branch to see available items'
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="form-section-popup">
              <div className="auditor-items-note">
                
              </div>
            </div>
          )}

          {/* Selected Items Summary */}
          {selectedItems.length > 0 && (
            <div className="form-section-popup">
              <div className="selected-summary">
                <label>Selected Items ({selectedItems.length})</label>
                <div className="selected-items-list-popup">
                  {selectedItems.map((item) => (
                    <div key={item.Items_id} className="selected-item-popup">
                      <div className="selected-item-info">
                        <span className="selected-item-name">
                          #{item.Items_id} - {item.Brand || '-'} {item.Model || item.ModelNumber || '-'}
                        </span>
                        <span className="selected-item-branch">
                          From: {getBranchName(item.BranchID)} | Status: {item.ItemStatus}
                        </span>
                      </div>
                      <div className="selected-item-controls">
                        <div className="quantity-control">
                          <label>Qty:</label>
                          <input
                            type="number"
                            min="1"
                            max={1} // Since these are individual items, quantity should be 1
                            value={item.transferQuantity}
                            onChange={(e) => updateItemQuantity(item.Items_id, parseInt(e.target.value) || 1)}
                            className="quantity-input-popup"
                            disabled // Disable quantity change since these are individual items
                          />
                        </div>
                        <button
                          type="button"
                          className="btn-remove-popup"
                          onClick={() => handleItemRemove(item.Items_id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes Field */}
          <div className="form-section-popup">
            <div className="notes-section">
              <label>Notes</label>
              <textarea
                placeholder="Add any additional notes or instructions..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="notes-textarea"
                rows="3"
              />
            </div>
          </div>

          {/* Priority and Add Button */}
          <div className="form-section-popup">
            <div className="action-row">
              

              <button
                type="submit"
                className="btn-add-popup"
                disabled={(() => {
                  // Loading always disables
                  if (loading) return true;
                  // Auditor can submit even with zero selectedItems as long as capital/balance + amount are valid
                  if (isAuditor) {
                    const haveType = !!formData.capital_or_balance;
                    const amt = parseFloat(formData.amount);
                    const validAmount = !isNaN(amt) && amt > 0;
                    return !(haveType && validAmount);
                  }
                  // Non-auditor must select at least one item
                  return selectedItems.length === 0;
                })()}
                title={(() => {
                  if (loading) return 'Submitting assignment...';
                  if (isAuditor) {
                    if (!formData.capital_or_balance) return 'Select Capital or Get Balance';
                    const amt = parseFloat(formData.amount);
                    if (isNaN(amt) || amt <= 0) return 'Enter a valid amount';
                    return 'Ready to create assignment';
                  }
                  if (selectedItems.length === 0) return 'Select at least one item';
                  return 'Ready to create assignment';
                })()}
              >
                {loading ? <span className="loading-spinner-small"></span> : 'ADD DELIVERY'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignDeliveryCard;
