import React from 'react';

// Reusable detail card / form style popup for an assignment
// Uses existing .detail-overlay / .detail-card styles from table.scss
const AssignmentDetailCard = ({ assignment, onClose, apiBase, formatDate }) => {
  if (!assignment) return null;

  const a = assignment;
  const fmt = (v) => formatDate ? formatDate(v) : (v ? new Date(v).toLocaleString() : '—');

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-card" onClick={(e) => e.stopPropagation()}>
        <div className="detail-card__header">
          <div className="detail-card__title">
            <div className="detail-card__item-id">Assignment #{a.assignment_id}</div>
            <div className="detail-card__item-desc">{a.assignment_type || '—'} {a.status ? `· ${a.status}` : ''}</div>
          </div>
          <button type="button" className="detail-card__close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="detail-card__sections">
          <div className="detail-section">
            <div className="detail-section__title">Core Info</div>
            <div className="detail-section__grid">
              <div className="detail-field">
                <label className="detail-field__label">Assigned To</label>
                <div className="detail-field__value">{a.assigned_to_name ?? a.assigned_to ?? '—'}</div>
              </div>
              <div className="detail-field">
                <label className="detail-field__label">Assigned By</label>
                <div className="detail-field__value">{a.assigned_by_name ?? a.assigned_by ?? '—'}</div>
              </div>
              <div className="detail-field">
                <label className="detail-field__label">From Branch</label>
                <div className="detail-field__value">{a.from_branch_name ?? a.from_branch_id ?? '—'}</div>
              </div>
              <div className="detail-field">
                <label className="detail-field__label">To Branch</label>
                <div className="detail-field__value">{a.to_branch_name ?? a.to_branch_id ?? '—'}</div>
              </div>
              <div className="detail-field">
                <label className="detail-field__label">Amount</label>
                <div className="detail-field__value">{a.amount != null ? Number(a.amount).toFixed(2) : '—'}</div>
              </div>
              <div className="detail-field">
                <label className="detail-field__label">Capital / Balance</label>
                <div className="detail-field__value">{a.capital_or_balance ?? '—'}</div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section__title">Status & Timing</div>
            <div className="detail-section__grid">
              <div className="detail-field">
                <label className="detail-field__label">Created At</label>
                <div className="detail-field__value">{fmt(a.created_at)}</div>
              </div>
              <div className="detail-field">
                <label className="detail-field__label">Updated At</label>
                <div className="detail-field__value">{fmt(a.updated_at)}</div>
              </div>
              <div className="detail-field">
                <label className="detail-field__label">Pickup Verified</label>
                <div className="detail-field__value">{fmt(a.pickup_verified_at)}</div>
              </div>
              <div className="detail-field">
                <label className="detail-field__label">Delivered At</label>
                <div className="detail-field__value">{fmt(a.delivered_at)}</div>
              </div>
              <div className="detail-field">
                <label className="detail-field__label">Due Date</label>
                <div className="detail-field__value">{fmt(a.due_date)}</div>
              </div>
            </div>
          </div>

          {(a.notes || a.items) && (
            <div className="detail-section">
              <div className="detail-section__title">Contents</div>
              {a.notes && (
                <div className="detail-field">
                  <label className="detail-field__label">Notes</label>
                  <div className="detail-field__value" style={{ whiteSpace: 'pre-wrap' }}>{String(a.notes)}</div>
                </div>
              )}
              {Array.isArray(a.items) && a.items.length > 0 && (
                <div className="detail-field">
                  <label className="detail-field__label">Items</label>
                  <ul className="detail-field__value" style={{ listStyle: 'disc', paddingLeft: '18px', margin: 0 }}>
                    {a.items.map((it, idx) => (
                      <li key={idx}>{it.item_id || it.id || 'Item'} {it.name ? `- ${it.name}` : ''} {it.quantity ? `(x${it.quantity})` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="detail-section">
            <div className="detail-section__title">Images</div>
            <div className="detail-section__grid">
              <div className="detail-field">
                <label className="detail-field__label">Pickup Image</label>
                {a.item_image ? (
                  <img
                    src={`${apiBase}/uploads/${a.item_image}`}
                    alt={`Pickup for assignment ${a.assignment_id}`}
                    style={{ maxWidth: '100%', borderRadius: '8px' }}
                  />
                ) : <div className="detail-field__value">No pickup image</div>}
              </div>
              <div className="detail-field">
                <label className="detail-field__label">Dropoff Image</label>
                {a.dropoff_image ? (
                  <img
                    src={`${apiBase}/uploads/${a.dropoff_image}`}
                    alt={`Dropoff for assignment ${a.assignment_id}`}
                    style={{ maxWidth: '100%', borderRadius: '8px' }}
                  />
                ) : <div className="detail-field__value">No dropoff image</div>}
              </div>
            </div>
          </div>

        </div>
        <div className="detail-card__footer">
          <button type="button" className="detail-card__update-btn footer" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailCard;
