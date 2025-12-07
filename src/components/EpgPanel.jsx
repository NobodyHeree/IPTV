import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, ChevronLeft, ChevronRight, Tv, Radio, Play } from 'lucide-react';

// Format timestamp to readable time
const formatTime = (timestamp) => {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// Format timestamp to date
const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
};

// Calculate progress percentage
const getProgress = (start, end) => {
    const now = Date.now() / 1000;
    if (now < start) return 0;
    if (now > end) return 100;
    return ((now - start) / (end - start)) * 100;
};

// Check if program is currently live
const isLive = (start, end) => {
    const now = Date.now() / 1000;
    return now >= start && now <= end;
};

const EpgPanel = ({ channel, onClose, onPlayChannel }) => {
    const [epgData, setEpgData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEpg = async () => {
            if (!channel?.id) return;

            setLoading(true);
            setError(null);

            try {
                const res = await window.api.getShortEpg(channel.id);
                if (res.success && res.epg) {
                    // EPG data can be array or object, normalize it
                    const programs = Array.isArray(res.epg) ? res.epg :
                        res.epg.data ? res.epg.data : [];
                    setEpgData(programs);
                } else {
                    setEpgData([]);
                }
            } catch (err) {
                console.error('EPG fetch error:', err);
                setError('Impossible de charger le guide des programmes');
            } finally {
                setLoading(false);
            }
        };

        fetchEpg();
    }, [channel?.id]);

    // Find current program
    const currentProgram = epgData.find(p => isLive(p.start_timestamp, p.stop_timestamp));
    const upcomingPrograms = epgData.filter(p => !isLive(p.start_timestamp, p.stop_timestamp) && p.start_timestamp > Date.now() / 1000);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-purple-600 flex items-center justify-center">
                            <Tv className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{channel?.name || 'Guide des programmes'}</h2>
                            <p className="text-sm text-[var(--color-text-muted)]">Programme TV</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-12 text-[var(--color-text-muted)]">
                            <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && epgData.length === 0 && (
                        <div className="text-center py-12 text-[var(--color-text-muted)]">
                            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucun programme disponible</p>
                            <p className="text-sm mt-2">Le guide des programmes n'est pas disponible pour cette chaîne</p>
                        </div>
                    )}

                    {!loading && !error && epgData.length > 0 && (
                        <div className="space-y-4">
                            {/* Current Program */}
                            {currentProgram && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
                                        <span className="badge-live">EN DIRECT</span>
                                        Maintenant
                                    </h3>
                                    <div className="glass-card p-4 border-l-4 border-[var(--color-accent)]">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-lg">{currentProgram.name || 'Programme'}</h4>
                                            <span className="text-sm text-[var(--color-text-muted)]">
                                                {formatTime(currentProgram.start_timestamp)} - {formatTime(currentProgram.stop_timestamp)}
                                            </span>
                                        </div>
                                        {currentProgram.descr && (
                                            <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">
                                                {currentProgram.descr}
                                            </p>
                                        )}
                                        {/* Progress bar */}
                                        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[var(--color-accent)] rounded-full transition-all"
                                                style={{ width: `${getProgress(currentProgram.start_timestamp, currentProgram.stop_timestamp)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Upcoming Programs */}
                            {upcomingPrograms.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">
                                        À suivre
                                    </h3>
                                    <div className="space-y-2">
                                        {upcomingPrograms.slice(0, 8).map((program, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 min-w-[100px] text-sm text-[var(--color-text-muted)]">
                                                    <Clock className="w-4 h-4" />
                                                    {formatTime(program.start_timestamp)}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium">{program.name || 'Programme'}</h4>
                                                    {program.descr && (
                                                        <p className="text-sm text-[var(--color-text-muted)] line-clamp-1">
                                                            {program.descr}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-sm text-[var(--color-text-muted)]">
                                                    {formatTime(program.stop_timestamp)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={() => {
                            onPlayChannel?.(channel);
                            onClose();
                        }}
                        className="btn-primary w-full flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Play className="w-5 h-5" />
                        Regarder {channel?.name}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default EpgPanel;
