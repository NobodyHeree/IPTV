import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RefreshCw, Smartphone, Globe, Info, Monitor, Shield, ChevronRight, Check, Power } from 'lucide-react';
import { useToast } from '../Toast';
import { useSettings } from '../../contexts/SettingsContext';

// Tab Component
const TabButton = ({ active, icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-6 py-4 w-full text-left transition-all duration-200 border-l-2
        ${active
                ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-white'
                : 'border-transparent text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text-secondary)]'
            }`}
    >
        <Icon className={`w-5 h-5 ${active ? 'text-[var(--color-accent)]' : ''}`} />
        <span className="font-medium">{label}</span>
        {active && <ChevronRight className="w-4 h-4 ml-auto text-[var(--color-accent)]" />}
    </button>
);

// Form Components
const Section = ({ title, description, children }) => (
    <div className="mb-8 p-6 bg-[var(--color-surface)] border border-white/5 rounded-2xl">
        <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            {description && <p className="text-sm text-[var(--color-text-muted)]">{description}</p>}
        </div>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

const Input = ({ label, value, onChange, placeholder, type = "text", helper }) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
        />
        {helper && <p className="text-xs text-[var(--color-text-muted)]">{helper}</p>}
    </div>
);

const Select = ({ label, value, onChange, options }) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all appearance-none"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

const SettingsView = () => {
    const { settings, updateSetting, saveSettings, clearCache, restartApp, t, isDirty } = useSettings();
    const [activeTab, setActiveTab] = useState('general');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const toast = useToast();

    const handleClearCache = async () => {
        try {
            const result = await clearCache();
            if (result.success) {
                toast.success(t('settings.cacheCleared'));
            } else {
                toast.error('Erreur', 'Impossible de vider le cache');
            }
        } catch (error) {
            toast.error('Erreur', error.message);
        }
    };

    const handleSave = async () => {
        if (!isDirty) return; // Prevention

        setSaving(true);
        try {
            const result = await saveSettings();
            if (result.success) {
                toast.success(t('settings.success') || 'Settings saved successfully');
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Erreur', 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col overflow-hidden bg-[var(--color-background)]">
            {/* Header */}
            <div className="p-8 pb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        {t('settings.title')}
                    </h1>
                    <p className="text-[var(--color-text-muted)] mt-2">
                        {t('settings.subtitle')}
                    </p>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto p-8 pt-0 gap-8">
                {/* Sidebar Navigation */}
                <div className="w-64 flex-shrink-0">
                    <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden border border-white/5 py-2">
                        <TabButton
                            icon={Monitor}
                            label={t('settings.general')}
                            active={activeTab === 'general'}
                            onClick={() => setActiveTab('general')}
                        />
                        <TabButton
                            icon={Smartphone}
                            label={t('settings.player')}
                            active={activeTab === 'player'}
                            onClick={() => setActiveTab('player')}
                        />
                        <TabButton
                            icon={Globe}
                            label={t('settings.network')}
                            active={activeTab === 'network'}
                            onClick={() => setActiveTab('network')}
                        />
                        <TabButton
                            icon={Info}
                            label={t('settings.about')}
                            active={activeTab === 'about'}
                            onClick={() => setActiveTab('about')}
                        />
                    </div>

                    <motion.button
                        whileHover={isDirty ? { scale: 1.02 } : {}}
                        whileTap={isDirty ? { scale: 0.98 } : {}}
                        onClick={handleSave}
                        disabled={saving || !isDirty}
                        className={`mt-6 w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all
                            ${!isDirty
                                ? 'bg-white/5 text-white/30 cursor-not-allowed shadow-none'
                                : saving
                                    ? 'bg-white/10 cursor-not-allowed'
                                    : saved
                                        ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20 cursor-default'
                                        : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 shadow-[var(--color-accent)]/20 cursor-pointer'}`}
                    >
                        {saving ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : saved ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {saving ? t('settings.saving') : saved ? 'Enregistré !' : t('settings.save')}
                    </motion.button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto pr-2 pb-20 scrollbar-hide">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'general' && (
                                <div className="space-y-6">
                                    <Section title={t('settings.general')} description="Personnalisez l'apparence de l'interface">
                                        <Select
                                            label={t('settings.language')}
                                            value={settings.general.language}
                                            onChange={(val) => updateSetting('general', 'language', val)}
                                            options={[
                                                { value: 'fr', label: 'Français' },
                                                { value: 'en', label: 'English' }
                                            ]}
                                        />

                                        <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/10 transition-colors hover:bg-black/30">
                                            <div>
                                                <h4 className="font-medium text-white">{t('settings.autoStart')}</h4>
                                                <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('settings.autoStartHelper')}</p>
                                            </div>
                                            <div
                                                onClick={() => updateSetting('general', 'autoStart', !settings.general.autoStart)}
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${settings.general.autoStart ? 'bg-[var(--color-accent)]' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm ${settings.general.autoStart ? 'left-7' : 'left-1'}`} />
                                            </div>
                                        </div>
                                    </Section>

                                    <Section title={t('settings.maintenance')} description="Gestion des données et du cache">
                                        <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                                    <Shield className="w-5 h-5 text-red-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-white">{t('settings.clearCache')}</h4>
                                                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                                        Libère de l'espace et corrige les erreurs d'affichage
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleClearCache}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg border border-white/10 transition-all active:scale-95 cursor-pointer"
                                            >
                                                {t('settings.clearCache')}
                                            </button>
                                        </div>
                                    </Section>
                                </div>
                            )}

                            {activeTab === 'player' && (
                                <div className="space-y-6">
                                    <Section title={t('settings.player')} description="Ajustez les performances de lecture">
                                        <div className="grid grid-cols-2 gap-6">
                                            <Input
                                                label={t('settings.buffer')}
                                                type="number"
                                                value={settings.player.bufferSize}
                                                onChange={(val) => updateSetting('player', 'bufferSize', parseInt(val))}
                                                helper="Augmentez si vous avez des coupures. (Défaut: 10)"
                                            />
                                            <Select
                                                label={t('settings.aspectRatio')}
                                                value={settings.player.aspectRatio}
                                                onChange={(val) => updateSetting('player', 'aspectRatio', val)}
                                                options={[
                                                    { value: 'auto', label: 'Auto' },
                                                    { value: '16:9', label: '16:9' },
                                                    { value: '4:3', label: '4:3' },
                                                    { value: 'fill', label: 'Remplir' }
                                                ]}
                                            />
                                        </div>
                                    </Section>

                                    <Section title="Avancé" description="Configuration technique du flux">
                                        <Input
                                            label={t('settings.userAgent')}
                                            value={settings.player.userAgent}
                                            onChange={(val) => updateSetting('player', 'userAgent', val)}
                                            placeholder="Mozilla/5.0..."
                                            helper="Utilisé pour les requêtes HLS. Ne modifiez que si nécessaire."
                                        />
                                        <div className="pt-4 border-t border-white/5">
                                            <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                                                <div>
                                                    <h4 className="font-medium text-white">Redémarrer l'application</h4>
                                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                                        Utile si vous rencontrez des problèmes de connexion ou d'affichage.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={restartApp}
                                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                                                >
                                                    <Power className="w-4 h-4" />
                                                    Redémarrer
                                                </button>
                                            </div>
                                        </div>
                                    </Section>
                                </div>
                            )}

                            {activeTab === 'network' && (
                                <div className="space-y-6">
                                    <Section title={t('settings.network')} description="Paramètres de délai et proxy">
                                        <Input
                                            label={t('settings.timeout')}
                                            type="number"
                                            value={settings.network.timeout}
                                            onChange={(val) => updateSetting('network', 'timeout', parseInt(val))}
                                            helper="Temps maximum d'attente pour une connexion serveur. (Défaut: 15000)"
                                        />
                                        <Input
                                            label="Proxy HTTP (Optionnel)"
                                            value={settings.network.proxy}
                                            onChange={(val) => updateSetting('network', 'proxy', val)}
                                            placeholder="http://user:pass@host:port"
                                        />
                                    </Section>
                                </div>
                            )}

                            {activeTab === 'about' && (
                                <div className="space-y-6">
                                    <Section title={t('settings.about')} description="Information sur la version">
                                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-accent)] to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                                <Monitor className="w-8 h-8 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold">AURA IPTV</h4>
                                                <p className="text-[var(--color-text-secondary)]">Version 1.0.0 (Beta)</p>
                                            </div>
                                        </div>
                                    </Section>

                                    <div className="p-6 bg-[var(--color-surface)] border border-white/5 rounded-2xl text-center">
                                        <p className="text-[var(--color-text-muted)] text-sm">
                                            Développé avec <span className="text-red-500">❤️</span> par l'équipe AURA
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
