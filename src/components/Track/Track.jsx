import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Track.module.css';

function Track({ track, onAdd, onRemove, isInPlaylist, currentlyPlaying, onPlayPreview }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const animRef = useRef(null);

  // Stop this track if another track starts playing
  useEffect(() => {
    if (currentlyPlaying && currentlyPlaying !== track.id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setProgress(0);
      cancelAnimationFrame(animRef.current);
    }
  }, [currentlyPlaying, track.id, isPlaying]);

  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
      animRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  function handleAction() {
    if (isInPlaylist) {
      onRemove(track);
    } else {
      onAdd(track);
    }
  }

  function togglePreview() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animRef.current);
    } else {
      if (onPlayPreview) onPlayPreview(track.id);
      audio.play();
      setIsPlaying(true);
      animRef.current = requestAnimationFrame(updateProgress);
    }
  }

  function handleEnded() {
    setIsPlaying(false);
    setProgress(0);
    cancelAnimationFrame(animRef.current);
  }

  return (
    <div className={styles.track}>
      <div className={styles.thumbnail}>
        {track.image ? (
          <img src={track.image} alt={track.album} className={styles.albumArt} />
        ) : (
          <div className={styles.albumPlaceholder}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
            </svg>
          </div>
        )}
      </div>
      <div className={styles.trackInfo}>
        <h3 className={styles.trackName}>{track.name}</h3>
        <p className={styles.trackDetails}>
          {track.artist} &bull; {track.album}
        </p>
        {isPlaying && (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {track.previewUrl ? (
          <>
            <audio
              ref={audioRef}
              src={track.previewUrl}
              onEnded={handleEnded}
            />
            <button
              className={`${styles.previewButton} ${isPlaying ? styles.playing : ''}`}
              onClick={togglePreview}
              title={isPlaying ? 'Pause preview' : 'Play 30s preview'}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
          </>
        ) : (
          <a
            className={styles.spotifyLink}
            href={`https://open.spotify.com/track/${track.uri.split(':').pop()}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Listen on Spotify"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </a>
        )}

        <button
          className={`${styles.trackAction} ${isInPlaylist ? styles.remove : styles.add}`}
          onClick={handleAction}
          title={isInPlaylist ? 'Remove from playlist' : 'Add to playlist'}
        >
          {isInPlaylist ? '−' : '+'}
        </button>
      </div>
    </div>
  );
}

export default Track;
