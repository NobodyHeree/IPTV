import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import Player from './Player';
import MiniPlayer from './MiniPlayer';
import SpotlightSearch from './SpotlightSearch';
import ErrorBoundary from './ErrorBoundary';
import EpgPanel from './EpgPanel';
import AmbientBackground from './AmbientBackground';

// Dashboard Components
import Sidebar from './dashboard/Sidebar';
import Header from './dashboard/Header';
import HomeView from './dashboard/HomeView';
import ChannelGrid from './dashboard/ChannelGrid';
import CategoryCard from './dashboard/CategoryCard';
import SettingsView from './dashboard/SettingsView';

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
    const [showSettingsView, setShowSettingsView] = useState(false);
    const [epgChannel, setEpgChannel] = useState(null); // Channel for EPG panel
    const [epgData, setEpgData] = useState({});
    const [hoveredChannel, setHoveredChannel] = useState(null);
    const [miniPlayerChannel, setMiniPlayerChannel] = useState(null); // For mini-player
    const [isMiniPlayerMuted, setIsMiniPlayerMuted] = useState(false);
    const [showSpotlight, setShowSpotlight] = useState(false); // Spotlight search

    // Global keyboard shortcut for Spotlight (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowSpotlight(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Fetch EPG when channels are loaded
    useEffect(() => {
        const fetchEpg = async () => {
            if (channels.length === 0) return;
            try {
                // Fetch 2 hours of EPG to get current programs
                const epg = await window.api.getAllEpg(2);
                if (epg && Array.isArray(epg)) {
                    // Map EPG data for easier lookup: channelId -> current program
                    const epgMap = {};
                    const now = Math.floor(Date.now() / 1000);

                    epg.forEach(program => {
                        const start = parseInt(program.start_timestamp, 10);
                        const end = parseInt(program.stop_timestamp, 10);

                        // Check if program is currently playing
                        if (now >= start && now < end) {
                            epgMap[program.ch_id] = {
                                title: program.name,
                                start: start,
                                end: end,
                                duration: end - start
                            };
                        }
                    });
                    setEpgData(epgMap);
                }
            } catch (err) {
                console.error("Failed to fetch EPG", err);
            }
        };

        fetchEpg();

        // Refresh EPG every 5 minutes
        const interval = setInterval(fetchEpg, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [channels]);

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

    const frGroup = countryGroups.find(g => g.code === 'FR');

    return (
        <div className="relative min-h-screen bg-[var(--color-surface-solid)] overflow-hidden">
            {/* Dynamic Ambiance */}
            <AmbientBackground imageUrl={hoveredChannel?.logo || (featuredChannels.length > 0 ? featuredChannels[0].logo : null)} />

            {/* Spotlight Search Overlay */}
            <AnimatePresence>
                {showSpotlight && (
                    <SpotlightSearch
                        isOpen={showSpotlight}
                        onClose={() => setShowSpotlight(false)}
                        onSelectChannel={(ch) => {
                            handlePlayChannel(ch);
                            setShowSpotlight(false);
                        }}
                        onNavigate={(target) => {
                            if (target === 'favorites') {
                                setShowFavoritesView(true);
                                setSelectedCountry(null);
                                setSelectedCategory(null);
                                setShowSettingsView(false);
                            } else if (target === 'settings') {
                                setShowSettingsView(true);
                                setSelectedCountry(null);
                                setSelectedCategory(null);
                                setShowFavoritesView(false);
                            }
                        }}
                        favorites={favorites}
                        recentChannels={recentlyWatched}
                    />
                )}
            </AnimatePresence>

            <div className="relative z-10 flex h-screen w-screen overflow-hidden bg-transparent">
                {/* Sidebar */}
                <Sidebar
                    sidebarExpanded={sidebarExpanded}
                    setSidebarExpanded={setSidebarExpanded}
                    selectedCountry={selectedCountry}
                    setSelectedCountry={setSelectedCountry}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showFavoritesView={showFavoritesView}
                    setShowFavoritesView={setShowFavoritesView}
                    showSettingsView={showSettingsView}
                    setShowSettingsView={setShowSettingsView}
                    setSelectedCategory={setSelectedCategory}
                    favoritesCount={favorites.length}
                    countryGroups={countryGroups}
                    profile={profile}
                    onSwitchProfile={onSwitchProfile}
                    onLogout={onLogout}
                />

                {/* Main Content */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    {/* Search Bar */}
                    <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

                    {/* Content Area */}
                    <div className={`flex-1 pt-24 ${(!selectedCategory && !searchQuery && !showFavoritesView && !showSettingsView) ? 'overflow-y-auto' : 'overflow-hidden'}`}>

                        {/* SETTINGS VIEW */}
                        {showSettingsView && (
                            <SettingsView />
                        )}

                        {/* FAVORITES VIEW */}
                        {showFavoritesView && (
                            <ChannelGrid
                                title="Mes Favoris"
                                channels={favorites}
                                onChannelClick={handlePlayChannel}
                                favorites={favorites}
                                onToggleFavorite={toggleFavorite}
                                emptyMessage="Aucun favori pour l'instant"
                                onHover={setHoveredChannel}
                            />
                        )}

                        {/* NETFLIX-STYLE HOME */}
                        {!selectedCountry && !selectedCategory && !searchQuery && !showFavoritesView && !showSettingsView && (
                            <div className="pb-8">
                                <HomeView
                                    frGroup={frGroup}
                                    favorites={favorites}
                                    recentlyWatched={recentlyWatched}
                                    featuredChannels={featuredChannels}
                                    countryGroups={countryGroups}
                                    setSelectedCountry={setSelectedCountry}
                                    setSelectedCategory={setSelectedCategory}
                                    handlePlayChannel={handlePlayChannel}
                                    toggleFavorite={toggleFavorite}
                                    setHoveredChannel={setHoveredChannel}
                                />
                            </div>
                        )}

                        {/* Search Results */}
                        {searchQuery && (
                            <ChannelGrid
                                title={`Résultats pour "${searchQuery}"`}
                                loading={loading}
                                channels={channels}
                                onChannelClick={handlePlayChannel}
                                favorites={favorites}
                                onToggleFavorite={toggleFavorite}
                                emptyMessage={`Aucune chaîne trouvée pour "${searchQuery}"`}
                                onHover={setHoveredChannel}
                            />
                        )}

                        {/* Categories Grid */}
                        {selectedCountry && !selectedCategory && !searchQuery && (
                            <div className="px-8 space-y-8 pb-8 overflow-y-auto h-full">
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
                            <div className="flex flex-col h-full">
                                <div className="px-8 mb-4 shrink-0">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Retour à {selectedCountry?.code}
                                    </button>
                                </div>
                                <ChannelGrid
                                    title={selectedCategory.displayName}
                                    loading={loading}
                                    channels={channels}
                                    onChannelClick={handlePlayChannel}
                                    favorites={favorites}
                                    onToggleFavorite={toggleFavorite}
                                    epgData={epgData}
                                    onHover={setHoveredChannel}
                                />
                            </div>
                        )}

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
                                            program={epgData?.[selectedChannel.id]}
                                            onClose={() => setSelectedChannel(null)}
                                            onMinimize={() => {
                                                setMiniPlayerChannel(selectedChannel);
                                                setSelectedChannel(null);
                                            }}
                                            onPrevChannel={goToPrevChannel}
                                            onNextChannel={goToNextChannel}
                                            hasPrev={hasPrevChannel}
                                            hasNext={hasNextChannel}
                                        />
                                    </ErrorBoundary>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Mini Player (floating) */}
                        <AnimatePresence>
                            {miniPlayerChannel && !selectedChannel && (
                                <MiniPlayer
                                    channel={miniPlayerChannel}
                                    isPlaying={true}
                                    isMuted={isMiniPlayerMuted}
                                    onToggleMute={() => setIsMiniPlayerMuted(!isMiniPlayerMuted)}
                                    onExpand={() => {
                                        setSelectedChannel(miniPlayerChannel);
                                        setMiniPlayerChannel(null);
                                    }}
                                    onClose={() => setMiniPlayerChannel(null)}
                                />
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
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
