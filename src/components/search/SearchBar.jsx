import React, { useState, useEffect, useRef } from 'react';
import './searchbar.scss';

// Reusable debounced search bar
// Props: value, onChange(term), placeholder, delay
const SearchBar = ({ value = '', onChange, placeholder = 'Search...', delay = 300 }) => {
  const [internal, setInternal] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => { setInternal(value); }, [value]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (onChange) onChange(internal.trim());
    }, delay);
    return () => timerRef.current && clearTimeout(timerRef.current);
  }, [internal, onChange, delay]);

  return (
    <div className="searchBar">
      <div className="searchIcon" aria-hidden>🔍</div>
      <input
        type="text"
        className="searchInput"
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {internal && (
        <button
          type="button"
          className="clearBtn"
          onClick={() => setInternal('')}
          aria-label="Clear search"
        >✕</button>
      )}
    </div>
  );
};

export default SearchBar;
