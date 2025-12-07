# Aura IPTV

A premium IPTV Desktop Application built with Electron, React, and Vite. Designed to provide a seamless and high-quality viewing experience for Stalker Middleware providers (MAG style).

## Features

- **📺 Modern User Interface**: A sleek, dark-themed UI built with React and TailwindCSS.
- **🔌 Stalker Middleware Support**: Connect to any IPTV provider that uses Stalker/MAG portal authentication (MAC Address & URL).
- **🔄 Smart HLS Proxy**:
  - Integrated local HTTP proxy to handle complex stream authentication.
  - Automatically injects User-Agent, Cookies, and headers to mimic a real MAG set-top box.
  - Resolves redirects and rewrites HLS playlists on the fly to bypass CORS and restriction issues.
- **👤 Multi-Profile System**:
  - Create and manage up to 5 different profiles (accounts).
  - Each profile has its own Favorites list and Recently Watched history.
- **📅 EPG Integration**: Electronic Program Guide support to see what's playing.
- **❤️ Favorites & History**: Locally stored favorites and watch history using `electron-store`.
- **🎥 Advanced Player**: Built-in video player optimized for HLS streams (`.m3u8`) and MPEG-TS.

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Framer Motion, Lucide React
- **Backend**: Electron, Node.js
- **Streaming**: Custom HLS Proxy, `hls.js`, `mpegts.js`, `fluent-ffmpeg`
- **Data Persistence**: `electron-store`

## Installation

Ensure you have [Node.js](https://nodejs.org/) installed.

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd IPTV
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## Development

To start the application in development mode:

```bash
# Run both React (Vite) and Electron concurrently
npm start
```

Or run them individually:

```bash
# Start the React dev server
npm run dev

# Start the Electron app (wait for React server first)
npm run electron
```

## Build

To create a distributable installer for Windows:

```bash
npm run dist
```
The output will be in the `dist_electron` directory.

## Configuration

The application stores its configuration (profiles, auth, favorites) locally. You can reset the app by clearing the Electron user data if needed.

### Connection Requirements
To connect to a provider you need:
- **Portal URL**: The URL given by your IPTV provider (usually ends in `/c/`).
- **MAC Address**: The MAC address registered with your provider (e.g., `00:1A:79:...`).

## License

[MIT](LICENSE)
