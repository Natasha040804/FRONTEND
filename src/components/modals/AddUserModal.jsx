import React, { useState } from 'react';
import '../../components/sidebar/navbar.scss';
import { getApiBase } from '../../apiBase';
import { useAuth } from '../../context/authContext';

const initial = {
  username: '',
  password: '',
  fullName: '',
  email: '',
  role: '',
  contact: '',
  employeeId: '',
  address: '',
  // note: image file is kept in separate state (not in this object)
};

const AddUserModal = ({ open = true, onClose = () => {}, onAdded = () => {} }) => {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  // Hooks must be declared before any conditional returns
  const { getAuthHeaders } = useAuth();
  if (!open) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setImageFile(f || null);
    if (f) {
      const url = URL.createObjectURL(f);
      setImagePreview(url);
    } else {
      setImagePreview('');
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // more specific validation message so user sees which fields are missing
    const missing = [];
    if (!form.username || !form.username.trim()) missing.push('Username');
    if (!form.password || !form.password.trim()) missing.push('Password');
    if (!form.role || !form.role.trim()) missing.push('Role');
    if (missing.length) {
      setError(`${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} required`);
      return;
    }
    setLoading(true);
    try {
      const API_BASE = getApiBase();
      if (!API_BASE) {
        setError('API base URL not configured.');
        return;
      }
      let res;
      // If an image is attached, send multipart/form-data
      if (imageFile) {
        const fd = new FormData();
        Object.keys(form).forEach((k) => {
          if (form[k] !== undefined && form[k] !== null) fd.append(k, form[k]);
        });
        fd.append('image', imageFile);
        const headers = await getAuthHeaders(); // auth headers only; browser sets multipart boundary
        res = await fetch(`${API_BASE}/api/users`, {
          method: 'POST',
          body: fd,
          credentials: 'include',
          headers,
        });
      } else {
        const headers = await getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
        res = await fetch(`${API_BASE}/api/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify(form),
          credentials: 'include'
        });
      }
      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server ${res.status}: ${txt.slice(0,200)}`);
      }
      if (ct && !ct.includes('application/json')) {
        const txt = await res.text();
        throw new Error(`Unexpected non-JSON response (content-type: ${ct}) body: ${txt.slice(0,200)}`);
      }
      const created = await res.json();
      onAdded(created);
      onClose();
    } catch (err) {
      console.error('Add user failed', err);
      setError(err.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h3>Add User</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="input-grid">
            <label>
              Username
              <input name="username" value={form.username} onChange={onChange} />
            </label>

            <label>
              Password
              <input name="password" type="password" value={form.password} onChange={onChange} />
            </label>

            <label>
              Full name
              <input name="fullName" value={form.fullName} onChange={onChange} />
            </label>

            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={onChange} />
            </label>

            <label>
              Role
              <select name="role" value={form.role} onChange={onChange}>
                <option value="">Select role</option>
                <option value="AccountExecutive">Account Executive</option>
                <option value="Admin">Admin</option>
                <option value="Auditor">Auditor</option>
                <option value="Logistics">Logistics (Mobile)</option>
              </select>
            </label>
            <label>
              Employee ID
              <input name="employeeId" value={form.employeeId} onChange={onChange} />
            </label>

            <label>
              Contact
              <input name="contact" value={form.contact} onChange={onChange} />
            </label>

            <label>
              Address
              <input name="address" value={form.address} onChange={onChange} />
            </label>

            <label>
              Photo
              <input name="image" type="file" accept="image/*" onChange={onFileChange} />
            </label>
            {imagePreview && (
              <div style={{ marginTop: 8 }}>
                <img src={imagePreview} alt="preview" style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover' }} />
              </div>
            )}
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Adding...' : 'Add User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
