import React, { useMemo, useState } from 'react';
import Sidebar from "../sidebar/sidebar";
import "./home.scss";
import { useAuth } from "../../context/authContext";
import { getApiBase } from "../../apiBase";

const API_BASE = getApiBase();

const initialForm = {
  BranchID: "",
  Branch: "",
  LoanAgreementNumber: "",
  ItemSerialNumber: "",
  BatchargeSerialNumber: "",
  Classification: "",
  ItemStatus: "VAULT",
  Brand: "",
  Model: "",
  Processor: "",
  WifiAddress: "",
  LoanDate: "",
  DueDate: "",
  Amount: "",
  InterestRate: "1.00",
  InterestAmount: "",
  Customer: "",
  CustomerAddress: "",
  CustomerContact: "",
  AccountExecutive: "",
};

export default function Loan() {
  const { user, branchStatus, getAuthHeaders } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const approved = branchStatus && branchStatus.status === 'approved';

  // Prefill branch and AE on first render when approved
  useMemo(() => {
    if (approved) {
      // build local current datetime (for datetime-local input)
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      setForm((prev) => ({
        ...prev,
        BranchID: branchStatus.branchId || prev.BranchID,
        Branch: branchStatus.branchName || prev.Branch, // show branch name in form
        AccountExecutive: user?.username || prev.AccountExecutive,
        LoanDate: prev.LoanDate || todayStr,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approved, branchStatus?.branchId, branchStatus?.branchName, user?.username]);

  // format helpers
  const pad2 = (n) => String(n).padStart(2, '0');
  // For inputs of type="datetime-local" (no seconds)
  const fmtLocal = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  // For DB payload (with seconds, space separator)
  const fmtDb = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

  const CLASSIFICATION_DAYS = {
    'High - End': 15,
    'Non - High end': 15,
    'Android Wear': 15,
    'Apple Watch': 15,
    'Digicam': 15,
    'DSLR': 15,
    'Ipod': 15,
    'Laptop': 15,
    'LED/LCD TV': 15,
    'Low End': 15,
    'Low - End No WiFi': 15,
    'Phone': 15,
    'PSP': 15,
    'Tablet': 15,
    'Videocam': 15,
  };

  const computeDue = (loanDateStr, classification) => {
    if (!loanDateStr || !classification) return "";
    const days = CLASSIFICATION_DAYS[classification] || 0;
    if (!days) return "";
    const d = new Date(loanDateStr);
    d.setDate(d.getDate() + days);
    return fmtLocal(d);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => {
      const next = { ...s, [name]: value };
      // auto-calc DueDate when Classification changes
      if (name === 'Classification') {
        next.DueDate = computeDue(next.LoanDate, value);
      }
      // auto-calc InterestAmount when Amount or InterestRate changes
      if (name === 'Amount' || name === 'InterestRate') {
        const amt = parseFloat(name === 'Amount' ? value : next.Amount) || 0;
        const rate = parseFloat(name === 'InterestRate' ? value : next.InterestRate) || 0;
        const interest = (amt * (rate / 100));
        next.InterestAmount = amt > 0 ? interest.toFixed(2) : "";
      }
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
      // Build payloads for both tables
      const itemsInventory = {
        ...form,
        BranchID: form.BranchID ? parseInt(form.BranchID, 10) : null,
        ItemStatus: 'VAULT',
        // Items inventory can store datetime (keep time component)
        LoanDate: form.LoanDate ? fmtDb(new Date(form.LoanDate)) : null,
        DueDate: form.DueDate ? fmtDb(new Date(form.DueDate)) : null,
        Amount: form.Amount ? parseFloat(form.Amount) : null,
        InterestRate: form.InterestRate ? parseFloat(form.InterestRate) : null,
        InterestAmount: form.InterestAmount ? parseFloat(form.InterestAmount) : null,
      };

      // Helper to format date-only (YYYY-MM-DD) for tbl_loan DATE columns
      const toDateOnly = (s) => {
        if (!s) return null;
        const d = new Date(s);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      };

      const loan = {
        BranchID: itemsInventory.BranchID,
        CustomerName: form.Customer || null,
        CustomerContact: form.CustomerContact || null,
        Brand: form.Brand || null,
        Model: form.Model || null,
        ItemSerialNumber: form.ItemSerialNumber || null,
        LoanAmount: form.Amount ? parseFloat(form.Amount) : null,
        LoanDate: toDateOnly(form.LoanDate),
        DueDate: toDateOnly(form.DueDate),
        ExtensionDueDate: null,
        Status: 'ACTIVE'
      };

      const res = await fetch(`${API_BASE}/api/loan/create-with-inventory`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ itemsInventory, loan }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
  const result = await res.json().catch(() => ({}));
  const invId = result.itemsInventoryId || '';
  const loanId = result.loanId || '';
  const capitalInfo = result.capitalRecord ? ` Capital updated: ₱${Number(result.capitalRecord.Current_Capital).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.` : '';
  setSuccess(`Loan created successfully. ${invId ? 'Item ID: ' + invId + '. ' : ''}${loanId ? 'Loan ID: ' + loanId + '. ' : ''}${capitalInfo}`.trim());
      setForm((s) => ({ ...initialForm, BranchID: s.BranchID, Branch: s.Branch, AccountExecutive: s.AccountExecutive }));
    } catch (err) {
      console.error('Save loan failed:', err);
      setError(err.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setError("");
    setSuccess("");
    const d = new Date();
    const nowStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    setForm((s) => {
      const base = {
        ...initialForm,
        BranchID: s.BranchID || "",
        Branch: s.Branch || "",
        AccountExecutive: s.AccountExecutive || "",
        LoanDate: nowStr,
      };
      base.DueDate = computeDue(base.LoanDate, base.Classification);
      return base;
    });
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboardContainer">
        <div className="branchBanner">
          <span>
            {approved ? `Active branch: ${branchStatus.branchName || branchStatus.branchId}` : 'Awaiting branch approval'}
          </span>
        </div>

        <div className="card" style={{ color: 'white', padding: 24, marginTop: 16 }}>
          <h2 style={{ color: '#334155', marginBottom: 16 }}>Loan Form</h2>
          {!approved && (
            <div style={{ color: '#b00020', background: '#ffebee', padding: 12, borderRadius: 4, marginBottom: 16 }}>
              You need an approved branch session before adding items.
            </div>
          )}
          {error && (
            <div style={{ color: '#b00020', background: '#ffebee', padding: 12, borderRadius: 4, marginBottom: 16 }}>{error}</div>
          )}
          {success && (
            <div style={{ color: '#1b5e20', background: '#e8f5e9', padding: 12, borderRadius: 4, marginBottom: 16 }}>{success}</div>
          )}
          <form onSubmit={onSubmit} className="modal-body">
            <div className="input-grid">
              <label>
                Branch Name
                <input
                  name="Branch"
                  value={form.Branch || branchStatus?.branchName || ''}
                  readOnly
                  disabled
                />
              </label>
              <label>
                Loan Agreement Number
                <input name="LoanAgreementNumber" value={form.LoanAgreementNumber} onChange={onChange} />
              </label>
              <label>
                Serial #
                <input name="ItemSerialNumber" value={form.ItemSerialNumber} onChange={onChange} required />
              </label>
              <label>
                Serial Battery
                <input name="BatchargeSerialNumber" value={form.BatchargeSerialNumber} onChange={onChange} required />
              </label>
              <label>
                Classification
                <select
                  name="Classification"
                  value={form.Classification}
                  onChange={onChange}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: 4, border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' }}
                >
                  <option value="">Select Classification</option>
                  <option value="High - End">High - End</option>
                  <option value="Non - High end">Non - High end</option>
                  <option value="Android Wear">Android Wear</option>
                  <option value="Apple Watch">Apple Watch</option>
                  <option value="Digicam">Digicam</option>
                  <option value="DSLR">DSLR</option>
                  <option value="Ipod">Ipod</option>
                  <option value="Laptop">Laptop</option>
                  <option value="LED/LCD TV">LED/LCD TV</option>
                  <option value="Low End">Low End</option>
                  <option value="Low - End No WiFi">Low - End No WiFi</option>
                  <option value="Phone">Phone</option>
                  <option value="PSP">PSP</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Videocam">Videocam</option>
                </select>
              </label>
              {/* Status is fixed to VAULT and not editable */}
            
              <label>
                Amount
                <input
                  name="Amount"
                  type="number"
                  step="0.01"
                  value={form.Amount}
                  onChange={onChange}
                  required
                />
              </label>
              <label>
                Interest Rate (%)
                <input
                  name="InterestRate"
                  type="number"
                  step="0.01"
                  value={form.InterestRate}
                  readOnly
                  disabled
                />
              </label>
              <label>
                Interest Amount
                <input
                  name="InterestAmount"
                  type="number"
                  step="0.01"
                  value={form.InterestAmount}
                  readOnly
                  disabled
                />
              </label>
              <label>
                Brand
                <select
                  name="Brand"
                  value={form.Brand}
                  onChange={onChange}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: 4, border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' }}
                >
                  <option value="">Select Brand</option>
                  <option value="Acer">Acer</option>
                  <option value="Alcatel">Alcatel</option>
                  <option value="Alienware">Alienware</option>
                  <option value="Apple">Apple</option>
                  <option value="Asus">Asus</option>
                  <option value="Blackberry">Blackberry</option>
                  <option value="Canon">Canon</option>
                  <option value="Casio">Casio</option>
                  <option value="Compaq">Compaq</option>
                  <option value="Dell">Dell</option>
                  <option value="GoPro">GoPro</option>
                  <option value="Honor">Honor</option>
                  <option value="HP">HP</option>
                  <option value="HTC">HTC</option>
                  <option value="Huawei">Huawei</option>
                  <option value="JVC">JVC</option>
                  <option value="Lenovo">Lenovo</option>
                  <option value="LG">LG</option>
                  <option value="Microsoft">Microsoft</option>
                  <option value="Microsoft Nokia">Microsoft Nokia</option>
                  <option value="Motorola">Motorola</option>
                  <option value="MSI">MSI</option>
                  <option value="Myphone">Myphone</option>
                  <option value="Neo">Neo</option>
                  <option value="Nikon">Nikon</option>
                  <option value="Nokia">Nokia</option>
                  <option value="Olympus">Olympus</option>
                  <option value="Oppo">Oppo</option>
                  <option value="Panasonic">Panasonic</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Sharp">Sharp</option>
                  <option value="Sony">Sony</option>
                  <option value="Sony Erickson">Sony Erickson</option>
                  <option value="Toshiba">Toshiba</option>
                  <option value="Vivo">Vivo</option>
                  <option value="Xiaomi">Xiaomi</option>
                </select>
              </label>
              <label>
                Model
                <input name="Model" value={form.Model} onChange={onChange} required />
              </label>
              <label>
                Processor
                <input name="Processor" value={form.Processor} onChange={onChange} required />
              </label>
              <label>
                Wifi Address
                <input name="WifiAddress" value={form.WifiAddress} onChange={onChange} required />
              </label>
              <label>
                Loan Date
                <input type="datetime-local" name="LoanDate" value={form.LoanDate} readOnly disabled />
              </label>
              <label>
                Due Date
                <input type="datetime-local" name="DueDate" value={form.DueDate} readOnly disabled />
              </label>
              <label>
                Customer
                <input name="Customer" value={form.Customer} onChange={onChange} required />
              </label>
              <label>
                Customer Address
                <input name="CustomerAddress" value={form.CustomerAddress} onChange={onChange} required />
              </label>
              <label>
                Customer Contact
                <input name="CustomerContact" value={form.CustomerContact} onChange={onChange} required />
              </label>
              <label>
                Account Executive
                <input name="AccountExecutive" value={form.AccountExecutive} onChange={onChange} readOnly disabled />
              </label>
            </div>

            <div className="modal-footer" style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button className="btn" type="button" onClick={handleReset}>Reset</button>
              <button className="btn primary" type="submit" disabled={submitting || !approved}>
                {submitting ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
