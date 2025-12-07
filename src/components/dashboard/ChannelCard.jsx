import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { QualityBadge, ChannelInitials } from '../UIComponents';

const ChannelCard = ({ channel, program, onClick, isFavorite, onToggleFavorite, onHover }) => {
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

    // Calculate progress
    const progress = useMemo(() => {
        if (!program) return 0;
        const now = Math.floor(Date.now() / 1000);
        const p = ((now - program.start) / (program.end - program.start)) * 100;
        return Math.min(Math.max(p, 0), 100);
    }, [program]);

    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -8 }}
            className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group glass-card"
            onClick={onClick}
            onMouseEnter={() => onHover?.(channel)}
            onMouseLeave={() => onHover?.(null)}
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

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <h4 className="text-sm font-bold text-white truncate mb-1">{channel.name}</h4>

                {program ? (
                    <div className="space-y-1.5">
                        <p className="text-xs text-[var(--color-text-secondary)] truncate">{program.title}</p>
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--color-accent)] rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="badge-live">LIVE</span>
                        {quality && <QualityBadge quality={quality} />}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ChannelCard;
