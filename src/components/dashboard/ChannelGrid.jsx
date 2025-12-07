import React from 'react';
import { Search } from 'lucide-react';
import { VirtuosoGrid } from 'react-virtuoso';
import { GridSkeleton, EmptyState } from '../UIComponents';
import ChannelCard from './ChannelCard';

const ChannelGrid = ({
    title,
    loading,
    channels,
    onChannelClick,
    favorites,
    onToggleFavorite,
    emptyMessage,
    epgData,
    onHover
}) => {
    if (loading) {
        return (
            <div className="h-full p-8 overflow-hidden">
                <h2 className="text-3xl font-bold mb-6">{title}</h2>
                <GridSkeleton count={18} />
            </div>
        );
    }

    if (channels.length === 0) {
        return (
            <div className="h-full p-8">
                <h2 className="text-3xl font-bold mb-6">{title}</h2>
                <EmptyState
                    icon={Search}
                    title="Aucune chaîne trouvée"
                    message={emptyMessage || "Essayez une autre recherche ou sélectionnez une catégorie"}
                />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="px-8 pb-4 shrink-0">
                <h2 className="text-3xl font-bold">{title}</h2>
            </div>

            <div className="flex-1 px-8">
                <VirtuosoGrid
                    style={{ height: '100%' }}
                    totalCount={channels.length}
                    components={{
                        List: React.forwardRef(({ style, children, ...props }, ref) => (
                            <div
                                ref={ref}
                                {...props}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                    gap: '1rem',
                                    paddingBottom: '2rem',
                                    ...style,
                                }}
                            >
                                {children}
                            </div>
                        ))
                    }}
                    itemContent={(index) => {
                        const ch = channels[index];
                        return (
                            <ChannelCard
                                key={ch.id}
                                channel={ch}
                                program={epgData?.[ch.id]}
                                onClick={() => onChannelClick(ch)}
                                isFavorite={favorites?.some(f => f.id === ch.id)}
                                onToggleFavorite={onToggleFavorite}
                                onHover={onHover}
                            />
                        );
                    }}
                />
            </div>
        </div>
    );
};

export default ChannelGrid;
