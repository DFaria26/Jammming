# Jammming

A React web application that lets you search the Spotify library, build custom playlists, and save them directly to your Spotify account.

## Purpose

Jammming was built as a Codecademy capstone project to demonstrate proficiency with React component architecture, unidirectional data flow, state management with hooks, and integration with a real-world REST API. The app connects to the Spotify Web API using OAuth 2.0 with the Authorization Code + PKCE flow, allowing users to search millions of tracks, curate playlists, and push them to their Spotify account — all from the browser with no backend server required.

## Technologies Used

| Technology | Role |
|---|---|
| **React 19** | Component-based UI with functional components and hooks (`useState`, `useEffect`, `useRef`, `useCallback`) |
| **Vite 8** | Fast development server and production build tool |
| **CSS Modules** | Scoped, maintainable component styling with CSS custom properties for theming |
| **Spotify Web API** | Search tracks, create playlists, and add tracks to user accounts |
| **OAuth 2.0 (PKCE)** | Secure browser-side authentication without exposing a client secret |
| **sessionStorage** | Persist user state (search term, playlist) across OAuth login redirects |
| **localStorage** | Persist authentication tokens and theme preference between sessions |

## Features

- **Spotify Search** — Search the Spotify library by song title, artist, or album name
- **Track Details** — View track name, artist, album, and album artwork for each result
- **Audio Previews** — Listen to 30-second preview clips with playback progress; only one preview plays at a time across the app
- **Playlist Builder** — Add tracks with **+** and remove them with **−**; search results automatically hide tracks already in the playlist
- **Custom Naming** — Rename the playlist inline by editing the title field
- **Save to Spotify** — Save the finished playlist directly to your Spotify account with a loading indicator during the save
- **State Persistence** — Playlist and search state are preserved across login redirects and session expirations so no work is lost
- **Smart Token Management** — Access tokens expire automatically at the correct time; expired sessions preserve your playlist so you can re-authenticate and continue
- **Theme Toggle** — Switch between dark and light mode; defaults to your system preference and remembers your choice
- **Responsive Layout** — Fully responsive design that works on mobile and desktop

## Getting Started

### Prerequisites

- Node.js 18+
- A Spotify account (free or premium)
- A registered app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) with the redirect URI set to `http://127.0.0.1:3000`

### Install & Run

```bash
git clone <repo-url>
cd Jammming
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser. Click **Log In**, authenticate with Spotify, and grant the requested permissions. You'll be redirected back to the app and can start searching immediately.

## Project Structure

```
src/
  components/
    SearchBar/       # Search input with controlled text field
    SearchResults/   # Filtered search results (excludes playlist tracks)
    Playlist/        # Custom playlist with editable name and save button
    Tracklist/       # Reusable scrollable track list with single-preview management
    Track/           # Track row: album art, metadata, preview button, add/remove
  spotify/
    spotify.js       # Spotify API module (PKCE auth, search, playlist save, state persistence)
  App.jsx            # Root component — all app state and data flow
  App.module.css     # App-level layout, header, and theme styles
  index.css          # Global reset and CSS custom properties
  main.jsx           # React entry point
```

## Known Issues & Workarounds

The Spotify Web API's playlist endpoints (specifically adding tracks to a playlist) consistently returned **403 Forbidden** errors during development, possibly due to regional restrictions — the project was built from the UK, and Codecademy notes that non-US learners may experience limited API access. Multiple endpoint formats and HTTP methods were tried without success. As a workaround, an alternative API approach was used to complete the playlist-saving functionality. If you're outside the US and hit similar issues, check the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) User Management settings and consider using a proxy API such as [RapidAPI's Spotify endpoint](https://rapidapi.com/).

## Future Work

- Support searching by genre or mood
- Allow reordering playlist tracks via drag-and-drop
- Edit or delete existing Spotify playlists from within the app
- Add TypeScript for improved type safety and developer experience
- Deploy to Netlify or Vercel with environment-variable support for the Client ID
