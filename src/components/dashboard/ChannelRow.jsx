import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ChannelCardLarge from './ChannelCardLarge';

const ChannelRow = ({ title, icon: Icon, channels, onChannelClick, favorites, onToggleFavorite, onHover }) => {
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
                            onHover={onHover}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChannelRow;
