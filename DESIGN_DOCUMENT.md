# Technical Design Document: Persist User State Across Login Redirects

## Objective

When a user is redirected to Spotify for authentication, any in-progress work (search term, playlist name, playlist tracks) is lost because the page fully reloads on redirect back. This feature preserves that state so users can pick up exactly where they left off after logging in.

## Background

Jammming uses the OAuth 2.0 Authorization Code with PKCE flow, which requires redirecting the user to Spotify's login page and then back to the app. During this redirect cycle, all React state is lost because the browser navigates away from the app entirely. This creates a frustrating experience: if a user has been building a playlist with mock data and then decides to log in, their playlist is wiped.

## Feature Summary

Persist the following state across Spotify login redirects:
1. **Search term** — the text in the search bar before redirect
2. **Playlist name** — the user's custom playlist title
3. **Playlist tracks** — all tracks added to the playlist

After the user completes authentication and is redirected back, the app restores this state automatically.

## Technical Design

### Approach: `sessionStorage`

Use the browser's `sessionStorage` API to save and restore state. This was chosen over `localStorage` because:
- `sessionStorage` is automatically cleared when the tab is closed, preventing stale data from persisting across sessions
- `localStorage` is already used for auth tokens and theme — keeping concerns separate avoids conflicts
- The state we're saving is ephemeral (a work-in-progress playlist), not long-lived

### Data Format

A single JSON object stored under the key `jammming_pending_state`:

```json
{
  "searchTerm": "The Weeknd",
  "playlistName": "Summer Vibes",
  "playlistTracks": [
    {
      "id": "abc123",
      "name": "Blinding Lights",
      "artist": "The Weeknd",
      "album": "After Hours",
      "uri": "spotify:track:abc123",
      "previewUrl": null
    }
  ]
}
```

### Implementation Steps

1. **Save state before redirect** — In the `login()` function in `spotify.js`, before redirecting to Spotify, serialize the current app state to `sessionStorage`.

2. **Restore state after redirect** — In the `App` component's auth callback handler, after a successful token exchange, check `sessionStorage` for saved state and restore it.

3. **Clean up** — Remove the saved state from `sessionStorage` after restoring it, so it doesn't interfere with future sessions.

### Components Modified

| File | Change |
|------|--------|
| `src/spotify/spotify.js` | Add `savePreRedirectState()` and `getPreRedirectState()` functions. Call save in `login()`. |
| `src/App.jsx` | Pass current state to `savePreRedirectState()` before login. Restore state after successful auth callback. Add `searchTerm` state to SearchBar. |
| `src/components/SearchBar/SearchBar.jsx` | Accept optional `initialTerm` prop to pre-fill the search input after redirect. |

### Edge Cases

- **No saved state**: If `sessionStorage` has no `jammming_pending_state` key, the app behaves as before (no restoration).
- **Corrupted data**: Wrap `JSON.parse` in a try-catch; if parsing fails, discard the data and proceed normally.
- **Tab closed before redirect completes**: `sessionStorage` is cleared automatically, so no stale data.
- **Multiple tabs**: Each tab has its own `sessionStorage`, so tabs don't interfere with each other.

## Alternatives Considered

### 1. URL query parameters
Encode state in the redirect URL. Rejected because:
- Track data can be large, exceeding URL length limits
- Exposes internal data in the URL
- Complex serialization/deserialization

### 2. localStorage
Would work functionally but keeps data after the tab closes. Since this state is ephemeral (in-progress work, not a saved preference), `sessionStorage` is more appropriate.

### 3. IndexedDB
Overkill for a small JSON payload. Adds complexity with async APIs for no practical benefit.

## Success Criteria

1. User types a search term, adds tracks to playlist, renames playlist
2. User clicks "Log In" — redirected to Spotify
3. User completes Spotify login — redirected back to Jammming
4. Search bar contains the previous search term
5. Playlist name and tracks are restored
6. A follow-up search using the restored term returns live Spotify results
