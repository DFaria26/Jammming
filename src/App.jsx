import { useState, useEffect, useRef, useCallback } from 'react';
import SearchBar from './components/SearchBar/SearchBar';
import SearchResults from './components/SearchResults/SearchResults';
import Playlist from './components/Playlist/Playlist';
import { Spotify } from './spotify/spotify';
import Toast from './components/Toast/Toast';
import TrendingTracks from './components/TrendingTracks/TrendingTracks';
import Particles from './components/Particles/Particles';
import styles from './App.module.css';


function getInitialTheme() {
  const saved = localStorage.getItem('jammming_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!Spotify.getAccessToken());
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [playlistName, setPlaylistName] = useState('My Playlist');
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false });
  const [isSaving, setIsSaving] = useState(false);
  const [waveState, setWaveState] = useState('idle');
  const [fadeOrigin, setFadeOrigin] = useState(0);
  const [mobileTab, setMobileTab] = useState('results');
  const waveTimer = useRef(null);
  const logoTextRef = useRef(null);
  const undoRef = useRef(null);

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

  function showToast(message, type = 'info', action = null) {
    setToast({ message, type, visible: true, action });
  }

  function hideToast() {
    setToast((prev) => ({ ...prev, visible: false }));
  }

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
        showToast(`Login failed: ${err.message}`, 'error');
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
    setSearchResults([]);
    showToast('Session expired — please log in again.', 'info');
  }

  function handleLogout() {
    Spotify.clearToken();
    setIsLoggedIn(false);
    setSearchResults([]);
    setPlaylistTracks([]);
    setPlaylistName('My Playlist');
  }

  function handleUndo() {
    if (undoRef.current) {
      setPlaylistName(undoRef.current.name);
      setPlaylistTracks(undoRef.current.tracks);
      undoRef.current = null;
      hideToast();
      showToast('Playlist restored.', 'info');
    }
  }

  function handleClearSearch() {
    setSearchTerm('');
    setSearchResults([]);
  }

  async function handleSearch(term) {
    setSearchTerm(term);
    if (!isLoggedIn) {
      showToast('Please log in first to search.', 'info');
      return;
    }
    setIsSearching(true);
    try {
      const results = await Spotify.search(term);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      if (err.message.includes('Session expired')) {
        handleSessionExpired();
        return;
      }
      showToast(err.message, 'error');
    } finally {
      setIsSearching(false);
    }
  }

  function addTrack(track) {
    if (playlistTracks.find((t) => t.id === track.id)) return;
    setPlaylistTracks((prev) => [...prev, track]);
  }

  function removeTrack(track) {
    setPlaylistTracks((prev) => {
      const index = prev.findIndex((t) => t.id === track.id);
      if (index === -1) return prev;
      const updated = prev.filter((t) => t.id !== track.id);
      showToast(`Removed "${track.name}"`, 'info', {
        label: 'Undo',
        onClick: () => {
          setPlaylistTracks((current) => {
            const restored = [...current];
            restored.splice(Math.min(index, restored.length), 0, track);
            return restored;
          });
          hideToast();
        },
      });
      return updated;
    });
  }

  function handleReorder(newTracks) {
    setPlaylistTracks(newTracks);
  }

  async function savePlaylist() {
    if (!isLoggedIn) {
      showToast('Please log in first to save a playlist.', 'info');
      return;
    }
    if (!playlistName.trim() || playlistTracks.length === 0) {
      showToast('Add a name and at least one track before saving.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const uris = playlistTracks.map((t) => t.uri);
      await Spotify.savePlaylist(playlistName, uris);
      const savedName = playlistName;
      const savedTracks = [...playlistTracks];
      setPlaylistName('My Playlist');
      setPlaylistTracks([]);
      undoRef.current = { name: savedName, tracks: savedTracks };
      showToast(`"${savedName}" saved to Spotify!`, 'success', { label: 'Undo', onClick: handleUndo });
    } catch (err) {
      console.error(err);
      if (err.message.includes('Session expired')) {
        handleSessionExpired();
        return;
      } else if (err.message === 'MISSING_SCOPES') {
        Spotify.clearToken();
        setIsLoggedIn(false);
        showToast('Playlist permissions missing — please log in again.', 'error');
      } else {
        showToast(err.message, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.app}>
      <Particles />
      <a className={styles.skipLink} href="#main-content">Skip to content</a>
      <header className={styles.header} role="banner">
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

      <main className={styles.main} id="main-content">
        {!isLoggedIn && (
          <div className={styles.loginBanner}>
            <p>Sign in with your Spotify account to search and save playlists.</p>
            <button className={styles.loginBannerButton} onClick={handleLogin}>
              Sign In with Spotify
            </button>
          </div>
        )}

        <section className={styles.searchSection}>
          <SearchBar onSearch={handleSearch} onClear={handleClearSearch} initialTerm={searchTerm} />
        </section>

        <div className={styles.mobileTabs}>
          <button
            className={`${styles.mobileTab} ${mobileTab === 'results' ? styles.mobileTabActive : ''}`}
            onClick={() => setMobileTab('results')}
          >
            Results
          </button>
<button
            className={`${styles.mobileTab} ${mobileTab === 'playlist' ? styles.mobileTabActive : ''}`}
            onClick={() => setMobileTab('playlist')}
          >
            Playlist{playlistTracks.length > 0 ? ` (${playlistTracks.length})` : ''}
          </button>
        </div>

        <section className={styles.columns}>
          <div className={`${styles.columnLeft} ${mobileTab !== 'results' ? styles.mobileHidden : ''}`}>
            <SearchResults
              searchResults={searchResults}
              onAdd={addTrack}
              onRemove={removeTrack}
              playlistTracks={playlistTracks}
              isSearching={isSearching}
              isLoggedIn={isLoggedIn}
            />
            {isLoggedIn && searchResults.length === 0 && !isSearching && (
              <TrendingTracks
                isLoggedIn={isLoggedIn}
                onAdd={addTrack}
                playlistTracks={playlistTracks}
              />
            )}
          </div>
          <div className={`${styles.columnRight} ${mobileTab !== 'playlist' ? styles.mobileHidden : ''}`}>
            <Playlist
              playlistName={playlistName}
              playlistTracks={playlistTracks}
              onNameChange={setPlaylistName}
              onRemove={removeTrack}
              onReorder={handleReorder}
              onSave={savePlaylist}
              isSaving={isSaving}
            />
          </div>
        </section>

      </main>

      <footer className={styles.footer}>
        <p>Built by Daniel Faria</p>
        <p className={styles.footerSub}>Codecademy - Front-End Engineer (Practice Project: Jammming)</p>
      </footer>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
        action={toast.action}
      />
    </div>
  );
}

export default App;
