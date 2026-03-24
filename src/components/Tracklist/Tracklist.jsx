import { useState, useCallback } from 'react';
import Track from '../Track/Track';
import styles from './Tracklist.module.css';

function Tracklist({ tracks, onAdd, onRemove, playlistTracks }) {
  const playlistIds = new Set((playlistTracks || []).map((t) => t.id));
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  const handlePlayPreview = useCallback((trackId) => {
    setCurrentlyPlaying(trackId);
  }, []);

  return (
    <div className={styles.tracklist}>
      {tracks.length === 0 ? (
        <p className={styles.empty}>No tracks to display.</p>
      ) : (
        tracks.map((track, index) => (
          <Track
            key={track.id}
            track={track}
            onAdd={onAdd}
            onRemove={onRemove}
            isInPlaylist={playlistIds.has(track.id)}
            currentlyPlaying={currentlyPlaying}
            onPlayPreview={handlePlayPreview}
            animationDelay={index * 0.05}
          />
        ))
      )}
    </div>
  );
}

export default Tracklist;
