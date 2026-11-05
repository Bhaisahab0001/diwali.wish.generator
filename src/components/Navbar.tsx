import React from 'react';
import { Sparkles, Lock, BookOpen, Plus, LogOut, User } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'create' | 'preview' | 'unlock-direct';
  onNavigate: (view: 'dashboard' | 'create' | 'unlock-direct') => void;
  onOpenDocs: () => void;
  isAuthenticated: boolean;
  ownerName?: string;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenDocs,
  isAuthenticated,
  ownerName,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 h-16">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="text-base sm:text-lg font-display font-bold tracking-wide text-slate-100 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="text-amber-400">🪔</span>
          <span className="shimmer-text">DiwaliVerse</span>
          <span className="text-slate-400 font-sans text-xs font-normal hidden sm:inline">
            · Secret Messages
          </span>
        </button>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className={`whitespace-nowrap shrink-0 hover:text-amber-300 transition-colors ${
              currentView === 'dashboard' ? 'text-amber-300 font-semibold' : 'text-slate-300'
            }`}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => onNavigate('create')}
            className={`whitespace-nowrap shrink-0 hover:text-amber-300 transition-colors ${
              currentView === 'create' ? 'text-amber-300 font-semibold' : 'text-slate-300'
            }`}
          >
            Create Secret
          </button>

          <button
            type="button"
            onClick={() => onNavigate('unlock-direct')}
            className={`whitespace-nowrap shrink-0 hover:text-amber-300 transition-colors ${
              currentView === 'unlock-direct' ? 'text-amber-300 font-semibold' : 'text-slate-300'
            }`}
          >
            Unlock by Code
          </button>

          <button
            type="button"
            onClick={onOpenDocs}
            className="whitespace-nowrap shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cloudflare Architecture
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                {ownerName || 'Owner'}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700/80 rounded-xl hover:bg-slate-800 hover:text-rose-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                title="Sign out of owner vault"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 rounded-xl hover:from-amber-300 hover:to-amber-400 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.25)] whitespace-nowrap shrink-0 flex items-center gap-1 font-sans"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
