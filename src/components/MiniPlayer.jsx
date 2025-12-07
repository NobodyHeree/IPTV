import React from 'react';
import { motion } from 'framer-motion';
import { X, Maximize2, Volume2, VolumeX } from 'lucide-react';

/**
 * Mini Player - A compact floating player for background viewing
 * Appears in the corner of the screen when minimized
 */
const MiniPlayer = ({
    channel,
    videoRef,
    isPlaying,
    isMuted,
    onExpand,
    onClose,
    onToggleMute,
    position = 'bottom-right'
}) => {
    // Position classes
    const positions = {
        'top-left': 'top-4 left-4',
        'top-right': 'top-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-right': 'bottom-4 right-4'
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            drag
            dragMomentum={false}
            className={`fixed ${positions[position]} z-50 w-80 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black cursor-move`}
        >
            {/* Video Container */}
            <div className="relative aspect-video bg-black">
                {/* Video element is passed via ref, we clone it here */}
                <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center">
                    {/* Placeholder when video not loaded */}
                    <div className="text-sm text-white/50">
                        {isPlaying ? '▶ En cours...' : '⏸ En pause'}
                    </div>
                </div>

                {/* Channel indicator */}
                <div className="absolute top-2 left-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                        LIVE
                    </span>
                </div>

                {/* Controls overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                        <div className="flex-1 truncate">
                            <span className="text-sm font-medium text-white truncate">
                                {channel?.name || 'Channel'}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleMute?.(); }}
                                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                            >
                                {isMuted ? (
                                    <VolumeX className="w-4 h-4 text-white" />
                                ) : (
                                    <Volume2 className="w-4 h-4 text-white" />
                                )}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onExpand?.(); }}
                                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <Maximize2 className="w-4 h-4 text-white" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MiniPlayer;
