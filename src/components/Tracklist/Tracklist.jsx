import Track from '../Track/Track';
import styles from './Tracklist.module.css';

function Tracklist({ tracks, onAdd, onRemove, playlistTracks }) {
  const playlistIds = new Set((playlistTracks || []).map((t) => t.id));

  return (
    <div className={styles.tracklist}>
      {tracks.length === 0 ? (
        <p className={styles.empty}>No tracks to display.</p>
      ) : (
        tracks.map((track) => (
          <Track
            key={track.id}
            track={track}
            onAdd={onAdd}
            onRemove={onRemove}
            isInPlaylist={playlistIds.has(track.id)}
          />
        ))
      )}
    </div>
  );
}

export default Tracklist;
