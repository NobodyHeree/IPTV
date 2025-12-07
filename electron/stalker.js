import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

class StalkerClient {
    constructor() {
        this.jar = new CookieJar();
        this.client = wrapper(axios.create({
            jar: this.jar,
            timeout: 15000, // Increased timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'Keep-Alive',
                'X-User-Agent': 'Model: MAG250; Link: WiFi'
            }
        }));
        this.mac = null;
        this.baseUrl = null;
        this.token = null;
        this.method = 'GET'; // Default method
        this.allChannelsCache = null; // Cache for client-side search
        this.config = {
            timeout: 15000,
            userAgent: 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3'
        };
    }

    // Update configuration dynamically
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };

        // Update axios defaults
        if (newConfig.userAgent) {
            this.client.defaults.headers['User-Agent'] = newConfig.userAgent;
        }
        if (newConfig.timeout) {
            this.client.defaults.timeout = newConfig.timeout;
        }
        console.log('[Stalker] Configuration updated:', this.config);
    }

    // Set the HTTP method to use (GET or POST)
    setMethod(method) {
        this.method = method?.toUpperCase() === 'POST' ? 'POST' : 'GET';
        console.log(`[Stalker] HTTP method set to: ${this.method}`);
    }

    // Make a request using the configured method
    async request(url, params) {
        if (this.method === 'POST') {
            return this.client.post(url, params);
        } else {
            return this.client.get(`${url}?${params.toString()}`);
        }
    }

    // Helper function to add delays between requests
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async login(mac, portalUrl, method = 'GET') {
        this.mac = mac.trim();
        this.setMethod(method);

        // Normalize URL: trim whitespace and ensure it ends with /
        let url = portalUrl.trim();
        url = url.endsWith('/') ? url : url + '/';
        this.baseUrl = url;

        try {
            // 1. Initial Handshake to set cookies
            console.log(`[Stalker] Handshake: ${this.baseUrl} (Method: ${this.method})`);
            const initialRes = await this.client.get(this.baseUrl);

            // Check for ban in initial response
            if (typeof initialRes.data === 'string' && initialRes.data.includes('BANNED')) {
                throw new Error('Votre IP a été bannie par le serveur. Attendez quelques heures ou changez d\'IP.');
            }

            // 2. Get Token
            this.client.defaults.headers.common['Authorization'] = `Bearer ${mac}`;
            this.client.defaults.headers.common['Cookie'] = `mac=${encodeURIComponent(mac)}; stboffset=0`;

            const handshakeParams = new URLSearchParams({
                type: 'stb',
                action: 'handshake',
                token: '',
                mac: mac,
                stb_type: 'MAG250',
                sn: '0000000000000',
                ver: 'ImageDescription: 0.2.18-r14-250; ImageDate: Fri Jan 15 15:20:44 EET 2016; PORTAL version: 5.1.0; API Version: JS API version: 328; STB API version: 134;',
                not_valid_token: '0'
            });

            const handshakeRes = await this.request(`${this.baseUrl}server/load.php`, handshakeParams);
            console.log('[Stalker] Handshake Response:', handshakeRes.data);

            if (handshakeRes.data && handshakeRes.data.js && handshakeRes.data.js.token) {
                this.token = handshakeRes.data.js.token;
                console.log('[Stalker] Token received:', this.token);
            }

            // Add delay to avoid rate limiting
            await this.delay(500);

            // 3. Get Profile (with retry)
            const profileParams = new URLSearchParams({
                type: 'stb',
                action: 'get_profile',
                hd: '1',
                ver: '2',
                num_banks: '2',
                sn: '0000000000000',
                stb_type: 'MAG250',
                image_version: '218',
                video_out: 'hdmi',
                mac: mac,
                hw_version: '1.7-BD-00'
            });

            if (this.token) {
                profileParams.append('handshake_token', this.token);
            }

            // Try to get profile, but it's optional - token is enough
            let profileRes;
            try {
                for (let attempt = 1; attempt <= 2; attempt++) {
                    try {
                        profileRes = await this.request(`${this.baseUrl}server/load.php`, profileParams);
                        console.log('[Stalker] Profile Response:', profileRes.data);
                        break;
                    } catch (err) {
                        console.log(`[Stalker] Profile attempt ${attempt} failed: ${err.message}`);
                        if (attempt === 2) throw err;
                        await this.delay(1000);
                    }
                }
            } catch (profileError) {
                // Profile fetch failed, but we have the token - that's enough!
                console.log('[Stalker] get_profile failed but we have token, proceeding anyway');
                return { js: { token: this.token, id: 'unknown' }, login: 'Profile' };
            }

            if (!profileRes.data || !profileRes.data.js || !profileRes.data.js.id) {
                if (profileRes.data === 'Authorization failed') {
                    throw new Error('Authorization failed');
                }
                // Return minimal data if profile is incomplete
                return { js: { token: this.token, id: 'unknown' }, login: 'Profile' };
            }

            return profileRes.data;

        } catch (error) {
            console.error('[Stalker] Login Error:', error);
            throw error;
        }
    }

    async getGenres() {
        const params = new URLSearchParams({
            type: 'itv',
            action: 'get_genres',
            bot_link: '1'
        });
        const res = await this.request(`${this.baseUrl}server/load.php`, params);
        console.log('[Stalker] getGenres response:', JSON.stringify(res.data.js, null, 2));
        return res.data.js || [];
    }

    async getChannels(genreId) {
        const params = new URLSearchParams({
            type: 'itv',
            action: 'get_ordered_list',
            genre: genreId,
            force_ch_link_check: '0',
            fav: '0',
            sortby: 'number',
            hd: '1'
        });
        const res = await this.request(`${this.baseUrl}server/load.php`, params);
        return res.data.js ? res.data.js.data : [];
    }

    async searchChannels(query) {
        // The server search is broken (returns random channels).
        // We will try to fetch ALL channels and filter client-side.
        // We'll cache the full list to avoid spamming the server.

        if (!this.allChannelsCache) {
            console.log('[Stalker] Fetching ALL channels for client-side search...');
            try {
                // Try get_all_channels first
                const params = new URLSearchParams({
                    type: 'itv',
                    action: 'get_all_channels',
                    force_ch_link_check: '0',
                    fav: '0'
                });
                const res = await this.request(`${this.baseUrl}server/load.php`, params);
                if (res.data && res.data.js && res.data.js.data) {
                    this.allChannelsCache = res.data.js.data;
                    console.log(`[Stalker] Cached ${this.allChannelsCache.length} channels.`);
                } else {
                    console.warn('[Stalker] get_all_channels failed or returned empty. Falling back to get_ordered_list.');
                    // Fallback: try to get ordered list without genre (sometimes returns all)
                    const fallbackParams = new URLSearchParams({
                        type: 'itv',
                        action: 'get_ordered_list',
                        genre: '0',
                        force_ch_link_check: '0',
                        fav: '0',
                        hd: '1'
                    });
                    const fallbackRes = await this.request(`${this.baseUrl}server/load.php`, fallbackParams);
                    if (fallbackRes.data.js && fallbackRes.data.js.data) {
                        this.allChannelsCache = fallbackRes.data.js.data;
                        console.log(`[Stalker] Cached ${this.allChannelsCache.length} channels (fallback).`);
                    }
                }
            } catch (e) {
                console.error('[Stalker] Failed to fetch all channels:', e);
            }
        }

        let results = this.allChannelsCache || [];
        console.log(`[Stalker] Searching in ${results.length} cached channels for "${query}"`);

        // Client-side filtering
        if (query && results.length > 0) {
            const lowerQuery = query.toLowerCase();
            const filtered = results.filter(ch => {
                const name = ch.name?.toLowerCase() || '';
                const title = ch.title?.toLowerCase() || '';
                const alias = ch.alias?.toLowerCase() || '';
                return name.includes(lowerQuery) || title.includes(lowerQuery) || alias.includes(lowerQuery);
            });
            console.log(`[Stalker] Found ${filtered.length} matches locally.`);
            return filtered;
        }

        return [];
    }

    async getStream(cmd, startTime = null) {
        const params = new URLSearchParams({
            type: 'itv',
            action: 'create_link',
            cmd: cmd,
            series: '',
            forced_storage: '0',
            disable_ad: '0',
            download: '0',
            force_ch_link_check: '0'
        });

        // If it's a replay request, we might need to adjust params or cmd
        // For standard MAG/Stalker, we usually append ?utc=TIMESTAMP to the stream URL
        // But create_link expects the original cmd. 
        // Some portals interpret 'forced_storage' or specific flags for archive.
        // Let's try to just get the link first, then append utc if it's not baked in.

        // However, usually we need to tell the server we want archive.
        // If startTime is present, sometimes we modify the cmd sent to the server.
        // Example: "ffrt http://... " -> "ffrt http://... ...?utc=..."
        // Let's try appending to the cmd if it contains a URL.

        let modifiedCmd = cmd;
        if (startTime) {
            // Basic heuristic: find the http url in cmd and append utc
            if (modifiedCmd.includes('http')) {
                if (modifiedCmd.includes('?')) {
                    modifiedCmd += `&utc=${startTime}`;
                } else {
                    // Check if it ends with whitespace
                    const parts = modifiedCmd.split(' ');
                    const urlIndex = parts.findIndex(p => p.startsWith('http'));
                    if (urlIndex !== -1) {
                        parts[urlIndex] += `?utc=${startTime}`;
                        modifiedCmd = parts.join(' ');
                    }
                }
                params.set('cmd', modifiedCmd);
            }
        }

        const res = await this.request(`${this.baseUrl}server/load.php`, params);
        console.log('[Stalker] create_link response:', res.data);

        if (res.data && res.data.js && res.data.js.cmd) {
            let streamUrl = res.data.js.cmd;
            if (streamUrl.startsWith('ffmpeg ')) {
                streamUrl = streamUrl.replace('ffmpeg ', '').trim();
            }
            if (streamUrl.includes('extension=ts')) {
                streamUrl = streamUrl.replace('extension=ts', 'extension=m3u8');
            }

            // If we requested a start time, ensure the returned URL has it. 
            // Sometimes the server ignores our cmd modification and returns a generic link.
            // In that case, we force append it again for the proxy/player.
            if (startTime && !streamUrl.includes('utc=')) {
                streamUrl += (streamUrl.includes('?') ? '&' : '?') + `utc=${startTime}`;
            }

            return streamUrl;
        }
        throw new Error('Could not generate stream link');
    }

    // Get EPG (Electronic Program Guide) for a channel
    async getShortEpg(channelId) {
        try {
            const params = new URLSearchParams({
                type: 'itv',
                action: 'get_short_epg',
                ch_id: channelId,
                size: '10' // Number of programs to fetch
            });
            const res = await this.request(`${this.baseUrl}server/load.php`, params);
            console.log(`[Stalker] EPG for channel ${channelId}:`, res.data?.js);
            return res.data?.js || [];
        } catch (error) {
            console.error('[Stalker] getShortEpg error:', error.message);
            return [];
        }
    }

    // Get all EPG data for multiple channels
    async getAllEpg(period = 24) {
        try {
            const params = new URLSearchParams({
                type: 'itv',
                action: 'get_epg_info',
                period: period.toString()
            });
            const res = await this.request(`${this.baseUrl}server/load.php`, params);
            console.log('[Stalker] Full EPG data:', res.data?.js?.data?.length || 0, 'entries');
            return res.data?.js?.data || [];
        } catch (error) {
            console.error('[Stalker] getAllEpg error:', error.message);
            return [];
        }
    }

    async keepAlive() {
        if (!this.token) return;
        try {
            const params = new URLSearchParams({
                type: 'stb',
                action: 'get_profile',
                handshake_token: this.token,
                mac: this.mac,
                stb_type: 'MAG250',
                sn: '0000000000000'
            });
            await this.request(`${this.baseUrl}server/load.php`, params);
            console.log('[Stalker] Keep-alive sent successfully');
        } catch (error) {
            console.error('[Stalker] Keep-alive failed:', error.message);
        }
    }

    async getSessionCookies() {
        if (this.baseUrl && this.jar) {
            return await this.jar.getCookieString(this.baseUrl);
        }
        return '';
    }
}

export default new StalkerClient();
