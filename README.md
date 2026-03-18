# Jammming

A React web application that lets you search the Spotify library, build a custom playlist, and save it directly to your Spotify account.

## Purpose

Jammming was built as a capstone project to demonstrate React component architecture, unidirectional data flow, state management, and integration with a real-world REST API (Spotify Web API) including OAuth authentication.

## Technologies Used

- **React 19** — component-based UI
- **Vite** — fast development build tool
- **CSS Modules** — scoped component styling
- **Spotify Web API** — search tracks and manage playlists
- **Implicit Grant Flow** — browser-side OAuth 2.0 authentication

## Features

- Search the Spotify library by song title, artist, or album
- View track name, artist, and album for each result
- Add tracks to a custom playlist with a **+** button
- Remove tracks from the playlist with a **−** button
- Rename the playlist inline by clicking the title field
- Save the playlist to your personal Spotify account with one click
- Authentication handled automatically via Spotify's Implicit Grant Flow

## Getting Started

### Prerequisites

- Node.js 18+
- A Spotify account
- The app registered in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) with redirect URI `http://127.0.0.1:3000`

### Install & Run

```bash
git clone <repo-url>
cd Jammming
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser. On first search you will be redirected to Spotify to log in and grant access — you will then be returned to the app automatically.

## Project Structure

```
src/
  components/
    SearchBar/       # Search input and button
    SearchResults/   # Displays Spotify search results
    Playlist/        # User's custom playlist with save button
    Tracklist/       # Reusable list of Track components
    Track/           # Individual track row with add/remove action
  spotify/
    spotify.js       # Spotify API module (auth, search, save)
  App.jsx            # Root component — state and data flow
  App.module.css
  index.css
  main.jsx
```

## Future Work

- Add album artwork to track rows
- Support searching by genre or mood
- Allow reordering playlist tracks via drag-and-drop
- Show a preview of currently playing track
- Add TypeScript for better type safety
- Deploy to Netlify or Vercel with environment variable support for the Client ID
