import Tracklist from '../Tracklist/Tracklist';
import styles from './SearchResults.module.css';

function SearchResults({ searchResults, onAdd, onRemove, playlistTracks }) {
  const playlistIds = new Set((playlistTracks || []).map((t) => t.id));
  const filteredResults = searchResults.filter((t) => !playlistIds.has(t.id));

  return (
    <div className={styles.searchResults}>
      <h2 className={styles.heading}>Results</h2>
      <Tracklist
        tracks={filteredResults}
        onAdd={onAdd}
        onRemove={onRemove}
        playlistTracks={playlistTracks}
      />
    </div>
  );
}

export default SearchResults;
