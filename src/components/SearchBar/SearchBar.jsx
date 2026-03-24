import { useState } from 'react';
import styles from './SearchBar.module.css';

function SearchBar({ onSearch, onClear, initialTerm }) {
  const [term, setTerm] = useState(initialTerm || '');

  function handleSearch() {
    if (term.trim()) {
      onSearch(term.trim());
    }
  }

  function handleClear() {
    setTerm('');
    if (onClear) onClear();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  return (
    <div className={styles.searchBar} role="search" aria-label="Search for songs">
      <div className={styles.inputWrapper}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search for a song, artist, or album..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search for a song, artist, or album"
          autoComplete="off"
        />
        {term && (
          <button className={styles.clearButton} onClick={handleClear} title="Clear search" aria-label="Clear search">
            &times;
          </button>
        )}
      </div>
      <button className={styles.searchButton} onClick={handleSearch} aria-label="Search">
        Search
      </button>
    </div>
  );
}

export default SearchBar;
