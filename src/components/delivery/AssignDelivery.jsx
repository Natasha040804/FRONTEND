import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './delivery.scss';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const AssignDelivery = () => {
  const { personnelId } = useParams();
  const query = useQuery();
  const navigate = useNavigate();
  const name = query.get('name') || 'Unknown';
  const status = query.get('status') || 'standby';
  const employeeId = query.get('employeeId') || '';

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('route');
  const [formData, setFormData] = useState({
    assignment_type: 'ITEM_TRANSFER',
    stops: [
      { 
        type: 'pickup', 
        location_type: 'BRANCH', 
        branch_id: '',
        address: '',
        contact_person: '',
        contact_number: '',
        instructions: ''
      },
      { 
        type: 'drop', 
        location_type: 'BRANCH', 
        branch_id: '',
        address: '',
        contact_person: '',
        contact_number: '',
        instructions: ''
      }
    ],
    items: [{ 
      item_id: '', 
      name: '', 
      quantity: 1, 
      weight: '', 
      dimensions: '',
      fragile: false,
      special_handling: ''
    }],
    amount: '',
    priority: 'medium',
    notes: '',
    due_date: ''
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/users/branches');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBranches(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/users/delivery-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assigned_to: parseInt(personnelId),
          ...formData,
          from_location_type: formData.stops[0].location_type,
          from_branch_id: formData.stops[0].branch_id,
          to_location_type: formData.stops[1].location_type,
          to_branch_id: formData.stops[1].branch_id,
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Assignment created successfully!');
        navigate(-1);
      } else {
        alert('Error creating assignment: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Error creating assignment');
    } finally {
      setLoading(false);
    }
  };

  const updateStop = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      stops: prev.stops.map((stop, i) => 
        i === index ? { ...stop, [field]: value } : stop
      )
    }));
  };

  const addStop = () => {
    setFormData(prev => ({
      ...prev,
      stops: [
        ...prev.stops,
        { 
          type: 'intermediate', 
          location_type: 'BRANCH', 
          branch_id: '',
          address: '',
          contact_person: '',
          contact_number: '',
          instructions: ''
        }
      ]
    }));
  };

  const removeStop = (index) => {
    if (formData.stops.length <= 2) return; // Keep at least pickup and drop
    setFormData(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index)
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        item_id: '', 
        name: '', 
        quantity: 1, 
        weight: '', 
        dimensions: '',
        fragile: false,
        special_handling: ''
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => String(b.BranchID) === String(branchId));
    return branch ? `${branch.BranchName} (${branch.BranchCode})` : 'Select Branch';
  };

  const getLocationName = (stop) => {
    if (stop.location_type === 'OFFICE') return 'Main Office';
    return getBranchName(stop.branch_id);
  };

  return (
    <div className="delivery-page modern-assignment">
      {/* Header */}
      <div className="page-header modern-header">
        <div className="header-content">
          <div className="header-main">
            <h2>Create Delivery Assignment</h2>
            <p>Assign a new delivery task to logistics personnel</p>
          </div>
          <div className="header-meta">
            <div className="personnel-info">
              <div className="personnel-avatar">
                <img src={`https://i.pravatar.cc/40?img=${personnelId % 70}`} alt={name} />
              </div>
              <div className="personnel-details">
                <div className="personnel-name">{name}</div>
                <div className="personnel-id">{employeeId}</div>
              </div>
            </div>
            <span className={`status-chip modern ${status}`}>
              <span className="status-dot"></span>
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'route' ? 'active' : ''}`}
            onClick={() => setActiveTab('route')}
          >
            <span className="tab-icon">📍</span>
            Delivery Route
          </button>
          <button 
            className={`tab ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            <span className="tab-icon">📦</span>
            Items & Details
          </button>
          <button 
            className={`tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            <span className="tab-icon">👁️</span>
            Review & Assign
          </button>
        </div>
      </div>

      <div className="cards modern-layout">
        {/* Route Planning Card */}
        <div className="card modern-card route-card">
          <div className="card-header">
            <h3 className="section-title">
              <span className="title-icon">🛣️</span>
              Delivery Route
            </h3>
            <div className="card-actions">
              <button className="btn-add-stop" onClick={addStop}>
                <span className="btn-icon">+</span>
                Add Stop
              </button>
            </div>
          </div>

          <div className="stops-container">
            {formData.stops.map((stop, index) => (
              <div key={index} className={`stop-item ${stop.type}`}>
                <div className="stop-marker">
                  <div className="marker-icon">
                    {stop.type === 'pickup' ? '📥' : 
                     stop.type === 'drop' ? '📤' : '📍'}
                  </div>
                  <div className="marker-line"></div>
                </div>
                
                <div className="stop-content">
                  <div className="stop-header">
                    <div className="stop-type">
                      {stop.type === 'pickup' ? 'Pickup Location' : 
                       stop.type === 'drop' ? 'Drop Location' : `Stop ${index + 1}`}
                    </div>
                    {index >= 2 && (
                      <button 
                        className="btn-remove-stop"
                        onClick={() => removeStop(index)}
                        title="Remove stop"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="stop-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Location Type</label>
                        <select 
                          value={stop.location_type}
                          onChange={(e) => updateStop(index, 'location_type', e.target.value)}
                        >
                          <option value="BRANCH">Branch</option>
                          <option value="OFFICE">Main Office</option>
                        </select>
                      </div>

                      {stop.location_type === 'BRANCH' && (
                        <div className="form-group">
                          <label>Select Branch</label>
                          <select 
                            value={stop.branch_id}
                            onChange={(e) => updateStop(index, 'branch_id', e.target.value)}
                          >
                            <option value="">Choose a branch</option>
                            {branches.map(branch => (
                              <option key={branch.BranchID} value={branch.BranchID}>
                                {branch.BranchName} ({branch.BranchCode}) - {branch.City}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input
                          type="text"
                          placeholder="Name of contact person"
                          value={stop.contact_person}
                          onChange={(e) => updateStop(index, 'contact_person', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Contact Number</label>
                        <input
                          type="text"
                          placeholder="Phone number"
                          value={stop.contact_number}
                          onChange={(e) => updateStop(index, 'contact_number', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Special Instructions</label>
                      <textarea
                        placeholder="Any special instructions for this location..."
                        value={stop.instructions}
                        onChange={(e) => updateStop(index, 'instructions', e.target.value)}
                        rows="2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items Table Card */}
        <div className="card modern-card items-card">
          <div className="card-header">
            <h3 className="section-title">
              <span className="title-icon">📋</span>
              Items Details
            </h3>
            <button className="btn-add-item" onClick={addItem}>
              <span className="btn-icon">+</span>
              Add Item
            </button>
          </div>

          <div className="items-table-container">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item ID</th>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Weight (kg)</th>
                  <th>Dimensions</th>
                  <th>Fragile</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index} className="item-row">
                    <td>
                      <input
                        type="text"
                        value={item.item_id}
                        onChange={(e) => updateItem(index, 'item_id', e.target.value)}
                        placeholder="ITEM-001"
                        className="table-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder="Item description"
                        className="table-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        min="1"
                        className="table-input quantity-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.weight}
                        onChange={(e) => updateItem(index, 'weight', e.target.value)}
                        placeholder="0.0"
                        step="0.1"
                        className="table-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.dimensions}
                        onChange={(e) => updateItem(index, 'dimensions', e.target.value)}
                        placeholder="L x W x H"
                        className="table-input"
                      />
                    </td>
                    <td>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={item.fragile}
                          onChange={(e) => updateItem(index, 'fragile', e.target.checked)}
                          className="checkbox-input"
                        />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                    <td>
                      {formData.items.length > 1 && (
                        <button 
                          className="btn-remove-item"
                          onClick={() => removeItem(index)}
                          title="Remove item"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Special Handling */}
          <div className="special-handling-section">
            <h4>Special Handling Instructions</h4>
            <textarea
              placeholder="Any special handling requirements for all items..."
              value={formData.items[0]?.special_handling || ''}
              onChange={(e) => updateItem(0, 'special_handling', e.target.value)}
              rows="3"
              className="special-handling-textarea"
            />
          </div>
        </div>

        {/* Assignment Details Card */}
        <div className="card modern-card details-card">
          <div className="card-header">
            <h3 className="section-title">
              <span className="title-icon">⚡</span>
              Assignment Details
            </h3>
          </div>

          <div className="details-form">
            <div className="form-row">
              <div className="form-group">
                <label>Assignment Type</label>
                <select 
                  value={formData.assignment_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignment_type: e.target.value }))}
                >
                  <option value="ITEM_TRANSFER">Item Transfer</option>
                  <option value="CAPITAL_DELIVERY">Capital Delivery</option>
                  <option value="BALANCE_DELIVERY">Balance Delivery</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority Level</label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Due Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            {['CAPITAL_DELIVERY', 'BALANCE_DELIVERY'].includes(formData.assignment_type) && (
              <div className="form-group">
                <label>Amount</label>
                <div className="amount-input-container">
                  <span className="currency-symbol">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="amount-input"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional instructions or important information..."
                rows="4"
              />
            </div>
          </div>
        </div>

        {/* Route Summary Card */}
        <div className="card modern-card summary-card">
          <div className="card-header">
            <h3 className="section-title">
              <span className="title-icon">👁️</span>
              Route Summary
            </h3>
          </div>

          <div className="route-summary">
            <div className="route-visual">
              {formData.stops.map((stop, index) => (
                <div key={index} className="route-stop">
                  <div className="stop-visual">
                    <div className={`stop-dot ${stop.type}`}>
                      {stop.type === 'pickup' ? '📥' : 
                       stop.type === 'drop' ? '📤' : '📍'}
                    </div>
                    {index < formData.stops.length - 1 && (
                      <div className="route-connector"></div>
                    )}
                  </div>
                  <div className="stop-info">
                    <div className="stop-name">{getLocationName(stop)}</div>
                    {stop.contact_person && (
                      <div className="stop-contact">{stop.contact_person}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-stats">
              <div className="stat-item">
                <div className="stat-label">Total Stops</div>
                <div className="stat-value">{formData.stops.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Items</div>
                <div className="stat-value">
                  {formData.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Priority</div>
                <div className={`stat-value priority-${formData.priority}`}>
                  {formData.priority}
                </div>
              </div>
            </div>
          </div>

          <div className="actions modern-actions">
            <button 
              type="button" 
              className="btn primary large"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating Assignment...
                </>
              ) : (
                <>
                  <span className="btn-icon">🚚</span>
                  Create Delivery Assignment
                </>
              )}
            </button>
            <button 
              type="button" 
              className="btn ghost"
              onClick={() => navigate(-1)}
            >
              Cancel Assignment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignDelivery;
