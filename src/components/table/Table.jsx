import "./table.scss";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/authContext";
import { getApiBase } from "../../apiBase";
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { createPortal } from 'react-dom';

const List = ({ refreshKey = 0, onUpdateItem, actionButtonText = "Update", detailView = 'detail', statusFilter, onRowClick, searchTerm = '' }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
    const { getAuthHeaders } = useAuth();

  // Fetch data from backend using fetch (no axios dependency required)
  useEffect(() => {
    const controller = new AbortController();

    const fetchItems = async () => {
      try {
        const API_BASE = getApiBase();
        let url = `${API_BASE ? API_BASE : ''}/api/items`;
        const params = new URLSearchParams();
        if (statusFilter) {
          params.append('status', statusFilter);
        } else {
          // By default, exclude Sold and Redeemed from the generic table view
          params.append('exclude', 'Sold,Redeemed');
        }
        const qs = params.toString();
        if (qs) url += `?${qs}`;
      
        const headers = await getAuthHeaders({'Content-Type':'application/json'});
        const res = await fetch(url, { signal: controller.signal, credentials: 'include', headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setItems(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch error:', err);
          setError('Failed to fetch data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchItems();

    return () => controller.abort();
  }, [refreshKey, statusFilter]);

  // Close modal when clicking outside or pressing Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setSelectedItem(null);
    };

    const handleClickOutside = (e) => {
      if (selectedItem && e.target.closest('.detail-card') === null) {
        setSelectedItem(null);
      }
    };

    if (selectedItem) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [selectedItem]);

  const handleUpdateClick = () => {
    if (selectedItem && onUpdateItem) {
      onUpdateItem(selectedItem);
      setSelectedItem(null); // Close the popup after clicking update
    }
  };

  

  const formatValue = (value, type = 'text') => {
    if (value === null || value === undefined || value === '') return '—';
    
    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'currency':
        return `₱${value}`;
      case 'status':
        return <span className={`status ${value}`}>{value}</span>;
      default:
        return String(value);
    }
  };

  const DetailCard = () => {
    if (!selectedItem) return null;

    return createPortal(
      <div className="detail-overlay">
        <div className="detail-card">
          <div className="detail-card__header">
            <div className="detail-card__title">
              <div className="detail-card__item-id">Item #{selectedItem.Items_id}</div>
              <div className="detail-card__item-desc">
                {selectedItem.Brand || '—'} {selectedItem.Model || '—'} 
                {selectedItem.ItemSerialNumber && ` • ${selectedItem.ItemSerialNumber}`}
              </div>
            </div>
            <div className="detail-card__header-actions">
              <button 
                className={`detail-card__update-btn ${actionButtonText === 'Redeem' ? 'redeem' : ''}`}
                onClick={handleUpdateClick}
                aria-label="update item"
              >
                <EditIcon />
                {actionButtonText}
              </button>
              <button 
                className="detail-card__close-btn"
                onClick={() => setSelectedItem(null)}
                aria-label="close detail"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="detail-card__sections">
            {/* Item Information Section */}
            <div className="detail-section">
              <h3 className="detail-section__title">Item Information</h3>
              <div className="detail-section__grid">
                <div className="detail-field">
                  <label className="detail-field__label">Serial Number</label>
                  <div className="detail-field__value">{formatValue(selectedItem.ItemSerialNumber)}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Battery/Charger Serial</label>
                  <div className="detail-field__value">{formatValue(selectedItem.BatchargeSerialNumber)}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Classification</label>
                  <div className="detail-field__value">{formatValue(selectedItem.Classification)}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Status</label>
                  <div className="detail-field__value">{formatValue(selectedItem.ItemStatus, 'status')}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Brand</label>
                  <div className="detail-field__value">{formatValue(selectedItem.Brand)}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Model</label>
                  <div className="detail-field__value">{formatValue(selectedItem.Model)}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Processor/Specs</label>
                  <div className="detail-field__value">{formatValue(selectedItem.ProcessorSpecs)}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Wifi Address</label>
                  <div className="detail-field__value">{formatValue(selectedItem.WifiAddress)}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Amount</label>
                  <div className="detail-field__value">{formatValue(selectedItem.Amount, 'currency')}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Interest Rate (%)</label>
                  <div className="detail-field__value">{formatValue(selectedItem.InterestRate)}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Interest Amount</label>
                  <div className="detail-field__value">{formatValue(selectedItem.InterestAmount, 'currency')}</div>
                </div>
              </div>
            </div>

            {/* Loan Information Section */}
            <div className="detail-section">
              <h3 className="detail-section__title">Loan Information</h3>
              <div className="detail-section__grid">
                <div className="detail-field">
                  <label className="detail-field__label">Loan Agreement Number</label>
                  <div className="detail-field__value">{formatValue(selectedItem.LoanAgreementNumber)}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Branch</label>
                  <div className="detail-field__value">{formatValue(selectedItem.BranchName || selectedItem.BranchID)}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Loan Date</label>
                  <div className="detail-field__value">{formatValue(selectedItem.LoanDate, 'datetime')}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Due Date</label>
                  <div className="detail-field__value">{formatValue(selectedItem.DueDate, 'datetime')}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Account Executive</label>
                  <div className="detail-field__value">{formatValue(selectedItem.AccountExecutive)}</div>
                </div>
              </div>
            </div>

            {/* Customer Information Section */}
            <div className="detail-section">
              <h3 className="detail-section__title">Customer Information</h3>
              <div className="detail-section__grid">
                <div className="detail-field">
                  <label className="detail-field__label">Customer Name</label>
                  <div className="detail-field__value">{formatValue(selectedItem.Customer)}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Customer Address</label>
                  <div className="detail-field__value">{formatValue(selectedItem.CustomerAddress)}</div>
                </div>
                <div className="detail-field">
                  <label className="detail-field__label">Contact Number</label>
                  <div className="detail-field__value">{formatValue(selectedItem.CustomerContact)}</div>
                </div>
              </div>
            </div>

          </div>

          {/* Update button at the bottom as well for better accessibility */}
          <div className="detail-card__footer">
            <button 
              className={`detail-card__update-btn footer ${actionButtonText === 'Redeem' ? 'redeem' : ''}`}
              onClick={handleUpdateClick}
            >
              <EditIcon />
              {actionButtonText} Item Details
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Derived filtered items by searchTerm (must be declared before any early returns to satisfy hook rules)
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(it => {
      return [
        it.Items_id,
        it.BranchName,
        it.LoanAgreementNumber,
        it.ItemSerialNumber,
        it.BatchargeSerialNumber,
        it.Classification,
        it.ItemStatus,
        it.Brand,
        it.Model,
        it.WifiAddress,
        it.Customer,
        it.CustomerAddress,
        it.CustomerContact,
        it.AccountExecutive
      ].some(field => field && String(field).toLowerCase().includes(term));
    });
  }, [items, searchTerm]);

  if (loading) return <div className="loading">Loading items...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <TableContainer component={Paper} className="table container" sx={{ maxHeight: '80vh', overflow: 'auto' }}
>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell className="tableCell">Item ID</TableCell>
              <TableCell className="tableCell">Branch</TableCell>
              <TableCell className="tableCell">Loan Agreement Number</TableCell>
              <TableCell className="tableCell">Serial Number of Item</TableCell>
              <TableCell className="tableCell">Serial Number of Battery/Charger</TableCell>
              <TableCell className="tableCell">Classification</TableCell>
              <TableCell className="tableCell">Item Status</TableCell>
              <TableCell className="tableCell">Brand</TableCell>
              <TableCell className="tableCell">Model</TableCell>
              <TableCell className="tableCell">Processor/Megapixel/Optical Zoom</TableCell>
              <TableCell className="tableCell">Wifi Address</TableCell>
              <TableCell className="tableCell">Amount</TableCell>
              <TableCell className="tableCell">Interest Rate (%)</TableCell>
              <TableCell className="tableCell">Interest Amount</TableCell>
              <TableCell className="tableCell">Loan Date</TableCell>
              <TableCell className="tableCell">Due Date</TableCell>
              <TableCell className="tableCell">Customer Name</TableCell>
              <TableCell className="tableCell">Customer Address</TableCell>
              <TableCell className="tableCell">Customer Contact Number</TableCell>
              <TableCell className="tableCell">Account Executive</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow
                key={item.Items_id}
                className="clickable-row"
                onClick={() => {
                  // If parent provided an onRowClick we call it and do not open the detail card
                  if (onRowClick) return onRowClick(item);

                  // Preserve existing adminForm shortcut behavior
                  if (detailView === 'adminForm' && onUpdateItem) {
                    return onUpdateItem(item);
                  }

                  setSelectedItem(item);
                }}
              >
                <TableCell className="tableCell clickable">{item.Items_id}</TableCell>
                <TableCell className="tableCell clickable">{item.BranchName || item.BranchID}</TableCell>
                <TableCell className="tableCell clickable">{item.LoanAgreementNumber}</TableCell>
                <TableCell className="tableCell clickable">{item.ItemSerialNumber}</TableCell>
                <TableCell className="tableCell clickable">{item.BatchargeSerialNumber}</TableCell>
                <TableCell className="tableCell clickable">{item.Classification}</TableCell>
                <TableCell className="tableCell clickable">
                  <span className={`status ${item.ItemStatus}`}>
                    {item.ItemStatus}
                  </span>
                </TableCell>
                <TableCell className="tableCell clickable">{item.Brand}</TableCell>
                <TableCell className="tableCell clickable">{item.Model}</TableCell>
                <TableCell className="tableCell clickable">{item.Processor}</TableCell>
                <TableCell className="tableCell clickable">{item.WifiAddress}</TableCell>
                <TableCell className="tableCell clickable">{item.Amount ? `₱${item.Amount}` : 'N/A'}</TableCell>
                <TableCell className="tableCell clickable">{item.InterestRate ? `${item.InterestRate}%` : 'N/A'}</TableCell>
                <TableCell className="tableCell clickable">{item.InterestAmount ? `₱${item.InterestAmount}` : 'N/A'}</TableCell>
                <TableCell className="tableCell clickable">{item.LoanDate ? new Date(item.LoanDate).toLocaleString() : 'N/A'}</TableCell>
                <TableCell className="tableCell clickable">{item.DueDate ? new Date(item.DueDate).toLocaleString() : 'N/A'}</TableCell>
                <TableCell className="tableCell clickable">{item.Customer}</TableCell>
                <TableCell className="tableCell clickable">{item.CustomerAddress}</TableCell>
                <TableCell className="tableCell clickable">{item.CustomerContact}</TableCell>
                <TableCell className="tableCell clickable">{item.AccountExecutive}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!onRowClick && <DetailCard />}
    </>
  );
};

export default List;
