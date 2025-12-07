import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ProfileSelect from './components/ProfileSelect';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';

function App() {
  const [activeProfile, setActiveProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load profiles on mount
  useEffect(() => {
    const init = async () => {
      try {
        const profs = await window.api.getProfiles();
        setProfiles(profs);
      } catch (e) {
        console.error('Failed to load profiles:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSelectProfile = (profile) => {
    setActiveProfile(profile);
  };

  const handleLogout = () => {
    setActiveProfile(null);
  };

  const handleSwitchProfile = () => {
    setActiveProfile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-white font-sans antialiased selection:bg-primary selection:text-white">
        {!activeProfile ? (
          // Profile Selection (first screen)
          <ProfileSelect
            profiles={profiles}
            onSelectProfile={handleSelectProfile}
            onProfilesChange={setProfiles}
          />
        ) : (
          // Dashboard
          <ErrorBoundary>
            <Dashboard
              profile={activeProfile}
              onLogout={handleLogout}
              onSwitchProfile={handleSwitchProfile}
            />
          </ErrorBoundary>
        )}
      </div>
    </ToastProvider>
  );
}

export default App;
