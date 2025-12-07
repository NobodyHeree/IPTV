const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Auth (legacy - now through profiles)
    login: (mac, url) => ipcRenderer.invoke('login', { mac, url }),
    getSavedAuth: () => ipcRenderer.invoke('get-saved-auth'),

    // Channels
    getGenres: () => ipcRenderer.invoke('get-genres'),
    getChannels: (genreId) => ipcRenderer.invoke('get-channels', genreId),
    searchChannels: (query) => ipcRenderer.invoke('search-channels', query),
    getStreamUrl: (cmd) => ipcRenderer.invoke('get-stream-url', cmd),

    // Profiles (each profile = separate IPTV account)
    getProfiles: () => ipcRenderer.invoke('get-profiles'),
    getActiveProfile: () => ipcRenderer.invoke('get-active-profile'),
    setActiveProfile: (profileId) => ipcRenderer.invoke('set-active-profile', profileId),
    createProfile: (data) => ipcRenderer.invoke('create-profile', data),
    connectProfile: (profileId) => ipcRenderer.invoke('connect-profile', profileId),
    updateProfile: (data) => ipcRenderer.invoke('update-profile', data),
    deleteProfile: (profileId) => ipcRenderer.invoke('delete-profile', profileId),

    // Favorites (per-profile)
    getFavorites: () => ipcRenderer.invoke('get-favorites'),
    addFavorite: (channel) => ipcRenderer.invoke('add-favorite', channel),
    removeFavorite: (channelId) => ipcRenderer.invoke('remove-favorite', channelId),
    isFavorite: (channelId) => ipcRenderer.invoke('is-favorite', channelId),

    // Recently Watched (per-profile)
    getRecent: () => ipcRenderer.invoke('get-recent'),
    addRecent: (channel) => ipcRenderer.invoke('add-recent', channel),

    // EPG (Electronic Program Guide)
    getShortEpg: (channelId) => ipcRenderer.invoke('get-short-epg', channelId),
    getAllEpg: (period) => ipcRenderer.invoke('get-all-epg', period)
});
