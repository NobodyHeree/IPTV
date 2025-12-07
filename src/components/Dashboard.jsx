import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, LogOut, Tv, Home,
    ChevronRight, ChevronLeft, Play, X, Globe, Sparkles, TrendingUp,
    Heart, Clock, Users, Calendar
} from 'lucide-react';
import Player from './Player';
import ErrorBoundary from './ErrorBoundary';
import EpgPanel from './EpgPanel';
import { QualityBadge, ChannelInitials, RowSkeleton, GridSkeleton, EmptyState } from './UIComponents';

// Country code to flag emoji converter
const getCountryFlag = (code) => {
    const flags = {
        'FR': '🇫🇷', 'US': '🇺🇸', 'UK': '🇬🇧', 'GB': '🇬🇧', 'DE': '🇩🇪', 'ES': '🇪🇸', 'IT': '🇮🇹',
        'PT': '🇵🇹', 'NL': '🇳🇱', 'BE': '🇧🇪', 'CH': '🇨🇭', 'CA': '🇨🇦', 'AU': '🇦🇺', 'BR': '🇧🇷',
        'MX': '🇲🇽', 'AR': '🇦🇷', 'PL': '🇵🇱', 'RU': '🇷🇺', 'TR': '🇹🇷', 'IN': '🇮🇳', 'JP': '🇯🇵',
        'KR': '🇰🇷', 'CN': '🇨🇳', 'SA': '🇸🇦', 'AE': '🇦🇪', 'EG': '🇪🇬', 'MA': '🇲🇦', 'DZ': '🇩🇿',
        'TN': '🇹🇳', 'SN': '🇸🇳', 'CI': '🇨🇮', 'CM': '🇨🇲', 'NG': '🇳🇬', 'GH': '🇬🇭', 'KE': '🇰🇪',
        'ZA': '🇿🇦', 'AL': '🇦🇱', 'RO': '🇷🇴', 'BG': '🇧🇬', 'HR': '🇭🇷', 'RS': '🇷🇸', 'BA': '🇧🇦',
        'SI': '🇸🇮', 'SK': '🇸🇰', 'CZ': '🇨🇿', 'HU': '🇭🇺', 'AT': '🇦🇹', 'GR': '🇬🇷', 'SE': '🇸🇪',
        'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'IE': '🇮🇪', 'IL': '🇮🇱', 'PK': '🇵🇰', 'BD': '🇧🇩',
        'VN': '🇻🇳', 'TH': '🇹🇭', 'ID': '🇮🇩', 'MY': '🇲🇾', 'PH': '🇵🇭', 'AF': '🇦🇫', 'AM': '🇦🇲',
        'AZ': '🇦🇿', 'GE': '🇬🇪', 'KZ': '🇰🇿', 'UZ': '🇺🇿', 'OTHER': '🌍'
    };
    return flags[code] || '🌍';
};

