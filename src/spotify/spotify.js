const CLIENT_ID = '0ef6b1313db5423ba3fb8c86c0ccc061';
const REDIRECT_URI = 'http://127.0.0.1:3000';
const SCOPES = ['playlist-modify-public', 'playlist-modify-private', 'user-read-private'].join(' ');
const SCOPES_VERSION = 'v3';

// ── PKCE helpers ──────────────────────────────────────────────────────────────

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join('');
}

async function sha256(plain) {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64urlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ── Token storage ─────────────────────────────────────────────────────────────

function saveToken(token, expiresIn, grantedScopes) {
  localStorage.setItem('spotify_access_token', token);
  localStorage.setItem('spotify_expires_at', String(Date.now() + Number(expiresIn) * 1000));
  localStorage.setItem('spotify_scopes_version', SCOPES_VERSION);
  localStorage.setItem('spotify_granted_scopes', grantedScopes || '');
}

// Returns the stored token if valid, otherwise null.
function getAccessToken() {
  const token = localStorage.getItem('spotify_access_token');
  const expiresAt = Number(localStorage.getItem('spotify_expires_at'));
  const scopesVersion = localStorage.getItem('spotify_scopes_version');
  if (token && Date.now() < expiresAt && scopesVersion === SCOPES_VERSION) return token;
  return null;
}

function getGrantedScopes() {
  return localStorage.getItem('spotify_granted_scopes') || '';
}

function getExpiresAt() {
  return Number(localStorage.getItem('spotify_expires_at')) || 0;
}

function clearToken() {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_expires_at');
  localStorage.removeItem('spotify_scopes_version');
  localStorage.removeItem('spotify_granted_scopes');
  localStorage.removeItem('spotify_code_verifier');
}

// ── Pre-redirect state persistence ────────────────────────────────────────────

const STATE_KEY = 'jammming_pending_state';

function savePreRedirectState(state) {
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (_) { /* ignore quota errors */ }
}

function getPreRedirectState() {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    sessionStorage.removeItem(STATE_KEY);
    return null;
  }
}

// ── Auth flow ─────────────────────────────────────────────────────────────────

// Redirects the user to Spotify's login page.
async function login() {
  clearToken();
  const verifier = generateRandomString(128);
  const challenge = base64urlEncode(await sha256(verifier));
  localStorage.setItem('spotify_code_verifier', verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    show_dialog: 'true', // Always show the permission screen to avoid stale scope grants
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

// Call once on app mount. If Spotify redirected back with ?code=, exchanges it
// for a token and clears the URL. Returns the token, or null if not a callback.
let _callbackPromise = null;
async function handleCallback() {
  if (_callbackPromise) return _callbackPromise;

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');

  if (error) {
    window.history.replaceState({}, document.title, window.location.pathname);
    throw new Error(`Spotify denied access: ${error}`);
  }

  if (!code) return null; // Normal page load, nothing to do.

  // Clear the URL immediately before the async work begins so StrictMode's
  // double-invoke doesn't try to exchange the same single-use code twice.
  window.history.replaceState({}, document.title, window.location.pathname);

  _callbackPromise = (async () => {
    const verifier = localStorage.getItem('spotify_code_verifier');
    if (!verifier) throw new Error('Missing PKCE verifier — please try logging in again.');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: verifier,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error_description || `Token exchange failed (HTTP ${response.status})`);
    }

    const data = await response.json();
    saveToken(data.access_token, data.expires_in, data.scope);
    localStorage.removeItem('spotify_code_verifier');
    return data.access_token;
  })().finally(() => { _callbackPromise = null; });

  return _callbackPromise;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function throwApiError(response, context) {
  let message = `${context} (HTTP ${response.status})`;
  try {
    const body = await response.json();
    console.error(`[Jammming] ${context} response body:`, JSON.stringify(body));
    if (body?.error?.message) message += `: ${body.error.message}`;
  } catch (_) { /* ignore */ }
  throw new Error(message);
}

// ── Public API ────────────────────────────────────────────────────────────────

async function search(term) {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(term)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (response.status === 401) {
    clearToken();
    throw new Error('Session expired — please reconnect to Spotify.');
  }
  if (!response.ok) await throwApiError(response, 'Search failed');

  const data = await response.json();
  return data.tracks.items.map((track) => ({
    id: track.id,
    name: track.name,
    artist: track.artists[0].name,
    album: track.album.name,
    uri: track.uri,
    previewUrl: track.preview_url,
    image: track.album.images?.[track.album.images.length - 1]?.url || null,
  }));
}

async function savePlaylist(playlistName, trackUris) {
  if (!playlistName || trackUris.length === 0) return;

  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const grantedScopes = getGrantedScopes();
  const hasPlaylistScope = grantedScopes.includes('playlist-modify-public') || grantedScopes.includes('playlist-modify-private');
  if (!hasPlaylistScope) {
    clearToken();
    throw new Error('MISSING_SCOPES');
  }

  const userResponse = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (userResponse.status === 401) {
    clearToken();
    throw new Error('Session expired — please reconnect to Spotify.');
  }
  if (!userResponse.ok) await throwApiError(userResponse, 'Failed to get user profile');
  const userData = await userResponse.json();

  const createResponse = await fetch('https://api.spotify.com/v1/me/playlists', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: playlistName, description: 'Created with Jammming', public: false }),
  });
  if (!createResponse.ok) await throwApiError(createResponse, 'Failed to create playlist');
  const createdPlaylist = await createResponse.json();
  const playlistId = createdPlaylist.id;

  const addResponse = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/items`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: trackUris }),
    }
  );
  if (!addResponse.ok) await throwApiError(addResponse, 'Failed to add tracks');
}

export const Spotify = { handleCallback, getAccessToken, getExpiresAt, getGrantedScopes, login, clearToken, search, savePlaylist, savePreRedirectState, getPreRedirectState };
