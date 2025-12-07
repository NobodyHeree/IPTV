import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import stalker from './stalker.js';
import Store from 'electron-store';
import http from 'http';
import { URL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const store = new Store();

let mainWindow;

// --- HLS PROXY (SFVIP-style) ---
class HLSProxy {
    constructor() {
        this.server = null;
        this.port = 0;
        this.channelCache = new Map(); // Cache channel cmd -> stream info
    }

    async start() {
        if (this.server) return this.port;

        return new Promise((resolve) => {
            this.server = http.createServer(async (req, res) => {
                try {
                    await this.handleRequest(req, res);
                } catch (error) {
                    console.error('[HLSProxy] Request error:', error.message);
                    res.writeHead(500);
                    res.end('Proxy error');
                }
            });

            this.server.listen(0, '127.0.0.1', () => {
                this.port = this.server.address().port;
                console.log(`[HLSProxy] Server running on port ${this.port}`);
                resolve(this.port);
            });
        });
    }

    async handleRequest(req, res) {
        const urlParts = new URL(req.url, `http://localhost:${this.port}`);
        const pathname = urlParts.pathname;

        // CORS headers for browser
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Route: /playlist/:channelCmd (base64 encoded)
        if (pathname.startsWith('/playlist/')) {
            const encodedCmd = pathname.replace('/playlist/', '');
            const cmd = Buffer.from(encodedCmd, 'base64').toString('utf-8');
            await this.handlePlaylist(cmd, res);
            return;
        }

        // Route: /segment?url=:encodedUrl
        if (pathname === '/segment') {
            const encodedUrl = urlParts.searchParams.get('url');
            if (encodedUrl) {
                const originalUrl = Buffer.from(encodedUrl, 'base64').toString('utf-8');
                await this.handleSegment(originalUrl, res);
                return;
            }
        }

        res.writeHead(404);
        res.end('Not found');
    }

    async handlePlaylist(cmd, res) {
        console.log('[HLSProxy] Fetching playlist for:', cmd.substring(0, 40) + '...');

        try {
            // 1. Get fresh stream URL from Stalker
            const streamUrl = await stalker.getStream(cmd);

            // 2. Get auth info
            const auth = store.get('auth');
            const cookies = auth?.cookies || `mac=${encodeURIComponent(auth.mac)}; stboffset=0`;
            const userAgent = 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3';

            // 3. Resolve redirects to get final URL
            const finalUrl = await this.resolveRedirects(streamUrl, cookies, userAgent);

            // 4. Fetch the HLS playlist
            const playlistResponse = await axios.get(finalUrl, {
                headers: {
                    'User-Agent': userAgent,
                    'Cookie': cookies,
                    'X-User-Agent': 'Model: MAG250; Link: WiFi'
                },
                timeout: 10000,
                responseType: 'text'
            });

            let playlist = playlistResponse.data;
            const baseUrl = new URL(finalUrl);

            // 5. Rewrite all segment URLs to go through our proxy
            playlist = this.rewritePlaylist(playlist, baseUrl);

            res.writeHead(200, {
                'Content-Type': 'application/vnd.apple.mpegurl',
                'Cache-Control': 'no-cache'
            });
            res.end(playlist);

        } catch (error) {
            console.error('[HLSProxy] Playlist error:', error.message);
            res.writeHead(502);
            res.end('Failed to fetch playlist');
        }
    }

    rewritePlaylist(playlist, baseUrl) {
        const lines = playlist.split('\n');
        const rewrittenLines = lines.map(line => {
            line = line.trim();

            // Skip empty lines and comments (except URI in comments)
            if (!line || (line.startsWith('#') && !line.includes('URI='))) {
                // Handle #EXT-X-KEY with URI
                if (line.includes('URI="')) {
                    return line.replace(/URI="([^"]+)"/, (match, uri) => {
                        const absoluteUrl = this.resolveUrl(uri, baseUrl);
                        const encoded = Buffer.from(absoluteUrl).toString('base64');
                        return `URI="http://127.0.0.1:${this.port}/segment?url=${encoded}"`;
                    });
                }
                return line;
            }

            // Rewrite segment URLs
            if (!line.startsWith('#')) {
                const absoluteUrl = this.resolveUrl(line, baseUrl);
                const encoded = Buffer.from(absoluteUrl).toString('base64');
                return `http://127.0.0.1:${this.port}/segment?url=${encoded}`;
            }

            return line;
        });

        return rewrittenLines.join('\n');
    }

    resolveUrl(url, baseUrl) {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        if (url.startsWith('/')) {
            return `${baseUrl.protocol}//${baseUrl.host}${url}`;
        }
        // Relative URL
        const basePath = baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1);
        return `${baseUrl.protocol}//${baseUrl.host}${basePath}${url}`;
    }

    async handleSegment(url, res) {
        try {
            const auth = store.get('auth');
            const cookies = auth?.cookies || `mac=${encodeURIComponent(auth.mac)}; stboffset=0`;
            const userAgent = 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3';

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': userAgent,
                    'Cookie': cookies,
                    'X-User-Agent': 'Model: MAG250; Link: WiFi'
                },
                timeout: 15000,
                responseType: 'arraybuffer'
            });

            const contentType = response.headers['content-type'] || 'video/MP2T';
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(Buffer.from(response.data));

        } catch (error) {
            console.error('[HLSProxy] Segment error:', error.message);
            res.writeHead(502);
            res.end('Failed to fetch segment');
        }
    }

    async resolveRedirects(url, cookies, userAgent) {
        let currentUrl = url;
        let redirectCount = 0;
        const maxRedirects = 10;

        while (redirectCount < maxRedirects) {
            try {
                const response = await axios.get(currentUrl, {
                    maxRedirects: 0,
                    validateStatus: (status) => status >= 200 && status < 400,
                    headers: {
                        'User-Agent': userAgent,
                        'Cookie': cookies,
                        'X-User-Agent': 'Model: MAG250; Link: WiFi'
                    },
                    timeout: 10000
                });

                if (response.status === 200) {
                    return currentUrl;
                }

                if (response.status === 301 || response.status === 302) {
                    const location = response.headers.location;
                    if (!location) throw new Error('Redirect without Location');
                    currentUrl = location.startsWith('http') ? location : new URL(location, currentUrl).href;
                    redirectCount++;
                    continue;
                }
            } catch (error) {
                if (error.response && (error.response.status === 301 || error.response.status === 302)) {
                    const location = error.response.headers.location;
                    if (!location) throw new Error('Redirect without Location');
                    currentUrl = location.startsWith('http') ? location : new URL(location, currentUrl).href;
                    redirectCount++;
                    continue;
                }
                throw error;
            }
        }
        throw new Error('Too many redirects');
    }

    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
        }
        this.channelCache.clear();
    }
}

