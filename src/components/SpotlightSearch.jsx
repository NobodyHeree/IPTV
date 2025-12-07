import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Tv, Heart, Settings, Clock, ArrowRight } from 'lucide-react';

/**
 * SpotlightSearch - A global search overlay (Cmd+K / Ctrl+K style)
 * Provides quick access to channels, favorites, and navigation
 */
const SpotlightSearch = ({
    isOpen,
    onClose,
    onSelectChannel,
    onNavigate,
    favorites = [],
    recentChannels = []
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Search debounce
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await window.api.searchChannels(query);
                if (res.success) {
                    setResults(res.channels.slice(0, 8));
                }
            } catch (e) {
                console.error('Search error:', e);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e) => {
        const totalItems = results.length + (query.length < 2 ? favorites.slice(0, 3).length + recentChannels.slice(0, 3).length : 0);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, totalItems - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (results.length > 0 && selectedIndex < results.length) {
                    onSelectChannel?.(results[selectedIndex]);
                    onClose();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [results, selectedIndex, favorites, recentChannels, query, onSelectChannel, onClose]);

    // Quick actions when no query
    const quickActions = [
        { id: 'favorites', label: 'Voir les favoris', icon: Heart, action: () => onNavigate?.('favorites') },
        { id: 'settings', label: 'Paramètres', icon: Settings, action: () => onNavigate?.('settings') },
    ];

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-xl bg-[var(--color-surface-solid)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                {/* Search Input */}
                <div className="flex items-center gap-4 p-4 border-b border-white/10">
                    <Search className="w-5 h-5 text-[var(--color-text-muted)]" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                        placeholder="Rechercher une chaîne..."
                        className="flex-1 bg-transparent text-lg text-white placeholder-[var(--color-text-muted)] outline-none"
                    />
                    <kbd className="px-2 py-1 bg-white/10 rounded text-xs text-[var(--color-text-muted)]">ESC</kbd>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto scrollbar-hide">
                    {/* Loading */}
                    {loading && (
                        <div className="p-4 text-center text-[var(--color-text-muted)]">
                            Recherche en cours...
                        </div>
                    )}

                    {/* Search Results */}
                    {!loading && results.length > 0 && (
                        <div className="p-2">
                            <div className="px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                                Chaînes
                            </div>
                            {results.map((channel, index) => (
                                <button
                                    key={channel.id}
                                    onClick={() => { onSelectChannel?.(channel); onClose(); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer
                                        ${selectedIndex === index ? 'bg-[var(--color-accent)]/20 text-white' : 'hover:bg-white/5 text-[var(--color-text-secondary)]'}`}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                                        {channel.logo ? (
                                            <img src={channel.logo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Tv className="w-5 h-5 text-[var(--color-text-muted)]" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-medium text-white">{channel.name}</div>
                                        {channel.genre && (
                                            <div className="text-xs text-[var(--color-text-muted)]">{channel.genre}</div>
                                        )}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Empty state when query but no results */}
                    {!loading && query.length >= 2 && results.length === 0 && (
                        <div className="p-8 text-center text-[var(--color-text-muted)]">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Aucun résultat pour "{query}"</p>
                        </div>
                    )}

                    {/* Quick actions when no query */}
                    {query.length < 2 && !loading && (
                        <div className="p-2">
                            {/* Recent channels */}
                            {recentChannels.length > 0 && (
                                <>
                                    <div className="px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        Récents
                                    </div>
                                    {recentChannels.slice(0, 3).map((channel, index) => (
                                        <button
                                            key={channel.id}
                                            onClick={() => { onSelectChannel?.(channel); onClose(); }}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer
                                                ${selectedIndex === index ? 'bg-[var(--color-accent)]/20' : 'hover:bg-white/5'}`}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                                <Tv className="w-4 h-4 text-[var(--color-text-muted)]" />
                                            </div>
                                            <span className="text-white">{channel.name}</span>
                                        </button>
                                    ))}
                                </>
                            )}

                            {/* Quick actions */}
                            <div className="px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase mt-2">
                                Actions rapides
                            </div>
                            {quickActions.map((action, index) => {
                                const Icon = action.icon;
                                const isSelected = selectedIndex === recentChannels.slice(0, 3).length + index;
                                return (
                                    <button
                                        key={action.id}
                                        onClick={() => { action.action(); onClose(); }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer
                                            ${isSelected ? 'bg-[var(--color-accent)]/20' : 'hover:bg-white/5'}`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                            <Icon className="w-4 h-4 text-[var(--color-text-muted)]" />
                                        </div>
                                        <span className="text-[var(--color-text-secondary)]">{action.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑</kbd>
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↓</kbd>
                            naviguer
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↵</kbd>
                            sélectionner
                        </span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SpotlightSearch;
