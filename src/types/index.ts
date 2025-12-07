/**
 * Type definitions for AURA IPTV
 * These types help with IDE autocompletion and error checking
 */

// Channel types
export interface Channel {
    id: string;
    name: string;
    cmd: string;
    logo?: string;
    genre?: string;
    number?: number;
}

// Program/EPG types
export interface Program {
    id?: string;
    name: string;
    title?: string;
    descr?: string;
    start_timestamp: number;
    stop_timestamp: number;
    start?: number;
    end?: number;
}

// Profile types
export interface Profile {
    id: string;
    name: string;
    avatar: string;
    mac?: string;
    url?: string;
    method?: 'GET' | 'POST';
}

// Settings types
export interface Settings {
    general: {
        language: 'fr' | 'en';
        theme: 'dark' | 'light';
        autoStart: boolean;
    };
    player: {
        bufferSize: number;
        aspectRatio: 'contain' | 'fill' | 'cover';
        autoplay: boolean;
    };
    network: {
        timeout: number;
        retries: number;
    };
}

// Genre/Category types
export interface Genre {
    id: string;
    title: string;
    alias?: string;
    number?: number;
    censored?: number;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface StreamResponse {
    success: boolean;
    streamUrl?: string;
    error?: string;
}

export interface ProfileResponse {
    success: boolean;
    profile?: Profile;
    error?: string;
}

// Player state types
export type BufferHealth = 'good' | 'warning' | 'critical';

export interface PlayerState {
    isPlaying: boolean;
    isMuted: boolean;
    isFullscreen: boolean;
    isPiP: boolean;
    volume: number;
    currentTime: number;
    duration: number;
    bufferHealth: BufferHealth;
    loading: boolean;
    error: PlayerError | null;
}

export interface PlayerError {
    title: string;
    message: string;
    code?: string;
}

// Navigation types
export type ViewType = 'home' | 'favorites' | 'settings' | 'category' | 'search';

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

// Window API types (exposed from preload)
export interface WindowAPI {
    getProfiles: () => Promise<Profile[]>;
    createProfile: (profile: Omit<Profile, 'id'>) => Promise<ProfileResponse>;
    updateProfile: (profile: Profile) => Promise<{ success: boolean }>;
    deleteProfile: (id: string) => Promise<{ success: boolean }>;
    connectProfile: (id: string) => Promise<ProfileResponse>;

    getGenres: () => Promise<ApiResponse<Genre[]>>;
    getChannels: (genreId: string) => Promise<ApiResponse<Channel[]>>;
    searchChannels: (query: string) => Promise<ApiResponse<Channel[]>>;

    getStreamUrl: (cmd: string | { cmd: string; startTime?: number }) => Promise<StreamResponse>;
    getShortEpg: (channelId: string) => Promise<ApiResponse<Program[]>>;
    getAllEpg: (hours: number) => Promise<Program[]>;

    loadSettings: () => Promise<Settings>;
    saveSettings: (settings: Settings) => Promise<{ success: boolean }>;

    restartApp: () => void;
    clearCache: () => Promise<{ success: boolean }>;

    onProfileChanged: (callback: (profile: Profile | null) => void) => void;
}

// Extend Window interface
declare global {
    interface Window {
        api: WindowAPI;
    }
}
