import React from 'react';
import { motion } from 'framer-motion';

// Skeleton for channel cards
export const ChannelCardSkeleton = () => (
    <div className="aspect-video rounded-xl overflow-hidden glass-card animate-pulse">
        <div className="w-full h-full bg-white/5 relative">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer" />

            {/* Fake content structure */}
            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                <div className="h-4 w-3/4 bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-white/5 rounded" />
            </div>
        </div>
    </div>
);

// Skeleton for category cards
export const CategoryCardSkeleton = () => (
    <div className="aspect-[4/3] rounded-xl overflow-hidden glass-card animate-pulse">
        <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10" />
            <div className="h-4 w-20 bg-white/10 rounded" />
        </div>
    </div>
);

// Skeleton for the channel row (horizontal scroll)
export const ChannelRowSkeleton = ({ count = 6 }) => (
    <div className="space-y-4">
        {/* Title skeleton */}
        <div className="flex items-center gap-4 px-8">
            <div className="w-1 h-6 bg-[var(--color-accent)]/50 rounded-full" />
            <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Cards skeleton */}
        <div className="flex gap-4 px-8 overflow-hidden">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex-shrink-0 w-64"
                >
                    <ChannelCardSkeleton />
                </motion.div>
            ))}
        </div>
    </div>
);

// Skeleton for the grid layout
export const ChannelGridSkeleton = ({ count = 12 }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-8">
        {Array.from({ length: count }).map((_, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
            >
                <ChannelCardSkeleton />
            </motion.div>
        ))}
    </div>
);

// Skeleton for profile selection
export const ProfileSkeleton = () => (
    <div className="flex flex-col items-center">
        <div className="w-28 h-28 rounded-2xl bg-white/10 animate-pulse" />
        <div className="mt-4 h-5 w-20 bg-white/10 rounded animate-pulse" />
        <div className="mt-2 h-3 w-16 bg-white/5 rounded animate-pulse" />
    </div>
);

export default {
    ChannelCardSkeleton,
    CategoryCardSkeleton,
    ChannelRowSkeleton,
    ChannelGridSkeleton,
    ProfileSkeleton
};
