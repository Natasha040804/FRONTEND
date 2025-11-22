import React from 'react';
import './card.css';

export default function ApprovalCard({ request = {}, onApprove, onDeny, busyId }) {
  const id = request?.id ?? request?.Id ?? request?.requestId ?? request?.RequestId;
  
  // FIXED: Added username extraction with proper fallbacks
  const username = request?.username || request?.Username;
  const accountName = request?.accountName || request?.AccountName;
  const fullname = request?.fullname || request?.Fullname;
  
  // Create display title with username as priority
  const title = username || accountName || fullname || (id ? `User #${id}` : 'Pending Request');
  
  const branchLabel =
    request?.BranchName ||
    request?.branchName ||
    request?.branch ||
    (request?.branchId ? `Branch #${request.branchId}` : '');
  
  const isBusy = busyId === id;

  return (
    <div className="card purple">
      <div className="headline">Request Access</div>
      <div className="name">{title}</div>
      {username && (
        <div style={{ 
          fontSize: '14px', 
          color: '#666', 
          marginBottom: '8px',
          fontStyle: 'italic'
        }}>
          Username: {username}
        </div>
      )}
      {branchLabel ? <div className="branchBig">{branchLabel}</div> : null}

      <div className="actions actionsCentered">
        <button
          type="button"
          className="btn approve"
          onClick={() => onApprove?.(id)}
          disabled={!id || isBusy}
          aria-busy={isBusy ? 'true' : 'false'}
        >
          {isBusy ? 'Processing…' : 'Approve'}
        </button>
        <button
          type="button"
          className="btn deny"
          onClick={() => onDeny?.(id)}
          disabled={!id || isBusy}
        >
          Deny
        </button>
      </div>
    </div>
  );
}
