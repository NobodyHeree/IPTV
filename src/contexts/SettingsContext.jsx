import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

// Translations
const translations = {
    fr: {
        'nav.home': 'Accueil',
        'nav.favorites': 'Favoris',
        'nav.settings': 'Paramètres',
        'nav.profile': 'Changer de profil',
        'nav.logout': 'Déconnexion',
        'settings.title': 'Paramètres',
        'settings.subtitle': 'Personnalisez votre expérience de visionnage',
        'settings.general': 'Général',
        'settings.player': 'Lecteur',
        'settings.network': 'Réseau',
        'settings.about': 'À propos',
        'settings.save': 'Enregistrer',
        'settings.saving': 'Enregistrement...',
        'settings.language': 'Langue',
        'settings.buffer': 'Taille du tampon (secondes)',
        'settings.aspectRatio': "Format d'image",
        'settings.userAgent': 'User Agent',
        'settings.timeout': "Délai d'expiration (ms)",
        'settings.restart': 'Redémarrer',
        'settings.restartRequired': 'Un redémarrage est nécessaire pour appliquer certains changements.',
        'settings.success': 'Paramètres enregistrés !',
        'settings.maintenance': 'Maintenance',
        'settings.clearCache': 'Vider le cache',
        'settings.cacheCleared': 'Cache vidé avec succès !',
        'settings.autoStart': 'Lancer au démarrage',
        'settings.autoStartHelper': 'Lancer l\'application automatiquement au démarrage de Windows.'
    },
    en: {
        'nav.home': 'Home',
        'nav.favorites': 'Favorites',
        'nav.settings': 'Settings',
        'nav.profile': 'Switch Profile',
        'nav.logout': 'Logout',
        'settings.title': 'Settings',
        'settings.subtitle': 'Customize your viewing experience',
        'settings.general': 'General',
        'settings.player': 'Player',
        'settings.network': 'Network',
        'settings.about': 'About',
        'settings.save': 'Save',
        'settings.saving': 'Saving...',
        'settings.language': 'Language',
        'settings.buffer': 'Buffer Size (seconds)',
        'settings.aspectRatio': 'Aspect Ratio',
        'settings.userAgent': 'User Agent',
        'settings.timeout': 'Timeout (ms)',
        'settings.restart': 'Restart',
        'settings.restartRequired': 'A restart is required to apply some changes.',
        'settings.success': 'Settings saved!',
        'settings.maintenance': 'Maintenance',
        'settings.clearCache': 'Clear Cache',
        'settings.cacheCleared': 'Cache cleared successfully!',
        'settings.autoStart': 'Start on Boot',
        'settings.autoStartHelper': 'Launch application automatically when Windows starts.'
    }
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const [initialSettings, setInitialSettings] = useState(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await window.api.getSettings();
                setSettings(data);
                setInitialSettings(JSON.parse(JSON.stringify(data)));
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const updateSetting = (section, key, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    const isDirty = () => {
        if (!settings || !initialSettings) return false;
        return JSON.stringify(settings) !== JSON.stringify(initialSettings);
    };

    const saveSettings = async () => {
        if (!settings) return;
        if (!isDirty()) return { success: true }; // No changes needed

        try {
            const result = await window.api.saveSettings(settings);
            if (result.success) {
                setInitialSettings(JSON.parse(JSON.stringify(settings)));
            }
            return result;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return { success: false, error: error.message };
        }
    };

    const restartApp = () => {
        window.api.restartApp();
    };

    const t = (key) => {
        const lang = settings?.general?.language || 'fr';
        return translations[lang]?.[key] || key;
    };

    const value = {
        settings,
        loading,
        updateSetting,
        saveSettings,
        restartApp,
        clearCache: async () => {
            try {
                const result = await window.api.clearCache();
                return result;
            } catch (e) {
                return { success: false, error: e.message };
            }
        },
        t,
        isDirty: isDirty()
    };

    return (
        <SettingsContext.Provider value={value}>
            {!loading && children}
        </SettingsContext.Provider>
    );
};
