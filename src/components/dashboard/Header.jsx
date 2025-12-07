import React from 'react';
import { Search, X } from 'lucide-react';

const Header = ({ searchQuery, setSearchQuery }) => {
    return (
        <div className="absolute top-0 left-0 right-0 h-20 z-10 flex items-center px-8 bg-gradient-to-b from-[var(--color-background)] via-[var(--color-background)]/80 to-transparent pointer-events-none">
            <div className="pointer-events-auto flex items-center glass-card px-5 py-3 w-[400px] transition-all duration-300 focus-within:ring-2 focus-within:ring-[var(--color-accent)]/50 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <Search className="w-4 h-4 text-[var(--color-text-muted)] mr-3" />
                <input
                    type="text"
                    placeholder="Rechercher une chaîne..."
                    className="bg-transparent border-none outline-none text-sm w-full placeholder-[var(--color-text-muted)] text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <X className="w-4 h-4 text-[var(--color-text-muted)] cursor-pointer hover:text-white transition-colors" onClick={() => setSearchQuery('')} />
                )}
            </div>
        </div>
    );
};

export default Header;
