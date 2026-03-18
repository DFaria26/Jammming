import { useState } from 'react';
import SearchBar from './components/SearchBar/SearchBar';
import SearchResults from './components/SearchResults/SearchResults';
import Playlist from './components/Playlist/Playlist';
import { Spotify } from './spotify/spotify';
import styles from './App.module.css';

const MOCK_TRACKS = [
  { id: '1', name: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', uri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b' },
  { id: '2', name: 'Shape of You', artist: 'Ed Sheeran', album: '÷ (Divide)', uri: 'spotify:track:7qiZfU4dY1lWllzX7mPBI3' },
  { id: '3', name: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', uri: 'spotify:track:463CkQjx2Zfoiqh6zDiVKw' },
  { id: '4', name: 'Peaches', artist: 'Justin Bieber', album: 'Justice', uri: 'spotify:track:4iJyoBOLtHqaWYs3vyWFGE' },
  { id: '5', name: 'Stay', artist: 'The Kid LAROI & Justin Bieber', album: 'F*CK LOVE 3', uri: 'spotify:track:5PjdY0CKGZdEuoNab3yDmX' },
];

function App() {
  const [searchResults, setSearchResults] = useState(MOCK_TRACKS);
  const [playlistName, setPlaylistName] = useState('My Playlist');
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  async function handleSearch(term) {
    setIsSearching(true);
    setSaveStatus('');
    try {
      const results = await Spotify.search(term);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      setSaveStatus('Search failed. Please try again.');
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
    if (!playlistName.trim() || playlistTracks.length === 0) {
      setSaveStatus('Add a name and at least one track before saving.');
      return;
    }
    setSaveStatus('Saving...');
    try {
      const uris = playlistTracks.map((t) => t.uri);
      await Spotify.savePlaylist(playlistName, uris);
      setSaveStatus(`"${playlistName}" saved to Spotify!`);
      setPlaylistName('My Playlist');
      setPlaylistTracks([]);
    } catch (err) {
      console.error(err);
      setSaveStatus('Failed to save playlist. Please try again.');
    }
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.logo}>
          <span className={styles.logoBold}>Ja</span>mmming
        </h1>
      </header>

      <main className={styles.main}>
        <section className={styles.searchSection}>
          <SearchBar onSearch={handleSearch} />
          {isSearching && <p className={styles.status}>Searching...</p>}
        </section>

        <section className={styles.columns}>
          <SearchResults
            searchResults={searchResults}
            onAdd={addTrack}
            playlistTracks={playlistTracks}
          />
          <Playlist
            playlistName={playlistName}
            playlistTracks={playlistTracks}
            onNameChange={setPlaylistName}
            onRemove={removeTrack}
            onSave={savePlaylist}
          />
        </section>

        {saveStatus && <p className={styles.saveStatus}>{saveStatus}</p>}
      </main>
    </div>
  );
}

export default App;
