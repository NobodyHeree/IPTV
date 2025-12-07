import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tv, Wifi, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [mac, setMac] = useState('');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadSaved = async () => {
            if (window.api) {
                try {
                    const saved = await window.api.getSavedAuth();
                    if (saved) {
                        setMac(saved.mac || '');
                        setUrl(saved.url || '');
                    }
                } catch (e) {
                    console.error("Failed to load saved auth", e);
                }
            }
        };
        loadSaved();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!window.api) {
                throw new Error('Electron API not available');
            }
            const res = await window.api.login(mac, url);
            if (res.success) {
                onLogin(res.profile);
            } else {
                setError(res.error || 'Connection failed');
            }
        } catch (err) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen w-full overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[var(--color-background)]">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[var(--color-accent)] rounded-full blur-[150px] animate-pulse" />
                    <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-blue-600 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-[60%] left-[50%] w-[300px] h-[300px] bg-cyan-500 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                </div>
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div className="glass-card p-8 glow">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-10">
                        <motion.div
                            className="relative mb-6"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        >
                            <div className="absolute inset-0 bg-[var(--color-accent)] rounded-2xl blur-xl opacity-40 pulse-glow" />
                            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-blue-600">
                                <Tv className="w-10 h-10 text-white" />
                            </div>
                        </motion.div>

                        <motion.h1
                            className="text-3xl font-bold tracking-tight text-gradient mb-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            OBSIDIAN
                        </motion.h1>
                        <motion.p
                            className="text-[var(--color-text-muted)] text-sm tracking-[0.2em] uppercase"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            IPTV Player
                        </motion.p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider ml-1">
                                MAC Address
                            </label>
                            <div className="relative group">
                                <Wifi className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent)] transition-colors" />
                                <input
                                    type="text"
                                    value={mac}
                                    onChange={(e) => setMac(e.target.value)}
                                    placeholder="00:1A:79:XX:XX:XX"
                                    className="w-full pl-14 pr-4 py-4 input-glass"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider ml-1">
                                Portal URL
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent)] transition-colors" />
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="http://portal.example.com/c/"
                                    className="w-full pl-14 pr-4 py-4 input-glass"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center gap-3 py-4 text-base mt-8"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    Connect
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-[var(--color-text-muted)]">
                            Secured connection • v1.0.0
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
