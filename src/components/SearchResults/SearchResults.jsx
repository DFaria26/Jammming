import { useState, useEffect } from 'react';
import Tracklist from '../Tracklist/Tracklist';
import Skeleton from '../Skeleton/Skeleton';
import styles from './SearchResults.module.css';

const PAGE_SIZE = 5;

function SearchResults({ searchResults, onAdd, onRemove, playlistTracks, isSearching, isLoggedIn }) {
  const [page, setPage] = useState(0);

  const playlistIds = new Set((playlistTracks || []).map((t) => t.id));
  const filteredResults = searchResults.filter((t) => !playlistIds.has(t.id));

  const totalPages = Math.ceil(filteredResults.length / PAGE_SIZE);
  const pagedResults = filteredResults.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset to first page when search results change
  useEffect(() => {
    setPage(0);
  }, [searchResults]);

  return (
    <div className={styles.searchResults} role="region" aria-label="Search results">
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>Results</h2>
        {filteredResults.length > 0 && (
          <span className={styles.pageInfo}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredResults.length)} of {filteredResults.length}
          </span>
        )}
      </div>
      {isSearching ? (
        <Skeleton count={5} />
      ) : filteredResults.length === 0 ? (
        <div className={styles.emptyState}>
          <svg className={styles.emptyIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className={styles.emptyText}>
            {isLoggedIn ? 'Search for songs to get started' : 'Sign in to search for tracks'}
          </p>
        </div>
      ) : (
        <>
          <Tracklist
            tracks={pagedResults}
            onAdd={onAdd}
            onRemove={onRemove}
            playlistTracks={playlistTracks}
          />
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                aria-label="Previous page"
              >
                Back
              </button>
              <button
                className={styles.pageButton}
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SearchResults;
