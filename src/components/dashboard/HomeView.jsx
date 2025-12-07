import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Play, Heart, Clock, TrendingUp, Globe } from 'lucide-react';
import ChannelRow from './ChannelRow';

const HomeView = ({
    frGroup,
    favorites,
    recentlyWatched,
    featuredChannels,
    countryGroups,
    setSelectedCountry,
    setSelectedCategory,
    handlePlayChannel,
    toggleFavorite,
    setHoveredChannel
}) => {
    return (
        <div className="space-y-10">
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
                    onHover={setHoveredChannel}
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
                    onHover={setHoveredChannel}
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
                    onHover={setHoveredChannel}
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
    );
};

export default HomeView;
