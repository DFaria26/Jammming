import Tracklist from '../Tracklist/Tracklist';
import styles from './Playlist.module.css';

function Playlist({ playlistName, playlistTracks, onNameChange, onRemove, onSave }) {
  return (
    <div className={styles.playlist}>
      <input
        className={styles.playlistName}
        type="text"
        value={playlistName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Playlist Name"
      />
      <Tracklist
        tracks={playlistTracks}
        onRemove={onRemove}
        playlistTracks={playlistTracks}
      />
      <button className={styles.saveButton} onClick={onSave}>
        Save to Spotify
      </button>
    </div>
  );
}

export default Playlist;