const hlsProxy = new HLSProxy();

// --- Window ---
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        backgroundColor: '#0f172a',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            sandbox: false
        },
        show: false
    });

    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    } else {
        const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
        mainWindow.loadURL(startUrl);
    }

    // CORS bypass for HLS.js
    session.defaultSession.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
        const responseHeaders = details.responseHeaders || {};
        responseHeaders['Access-Control-Allow-Origin'] = ['*'];
        responseHeaders['Access-Control-Allow-Headers'] = ['*'];
        responseHeaders['Access-Control-Allow-Methods'] = ['GET, HEAD, POST, OPTIONS'];
        callback({ cancel: false, responseHeaders });
    });

    setInterval(() => stalker.keepAlive(), 30000);

    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.on('closed', () => { mainWindow = null; });
}

// --- App Lifecycle ---
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.on('ready', async () => {
    await hlsProxy.start();
    createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });
app.on('before-quit', () => { hlsProxy.stop(); console.log('[Main] 🛑 Quitting...'); });

// --- IPC Handlers ---
ipcMain.handle('login', async (event, { mac, url }) => {
    try {
        const profile = await stalker.login(mac, url);
        const cookies = await stalker.getSessionCookies();
        store.set('auth', { mac, url, cookies });
        return { success: true, profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-genres', async () => {
    try { return { success: true, genres: await stalker.getGenres() }; }
    catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('get-channels', async (event, genreId) => {
    try { return { success: true, channels: await stalker.getChannels(genreId) }; }
    catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('search-channels', async (event, query) => {
    try { return { success: true, channels: await stalker.searchChannels(query) }; }
    catch (error) { return { success: false, error: error.message }; }
});

// EPG (Electronic Program Guide)
ipcMain.handle('get-short-epg', async (event, channelId) => {
    try { return { success: true, epg: await stalker.getShortEpg(channelId) }; }
    catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('get-all-epg', async (event, period = 24) => {
    try { return { success: true, epg: await stalker.getAllEpg(period) }; }
    catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('get-saved-auth', () => store.get('auth'));

// Simple IPC to get the proxy URL for a channel
ipcMain.handle('get-stream-url', async (event, cmd) => {
    try {
        const encodedCmd = Buffer.from(cmd).toString('base64');
        const proxyUrl = `http://127.0.0.1:${hlsProxy.port}/playlist/${encodedCmd}`;
        console.log(`[Main] Stream URL: ${proxyUrl}`);
        return { success: true, streamUrl: proxyUrl };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// --- Profile System (Each profile = separate IPTV account) ---
ipcMain.handle('get-profiles', () => {
    return store.get('profiles', []);
});

ipcMain.handle('get-active-profile', () => {
    const profiles = store.get('profiles', []);
    const activeId = store.get('activeProfileId');
    return profiles.find(p => p.id === activeId) || null;
});

ipcMain.handle('set-active-profile', (event, profileId) => {
    store.set('activeProfileId', profileId);
    return profileId;
});

ipcMain.handle('create-profile', async (event, { name, avatar, mac, url, method }) => {
    // Try to login first to validate credentials
    try {
        const httpMethod = method || 'GET';
        const profile = await stalker.login(mac, url, httpMethod);

        const profiles = store.get('profiles', []);
        if (profiles.length >= 5) {
            return { success: false, error: 'Maximum 5 profils atteint' };
        }

        const newProfile = {
            id: Date.now().toString(),
            name: name || profile.login || `Profil ${profiles.length + 1}`,
            avatar: avatar || 'purple',
            mac,
            url,
            method: httpMethod,
            favorites: [],
            recentlyWatched: []
        };

        profiles.push(newProfile);
        store.set('profiles', profiles);
        store.set('activeProfileId', newProfile.id);

        return { success: true, profile: newProfile };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('connect-profile', async (event, profileId) => {
    const profiles = store.get('profiles', []);
    const profile = profiles.find(p => p.id === profileId);

    if (!profile) {
        return { success: false, error: 'Profil introuvable' };
    }

    // Check if profile has credentials (old profiles may not have them)
    if (!profile.mac || !profile.url) {
        return { success: false, error: 'Ce profil n\'a pas d\'identifiants. Veuillez le supprimer et en créer un nouveau.' };
    }

    try {
        await stalker.login(profile.mac, profile.url, profile.method || 'GET');
        store.set('activeProfileId', profileId);
        return { success: true, profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-profile', (event, { id, name, avatar, mac, url, method }) => {
    const profiles = store.get('profiles', []);
    const index = profiles.findIndex(p => p.id === id);
    if (index === -1) return { success: false, error: 'Profil introuvable' };
    profiles[index] = {
        ...profiles[index],
        name,
        avatar,
        mac: mac || profiles[index].mac,
        url: url || profiles[index].url,
        method: method || profiles[index].method || 'GET'
    };
    store.set('profiles', profiles);
    return { success: true, profile: profiles[index] };
});

ipcMain.handle('delete-profile', (event, profileId) => {
    let profiles = store.get('profiles', []);
    profiles = profiles.filter(p => p.id !== profileId);
    store.set('profiles', profiles);
    // If active profile was deleted, clear active
    if (store.get('activeProfileId') === profileId) {
        store.set('activeProfileId', profiles[0]?.id || null);
    }
    return { success: true };
});

// --- Per-Profile Favorites ---
ipcMain.handle('get-favorites', () => {
    const activeId = store.get('activeProfileId');
    const profiles = store.get('profiles', []);
    const profile = profiles.find(p => p.id === activeId) || profiles[0];
    return profile?.favorites || [];
});

ipcMain.handle('add-favorite', (event, channel) => {
    const activeId = store.get('activeProfileId');
    const profiles = store.get('profiles', []);
    const index = profiles.findIndex(p => p.id === activeId);
    if (index === -1) return [];

    const favorites = profiles[index].favorites || [];
    if (!favorites.find(f => f.id === channel.id)) {
        favorites.unshift(channel);
        profiles[index].favorites = favorites.slice(0, 50);
        store.set('profiles', profiles);
    }
    return profiles[index].favorites;
});

ipcMain.handle('remove-favorite', (event, channelId) => {
    const activeId = store.get('activeProfileId');
    const profiles = store.get('profiles', []);
    const index = profiles.findIndex(p => p.id === activeId);
    if (index === -1) return [];

    profiles[index].favorites = (profiles[index].favorites || []).filter(f => f.id !== channelId);
    store.set('profiles', profiles);
    return profiles[index].favorites;
});

ipcMain.handle('is-favorite', (event, channelId) => {
    const activeId = store.get('activeProfileId');
    const profiles = store.get('profiles', []);
    const profile = profiles.find(p => p.id === activeId);
    return (profile?.favorites || []).some(f => f.id === channelId);
});

// --- Per-Profile Recently Watched ---
ipcMain.handle('get-recent', () => {
    const activeId = store.get('activeProfileId');
    const profiles = store.get('profiles', []);
    const profile = profiles.find(p => p.id === activeId) || profiles[0];
    return profile?.recentlyWatched || [];
});

ipcMain.handle('add-recent', (event, channel) => {
    const activeId = store.get('activeProfileId');
    const profiles = store.get('profiles', []);
    const index = profiles.findIndex(p => p.id === activeId);
    if (index === -1) return [];

    let recent = profiles[index].recentlyWatched || [];
    recent = recent.filter(r => r.id !== channel.id);
    recent.unshift({ ...channel, watchedAt: Date.now() });
    profiles[index].recentlyWatched = recent.slice(0, 20);
    store.set('profiles', profiles);
    return profiles[index].recentlyWatched;
});