const Dashboard = ({ profile, onLogout, onSwitchProfile }) => {
    const [genres, setGenres] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [channels, setChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [featuredChannels, setFeaturedChannels] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [recentlyWatched, setRecentlyWatched] = useState([]);
    const [showFavoritesView, setShowFavoritesView] = useState(false);
    const [epgChannel, setEpgChannel] = useState(null); // Channel for EPG panel

    // Get current channel index and navigation helpers
    const currentChannelIndex = useMemo(() => {
        if (!selectedChannel || !channels.length) return -1;
        return channels.findIndex(c => c.id === selectedChannel.id);
    }, [selectedChannel, channels]);

    const hasPrevChannel = currentChannelIndex > 0;
    const hasNextChannel = currentChannelIndex >= 0 && currentChannelIndex < channels.length - 1;

    const goToPrevChannel = () => {
        if (hasPrevChannel) {
            setSelectedChannel(channels[currentChannelIndex - 1]);
        }
    };

    const goToNextChannel = () => {
        if (hasNextChannel) {
            setSelectedChannel(channels[currentChannelIndex + 1]);
        }
    };

    // Load genres
    useEffect(() => {
        const init = async () => {
            try {
                const response = await window.api.getGenres();
                if (response.success) setGenres(response.genres);
            } catch (err) {
                console.error("Failed to load genres", err);
            }
        };
        init();
    }, []);

    // Load favorites and recent
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const [favs, recent] = await Promise.all([
                    window.api.getFavorites(),
                    window.api.getRecent()
                ]);
                setFavorites(favs || []);
                setRecentlyWatched(recent || []);
            } catch (e) {
                console.error('Failed to load user data', e);
            }
        };
        loadUserData();
    }, []);

    // Load featured French channels
    useEffect(() => {
        const loadFeatured = async () => {
            try {
                const frGenre = genres.find(g => g.title?.includes('TNT') || g.title?.includes('|FR|'));
                if (frGenre) {
                    const res = await window.api.getChannels(frGenre.id);
                    if (res.success) {
                        setFeaturedChannels(res.channels.slice(0, 20));
                    }
                }
            } catch (e) {
                console.error('Failed to load featured', e);
            }
        };
        if (genres.length > 0) loadFeatured();
    }, [genres]);

    const countryGroups = useMemo(() => {
        if (!Array.isArray(genres)) return [];
        const groups = {};

        // Improved regex to match multiple formats:
        // "FR| TF1", "|FR| TF1", "FR |TF1", "| FR | TF1", "FR TF1", etc.
        // Captures: optional leading pipe/space, 2-3 letter country code, rest of name
        const extractCountry = (title) => {
            if (!title) return null;

            // Pattern 1: |XX| or | XX | format (with pipes)
            let match = title.match(/^[\|┃]?\s*([A-Z]{2,3})\s*[\|┃]\s*✪?\s*(.*)$/i);
            if (match) return { code: match[1].toUpperCase(), name: match[2].trim() };

            // Pattern 2: XX| or XX | format (code at start with pipe after)
            match = title.match(/^([A-Z]{2,3})\s*[\|┃]\s*✪?\s*(.*)$/i);
            if (match) return { code: match[1].toUpperCase(), name: match[2].trim() };

            // Pattern 3: XX followed by space and channel name (no pipe)
            match = title.match(/^([A-Z]{2})\s+(.+)$/i);
            if (match && match[1].length === 2) {
                // Only accept if it looks like a valid country code
                const possibleCode = match[1].toUpperCase();
                const validCodes = ['FR', 'US', 'UK', 'DE', 'ES', 'IT', 'PT', 'NL', 'BE', 'CH', 'CA', 'AU', 'BR', 'MX', 'AR', 'PL', 'RU', 'TR', 'IN', 'JP', 'KR', 'CN', 'SA', 'AE', 'EG', 'MA', 'DZ', 'TN', 'SN', 'CI', 'CM', 'NG', 'GH', 'KE', 'ZA', 'AL', 'RO', 'BG', 'HR', 'RS', 'BA', 'SI', 'SK', 'CZ', 'HU', 'AT', 'GR', 'SE', 'NO', 'DK', 'FI', 'IE', 'IL', 'PK', 'BD', 'VN', 'TH', 'ID', 'MY', 'PH', 'AF', 'AM', 'AZ', 'GE', 'KZ', 'UZ'];
                if (validCodes.includes(possibleCode)) {
                    return { code: possibleCode, name: match[2].trim() };
                }
            }

            return null;
        };

        genres.forEach(g => {
            if (!g || !g.title) return;
            const extracted = extractCountry(g.title);
            if (extracted) {
                const { code, name } = extracted;
                if (!groups[code]) groups[code] = { code, categories: [] };
                groups[code].categories.push({ ...g, displayName: name || g.title });
            } else {
                if (!groups['OTHER']) groups['OTHER'] = { code: 'OTHER', categories: [] };
                groups['OTHER'].categories.push({ ...g, displayName: g.title });
            }
        });
        return Object.values(groups).sort((a, b) => {
            if (a.code === 'FR') return -1;
            if (b.code === 'FR') return 1;
            if (a.code === 'OTHER') return 1;
            if (b.code === 'OTHER') return -1;
            return a.code.localeCompare(b.code);
        });
    }, [genres]);

    useEffect(() => {
        if (searchQuery.length < 3) {
            if (searchQuery.length === 0 && channels.length > 0 && !selectedCategory) {
                setChannels([]);
            }
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await window.api.searchChannels(searchQuery);
                if (response.success) {
                    setChannels(response.channels);
                    setSelectedCategory(null);
                    setSelectedCountry(null);
                }
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    useEffect(() => {
        if (!selectedCategory) return;
        setSearchQuery('');
        const fetchChannels = async () => {
            setLoading(true);
            try {
                const response = await window.api.getChannels(selectedCategory.id);
                if (response.success) setChannels(response.channels);
            } catch (err) {
                console.error("Failed to load channels", err);
            } finally {
                setLoading(false);
            }
        };
        fetchChannels();
    }, [selectedCategory]);

    const handlePlayChannel = async (ch) => {
        setSelectedChannel(ch);
        // Add to recently watched
        try {
            const updated = await window.api.addRecent(ch);
            setRecentlyWatched(updated);
        } catch (e) {
            console.error('Failed to add recent', e);
        }
    };

    const toggleFavorite = async (ch, e) => {
        e.stopPropagation();
        try {
            const isFav = favorites.some(f => f.id === ch.id);
            if (isFav) {
                const updated = await window.api.removeFavorite(ch.id);
                setFavorites(updated);
            } else {
                const updated = await window.api.addFavorite(ch);
                setFavorites(updated);
            }
        } catch (e) {
            console.error('Failed to toggle favorite', e);
        }
    };

    const isFavorite = (channelId) => favorites.some(f => f.id === channelId);
    const frGroup = countryGroups.find(g => g.code === 'FR');

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-background)]">
            {/* Sidebar */}
            <motion.div
                className="h-full flex flex-col z-20 border-r border-white/5"
                style={{ backgroundColor: 'var(--color-surface-solid)' }}
                initial={{ width: 72 }}
                animate={{ width: sidebarExpanded ? 260 : 72 }}
                onHoverStart={() => setSidebarExpanded(true)}
                onHoverEnd={() => setSidebarExpanded(false)}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* Logo */}
                <div className="h-20 flex items-center justify-center border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-blue-600 flex items-center justify-center">
                            <Tv className="w-5 h-5 text-white" />
                        </div>
                        <AnimatePresence>
                            {sidebarExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="font-bold text-lg tracking-wide text-gradient overflow-hidden whitespace-nowrap"
                                >
                                    OBSIDIAN
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Nav Items */}
                <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
                    <NavItem
                        icon={Home}
                        label="Accueil"
                        active={!selectedCountry && !searchQuery && !showFavoritesView}
                        onClick={() => { setSelectedCountry(null); setSelectedCategory(null); setSearchQuery(''); setShowFavoritesView(false); }}
                        expanded={sidebarExpanded}
                    />
                    <NavItem
                        icon={Heart}
                        label="Favoris"
                        count={favorites.length}
                        active={showFavoritesView}
                        onClick={() => { setShowFavoritesView(true); setSelectedCountry(null); setSelectedCategory(null); setSearchQuery(''); }}
                        expanded={sidebarExpanded}
                    />

                    <div className="my-4 mx-4 border-t border-white/5" />

                    {sidebarExpanded && (
                        <div className="px-6 mb-3 text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
                            Pays
                        </div>
                    )}

                    {countryGroups.map(country => (
                        <div
                            key={country.code}
                            onClick={() => { setSelectedCountry(country); setSelectedCategory(null); setSearchQuery(''); setShowFavoritesView(false); }}
                            className={`group flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl cursor-pointer transition-all duration-200 ${selectedCountry?.code === country.code ? 'bg-[var(--color-accent)]/20 text-white' : 'hover:bg-white/5 text-[var(--color-text-muted)]'}`}
                        >
                            <span className="text-xl">{getCountryFlag(country.code)}</span>
                            {sidebarExpanded && (
                                <>
                                    <span className={`text-sm font-medium flex-1 ${selectedCountry?.code === country.code ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}>
                                        {country.code}
                                    </span>
                                    <span className="text-[10px] text-[var(--color-text-muted)] bg-white/5 px-2 py-0.5 rounded-full">
                                        {country.categories.length}
                                    </span>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/5 space-y-1">
                    {profile && (
                        <div className="flex items-center gap-3 px-3 py-2 mb-2">
                            <div className={`w-8 h-8 rounded-lg bg-${profile.avatar || 'purple'}-500 flex items-center justify-center`}>
                                <span className="text-xs font-bold">{profile.name?.charAt(0).toUpperCase()}</span>
                            </div>
                            {sidebarExpanded && (
                                <span className="text-sm font-medium text-[var(--color-text-secondary)] truncate">
                                    {profile.name}
                                </span>
                            )}
                        </div>
                    )}
                    {onSwitchProfile && (
                        <NavItem icon={Users} label="Changer de profil" onClick={onSwitchProfile} expanded={sidebarExpanded} />
                    )}
                    <NavItem icon={LogOut} label="Déconnexion" onClick={onLogout} expanded={sidebarExpanded} />
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Search Bar */}
                <div className="absolute top-0 left-0 right-0 h-20 z-10 flex items-center px-8 bg-gradient-to-b from-[var(--color-background)] via-[var(--color-background)]/80 to-transparent pointer-events-none">
                    <div className="pointer-events-auto flex items-center glass-card px-5 py-3 w-[400px] transition-all duration-300 focus-within:ring-2 focus-within:ring-[var(--color-accent)]/50 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                        <Search className="w-4 h-4 text-[var(--color-text-muted)] mr-3" />
                        <input
                            type="text"
                            placeholder="Rechercher une chaîne..."
                            className="bg-transparent border-none outline-none text-sm w-full placeholder-[var(--color-text-muted)] text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <X className="w-4 h-4 text-[var(--color-text-muted)] cursor-pointer hover:text-white transition-colors" onClick={() => setSearchQuery('')} />
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto pt-24 pb-8">
                    {/* FAVORITES VIEW */}
                    {showFavoritesView && (
                        <div className="px-8 space-y-6">
                            <h2 className="text-3xl font-bold flex items-center gap-4">
                                <Heart className="w-8 h-8 text-red-500" />
                                Mes Favoris
                            </h2>
                            {favorites.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {favorites.map(ch => (
                                        <ChannelCard
                                            key={ch.id}
                                            channel={ch}
                                            onClick={() => handlePlayChannel(ch)}
                                            isFavorite={true}
                                            onToggleFavorite={toggleFavorite}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-[var(--color-text-muted)] py-20">
                                    <Heart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-xl">Aucun favori pour l'instant</p>
                                    <p className="mt-2">Cliquez sur le ❤️ d'une chaîne pour l'ajouter</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* NETFLIX-STYLE HOME */}
                    {!selectedCountry && !selectedCategory && !searchQuery && !showFavoritesView && (
                        <div className="space-y-10">
                            {/* Hero Banner */}
                            {/* Hero Banner */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="relative h-[420px] mx-8 rounded-3xl overflow-hidden glass-card"
                            >
                                {/* Animated Background Orbs */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [0.3, 0.5, 0.3],
                                    }}
                                    transition={{ duration: 8, repeat: Infinity }}
                                    className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[100px]"
                                />
                                <motion.div
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [0.2, 0.4, 0.2],
                                        x: [0, 50, 0]
                                    }}
                                    transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                                    className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[80px]"
                                />

                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)]/90 via-[var(--color-background)]/40 to-transparent" />
                                <div className="absolute inset-0 flex items-center p-16 relative z-10">
                                    <div className="max-w-xl">
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex items-center gap-2 mb-4"
                                        >
                                            <Sparkles className="w-5 h-5 text-[var(--color-accent)] animate-pulse" />
                                            <span className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-wider">Bienvenue</span>
                                        </motion.div>
                                        <motion.h1
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-6xl font-bold mb-6 tracking-tight leading-tight"
                                        >
                                            Vos chaînes <span className="text-gradient">préférées</span>
                                        </motion.h1>
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="text-xl text-[var(--color-text-secondary)] mb-10 leading-relaxed max-w-lg"
                                        >
                                            Accédez à des milliers de chaînes en direct, organisées par pays et catégorie.
                                        </motion.p>
                                        {frGroup && frGroup.categories[0] && (
                                            <motion.button
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 }}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => { setSelectedCountry(frGroup); setSelectedCategory(frGroup.categories[0]); }}
                                                className="btn-primary flex items-center gap-3 px-8 py-4 text-lg shadow-lg shadow-purple-500/20 group"
                                            >
                                                <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" /> Regarder maintenant
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Favorites Row */}
                            {favorites.length > 0 && (
                                <ChannelRow
                                    title="Mes Favoris"
                                    icon={Heart}
                                    channels={favorites}
                                    onChannelClick={handlePlayChannel}
                                    favorites={favorites}
                                    onToggleFavorite={toggleFavorite}
                                />
                            )}

                            {/* Recently Watched */}
                            {recentlyWatched.length > 0 && (
                                <ChannelRow
                                    title="Récemment regardées"
                                    icon={Clock}
                                    channels={recentlyWatched}
                                    onChannelClick={handlePlayChannel}
                                    favorites={favorites}
                                    onToggleFavorite={toggleFavorite}
                                />
                            )}

                            {/* Featured Row */}
                            {featuredChannels.length > 0 && (
                                <ChannelRow
                                    title="En Direct"
                                    icon={TrendingUp}
                                    channels={featuredChannels}
                                    onChannelClick={handlePlayChannel}
                                    favorites={favorites}
                                    onToggleFavorite={toggleFavorite}
                                />
                            )}

                            {/* French Quick Access */}
                            {frGroup && (
                                <div className="px-8">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                                        <span className="w-1 h-6 bg-[var(--color-accent)] rounded-full" />
                                        Catégories Françaises
                                    </h3>
                                    <div className="flex gap-3 flex-wrap">
                                        {frGroup.categories.slice(0, 8).map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => { setSelectedCountry(frGroup); setSelectedCategory(cat); }}
                                                className="px-5 py-3 glass-card hover:bg-white/10 hover:scale-105 transition-all text-sm font-medium cursor-pointer"
                                            >
                                                {cat.displayName}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Browse by Country Pills */}
                            <div className="px-8">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                                    <span className="w-1 h-6 bg-[var(--color-accent-secondary)] rounded-full" />
                                    Parcourir par Pays
                                </h3>
                                <div className="flex gap-3 flex-wrap">
                                    {countryGroups.slice(0, 12).map(country => (
                                        <button
                                            key={country.code}
                                            onClick={() => { setSelectedCountry(country); setSelectedCategory(null); }}
                                            className="px-4 py-2 glass-card hover:bg-white/10 hover:scale-105 transition-all text-sm font-medium flex items-center gap-2 cursor-pointer"
                                        >
                                            <Globe className="w-4 h-4 text-[var(--color-text-muted)]" />
                                            {country.code}
                                            <span className="text-[var(--color-text-muted)]">({country.categories.length})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {searchQuery && (
                        <div className="px-8">
                            <ContentSection
                                title={`Résultats pour "${searchQuery}"`}
                                loading={loading}
                                channels={channels}
                                onChannelClick={handlePlayChannel}
                                favorites={favorites}
                                onToggleFavorite={toggleFavorite}
                                emptyMessage={`Aucune chaîne trouvée pour "${searchQuery}"`}
                            />
                        </div>
                    )}

                    {/* Categories Grid */}
                    {selectedCountry && !selectedCategory && !searchQuery && (
                        <div className="px-8 space-y-8">
                            <h2 className="text-3xl font-bold flex items-center gap-4">
                                <span className="w-1 h-8 bg-[var(--color-accent)] rounded-full" />
                                {selectedCountry.code} - Catégories
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {selectedCountry.categories.map(cat => (
                                    <CategoryCard key={cat.id} category={cat} onClick={() => setSelectedCategory(cat)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Channels Grid */}
                    {selectedCategory && !searchQuery && (
                        <div className="px-8 space-y-6">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Retour à {selectedCountry?.code}
                            </button>
                            <ContentSection
                                title={selectedCategory.displayName}
                                loading={loading}
                                channels={channels}
                                onChannelClick={handlePlayChannel}
                                favorites={favorites}
                                onToggleFavorite={toggleFavorite}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Player Overlay */}
            <AnimatePresence>
                {selectedChannel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black"
                    >
                        <ErrorBoundary onClose={() => setSelectedChannel(null)}>
                            <Player
                                channel={selectedChannel}
                                onClose={() => setSelectedChannel(null)}
                                onPrevChannel={goToPrevChannel}
                                onNextChannel={goToNextChannel}
                                hasPrev={hasPrevChannel}
                                hasNext={hasNextChannel}
                            />
                        </ErrorBoundary>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EPG Panel */}
            <AnimatePresence>
                {epgChannel && (
                    <EpgPanel
                        channel={epgChannel}
                        onClose={() => setEpgChannel(null)}
                        onPlayChannel={(ch) => setSelectedChannel(ch)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// Netflix-style horizontal row
const ChannelRow = ({ title, icon: Icon, channels, onChannelClick, favorites, onToggleFavorite }) => {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir * 400, behavior: 'smooth' });
        }
    };

    return (
        <div className="relative group">
            <div className="px-8 mb-4 flex items-center gap-3">
                {Icon && <Icon className="w-5 h-5 text-[var(--color-accent)]" />}
                <h3 className="text-xl font-bold">{title}</h3>
                <span className="text-sm text-[var(--color-text-muted)]">({channels.length})</span>
            </div>

            <div className="relative">
                {canScrollLeft && (
                    <button
                        onClick={() => scroll(-1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-3 glass-card hover:bg-white/20 transition-all cursor-pointer"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                {canScrollRight && (
                    <button
                        onClick={() => scroll(1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-3 glass-card hover:bg-white/20 transition-all cursor-pointer"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}

                <div
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className="flex gap-4 overflow-x-auto px-8 pb-4"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
                >
                    {channels.map(ch => (
                        <ChannelCardLarge
                            key={ch.id}
                            channel={ch}
                            onClick={() => onChannelClick(ch)}
                            isFavorite={favorites?.some(f => f.id === ch.id)}
                            onToggleFavorite={onToggleFavorite}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Larger channel card for featured rows
const ChannelCardLarge = ({ channel, onClick, isFavorite, onToggleFavorite }) => (
    <motion.div
        whileHover={{ scale: 1.05, zIndex: 10 }}
        className="relative flex-shrink-0 w-[280px] aspect-video rounded-xl overflow-hidden cursor-pointer group glass-card"
        onClick={onClick}
    >
        {channel.logo ? (
            <img src={channel.logo} alt={channel.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" loading="lazy" />
        ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-accent)]/20 to-blue-600/20">
                <Tv className="w-12 h-12 text-[var(--color-text-muted)]" />
            </div>
        )}

        {/* Favorite Button */}
        <button
            onClick={(e) => onToggleFavorite(channel, e)}
            className="absolute top-3 right-3 p-2 rounded-full glass-card opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
        >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
            <h4 className="text-base font-bold text-white truncate">{channel.name}</h4>
            <div className="flex items-center gap-3 mt-2">
                <span className="badge-live">LIVE</span>
                <Play className="w-8 h-8 p-1.5 rounded-full bg-white/20 text-white" />
            </div>
        </div>
    </motion.div>
);

// Components
const NavItem = ({ icon: Icon, label, count, active, onClick, expanded }) => (
    <div
        onClick={onClick}
        className={`relative flex items-center h-12 mx-3 mb-1 rounded-xl cursor-pointer transition-all group
            ${active ? 'bg-white/5' : 'hover:bg-white/[0.03]'}`}
    >
        {active && (
            <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--color-accent)] rounded-r-full"
            />
        )}
        <div className={`flex items-center justify-center w-12 h-12 ${active ? 'text-white' : 'text-[var(--color-text-muted)]'} group-hover:text-white transition-colors`}>
            <Icon className="w-5 h-5" />
        </div>
        <AnimatePresence>
            {expanded && (
                <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center justify-between flex-1 pr-4 overflow-hidden"
                >
                    <span className={`text-sm font-medium whitespace-nowrap ${active ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}>
                        {label}
                    </span>
                    {count !== undefined && count > 0 && (
                        <span className="text-[10px] text-[var(--color-text-muted)] bg-white/5 px-2 py-0.5 rounded-full">
                            {count}
                        </span>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const CategoryCard = ({ category, onClick }) => (
    <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="glass-card p-6 cursor-pointer group"
    >
        <h3 className="font-semibold text-base truncate group-hover:text-[var(--color-accent)] transition-colors">
            {category.displayName}
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">Catégorie</p>
    </motion.div>
);

const ContentSection = ({ title, loading, channels, onChannelClick, favorites, onToggleFavorite, emptyMessage }) => (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold">{title}</h2>
        {loading ? (
            <GridSkeleton count={12} />
        ) : channels.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {channels.map(ch => (
                    <ChannelCard
                        key={ch.id}
                        channel={ch}
                        onClick={() => onChannelClick(ch)}
                        isFavorite={favorites?.some(f => f.id === ch.id)}
                        onToggleFavorite={onToggleFavorite}
                    />
                ))}
            </div>
        ) : (
            <EmptyState
                icon={Search}
                title="Aucune chaîne trouvée"
                message={emptyMessage || "Essayez une autre recherche ou sélectionnez une catégorie"}
            />
        )}
    </div>
);

const ChannelCard = ({ channel, onClick, isFavorite, onToggleFavorite }) => {
    // Detect quality from channel name
    const getQuality = (name) => {
        if (!name) return null;
        const upper = name.toUpperCase();
        if (upper.includes('4K') || upper.includes('UHD')) return '4K';
        if (upper.includes('FHD') || upper.includes('1080')) return 'FHD';
        if (upper.includes(' HD') || upper.includes('|HD') || upper.includes('720')) return 'HD';
        return null;
    };
    const quality = getQuality(channel.name);

    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -8 }}
            className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group glass-card"
            onClick={onClick}
        >
            {channel.logo ? (
                <img src={channel.logo} alt={channel.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" loading="lazy" />
            ) : (
                <ChannelInitials name={channel.name} />
            )}

            {/* Quality Badge */}
            {quality && (
                <div className="absolute top-2 left-2">
                    <QualityBadge quality={quality} />
                </div>
            )}

            {/* Favorite Button */}
            <button
                onClick={(e) => onToggleFavorite(channel, e)}
                className="absolute top-2 right-2 p-1.5 rounded-full glass-card opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
            >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <h4 className="text-sm font-bold text-white truncate">{channel.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                    <span className="badge-live">LIVE</span>
                    {quality && <QualityBadge quality={quality} />}
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
