import styles from './Track.module.css';

function Track({ track, onAdd, onRemove, isInPlaylist }) {
  function handleAction() {
    if (isInPlaylist) {
      onRemove(track);
    } else {
      onAdd(track);
    }
  }

  return (
    <div className={styles.track}>
      <div className={styles.trackInfo}>
        <h3 className={styles.trackName}>{track.name}</h3>
        <p className={styles.trackDetails}>
          {track.artist} &bull; {track.album}
        </p>
      </div>
      <button
        className={`${styles.trackAction} ${isInPlaylist ? styles.remove : styles.add}`}
        onClick={handleAction}
        title={isInPlaylist ? 'Remove from playlist' : 'Add to playlist'}
      >
        {isInPlaylist ? '−' : '+'}
      </button>
    </div>
  );
}

export default Track;
