import "./table.scss";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import { getApiBase } from "../../apiBase";

const BranchTable = ({ refreshKey = 0 }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);//
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const { getAuthHeaders } = useAuth();
  const API_BASE = getApiBase();

  // Fetch data from backend using fetch (no axios dependency required)
  useEffect(() => {
    const controller = new AbortController();

    const fetchItems = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE}/api/items`, { signal: controller.signal, credentials: 'include', headers });
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
  // getAuthHeaders and API_BASE are stable, but add to deps to satisfy lint
  }, [refreshKey, getAuthHeaders, API_BASE]);

  if (loading) return <div className="loading">Loading items...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <TableContainer component={Paper} className="table container">
      <Table aria-label="simple table">
        {selected && (
          <div style={{
            position: 'relative',
            margin: 12,
            padding: 16,
            borderRadius: 8,
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
            background: 'linear-gradient(135deg,#fff,#f7fbff)'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <div style={{fontSize:12,color:'#666'}}>Field</div>
                <div style={{fontSize:16,fontWeight:600}}>{selected.fieldLabel}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{border:'none', background:'transparent', cursor:'pointer'}} aria-label="close">
                ×
              </button>
            </div>
            <div style={{marginTop:8,fontSize:13,color:'#444'}}>
              <div style={{fontSize:18,fontWeight:600}}>{String(selected.value ?? '')}</div>
              <div style={{marginTop:8}}><strong>Item:</strong> {selected.item?.ItemSerialNumber || '—'}</div>
              <div><strong>Brand / Model:</strong> {selected.item?.Brand || '—'} / {selected.item?.Model || '—'}</div>
            </div>
          </div>
        )}
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
            <TableCell className="tableCell">Loan Date</TableCell>
            <TableCell className="tableCell">Due Date</TableCell>
            <TableCell className="tableCell">Customer Name</TableCell>
            <TableCell className="tableCell">Customer Address</TableCell>
            <TableCell className="tableCell">Customer Contact Number</TableCell>
            <TableCell className="tableCell">Account Executive</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.Items_id}>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Item ID', value: item.Items_id })} style={{cursor:'pointer'}}>{item.Items_id}</TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Branch', value: item.BranchID })} style={{cursor:'pointer'}}>{item.BranchID}</TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Loan Agreement Number', value: item.LoanAgreementNumber })} style={{cursor:'pointer'}}>{item.LoanAgreementNumber}</TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Serial Number of Item', value: item.ItemSerialNumber })} style={{cursor:'pointer'}}>{item.ItemSerialNumber}</TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Serial Number of Battery/Charger', value: item.BatchargeSerialNumber })} style={{cursor:'pointer'}}>{item.BatchargeSerialNumber}</TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Classification', value: item.Classification })} style={{cursor:'pointer'}}>{item.Classification}</TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Item Status', value: item.ItemStatus })} style={{cursor:'pointer'}}>
                <span className={`status ${item.ItemStatus}`}>
                  {item.ItemStatus}
                </span>
              </TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Brand', value: item.Brand })} style={{cursor:'pointer'}}>{item.Brand}</TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Model', value: item.Model })} style={{cursor:'pointer'}}>{item.Model}</TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Processor/Megapixel/Optical Zoom', value: item.ProcessorSpecs })} style={{cursor:'pointer'}}>{item.ProcessorSpecs}</TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Wifi Address', value: item.WifiAddress })} style={{cursor:'pointer'}}>{item.WifiAddress}</TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Loan Date', value: item.LoanDate })} style={{cursor:'pointer'}}>
                {item.LoanDate ? new Date(item.LoanDate).toLocaleString() : 'N/A'}
              </TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Due Date', value: item.DueDate })} style={{cursor:'pointer'}}>
                {item.DueDate ? new Date(item.DueDate).toLocaleString() : 'N/A'}
              </TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Customer Name', value: item.Customer })} style={{cursor:'pointer'}}>{item.Customer}</TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Customer Address', value: item.CustomerAddress })} style={{cursor:'pointer'}}>{item.CustomerAddress}</TableCell>
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Customer Contact Number', value: item.CustomerContact })} style={{cursor:'pointer'}}>{item.CustomerContact}</TableCell>
          
              <TableCell className="tableCell" onClick={() => setSelected({ item, fieldLabel: 'Account Executive', value: item.AccountExecutive })} style={{cursor:'pointer'}}>{item.AccountExecutive}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BranchTable;