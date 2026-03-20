import { useState } from 'react';
import styles from './SearchBar.module.css';

function SearchBar({ onSearch, initialTerm }) {
  const [term, setTerm] = useState(initialTerm || '');

  function handleSearch() {
    if (term.trim()) {
      onSearch(term.trim());
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  return (
    <div className={styles.searchBar}>
      <input
        className={styles.searchInput}
        type="text"
        placeholder="Search for a song, artist, or album..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button className={styles.searchButton} onClick={handleSearch}>
        Search
      </button>
    </div>
  );
}

export default SearchBar;
