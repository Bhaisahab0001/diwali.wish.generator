/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from './utils/api.ts';
import type {
  Owner,
  OwnerMessageItem,
  PublicMessageMetadata,
  UnlockedMessageData,
  VisualTheme,
} from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { ParticleBackground } from './components/ParticleBackground.tsx';
import { Envelope3D } from './components/Envelope3D.tsx';
import { ParchmentLetter } from './components/ParchmentLetter.tsx';
import { MessageComposer } from './components/MessageComposer.tsx';
import { OwnerDashboard } from './components/OwnerDashboard.tsx';
import { OwnerPreview } from './components/OwnerPreview.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CloudflareGuideModal } from './components/CloudflareGuideModal.tsx';
import { UnlockDirectView } from './components/UnlockDirectView.tsx';
import { CelebrationEffects } from './components/CelebrationEffects.tsx';
import { Sparkles, Heart, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'create' | 'edit' | 'owner-preview' | 'recipient' | 'unlock-direct'
  >('dashboard');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [ownerPreviewMessage, setOwnerPreviewMessage] = useState<any | null>(null);
  const [ownerPreviewSuccess, setOwnerPreviewSuccess] = useState<string | null>(null);

  // Auth State
  const [authStatus, setAuthStatus] = useState<{
    setup_required: boolean;
    authenticated: boolean;
    owner: Owner | null;
  }>({
    setup_required: false,
    authenticated: false,
    owner: null,
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  // Owner Messages List
  const [messages, setMessages] = useState<OwnerMessageItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Recipient Message State
  const [recipientMetadata, setRecipientMetadata] = useState<PublicMessageMetadata | null>(null);
  const [unlockedData, setUnlockedData] = useState<UnlockedMessageData | null>(null);
  const [isLetterRevealed, setIsLetterRevealed] = useState(false); // Revealing message on 3rd click
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [celebrationActive, setCelebrationActive] = useState(false);

  // Current active theme for particle background
  const activeTheme: VisualTheme =
    unlockedData?.theme ||
    ownerPreviewMessage?.theme ||
    recipientMetadata?.theme ||
    'midnight-starlight';

  // Check auth & session persistence on mount
  const checkStatus = useCallback(async () => {
    try {
      const res = await api.getStatus();
      setAuthStatus({
        setup_required: false,
        authenticated: res.authenticated,
        owner: res.owner,
      });

      if (res.authenticated) {
        loadOwnerMessages();
      }
    } catch (e) {
      console.error('Failed to fetch auth status', e);
    }
  }, []);

  const loadOwnerMessages = async () => {
    try {
      setIsLoadingMessages(true);
      const res = await api.getMessages();
      setMessages(res.messages || []);
    } catch (e) {
      console.error('Failed to load messages', e);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Route parser
  const handleRouteChange = useCallback(() => {
    const pathname = window.location.pathname;
    const match = pathname.match(/^\/m\/([a-zA-Z0-9_\-]+)/);

    if (match) {
      const slug = match[1];
      setActiveSlug(slug);
      setCurrentView('recipient');
      loadRecipientMessage(slug);
    } else if (pathname === '/create') {
      setCurrentView('create');
    } else if (pathname === '/unlock') {
      setCurrentView('unlock-direct');
    } else {
      setCurrentView('dashboard');
    }
  }, []);

  useEffect(() => {
    checkStatus();
    handleRouteChange();

    const onPopState = () => handleRouteChange();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [checkStatus, handleRouteChange]);

  const navigateTo = (view: 'dashboard' | 'create' | 'unlock-direct', slug?: string) => {
    setUnlockError(null);
    setRecipientError(null);
    setOwnerPreviewSuccess(null);

    if (view === 'dashboard') {
      window.history.pushState({}, '', '/');
      setCurrentView('dashboard');
      if (authStatus.authenticated) {
        loadOwnerMessages();
      }
    } else if (view === 'create') {
      if (!authStatus.authenticated) {
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
        return;
      }
      setEditingMessage(null);
      window.history.pushState({}, '', '/create');
      setCurrentView('create');
    } else if (view === 'unlock-direct') {
      window.history.pushState({}, '', '/unlock');
      setCurrentView('unlock-direct');
    }
  };

  const navigateToRecipient = (slug: string) => {
    window.history.pushState({}, '', `/m/${slug}`);
    setActiveSlug(slug);
    setCurrentView('recipient');
    loadRecipientMessage(slug);
  };

  // Load public recipient message metadata
  const loadRecipientMessage = async (slug: string) => {
    setRecipientLoading(true);
    setRecipientError(null);
    setUnlockedData(null);
    setIsLetterRevealed(false);
    setUnlockError(null);

    try {
      const res = await api.getPublicMessage(slug);
      setRecipientMetadata(res.metadata);
    } catch (err: any) {
      setRecipientError(err?.message || 'This secret message does not exist or has expired.');
    } finally {
      setRecipientLoading(false);
    }
  };

  // Step 1: Submit password unlock
  const handleUnlockPassword = async (password: string) => {
    if (!activeSlug) return;
    setIsUnlocking(true);
    setUnlockError(null);

    try {
      const res = await api.unlockPublicMessage(activeSlug, password);
      // Backend verified password! Store unlocked data, now ready for 3-click interactive seal breaking!
      setUnlockedData(res.data);
      setIsLetterRevealed(false);
    } catch (err: any) {
      setUnlockError(err?.message || 'Incorrect passcode');
      if (err?.data?.attempts_remaining !== undefined && recipientMetadata) {
        setRecipientMetadata({
          ...recipientMetadata,
          attempts_remaining: err.data.attempts_remaining,
        });
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  // Step 2: Triggered on 3rd click of wax seal breaking animation
  const handleSealShattered = () => {
    setIsLetterRevealed(true);
    setCelebrationActive(true);
  };

  // Owner saves new or edited message
  const handleSaveMessage = async (payload: any) => {
    if (editingMessage?.id) {
      await api.updateMessage(editingMessage.id, payload);
      setOwnerPreviewMessage({
        ...editingMessage,
        ...payload,
      });
      setOwnerPreviewSuccess('Your secret message has been updated successfully! ❤️');
      setCurrentView('owner-preview');
    } else {
      const res = await api.createMessage(payload);
      setOwnerPreviewMessage(res.data);
      setOwnerPreviewSuccess(res.message || 'Your little secret has been sealed successfully! ❤️');
      setCurrentView('owner-preview');
    }
    loadOwnerMessages();
  };

  // Owner opens confidential preview for a specific message
  const handleOwnerPreview = async (id: string) => {
    try {
      const res = await api.getMessage(id);
      setOwnerPreviewMessage(res.message);
      setOwnerPreviewSuccess(null);
      setCurrentView('owner-preview');
    } catch (err: any) {
      alert(err?.message || 'Failed to fetch message for preview');
    }
  };

  // Owner edits message
  const handleEditMessage = async (id: string) => {
    try {
      const res = await api.getMessage(id);
      setEditingMessage(res.message);
      setCurrentView('edit');
    } catch (err: any) {
      alert(err?.message || 'Failed to fetch message for editing');
    }
  };

  // Owner deletes message
  const handleDeleteMessage = async (id: string) => {
    await api.deleteMessage(id);
    await loadOwnerMessages();
  };

  // Owner duplicates message
  const handleDuplicateMessage = async (id: string) => {
    await api.duplicateMessage(id);
    await loadOwnerMessages();
  };

  // Auth actions
  const handleAuthSuccess = (owner: Owner) => {
    setAuthStatus({
      setup_required: false,
      authenticated: true,
      owner,
    });
    loadOwnerMessages();
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await api.logout();
    setAuthStatus({
      setup_required: false,
      authenticated: false,
      owner: null,
    });
    setMessages([]);
    setCurrentView('dashboard');
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans text-slate-100 selection:bg-amber-400/30 selection:text-amber-200">
      {/* Ambient background particles & romantic celestial glows */}
      <ParticleBackground theme={activeTheme} />

      {/* Confetti & floating hearts on unlock */}
      <CelebrationEffects active={celebrationActive} />

      {/* Top Bar Contract Navigation */}
      <Navbar
        currentView={
          currentView === 'edit'
            ? 'create'
            : currentView === 'recipient' || currentView === 'owner-preview'
            ? 'dashboard'
            : currentView
        }
        onNavigate={navigateTo}
        onOpenDocs={() => setIsDocsModalOpen(true)}
        isAuthenticated={authStatus.authenticated}
        ownerName={authStatus.owner?.display_name || authStatus.owner?.username}
        onOpenLogin={() => openAuthModal('login')}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 relative z-10 flex flex-col">
        {/* VIEW 1: RECIPIENT ENVELOPE (With 3-Click Wax Seal Breaking & Unlocked Letter) */}
        {currentView === 'recipient' && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full my-auto">
            {recipientLoading ? (
              <div className="text-center py-20 space-y-3">
                <Sparkles className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-sm font-display text-slate-300">Retrieving confidential dispatch...</p>
              </div>
            ) : recipientError ? (
              <div className="text-center py-16 px-6 max-w-md mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-950 text-rose-400 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-100">Message Unavailable</h3>
                <p className="text-xs text-slate-400">{recipientError}</p>
                <button
                  type="button"
                  onClick={() => navigateTo('dashboard')}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Go to DiwaliVerse Portal</span>
                </button>
              </div>
            ) : isLetterRevealed && unlockedData ? (
              /* Step 3: Complete destruction reveals the message parchment! */
              <div className="w-full space-y-4">
                <div className="text-center animate-in fade-in zoom-in duration-500">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg">
                    <Heart className="w-4 h-4 fill-current text-rose-500" />
                    <span>Your secret has been unlocked! ❤️</span>
                  </span>
                </div>
                <ParchmentLetter
                  data={unlockedData}
                  onComposeReply={() => navigateTo('create')}
                />
              </div>
            ) : recipientMetadata ? (
              /* Steps 1 & 2: Password entry, then 3-click interactive seal breaking */
              <div className="w-full">
                {recipientMetadata.is_burned ? (
                  <div className="text-center py-16 px-6 max-w-md mx-auto rounded-3xl bg-slate-900/80 border border-rose-900/60 space-y-3">
                    <span className="text-4xl">🔥</span>
                    <h3 className="text-xl font-display font-bold text-rose-300">Self-Destructed</h3>
                    <p className="text-xs text-slate-400">
                      This secret message was set to burn after opening and has already been permanently deleted.
                    </p>
                  </div>
                ) : recipientMetadata.is_expired ? (
                  <div className="text-center py-16 px-6 max-w-md mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <span className="text-4xl">⏳</span>
                    <h3 className="text-xl font-display font-bold text-slate-300">Message Expired</h3>
                    <p className="text-xs text-slate-400">
                      The expiration period set for this secret message has passed.
                    </p>
                  </div>
                ) : (
                  <Envelope3D
                    recipientName={recipientMetadata.recipient_name}
                    senderName={recipientMetadata.sender_name}
                    title={recipientMetadata.title}
                    theme={recipientMetadata.theme}
                    seal={recipientMetadata.envelope_seal}
                    passwordHint={recipientMetadata.password_hint}
                    onUnlockSubmit={handleUnlockPassword}
                    isLockedOut={recipientMetadata.is_locked_out}
                    lockoutSecondsRemaining={recipientMetadata.lockout_seconds_remaining}
                    attemptsRemaining={recipientMetadata.attempts_remaining}
                    errorMessage={unlockError}
                    isLoading={isUnlocking}
                    isUnlocked={!!unlockedData}
                    onSealShattered={handleSealShattered}
                  />
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* VIEW 2: DEDICATED OWNER CONFIDENTIAL PREVIEW */}
        {currentView === 'owner-preview' && ownerPreviewMessage && (
          <div className="py-6 flex-1">
            <OwnerPreview
              message={ownerPreviewMessage}
              successMessage={ownerPreviewSuccess}
              onEdit={handleEditMessage}
              onReturnDashboard={() => navigateTo('dashboard')}
            />
          </div>
        )}

        {/* VIEW 3: DIRECT UNLOCK CODE LOOKUP */}
        {currentView === 'unlock-direct' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <UnlockDirectView
              onUnlockSlug={navigateToRecipient}
              onGoHome={() => navigateTo('dashboard')}
            />
          </div>
        )}

        {/* VIEW 4: COMPOSER (CREATE / EDIT) */}
        {(currentView === 'create' || currentView === 'edit') && (
          <div className="py-8">
            <MessageComposer
              initialData={editingMessage || undefined}
              onSave={handleSaveMessage}
              onCancel={() => navigateTo('dashboard')}
              isEditing={currentView === 'edit'}
            />
          </div>
        )}

        {/* VIEW 5: OWNER DASHBOARD OR PUBLIC WELCOME */}
        {currentView === 'dashboard' && (
          <div className="py-8 flex-1">
            {authStatus.authenticated ? (
              <OwnerDashboard
                messages={messages}
                onCreateNew={() => navigateTo('create')}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                onDuplicate={handleDuplicateMessage}
                onPreview={handleOwnerPreview}
              />
            ) : (
              /* Public Landing: Register & Login Portals */
              <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-10">
                {/* Hero Headline */}
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>DiwaliVerse Romantic Mystery Dispatches</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-slate-100 max-w-2xl mx-auto text-balance">
                    Words Meant Only for Your{' '}
                    <span className="shimmer-text">Beloved's Eyes</span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                    Compose password-locked secret letters sealed in 3D animated wax envelopes.
                    Interactive 3-click wax seal breaking, self-destruct upon reading, protected with PBKDF2 cryptography and Cloudflare D1.
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => openAuthModal('register')}
                    className="px-6 py-3 rounded-2xl font-medium text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition-all flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4 fill-current text-rose-600" />
                    <span>Register Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="px-5 py-3 rounded-2xl font-medium text-xs sm:text-sm text-slate-200 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Sign In to Vault</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('unlock-direct')}
                    className="px-5 py-3 rounded-2xl font-medium text-xs sm:text-sm text-slate-300 bg-slate-900/60 border border-slate-800 hover:bg-slate-800 transition-colors"
                  >
                    I Have a Secret Link or Code
                  </button>
                </div>

                {/* Showcase Interactive 3-Click Wax Seal Envelope Preview */}
                <div className="pt-6">
                  <Envelope3D
                    recipientName="My Beloved"
                    senderName="A Secret Admirer"
                    title="Under the Golden Diya Starlight"
                    theme="golden-diya"
                    seal="diya"
                    isUnlocked={true}
                    isOwnerPreview={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900/80 py-6 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            DiwaliVerse · Secret Messages · Cloudflare Workers &amp; D1 SQLite
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              type="button"
              onClick={() => setIsDocsModalOpen(true)}
              className="hover:text-amber-300 transition-colors"
            >
              Cloudflare Setup Guide
            </button>
            <span aria-hidden="true">·</span>
            <span>Zero-Knowledge Server Architecture</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Full Name, Email, Password, Confirm Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />

      {/* Cloudflare Architecture & Deployment Guide Modal */}
      <CloudflareGuideModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
      />
    </div>
  );
}
