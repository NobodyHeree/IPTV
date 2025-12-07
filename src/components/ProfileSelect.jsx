import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Check, X, User, Wifi, Link, Loader2, AlertCircle, Tv } from 'lucide-react';

// Avatar colors
const avatarColors = [
    { id: 'purple', bg: 'bg-purple-500', gradient: 'from-purple-500 to-purple-700' },
    { id: 'blue', bg: 'bg-blue-500', gradient: 'from-blue-500 to-blue-700' },
    { id: 'green', bg: 'bg-green-500', gradient: 'from-green-500 to-green-700' },
    { id: 'red', bg: 'bg-red-500', gradient: 'from-red-500 to-red-700' },
    { id: 'yellow', bg: 'bg-yellow-500', gradient: 'from-yellow-500 to-yellow-700' },
    { id: 'pink', bg: 'bg-pink-500', gradient: 'from-pink-500 to-pink-700' },
    { id: 'cyan', bg: 'bg-cyan-500', gradient: 'from-cyan-500 to-cyan-700' },
];

const getAvatarColor = (colorId) => avatarColors.find(c => c.id === colorId) || avatarColors[0];

const ProfileSelect = ({ profiles, onSelectProfile, onProfilesChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Add profile form state
    const [newName, setNewName] = useState('');
    const [newMac, setNewMac] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newAvatar, setNewAvatar] = useState('purple');
    const [newMethod, setNewMethod] = useState('GET');

    // Auto-format MAC address as user types
    const formatMac = (value) => {
        // Remove all non-hex characters
        const cleaned = value.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
        // Insert colons every 2 characters
        const parts = cleaned.match(/.{1,2}/g) || [];
        return parts.slice(0, 6).join(':');
    };

    const handleMacChange = (e) => {
        const formatted = formatMac(e.target.value);
        setNewMac(formatted);
    };

    const handleSelect = async (profile) => {
        if (isEditing) return;
        setLoading(true);
        setError('');

        try {
            const result = await window.api.connectProfile(profile.id);
            if (result.success) {
                onSelectProfile(result.profile);
            } else {
                setError(result.error || 'Connexion échouée');
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProfile = async () => {
        if (!newMac || !newUrl) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await window.api.createProfile({
                name: newName || 'Nouveau Profil',
                avatar: newAvatar,
                mac: newMac,
                url: newUrl,
                method: newMethod
            });

            if (result.success) {
                const updated = await window.api.getProfiles();
                onProfilesChange(updated);
                setShowAddForm(false);
                resetForm();
                // Auto-connect to new profile
                onSelectProfile(result.profile);
            } else {
                setError(result.error || 'Erreur lors de la création');
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNewName('');
        setNewMac('');
        setNewUrl('');
        setNewAvatar('purple');
        setNewMethod('GET');
        setError('');
    };

    const startEdit = (profile, e) => {
        e.stopPropagation();
        setEditingProfile(profile);
        setNewName(profile.name);
        setNewAvatar(profile.avatar);
        setNewMac(profile.mac || '');
        setNewUrl(profile.url || '');
        setNewMethod(profile.method || 'GET');
    };

    const saveEdit = async () => {
        if (!editingProfile) return;
        await window.api.updateProfile({
            id: editingProfile.id,
            name: newName,
            avatar: newAvatar,
            mac: newMac,
            url: newUrl,
            method: newMethod
        });
        const updated = await window.api.getProfiles();
        onProfilesChange(updated);
        setEditingProfile(null);
    };

    const handleDelete = async (profileId, e) => {
        e.stopPropagation();
        await window.api.deleteProfile(profileId);
        const updated = await window.api.getProfiles();
        onProfilesChange(updated);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] p-8">
            {/* Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 text-center w-full max-w-4xl"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Tv className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-3xl font-bold text-gradient tracking-wide">AURA</span>
                </div>

                <h1 className="text-4xl font-bold mb-2">
                    {profiles.length === 0 ? 'Bienvenue !' : 'Qui regarde ?'}
                </h1>
                <p className="text-[var(--color-text-muted)] mb-12">
                    {profiles.length === 0
                        ? 'Ajoutez votre premier profil IPTV pour commencer'
                        : 'Sélectionnez votre profil'}
                </p>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3 max-w-md mx-auto"
                    >
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <span className="text-red-400 text-sm">{error}</span>
                    </motion.div>
                )}

                {/* Profiles Grid */}
                <div className="flex gap-8 flex-wrap justify-center mb-12">
                    {profiles.map(profile => {
                        const color = getAvatarColor(profile.avatar);
                        return (
                            <motion.div
                                key={profile.id}
                                whileHover={{ scale: isEditing || loading ? 1 : 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSelect(profile)}
                                className={`relative cursor-pointer group ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                {/* Avatar */}
                                <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${color.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all`}>
                                    <span className="text-4xl font-bold text-white/90">
                                        {profile.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>

                                {/* Name */}
                                <p className="mt-4 text-lg font-medium text-center">{profile.name}</p>
                                <p className="text-xs text-[var(--color-text-muted)] truncate max-w-[120px]">
                                    {profile.mac ? `${profile.mac.slice(0, 14)}...` : 'Ancien profil'}
                                </p>

                                {/* Edit/Delete buttons when editing mode */}
                                {isEditing && (
                                    <div className="absolute -top-2 -right-2 flex gap-1">
                                        <button
                                            onClick={(e) => startEdit(profile, e)}
                                            className="p-2 rounded-full bg-blue-500 hover:bg-blue-400 transition-colors cursor-pointer"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(profile.id, e)}
                                            className="p-2 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}

                    {/* Add Profile Button */}
                    {profiles.length < 5 && (
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setShowAddForm(true); resetForm(); }}
                            className="w-28 h-28 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all"
                        >
                            <Plus className="w-10 h-10 text-white/40" />
                            <span className="text-xs text-white/40 mt-2">Ajouter</span>
                        </motion.div>
                    )}
                </div>

                {/* Manage Profiles Button */}
                {profiles.length > 0 && (
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="px-6 py-3 glass-card hover:bg-white/10 transition-all cursor-pointer"
                    >
                        {isEditing ? 'Terminé' : 'Gérer les profils'}
                    </button>
                )}
            </motion.div>

            {/* Add Profile Modal */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card p-8 max-w-md w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-bold mb-6">Nouveau Profil IPTV</h2>

                            {/* Error in modal */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                    <span className="text-red-400 text-sm">{error}</span>
                                </div>
                            )}

                            {/* Name Input */}
                            <div className="mb-4">
                                <label className="block text-sm text-[var(--color-text-muted)] mb-2">Nom du profil</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Mon Profil"
                                        className="w-full pl-12 pr-4 py-3 input-glass"
                                        maxLength={20}
                                    />
                                </div>
                            </div>

                            {/* MAC Input */}
                            <div className="mb-4">
                                <label className="block text-sm text-[var(--color-text-muted)] mb-2">Adresse MAC *</label>
                                <div className="relative">
                                    <Wifi className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                                    <input
                                        type="text"
                                        value={newMac}
                                        onChange={handleMacChange}
                                        placeholder="00:1A:79:XX:XX:XX"
                                        className="w-full pl-12 pr-4 py-3 input-glass font-mono"
                                        maxLength={17}
                                        required
                                    />
                                </div>
                            </div>

                            {/* URL Input */}
                            <div className="mb-6">
                                <label className="block text-sm text-[var(--color-text-muted)] mb-2">URL du portail *</label>
                                <div className="relative">
                                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                                    <input
                                        type="text"
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        placeholder="http://portal.example.com/c/"
                                        className="w-full pl-12 pr-4 py-3 input-glass"
                                        required
                                    />
                                </div>
                            </div>

                            {/* HTTP Method Selection */}
                            <div className="mb-6">
                                <label className="block text-sm text-[var(--color-text-muted)] mb-2">Méthode HTTP</label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setNewMethod('GET')}
                                        className={`flex-1 py-3 rounded-xl border transition-all cursor-pointer ${newMethod === 'GET' ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white' : 'border-white/20 hover:border-white/40'}`}
                                    >
                                        GET
                                    </button>
                                    <button
                                        onClick={() => setNewMethod('POST')}
                                        className={`flex-1 py-3 rounded-xl border transition-all cursor-pointer ${newMethod === 'POST' ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white' : 'border-white/20 hover:border-white/40'}`}
                                    >
                                        POST
                                    </button>
                                </div>
                                <p className="text-xs text-[var(--color-text-muted)] mt-2">La plupart des portails utilisent GET. Essayez POST si GET ne fonctionne pas.</p>
                            </div>

                            {/* Avatar Color Selection */}
                            <div className="mb-8">
                                <label className="block text-sm text-[var(--color-text-muted)] mb-2">Couleur</label>
                                <div className="flex gap-3 flex-wrap">
                                    {avatarColors.map(color => (
                                        <button
                                            key={color.id}
                                            onClick={() => setNewAvatar(color.id)}
                                            className={`w-10 h-10 rounded-full ${color.bg} ${newAvatar === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--color-background)]' : ''} transition-all cursor-pointer hover:scale-110`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleAddProfile}
                                    disabled={loading}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                    {loading ? 'Connexion...' : 'Ajouter'}
                                </button>
                                <button
                                    onClick={() => { setShowAddForm(false); setError(''); }}
                                    className="px-6 py-3 glass-card hover:bg-white/10 transition-all cursor-pointer"
                                >
                                    Annuler
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {editingProfile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card p-8 max-w-md w-full mx-4"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-bold mb-6">Modifier le profil</h2>

                            {/* Name Input */}
                            <div className="mb-6">
                                <label className="block text-sm text-[var(--color-text-muted)] mb-2">Nom</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-4 py-3 input-glass"
                                    maxLength={20}
                                />
                            </div>

                            {/* MAC Address */}
                            <div className="mb-4">
                                <label className="block text-sm text-[var(--color-text-muted)] mb-2">Adresse MAC</label>
                                <input
                                    type="text"
                                    value={newMac}
                                    onChange={(e) => setNewMac(e.target.value)}
                                    placeholder="00:1A:79:XX:XX:XX"
                                    className="w-full px-4 py-3 input-glass font-mono text-sm"
                                />
                            </div>

                            {/* Portal URL */}
                            <div className="mb-4">
                                <label className="block text-sm text-[var(--color-text-muted)] mb-2">URL du Portail</label>
                                <input
                                    type="text"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    placeholder="http://portal.example.com/c/"
                                    className="w-full px-4 py-3 input-glass text-sm"
                                />
                            </div>

                            {/* HTTP Method */}
                            <div className="mb-6">
                                <label className="block text-sm text-[var(--color-text-muted)] mb-2">Méthode HTTP</label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setNewMethod('GET')}
                                        className={`flex-1 py-2 rounded-xl border transition-all cursor-pointer text-sm ${newMethod === 'GET' ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white' : 'border-white/20 hover:border-white/40'}`}
                                    >
                                        GET
                                    </button>
                                    <button
                                        onClick={() => setNewMethod('POST')}
                                        className={`flex-1 py-2 rounded-xl border transition-all cursor-pointer text-sm ${newMethod === 'POST' ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white' : 'border-white/20 hover:border-white/40'}`}
                                    >
                                        POST
                                    </button>
                                </div>
                            </div>

                            {/* Avatar Color Selection */}
                            <div className="mb-8">
                                <label className="block text-sm text-[var(--color-text-muted)] mb-2">Couleur</label>
                                <div className="flex gap-3 flex-wrap">
                                    {avatarColors.map(color => (
                                        <button
                                            key={color.id}
                                            onClick={() => setNewAvatar(color.id)}
                                            className={`w-10 h-10 rounded-full ${color.bg} ${newAvatar === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--color-background)]' : ''} transition-all cursor-pointer`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <button
                                    onClick={saveEdit}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Check className="w-4 h-4" /> Enregistrer
                                </button>
                                <button
                                    onClick={() => setEditingProfile(null)}
                                    className="px-6 py-3 glass-card hover:bg-white/10 transition-all cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center pointer-events-none">
                    <Loader2 className="w-12 h-12 text-[var(--color-accent)] animate-spin" />
                </div>
            )}
        </div>
    );
};

export default ProfileSelect;
