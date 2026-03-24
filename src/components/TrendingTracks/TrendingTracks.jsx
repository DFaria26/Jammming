import { useState, useEffect, useCallback } from 'react';
import { Spotify } from '../../spotify/spotify';
import Track from '../Track/Track';
import Skeleton from '../Skeleton/Skeleton';
import styles from './TrendingTracks.module.css';

function TrendingTracks({ isLoggedIn, onAdd, playlistTracks }) {
  const [tracks, setTracks] = useState([]);
  const [countryName, setCountryName] = useState('the UK');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  const handlePlayPreview = useCallback((trackId) => {
    setCurrentlyPlaying(trackId);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setTracks([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Spotify.getTrendingTracks(10)
      .then((result) => {
        if (!cancelled) {
          setTracks(result.tracks);
          setCountryName(result.countryName);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Trending tracks error:', err);
          setError('Could not load trending tracks.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  const playlistIds = new Set((playlistTracks || []).map((t) => t.id));

  return (
    <div className={styles.trending} role="region" aria-label="Trending in the UK">
      <div className={styles.header}>
        <svg className={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
        <h2 className={styles.title}>Trending in {countryName}</h2>
      </div>
      <p className={styles.subtitle}>Top 10 tracks this week</p>

      {isLoading && <Skeleton count={5} />}

      {error && <p className={styles.error}>{error}</p>}

      {!isLoading && !error && tracks.length > 0 && (
        <div className={styles.trackList}>
          {tracks.map((track, index) => (
            <div key={track.id} className={styles.rankedTrack}>
              <span className={styles.rank}>{index + 1}</span>
              <div className={styles.trackContent}>
                <Track
                  track={track}
                  onAdd={onAdd}
                  isInPlaylist={playlistIds.has(track.id)}
                  currentlyPlaying={currentlyPlaying}
                  onPlayPreview={handlePlayPreview}
                  animationDelay={index * 0.05}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TrendingTracks;
