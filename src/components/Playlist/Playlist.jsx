import Tracklist from '../Tracklist/Tracklist';
import styles from './Playlist.module.css';

function Playlist({ playlistName, playlistTracks, onNameChange, onRemove, onSave, isSaving }) {
  return (
    <div className={styles.playlist}>
      {isSaving && (
        <div className={styles.savingOverlay}>
          <div className={styles.spinner} />
          <p className={styles.savingText}>Saving to Spotify...</p>
        </div>
      )}
      <input
        className={styles.playlistName}
        type="text"
        value={playlistName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Playlist Name"
        disabled={isSaving}
      />
      <Tracklist
        tracks={playlistTracks}
        onRemove={onRemove}
        playlistTracks={playlistTracks}
      />
      <button className={styles.saveButton} onClick={onSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save to Spotify'}
      </button>
    </div>
  );
}

export default Playlist;
