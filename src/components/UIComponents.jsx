import React from 'react';
import { motion } from 'framer-motion';

// Skeleton loader for channel cards
export const ChannelCardSkeleton = () => (
    <div className="aspect-video rounded-xl overflow-hidden glass-card animate-pulse">
        <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
    </div>
);

// Skeleton loader for large featured cards
export const ChannelCardLargeSkeleton = () => (
    <div className="flex-shrink-0 w-[280px] aspect-video rounded-xl overflow-hidden glass-card animate-pulse">
        <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10" />
    </div>
);

// Skeleton loader for rows
export const RowSkeleton = ({ count = 5 }) => (
    <div className="space-y-4">
        <div className="h-6 bg-white/10 rounded w-48 animate-pulse" />
        <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: count }).map((_, i) => (
                <ChannelCardLargeSkeleton key={i} />
            ))}
        </div>
    </div>
);

// Grid skeleton for channel grid
export const GridSkeleton = ({ count = 12 }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: count }).map((_, i) => (
            <ChannelCardSkeleton key={i} />
        ))}
    </div>
);

// Empty state component with icon and message
export const EmptyState = ({ icon: Icon, title, message, action }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center mb-6">
            <Icon className="w-10 h-10 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-[var(--color-text-muted)] max-w-sm mb-6">{message}</p>
        {action && action}
    </motion.div>
);

// Quality badge component
export const QualityBadge = ({ quality }) => {
    const badges = {
        '4K': { bg: 'bg-purple-500/80', text: '4K' },
        'UHD': { bg: 'bg-purple-500/80', text: 'UHD' },
        'FHD': { bg: 'bg-blue-500/80', text: 'FHD' },
        'HD': { bg: 'bg-green-500/80', text: 'HD' },
        'SD': { bg: 'bg-gray-500/60', text: 'SD' },
    };

    // Detect quality from channel name
    const detectQuality = (name) => {
        if (!name) return null;
        const upper = name.toUpperCase();
        if (upper.includes('4K') || upper.includes('UHD')) return '4K';
        if (upper.includes('FHD') || upper.includes('1080')) return 'FHD';
        if (upper.includes(' HD') || upper.includes('|HD') || upper.includes('720')) return 'HD';
        return null;
    };

    const detected = quality || detectQuality(quality);
    if (!detected || !badges[detected]) return null;

    const badge = badges[detected];
    return (
        <span className={`${badge.bg} text-white text-[10px] font-bold px-1.5 py-0.5 rounded`}>
            {badge.text}
        </span>
    );
};

// Channel initials placeholder
export const ChannelInitials = ({ name, className = "" }) => {
    const getInitials = (name) => {
        if (!name) return '?';
        // Remove country codes and special chars
        const clean = name.replace(/^[\|┃]?\s*[A-Z]{2,3}\s*[\|┃]?\s*/i, '').trim();
        const words = clean.split(/\s+/).filter(w => w.length > 0);
        if (words.length === 0) return name.substring(0, 2).toUpperCase();
        if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
        return (words[0][0] + words[1][0]).toUpperCase();
    };

    // Generate consistent color from name
    const getColor = (name) => {
        const colors = [
            'from-red-500 to-pink-500',
            'from-orange-500 to-red-500',
            'from-yellow-500 to-orange-500',
            'from-green-500 to-teal-500',
            'from-teal-500 to-cyan-500',
            'from-blue-500 to-indigo-500',
            'from-indigo-500 to-purple-500',
            'from-purple-500 to-pink-500',
        ];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getColor(name)} ${className}`}>
            <span className="text-white font-bold text-2xl drop-shadow-lg">
                {getInitials(name)}
            </span>
        </div>
    );
};

// Loading spinner
export const Spinner = ({ size = "md", className = "" }) => {
    const sizes = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12"
    };
    return (
        <div className={`${sizes[size]} border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin ${className}`} />
    );
};

export default {
    ChannelCardSkeleton,
    ChannelCardLargeSkeleton,
    RowSkeleton,
    GridSkeleton,
    EmptyState,
    QualityBadge,
    ChannelInitials,
    Spinner
};
