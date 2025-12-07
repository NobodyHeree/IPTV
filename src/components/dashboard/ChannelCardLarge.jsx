import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Tv, Play } from 'lucide-react';

const ChannelCardLarge = ({ channel, onClick, isFavorite, onToggleFavorite, onHover }) => (
    <motion.div
        whileHover={{ scale: 1.05, zIndex: 10 }}
        className="relative flex-shrink-0 w-[280px] aspect-video rounded-xl overflow-hidden cursor-pointer group glass-card"
        onClick={onClick}
        onMouseEnter={() => onHover?.(channel)}
        onMouseLeave={() => onHover?.(null)}
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

export default ChannelCardLarge;
