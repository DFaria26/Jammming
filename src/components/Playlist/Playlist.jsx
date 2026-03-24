import { useState, useRef, useCallback } from 'react';
import Track from '../Track/Track';
import styles from './Playlist.module.css';

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours} hr ${minutes} min`;
  return `${minutes} min ${seconds} sec`;
}

function Playlist({ playlistName, playlistTracks, onNameChange, onRemove, onSave, onReorder, isSaving }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const dragNodeRef = useRef(null);

  const handlePlayPreview = useCallback((trackId) => {
    setCurrentlyPlaying(trackId);
  }, []);

  function handleDragStart(e, index) {
    setDragIndex(index);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    // Use a timeout so the dragging class applies after the drag image is captured
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.classList.add(styles.dragging);
      }
    }, 0);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex === null || index === dragIndex) {
      setDropIndex(null);
      return;
    }
    setDropIndex(index);
  }

  function handleDragEnd() {
    if (dragNodeRef.current) {
      dragNodeRef.current.classList.remove(styles.dragging);
    }
    setDragIndex(null);
    setDropIndex(null);
    dragNodeRef.current = null;
  }

  function handleDrop(e, index) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      handleDragEnd();
      return;
    }
    const newTracks = [...playlistTracks];
    const [draggedTrack] = newTracks.splice(dragIndex, 1);
    newTracks.splice(index, 0, draggedTrack);
    onReorder(newTracks);
    handleDragEnd();
  }

  return (
    <div className={styles.playlist} role="region" aria-label="Your playlist">
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
        aria-label="Playlist name"
      />
      {playlistTracks.length > 0 && (
        <div className={styles.statsBar}>
          <span className={styles.stat}>
            {playlistTracks.length} {playlistTracks.length === 1 ? 'track' : 'tracks'}
          </span>
          <span className={styles.statDivider}>·</span>
          <span className={styles.stat}>
            {formatDuration(playlistTracks.reduce((sum, t) => sum + (t.duration_ms || 0), 0))}
          </span>
          <span className={styles.statDivider}>·</span>
          <span className={styles.stat}>
            {new Set(playlistTracks.map((t) => t.artist)).size} {new Set(playlistTracks.map((t) => t.artist)).size === 1 ? 'artist' : 'artists'}
          </span>
        </div>
      )}
      <div className={styles.tracklistArea}>
        {playlistTracks.length === 0 ? (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
            <p className={styles.emptyText}>Add tracks to build your playlist</p>
            <p className={styles.emptyHint}>Search for songs and click + to add them</p>
          </div>
        ) : (
          playlistTracks.map((track, index) => (
            <div
              key={track.id}
              className={`${styles.trackDragWrapper}${dropIndex === index && dragIndex !== null && dragIndex !== index ? ` ${styles.dropTarget}` : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              {dropIndex === index && dragIndex !== null && dragIndex > index && (
                <div className={styles.dropIndicator} />
              )}
              <span className={styles.dragHandle} title="Drag to reorder">&#x2801;&#x2801;&#x2801;</span>
              <div className={styles.trackContent}>
                <Track
                  track={track}
                  onRemove={onRemove}
                  isInPlaylist={true}
                  currentlyPlaying={currentlyPlaying}
                  onPlayPreview={handlePlayPreview}
                />
              </div>
              {dropIndex === index && dragIndex !== null && dragIndex < index && (
                <div className={styles.dropIndicator} />
              )}
            </div>
          ))
        )}
      </div>
      <button className={styles.saveButton} onClick={onSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save to Spotify'}
      </button>
    </div>
  );
}

export default Playlist;
