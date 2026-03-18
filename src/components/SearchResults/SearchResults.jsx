import Tracklist from '../Tracklist/Tracklist';
import styles from './SearchResults.module.css';

function SearchResults({ searchResults, onAdd, playlistTracks }) {
  return (
    <div className={styles.searchResults}>
      <h2 className={styles.heading}>Results</h2>
      <Tracklist
        tracks={searchResults}
        onAdd={onAdd}
        playlistTracks={playlistTracks}
      />
    </div>
  );
}

export default SearchResults;
