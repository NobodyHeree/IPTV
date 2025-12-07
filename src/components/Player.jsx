import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { X, RefreshCw, Volume2, VolumeX, Maximize, Minimize, Minimize2, Play, Pause, Loader2, PictureInPicture2, AlertTriangle, SkipBack, SkipForward, Calendar, List, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseError } from '../utils/errors';
import { useSettings } from '../contexts/SettingsContext';

const Player = ({ channel, program, onClose, onMinimize, onPrevChannel, onNextChannel, hasPrev, hasNext }) => {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const containerRef = useRef(null);
    const [streamUrl, setStreamUrl] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPiP, setIsPiP] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentProgram, setCurrentProgram] = useState(program || null);
    const [showInfo, setShowInfo] = useState(false);
    const [reconnectCount, setReconnectCount] = useState(0);
    const [bufferHealth, setBufferHealth] = useState('good'); // 'good', 'warning', 'critical'
    const [showVolumeOSD, setShowVolumeOSD] = useState(false);
    const hideControlsTimer = useRef(null);
    const watchdogTimer = useRef(null);
    const volumeOSDTimer = useRef(null);
    const lastPlaybackTime = useRef(0);
    const { settings } = useSettings();

    // Monitor buffer health
    useEffect(() => {
        if (!isPlaying || !videoRef.current) return;

        const checkBuffer = () => {
            if (!videoRef.current) return;
            const buffered = videoRef.current.buffered;
            if (buffered.length > 0) {
                const bufferedEnd = buffered.end(buffered.length - 1);
                const bufferAhead = bufferedEnd - videoRef.current.currentTime;

                if (bufferAhead < 2) {
                    setBufferHealth('critical');
                } else if (bufferAhead < 5) {
                    setBufferHealth('warning');
                } else {
                    setBufferHealth('good');
                }
            }
        };

        const interval = setInterval(checkBuffer, 2000);
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Watchdog: Detect stalled playback and auto-reconnect
    useEffect(() => {
        if (!videoRef.current || !isPlaying || error) return;

        watchdogTimer.current = setInterval(() => {
            const video = videoRef.current;
            if (!video) return;

            // Check if playback is stalled (time hasn't advanced in 8 seconds)
            if (video.currentTime === lastPlaybackTime.current && !video.paused && !loading) {
                console.warn('[Watchdog] Playback stalled, attempting reconnect...');
                setReconnectCount(prev => prev + 1);
                startStream();
            }
            lastPlaybackTime.current = video.currentTime;
        }, 8000);

        return () => {
            if (watchdogTimer.current) clearInterval(watchdogTimer.current);
        };
    }, [isPlaying, error, loading]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'ArrowLeft':
                    if (hasPrev) {
                        e.preventDefault();
                        onPrevChannel?.();
                    }
                    break;
                case 'ArrowRight':
                    if (hasNext) {
                        e.preventDefault();
                        onNextChannel?.();
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setVolume(v => Math.min(1, v + 0.1));
                    if (videoRef.current) videoRef.current.volume = Math.min(1, volume + 0.1);
                    // Show volume OSD
                    setShowVolumeOSD(true);
                    if (volumeOSDTimer.current) clearTimeout(volumeOSDTimer.current);
                    volumeOSDTimer.current = setTimeout(() => setShowVolumeOSD(false), 1500);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setVolume(v => Math.max(0, v - 0.1));
                    if (videoRef.current) videoRef.current.volume = Math.max(0, volume - 0.1);
                    // Show volume OSD
                    setShowVolumeOSD(true);
                    if (volumeOSDTimer.current) clearTimeout(volumeOSDTimer.current);
                    volumeOSDTimer.current = setTimeout(() => setShowVolumeOSD(false), 1500);
                    break;
                case 'i':
                    e.preventDefault();
                    setShowInfo(prev => !prev);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasPrev, hasNext, volume]);

    // Fetch EPG for current channel if needed
    useEffect(() => {
        if (program) {
            setCurrentProgram(program);
        } else {
            const fetchEpg = async () => {
                if (!channel?.id) return;
                try {
                    const res = await window.api.getShortEpg(channel.id);
                    if (res.success && res.epg) {
                        const programs = Array.isArray(res.epg) ? res.epg : res.epg.data || [];
                        const now = Date.now() / 1000;
                        const current = programs.find(p => now >= p.start_timestamp && now <= p.stop_timestamp);
                        setCurrentProgram(current || null);
                    }
                } catch (e) {
                    console.error('EPG fetch failed:', e);
                }
            };
            fetchEpg();
        }
    }, [channel?.id, program]);

    // Format seconds to MM:SS or HH:MM:SS
    const formatTime = (seconds) => {
        if (!isFinite(seconds) || isNaN(seconds)) return '00:00';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startStream = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setCurrentTime(0);
            setDuration(0);
            const cmd = channel.cmd || `ffrt http://localhost/${channel.id}`;

            // Determine if we should play a specific program (Replay)
            let apiParams = cmd;
            if (program) {
                const now = Math.floor(Date.now() / 1000);
                // If program ended in the past, or if we explicitly want to watch a specific program
                // For now, let's say if it's not the CURRENT live program, we treat it as replay.
                const isLive = now >= program.start_timestamp && now <= program.stop_timestamp;

                if (!isLive) {
                    console.log('Playing Replay for:', program.name, program.start_timestamp);
                    apiParams = {
                        cmd: cmd,
                        startTime: program.start_timestamp
                    };
                }
            }

            const res = await window.api.getStreamUrl(apiParams);

            if (res.success && res.streamUrl) {
                setStreamUrl(res.streamUrl);
            } else {
                throw new Error(res.error || 'Failed to get stream URL');
            }
        } catch (err) {
            const friendlyError = parseError(err);
            setError(friendlyError);
            setLoading(false);
        }
    }, [channel]);

    useEffect(() => {
        startStream();
        return () => {
            // Cleanup HLS
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            // Exit Picture-in-Picture if active
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture().catch(() => { });
            }
            // Stop video playback
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.src = '';
            }
        };
    }, [channel, startStream]);

    // Handle Time Updates
    const handleTimeUpdate = () => {
        if (videoRef.current && !isDragging) {
            setCurrentTime(videoRef.current.currentTime);
            const d = videoRef.current.duration;
            if (d && !isNaN(d) && isFinite(d)) {
                setDuration(d);
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const d = videoRef.current.duration;
            if (d && !isNaN(d) && isFinite(d)) {
                setDuration(d);
            } else {
                setDuration(Infinity); // Live stream
            }
        }
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    };

    const handleSeekStart = () => setIsDragging(true);
    const handleSeekEnd = (e) => {
        setIsDragging(false);
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    };

    useEffect(() => {
        if (!streamUrl || !videoRef.current) return;

        if (Hls.isSupported()) {
            if (hlsRef.current) hlsRef.current.destroy();

            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90,
                maxBufferLength: settings?.player?.bufferSize || 30, // Use setting
                maxMaxBufferLength: (settings?.player?.bufferSize || 30) * 2,
                fragLoadingMaxRetry: 3,
                manifestLoadingMaxRetry: 3,
            });

            hlsRef.current = hls;
            hls.attachMedia(videoRef.current);

            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                hls.loadSource(streamUrl);
            });

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoRef.current.play().catch(() => { });
                setIsPlaying(true);
                setLoading(false);
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    } else {
                        hls.destroy();
                        startStream();
                    }
                }
            });

            hls.on(Hls.Events.FRAG_LOADED, () => setLoading(false));

        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = streamUrl;
            videoRef.current.play();
            setLoading(false);
        }
    }, [streamUrl, startStream]);

    // Controls visibility
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }, []);

    useEffect(() => {
        resetControlsTimer();
        return () => {
            if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        };
    }, [resetControlsTimer]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                resetControlsTimer(); // Keep controls visible when paused
            } else {
                videoRef.current.play();
                resetControlsTimer();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            setIsMuted(newVolume === 0);
        }
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const togglePiP = async () => {
        if (!videoRef.current) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPiP(false);
            } else if (document.pictureInPictureEnabled) {
                await videoRef.current.requestPictureInPicture();
                setIsPiP(true);
            }
        } catch (e) {
            console.error('PiP error:', e);
        }
    };

    const isLive = duration === Infinity;

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black flex flex-col"
            onMouseMove={resetControlsTimer}
            onClick={resetControlsTimer}
        >
            {/* Video */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: settings?.player?.aspectRatio === 'fill' ? 'fill' : 'contain' }}
                autoPlay
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
            />

            {/* Loading Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 z-20"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-[var(--color-accent)] animate-spin" />
                            <span className="text-sm text-[var(--color-text-secondary)]">Chargement du stream...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Volume OSD */}
            <AnimatePresence>
                {showVolumeOSD && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none"
                    >
                        <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-6 flex flex-col items-center gap-3">
                            <Volume2 className="w-8 h-8 text-white" />
                            <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[var(--color-accent)] rounded-full transition-all"
                                    style={{ width: `${volume * 100}%` }}
                                />
                            </div>
                            <span className="text-sm text-white font-medium">{Math.round(volume * 100)}%</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/90">
                    <div className="text-center p-8 max-w-md">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{error.title}</h3>
                        <p className="text-[var(--color-text-secondary)] mb-8">{error.message}</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={startStream} className="btn-primary flex items-center gap-2 cursor-pointer">
                                <RefreshCw className="w-4 h-4" /> Réessayer
                            </button>
                            <button onClick={onClose} className="px-6 py-3 glass-card hover:bg-white/10 transition-all cursor-pointer">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Overlay */}
            <AnimatePresence>
                {showControls && !error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30"
                    >
                        {/* Top Bar */}
                        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-white drop-shadow-lg">{channel.name}</h2>
                                    <div className="flex items-center gap-3 mt-2">
                                        {isLive ? (
                                            <span className="badge-live">LIVE</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500 text-white">VOD</span>
                                        )}
                                        {/* Buffer health indicator */}
                                        {bufferHealth !== 'good' && (
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${bufferHealth === 'critical' ? 'bg-red-500' : 'bg-yellow-500'} text-white`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                {bufferHealth === 'critical' ? 'Buffering' : 'Lent'}
                                            </span>
                                        )}
                                        {reconnectCount > 0 && (
                                            <span className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400 flex items-center gap-1">
                                                ↻ {reconnectCount}
                                            </span>
                                        )}
                                        <span className="text-sm text-[var(--color-text-secondary)]">
                                            {formatTime(currentTime)} / {isLive ? '--:--' : formatTime(duration)}
                                        </span>
                                    </div>
                                    {currentProgram && (
                                        <div className="flex items-center gap-2 mt-3 text-[var(--color-text-secondary)]">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">{currentProgram.name || 'Programme en cours'}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                                    className="p-3 rounded-full glass-card hover:bg-white/20 transition-colors cursor-pointer z-50"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* EPG Overlay (Info Panel) */}
                        <AnimatePresence>
                            {showInfo && showControls && currentProgram && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="absolute bottom-28 left-6 md:left-12 right-6 md:right-12 z-40"
                                >
                                    <div className="bg-black/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 max-w-2xl mx-auto shadow-2xl">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">{currentProgram.title}</h3>
                                                <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                                                    <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-white">LIVE</span>
                                                    <span>
                                                        {new Date(currentProgram.start * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {' - '}
                                                        {new Date(currentProgram.end * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div className="relative h-1.5 bg-white/20 rounded-full overflow-hidden mb-3">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-[var(--color-accent)]"
                                                style={{
                                                    width: `${Math.min(((Date.now() / 1000 - currentProgram.start) / (currentProgram.end - currentProgram.start)) * 100, 100)}%`
                                                }}
                                            />
                                        </div>

                                        {currentProgram.descr && (
                                            <p className="text-sm text-[var(--color-text-muted)] line-clamp-3">
                                                {currentProgram.descr}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>


                        {/* Center Controls - Prev/Play/Next */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                            <div className="flex items-center gap-6">
                                {/* Previous Channel */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => { e.stopPropagation(); hasPrev && onPrevChannel?.(); }}
                                    className={`p-4 rounded-full glass-card cursor-pointer transition-opacity ${hasPrev ? 'opacity-100' : 'opacity-30 cursor-not-allowed'}`}
                                    disabled={!hasPrev}
                                    title="Chaîne précédente"
                                >
                                    <SkipBack className="w-6 h-6" />
                                </motion.button>

                                {/* Play/Pause */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={togglePlay}
                                    className="p-6 rounded-full glass-card glow cursor-pointer"
                                >
                                    {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
                                </motion.button>

                                {/* Next Channel */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => { e.stopPropagation(); hasNext && onNextChannel?.(); }}
                                    className={`p-4 rounded-full glass-card cursor-pointer transition-opacity ${hasNext ? 'opacity-100' : 'opacity-30 cursor-not-allowed'}`}
                                    disabled={!hasNext}
                                    title="Chaîne suivante"
                                >
                                    <SkipForward className="w-6 h-6" />
                                </motion.button>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
                            {/* Time Bar */}
                            <div className="mb-4 flex items-center gap-4">
                                {isLive ? (
                                    // Live Progress Bar (Stylized)
                                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--color-accent)] w-full relative overflow-hidden">
                                            <div className="absolute inset-0 bg-white/30 animate-pulse" />
                                        </div>
                                    </div>
                                ) : (
                                    // Interactive Seek Bar for VOD
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 100}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        onMouseDown={handleSeekStart}
                                        onMouseUp={handleSeekEnd}
                                        onTouchStart={handleSeekStart}
                                        onTouchEnd={handleSeekEnd}
                                        className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-[var(--color-accent)] hover:h-1.5 transition-all"
                                        style={{
                                            background: `linear-gradient(to right, var(--color-accent) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%)`
                                        }}
                                    />
                                )}
                                <span className="text-sm text-[var(--color-text-secondary)] font-mono min-w-[60px] text-right">
                                    {isLive ? 'LIVE' : formatTime(duration - currentTime)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button onClick={togglePlay} className="p-3 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    </button>
                                    <div className="flex items-center gap-2 group">
                                        <button onClick={toggleMute} className="p-3 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                                            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                        </button>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={isMuted ? 0 : volume}
                                            onChange={handleVolumeChange}
                                            className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-[var(--color-accent)] hover:bg-white/40 transition-all"
                                            style={{
                                                background: `linear-gradient(to right, var(--color-accent) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(isMuted ? 0 : volume) * 100}%)`
                                            }}
                                        />
                                    </div>
                                    <button onClick={startStream} className="p-3 rounded-full hover:bg-white/10 transition-colors cursor-pointer" title="Actualiser">
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={togglePiP} className="p-3 rounded-full hover:bg-white/10 transition-colors cursor-pointer" title="Picture-in-Picture">
                                        <PictureInPicture2 className={`w-5 h-5 ${isPiP ? 'text-[var(--color-accent)]' : ''}`} />
                                    </button>
                                    <button onClick={() => setShowInfo(!showInfo)} className={`p-3 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${showInfo ? 'text-[var(--color-accent)] bg-white/10' : ''}`} title="Informations programme">
                                        <Info className="w-5 h-5" />
                                    </button>
                                    {onMinimize && (
                                        <button onClick={onMinimize} className="p-3 rounded-full hover:bg-white/10 transition-colors cursor-pointer" title="Mini lecteur">
                                            <Minimize2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button onClick={toggleFullscreen} className="p-3 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                                        {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Player;
