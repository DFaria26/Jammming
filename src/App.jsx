import { useState, useEffect, useRef, useCallback } from 'react';
import SearchBar from './components/SearchBar/SearchBar';
import SearchResults from './components/SearchResults/SearchResults';
import Playlist from './components/Playlist/Playlist';
import { Spotify } from './spotify/spotify';
import styles from './App.module.css';

const MOCK_TRACKS = [
  { id: '1', name: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', uri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b', previewUrl: null, image: null },
  { id: '2', name: 'Shape of You', artist: 'Ed Sheeran', album: '÷ (Divide)', uri: 'spotify:track:7qiZfU4dY1lWllzX7mPBI3', previewUrl: null, image: null },
  { id: '3', name: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', uri: 'spotify:track:463CkQjx2Zfoiqh6zDiVKw', previewUrl: null, image: null },
  { id: '4', name: 'Peaches', artist: 'Justin Bieber', album: 'Justice', uri: 'spotify:track:4iJyoBOLtHqaWYs3vyWFGE', previewUrl: null, image: null },
  { id: '5', name: 'Stay', artist: 'The Kid LAROI & Justin Bieber', album: 'F*CK LOVE 3', uri: 'spotify:track:5PjdY0CKGZdEuoNab3yDmX', previewUrl: null, image: null },
];

function getInitialTheme() {
  const saved = localStorage.getItem('jammming_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!Spotify.getAccessToken());
  const [searchResults, setSearchResults] = useState(MOCK_TRACKS);
  const [searchTerm, setSearchTerm] = useState('');
  const [playlistName, setPlaylistName] = useState('My Playlist');
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [waveState, setWaveState] = useState('idle');
  const [fadeOrigin, setFadeOrigin] = useState(0);
  const waveTimer = useRef(null);
  const logoTextRef = useRef(null);

  const findClosestLetter = useCallback((e) => {
    const container = logoTextRef.current;
    if (!container) return 0;
    const letters = container.children;
    const mouseX = e.clientX;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < letters.length; i++) {
      const rect = letters[i].getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const dist = Math.abs(mouseX - center);
      if (dist < minDist) { minDist = dist; closest = i; }
    }
    return closest;
  }, []);

  const handleLogoEnter = useCallback((e) => {
    clearTimeout(waveTimer.current);
    setFadeOrigin(findClosestLetter(e));
    setWaveState('active');
  }, [findClosestLetter]);

  const handleLogoLeave = useCallback((e) => {
    setFadeOrigin(findClosestLetter(e));
    setWaveState('fading');
    waveTimer.current = setTimeout(() => setWaveState('idle'), 1600);
  }, [findClosestLetter]);

  // Auto-logout when the access token expires (preserves playlist)
  useEffect(() => {
    if (!isLoggedIn) return;
    const expiresAt = Spotify.getExpiresAt();
    if (!expiresAt) return;
    const msLeft = expiresAt - Date.now();
    if (msLeft <= 0) {
      handleSessionExpired();
      return;
    }
    const timer = setTimeout(handleSessionExpired, msLeft);
    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  // Apply theme to the document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jammming_theme', theme);
  }, [theme]);

  // On mount: handle the Spotify redirect callback if ?code= is present.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('code')) return;

    Spotify.handleCallback()
      .then((token) => {
        if (!token) return;
        setIsLoggedIn(true);
        const saved = Spotify.getPreRedirectState();
        if (saved) {
          if (saved.searchTerm) setSearchTerm(saved.searchTerm);
          if (saved.playlistName) setPlaylistName(saved.playlistName);
          if (saved.playlistTracks?.length) setPlaylistTracks(saved.playlistTracks);
        }
      })
      .catch((err) => {
        console.error('Auth error:', err);
        setStatusMessage(`Login failed: ${err.message}`);
      });
  }, []);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  function handleLogin() {
    Spotify.savePreRedirectState({
      searchTerm,
      playlistName,
      playlistTracks,
    });
    Spotify.login();
  }

  function handleSessionExpired() {
    Spotify.clearToken();
    setIsLoggedIn(false);
    setSearchResults(MOCK_TRACKS);
    setStatusMessage('Session expired — please log in again.');
  }

  function handleLogout() {
    Spotify.clearToken();
    setIsLoggedIn(false);
    setSearchResults(MOCK_TRACKS);
    setPlaylistTracks([]);
    setPlaylistName('My Playlist');
    setStatusMessage('');
  }

  async function handleSearch(term) {
    setSearchTerm(term);
    if (!isLoggedIn) {
      setStatusMessage('Please log in first to search.');
      return;
    }
    setIsSearching(true);
    setStatusMessage('');
    try {
      const results = await Spotify.search(term);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      if (err.message.includes('Session expired')) {
        handleSessionExpired();
        return;
      }
      setStatusMessage(err.message);
    } finally {
      setIsSearching(false);
    }
  }

  function addTrack(track) {
    if (playlistTracks.find((t) => t.id === track.id)) return;
    setPlaylistTracks((prev) => [...prev, track]);
  }

  function removeTrack(track) {
    setPlaylistTracks((prev) => prev.filter((t) => t.id !== track.id));
  }

  async function savePlaylist() {
    if (!isLoggedIn) {
      setStatusMessage('Please log in first to save a playlist.');
      return;
    }
    if (!playlistName.trim() || playlistTracks.length === 0) {
      setStatusMessage('Add a name and at least one track before saving.');
      return;
    }
    setIsSaving(true);
    setStatusMessage('');
    try {
      const uris = playlistTracks.map((t) => t.uri);
      await Spotify.savePlaylist(playlistName, uris);
      setStatusMessage(`"${playlistName}" saved to Spotify!`);
      setPlaylistName('My Playlist');
      setPlaylistTracks([]);
    } catch (err) {
      console.error(err);
      if (err.message.includes('Session expired')) {
        handleSessionExpired();
        return;
      } else if (err.message === 'MISSING_SCOPES') {
        Spotify.clearToken();
        setIsLoggedIn(false);
        setStatusMessage('Playlist permissions missing — please log in again.');
      } else {
        setStatusMessage(err.message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.logo}>
          <svg className={styles.logoIcon} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#1db954"/>
            <g>
              <rect x="41" y="31" width="4" height="38" rx="2" fill="#fff"/>
              <rect x="63" y="27" width="4" height="38" rx="2" fill="#fff"/>
              <path d="M45 33l18-5v4l-18 5z" fill="#fff"/>
              <ellipse cx="35" cy="67" rx="8" ry="6" fill="#fff"/>
              <ellipse cx="57" cy="63" rx="8" ry="6" fill="#fff"/>
            </g>
          </svg>
          <span
            ref={logoTextRef}
            className={`${styles.logoText} ${waveState === 'active' ? styles.logoWaveActive : ''} ${waveState === 'fading' ? styles.logoWaveFading : ''}`}
            onMouseEnter={handleLogoEnter}
            onMouseLeave={handleLogoLeave}
          >
            {['J','a','m','m','m','i','n','g'].map((ch, i) => (
              <span
                key={i}
                className={`${styles.logoLetter}${i < 2 ? ` ${styles.logoBold}` : ''}`}
                style={{
                  '--d': Math.abs(i - fadeOrigin),
                }}
              >{ch}</span>
            ))}
          </span>
        </h1>
        <div className={styles.headerControls}>
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          {isLoggedIn ? (
            <button className={styles.authButton} onClick={handleLogout}>
              Log Out
            </button>
          ) : (
            <button className={`${styles.authButton} ${styles.authButtonConnect}`} onClick={handleLogin}>
              Log In
            </button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {!isLoggedIn && (
          <div className={styles.loginBanner}>
            <p>Sign in with your Spotify account to search and save playlists.</p>
            <button className={styles.loginBannerButton} onClick={handleLogin}>
              Sign In with Spotify
            </button>
          </div>
        )}

        <section className={styles.searchSection}>
          <SearchBar onSearch={handleSearch} initialTerm={searchTerm} />
          {isSearching && <p className={styles.status}>Searching...</p>}
        </section>

        <section className={styles.columns}>
          <SearchResults
            searchResults={searchResults}
            onAdd={addTrack}
            onRemove={removeTrack}
            playlistTracks={playlistTracks}
          />
          <Playlist
            playlistName={playlistName}
            playlistTracks={playlistTracks}
            onNameChange={setPlaylistName}
            onRemove={removeTrack}
            onSave={savePlaylist}
            isSaving={isSaving}
          />
        </section>

        {statusMessage && <p className={styles.saveStatus}>{statusMessage}</p>}
      </main>
    </div>
  );
}

export default App;
