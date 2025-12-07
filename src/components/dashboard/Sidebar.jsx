import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, Home, Heart, Globe, Users, LogOut, Settings } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

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

// Country code to flag emoji converter
// Country code to flag image URL converter
const getCountryFlag = (code) => {
    if (!code || code === 'OTHER') return null;
    // Handle special cases
    const map = {
        'UK': 'gb',
        'COM': 'us', // frequent mixup
    };
    const countryCode = map[code] || code.toLowerCase();
    return `https://flagcdn.com/w40/${countryCode}.png`;
};

const Sidebar = ({
    sidebarExpanded,
    setSidebarExpanded,
    selectedCountry,
    setSelectedCountry,
    searchQuery,
    setSearchQuery,
    showFavoritesView,
    setShowFavoritesView,
    showSettingsView,
    setShowSettingsView,
    setSelectedCategory,
    favoritesCount,
    countryGroups,
    profile,
    onSwitchProfile,
    onLogout
}) => {
    const { t } = useSettings();
    return (
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Tv className="w-5 h-5 text-white" />
                    </div>
                    <AnimatePresence>
                        {sidebarExpanded && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="font-bold text-xl tracking-wider text-gradient overflow-hidden whitespace-nowrap"
                            >
                                AURA
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Nav Items */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
                <NavItem
                    icon={Home}
                    label={t('nav.home')}
                    active={!selectedCountry && !searchQuery && !showFavoritesView && !showSettingsView}
                    onClick={() => { setSelectedCountry(null); setSelectedCategory(null); setSearchQuery(''); setShowFavoritesView(false); setShowSettingsView(false); }}
                    expanded={sidebarExpanded}
                />
                <NavItem
                    icon={Heart}
                    label={t('nav.favorites')}
                    count={favoritesCount}
                    active={showFavoritesView}
                    onClick={() => { setShowFavoritesView(true); setSelectedCountry(null); setSelectedCategory(null); setSearchQuery(''); setShowSettingsView(false); }}
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
                        onClick={() => {
                            setSelectedCountry(country);
                            setSelectedCategory(null);
                            setSearchQuery('');
                            setShowFavoritesView(false);
                            setShowSettingsView(false);
                        }}
                        className={`group flex items-center mx-2 py-1 rounded-xl cursor-pointer transition-all duration-200 ${selectedCountry?.code === country.code ? 'bg-[var(--color-accent)]/20 text-white' : 'hover:bg-white/5 text-[var(--color-text-muted)]'}`}
                    >
                        <div className={`flex items-center justify-center w-12 h-10 flex-shrink-0`}>
                            {getCountryFlag(country.code) ? (
                                <img
                                    src={getCountryFlag(country.code)}
                                    alt={country.code}
                                    className="w-6 h-auto rounded-sm shadow-sm opacity-90 group-hover:opacity-100 transition-opacity"
                                    onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '🌍'; }}
                                />
                            ) : (
                                <Globe className="w-5 h-5 opacity-70" />
                            )}
                        </div>
                        <AnimatePresence>
                            {sidebarExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="flex items-center justify-between flex-1 pr-4 overflow-hidden"
                                >
                                    <span className={`text-sm font-medium whitespace-nowrap ${selectedCountry?.code === country.code ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}>
                                        {country.code}
                                    </span>
                                    <span className="text-[10px] text-[var(--color-text-muted)] bg-white/5 px-2 py-0.5 rounded-full">
                                        {country.categories.length}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
                    <NavItem icon={Users} label={t('nav.profile')} onClick={onSwitchProfile} expanded={sidebarExpanded} />
                )}
                <NavItem
                    icon={Settings}
                    label={t('nav.settings')}
                    active={showSettingsView}
                    onClick={() => { setShowSettingsView(true); setSelectedCountry(null); setSelectedCategory(null); setSearchQuery(''); setShowFavoritesView(false); }}
                    expanded={sidebarExpanded}
                />
                <NavItem icon={LogOut} label={t('nav.logout')} onClick={onLogout} expanded={sidebarExpanded} />
            </div>
        </motion.div >
    );
};

export default Sidebar;
