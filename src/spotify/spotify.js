const CLIENT_ID = 'f11bc152548e4e8cb19de3a15cbde8ea';
const REDIRECT_URI = 'http://127.0.0.1:3000';
const SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ');

let accessToken = '';
let expiresAt = 0;

function getAccessToken() {
  // Return cached token if still valid
  if (accessToken && Date.now() < expiresAt) {
    return accessToken;
  }

  // Check if token is in the URL hash (after redirect from Spotify)
  const hash = window.location.hash;
  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    const expiresIn = params.get('expires_in');

    if (token) {
      accessToken = token;
      expiresAt = Date.now() + Number(expiresIn) * 1000;
      // Clear the hash from the URL so the token isn't visible or reused
      window.history.replaceState({}, document.title, window.location.pathname);
      return accessToken;
    }
  }

  // No valid token — redirect user to Spotify login
  const authUrl =
    `https://accounts.spotify.com/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  window.location = authUrl;
  return null;
}

async function search(term) {
  const token = getAccessToken();
  if (!token) return [];

  const response = await fetch(
    `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(term)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired — clear it and re-authenticate
      accessToken = '';
      expiresAt = 0;
      getAccessToken();
    }
    throw new Error(`Spotify search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.tracks.items.map((track) => ({
    id: track.id,
    name: track.name,
    artist: track.artists[0].name,
    album: track.album.name,
    uri: track.uri,
  }));
}

async function savePlaylist(playlistName, trackUris) {
  if (!playlistName || trackUris.length === 0) return;

  const token = getAccessToken();
  if (!token) return;

  // Get the current user's ID
  const userResponse = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!userResponse.ok) throw new Error('Failed to get user profile');
  const userData = await userResponse.json();
  const userId = userData.id;

  // Create a new playlist
  const createResponse = await fetch(
    `https://api.spotify.com/v1/users/${userId}/playlists`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: playlistName, description: 'Created with Jammming', public: false }),
    }
  );
  if (!createResponse.ok) throw new Error('Failed to create playlist');
  const playlistData = await createResponse.json();
  const playlistId = playlistData.id;

  // Add tracks to the playlist
  const addResponse = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: trackUris }),
    }
  );
  if (!addResponse.ok) throw new Error('Failed to add tracks to playlist');
}

export const Spotify = { getAccessToken, search, savePlaylist };
