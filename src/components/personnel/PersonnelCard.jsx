import React from 'react';
import './personnel.scss';

// status: 'standby' | 'assigned'
const statusLabel = {
  standby: 'Standby',
  assigned: 'Assigned',
};

const PersonnelCard = ({ name, photoUrl, status = 'standby', role = 'Logistics Personnel', href, target = '_blank', rel = 'noreferrer noopener', onClick }) => {
  const normalized = (status || 'standby').toLowerCase();
  const label = statusLabel[normalized] || status;

  const content = (
    <div className={`personnel-card status-${normalized}`} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="avatar">
        {photoUrl ? (
          <img src={photoUrl} alt={`${name} avatar`} onError={(e)=>{e.currentTarget.style.display='none';}} />
        ) : (
          <div className="avatar-fallback">{name?.[0]?.toUpperCase() || '?'}</div>
        )}
      </div>
      <div className="info">
        <div className="name" title={name}>{name}</div>
        <div className="role" title={role}>{role}</div>
      </div>
      <div className={`status-badge ${normalized}`}>{label}</div>
    </div>
  );

  if (href) {
    return (
      <a className="personnel-card-link" href={href} target={target} rel={rel} onClick={onClick}>
        {content}
      </a>
    );
  }

  return content;
};

export default PersonnelCard;
