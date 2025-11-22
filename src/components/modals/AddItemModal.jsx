import React, { useState } from "react";
import '../../components/sidebar/navbar.scss';

const initialForm = {
  Branch: "",
  ItemSerialNumber: "",
  BatchargeSerialNumber: "",
  Classification: "",
  ItemStatus: "",
  ModelNumber: "",
  Brand: "",
  Model: "",
  Processor: "",
  WifiAddress: "",
  LoanDate: "",
  DueDate: "",
  Customer: "",
  CustomerAddress: "",
  CustomerContact: "",
  LastPawnBranch: "",
  LastPawnAmount: "",
  LastPawnDate: "",
  ClaimSoldDate: "",
  AccountExecutive: "",
};

const AddItemModal = ({ open = true, onClose = () => {}, onAdded = () => {} }) => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server ${res.status}: ${txt}`);
      }
      const created = await res.json();
      onAdded(created);
      onClose();
    } catch (err) {
      console.error("Add item failed:", err);
      setError("Failed to add item. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h3>Add Inventory Item</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="input-grid">
            <label>
              Branch
              <input name="Branch" value={form.Branch} onChange={onChange} />
            </label>
            <label>
              Serial #
              <input name="ItemSerialNumber" value={form.ItemSerialNumber} onChange={onChange} />
            </label>
            <label>
              Serial Battery
              <input name="BatchargeSerialNumber" value={form.BatchargeSerialNumber} onChange={onChange} />
            </label>
            <label>
              Classification
              <input name="Classification" value={form.Classification} onChange={onChange} />
            </label>
            <label>
              Status
              <input name="ItemStatus" value={form.ItemStatus} onChange={onChange} />
            </label>
            <label>
              Model #
              <input name="ModelNumber" value={form.ModelNumber} onChange={onChange} />
            </label>
            <label>
              Brand
              <input name="Brand" value={form.Brand} onChange={onChange} />
            </label>
            <label>
              Model
              <input name="Model" value={form.Model} onChange={onChange} />
            </label>
            <label>
              Processor
              <input name="Processor" value={form.Processor} onChange={onChange} />
            </label>
            <label>
              Wifi Address
              <input name="WifiAddress" value={form.WifiAddress} onChange={onChange} />
            </label>
            <label>
              Loan Date
              <input type="date" name="LoanDate" value={form.LoanDate} onChange={onChange} />
            </label>
            <label>
              Due Date
              <input type="date" name="DueDate" value={form.DueDate} onChange={onChange} />
            </label>
            <label>
              Customer
              <input name="Customer" value={form.Customer} onChange={onChange} />
            </label>
            <label>
              Customer Address
              <input name="CustomerAddress" value={form.CustomerAddress} onChange={onChange} />
            </label>
            <label>
              Customer Contact
              <input name="CustomerContact" value={form.CustomerContact} onChange={onChange} />
            </label>
            <label>
              Last Pawn Branch
              <input name="LastPawnBranch" value={form.LastPawnBranch} onChange={onChange} />
            </label>
            <label>
              Last Pawn Amount
              <input name="LastPawnAmount" value={form.LastPawnAmount} onChange={onChange} />
            </label>
            <label>
              Last Pawn Date
              <input type="date" name="LastPawnDate" value={form.LastPawnDate} onChange={onChange} />
            </label>
            <label>
              Claim/Sold Date
              <input type="date" name="ClaimSoldDate" value={form.ClaimSoldDate} onChange={onChange} />
            </label>
            <label>
              Account Executive
              <input name="AccountExecutive" value={form.AccountExecutive} onChange={onChange} />
            </label>
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;

