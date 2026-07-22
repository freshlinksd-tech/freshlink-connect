/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { SocialPlatformProvider, useSocialPlatform } from './context/SocialPlatformContext';
import { Navigation } from './components/Navigation';
import { FreshLinkLogo } from './components/FreshLinkLogo';
import { motion } from 'motion/react';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { FeedPostSkeleton, ProfileSkeleton } from './components/SkeletonLoader';

const Auth = lazy(() => import('./components/Auth').then(m => ({ default: m.Auth })));
const Feed = lazy(() => import('./components/Feed').then(m => ({ default: m.Feed })));
const CreatePost = lazy(() => import('./components/CreatePost').then(m => ({ default: m.CreatePost })));
const Chat = lazy(() => import('./components/Chat').then(m => ({ default: m.Chat })));
const Profiles = lazy(() => import('./components/Profiles').then(m => ({ default: m.Profiles })));
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const OnboardingSetup = lazy(() => import('./components/OnboardingSetup').then(m => ({ default: m.OnboardingSetup })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const VerificationSetup = lazy(() => import('./components/VerificationSetup').then(m => ({ default: m.VerificationSetup })));
const MonetizationPanel = lazy(() => import('./components/MonetizationPanel').then(m => ({ default: m.MonetizationPanel })));
const Notifications = lazy(() => import('./components/Notifications').then(m => ({ default: m.Notifications })));
import { useTheme } from './hooks/useTheme';
import { 
  Sparkles, 
  Menu, 
  X, 
  Bookmark, 
  User, 
  MessageSquare, 
  Compass, 
  PlusCircle,
  Cpu,
  Wifi,
  WifiOff,
  ShieldCheck,
  Coins,
  Bell,
  Smartphone,
  Download,
  Sun,
  Moon
} from 'lucide-react';

function AppContent() {
  const { currentUser, loading, logout, messages, notifications, isOnline } = useSocialPlatform();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [targetChatUserId, setTargetChatUserId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-600 text-xs font-semibold uppercase tracking-wider animate-pulse font-mono">Synchronizing Live Channels...</p>
      </div>
    );
  }



  if (!currentUser) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider animate-pulse">Loading FreshLink Connection...</p>
        </div>
      }>
        <LandingPage />
      </Suspense>
    );
  }

  if (currentUser.isBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-6 text-center select-none font-sans" id="blocked-lockout-screen">
        <div className="bg-white p-8 max-w-md w-full rounded-2xl shadow-xl border border-red-50 flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 text-red-650 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-zinc-900 uppercase tracking-tight">Access Prohibited</h2>
          <p className="text-zinc-500 text-xs mt-3 leading-relaxed">
            This FreshLink profile (<span className="font-mono text-zinc-800 font-bold">{currentUser.email}</span>) has been blocked by administrators for community safety and code of conduct compliance.
          </p>
          <div className="bg-red-50 text-red-650 text-[10px] font-mono leading-relaxed p-4 rounded-xl mt-5 w-full text-left">
            <span>MODERATION INFRACTION: Writing, messaging, commenting and viewing access has been restricted.</span>
          </div>
          <button
            onClick={() => logout()}
            className="w-full mt-6 py-3 bg-black hover:bg-[#1A1A1A] text-white font-sans font-bold uppercase tracking-widest text-[10.5px] rounded-xl transition-all cursor-pointer"
          >
            Switch Creator Account
          </button>
        </div>
      </div>
    );
  }

  const needsVerification = currentUser && 
    currentUser.hasSetupAccount === true && 
    currentUser.isAdmin !== true && 
    currentUser.role !== 'admin' && 
    (currentUser.hasVerifiedDetails !== true || currentUser.isApprovedByAdmin !== true);
  if (needsVerification) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider animate-pulse">Loading Identity Verification Portal...</p>
        </div>
      }>
        <VerificationSetup />
      </Suspense>
    );
  }

  // Trigger when feed links call for direct profile inspection
  const handleSelectUser = (userId: string) => {
    setSelectedUser(userId);
    setActiveTab('profile');
    setMobileMenuOpen(false);
  };

  // Trigger when cards request instant chat room engagement
  const handleNavigateToChat = (userId: string) => {
    setTargetChatUserId(userId);
    setActiveTab('chat');
    setMobileMenuOpen(false);
  };

  const handleOpenAuth = () => {
    setAuthOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-zinc-900 dark:text-stone-100 flex flex-col md:flex-row font-sans antialiased">
      
      {/* Real-time Setup Wizard Portal for First Login */}
      {currentUser.hasSetupAccount === false && (
        <Suspense fallback={null}>
          <OnboardingSetup />
        </Suspense>
      )}
      
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200/50 dark:border-stone-850/50 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <FreshLinkLogo className="w-8 h-8 text-orange-500 transform hover:scale-105 transition-smooth" />
          <span className="font-display font-black text-lg tracking-tight text-zinc-950 dark:text-stone-50 uppercase">
            FRESHLINK <span className="text-orange-500">CONNECT</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile User-facing Theme Toggle Button */}
          <button
            type="button"
            id="mobile-theme-toggle-btn"
            onClick={toggleTheme}
            className="p-1.5 px-2 text-zinc-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer outline-none"
            title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          <button
            type="button"
            onClick={() => {
              const isIframe = window.self !== window.top;
              if (isIframe) {
                window.open(window.location.href, '_blank');
              } else {
                window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
              }
            }}
            className="p-1.5 px-2.5 text-orange-650 dark:text-orange-400 hover:text-white hover:bg-orange-600 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/30 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer outline-none"
            title="Install Mobile App"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="sm:inline hidden">Install App</span>
          </button>

          <button
            id="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 px-2.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-50 dark:bg-stone-900 rounded-lg hover:shadow-sm"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className="md:hidden fixed inset-0 bg-zinc-900/40 dark:bg-stone-950/60 backdrop-blur-sm z-30" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 bg-white dark:bg-stone-950 h-full shadow-2xl flex flex-col pt-20 border-r border-stone-100 dark:border-stone-850" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 space-y-1">
               {(() => {
                const isAdmin = currentUser?.email?.toLowerCase() === 'fresh.linksd@gmail.com' || currentUser?.isAdmin === true || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
                const itemsList = [
                  { id: 'feed', name: 'Home Feed', icon: Compass },
                  { id: 'create', name: 'Create Post', icon: PlusCircle },
                  { id: 'chat', name: 'Direct Messages', icon: MessageSquare },
                  { id: 'notifications', name: 'Notifications', icon: Bell },
                  { id: 'bookmarks', name: 'Saved Blogs', icon: Bookmark },
                  { id: 'monetization', name: 'Monetization Hub', icon: Coins },
                  ...(isAdmin ? [{ id: 'admin', name: 'Admin Control', icon: ShieldCheck }] : [])
                ];
                const unreadCount = currentUser && messages ? messages.filter(
                  msg => msg.receiverId === currentUser.id && !msg.read
                ).length : 0;
                const unreadNotifications = currentUser && notifications ? notifications.filter(
                  n => n.userId === currentUser.id && !n.read
                ).length : 0;

                return itemsList.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`mobile-nav-tab-${item.id}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-sans text-sm font-medium transition-all ${
                        isActive ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-stone-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </div>
                      {item.id === 'chat' && unreadCount > 0 && (
                        <span className="bg-orange-600 text-white font-mono text-[9.5px] font-bold px-2.5 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                      {item.id === 'notifications' && unreadNotifications > 0 && (
                        <span className="bg-orange-600 text-white font-mono text-[9.5px] font-bold px-2.5 py-0.5 rounded-full">
                          {unreadNotifications}
                        </span>
                      )}
                    </button>
                  );
                });
              })()}

              {currentUser && (
                <button
                  id="mobile-nav-tab-profile"
                  onClick={() => {
                    setSelectedUser(null);
                    setActiveTab('profile');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm font-medium transition-all ${
                    activeTab === 'profile' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-stone-900/40'
                  }`}
                >
                  <User className="w-5 h-5" />
                  My Profile
                </button>
              )}

              {/* Theme Switcher inside Mobile Drawer */}
              <button
                id="mobile-drawer-theme-toggle"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-sans text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-stone-900/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                  <span>Appearance</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  {isDark ? 'Dark' : 'Light'}
                </span>
              </button>
            </div>

            {/* PWA Direct Installation Mobile Drawer prompter */}
            <div className="mx-4 mt-4 p-3 bg-gradient-to-br from-orange-50/70 to-amber-50/50 dark:from-stone-900/40 dark:to-stone-950/20 border border-orange-100/50 dark:border-stone-850/50 rounded-xl" id="mobile-drawer-pwa-install-prompter">
              <div className="flex gap-2 items-start">
                <div className="bg-orange-500/10 p-1.5 rounded-lg border border-orange-500/20 text-orange-600 shrink-0">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <h4 className="font-sans font-black text-[9.5px] text-zinc-900 dark:text-stone-200 uppercase tracking-tighter">Use like App</h4>
                  <p className="text-[8.5px] text-zinc-500 dark:text-zinc-400 leading-normal font-semibold">Zero-delay loading & push notifications!</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const isIframe = window.self !== window.top;
                  if (isIframe) {
                    window.open(window.location.href, '_blank');
                  } else {
                    window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
                  }
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-2 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition shadow-sm flex items-center justify-center gap-1 cursor-pointer outline-none"
              >
                <Download className="w-3 h-3" />
                <span>Install Mobile App</span>
              </button>
            </div>

            <div className="mt-auto p-4 border-t border-zinc-100 dark:border-stone-850 bg-zinc-50 dark:bg-stone-900/40">
              {currentUser ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-700 dark:text-stone-300 truncate">{currentUser.name}</span>
                    <span className="text-[9.5px] text-orange-650 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-full font-bold">online</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={handleOpenAuth}
                      className="py-1.5 px-2 bg-zinc-200 dark:bg-stone-800 text-zinc-850 dark:text-stone-200 text-[10px] font-bold rounded-lg transition-all"
                    >
                      Switch Profile
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleOpenAuth}
                  className="w-full py-2 bg-emerald-600 text-white font-medium text-xs rounded-xl"
                >
                  Authenticate
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Primary Desktop Navigation Sidebar */}
      <div className="hidden md:block shrink-0">
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenAuth={handleOpenAuth}
          setSelectedUser={setSelectedUser}
        />
      </div>

      {/* Main Screen Content Stage */}
      <main className="flex-1 min-w-0" id="main-canvas-stage">


        {/* Physical Offline Connection Banner */}
        {!isOnline && (
          <div 
            id="pwa-physical-offline-notice" 
            className="m-4 md:m-6 bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200 rounded-3xl p-5 shadow-xs flex items-start gap-4 transition-all"
          >
            <div className="relative shrink-0 mt-0.5">
              <div className="bg-amber-500/15 p-3 rounded-2xl border border-amber-500/25 text-amber-600">
                <WifiOff className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
            </div>
            <div className="space-y-1.5 text-left">
              <h4 className="font-sans font-black text-xs text-zinc-950 uppercase tracking-wider flex items-center gap-2">
                ⚡ Offline Mode Active — Local Sandbox Engaged
              </h4>
              <p className="text-[11.5px] text-zinc-650 leading-relaxed font-semibold max-w-2xl">
                Your device is disconnected from the internet. FreshLink Connect is operating in <strong className="text-amber-800 font-extrabold">Offline Sandbox Mode</strong> with high-speed local databases. You can continue reading articles, writing drafts, adding comments, reacting, and sending direct messages. Your changes are stored securely and will synchronize automatically when connection is restored.
              </p>
            </div>
          </div>
        )}



        {/* Screen Routing logic */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="h-full"
        >
          <Suspense fallback={activeTab === 'profile' ? <ProfileSkeleton /> : <FeedPostSkeleton />}>
            {(() => {
              switch (activeTab) {
                case 'feed':
                  return (
                    <Feed 
                      onSelectUser={handleSelectUser} 
                      onNavigateToChat={handleNavigateToChat}
                      activeCategoryFilter={activeCategoryFilter}
                      setActiveCategoryFilter={setActiveCategoryFilter}
                    />
                  );
                case 'create':
                  return (
                    <CreatePost 
                      onSuccess={() => setActiveTab('feed')} 
                    />
                  );
                case 'chat':
                  return (
                    <Chat 
                      onSelectUser={handleSelectUser}
                      targetChatUserId={targetChatUserId}
                      setTargetChatUserId={setTargetChatUserId}
                    />
                  );
                case 'bookmarks':
                  return (
                    <Feed 
                      onSelectUser={handleSelectUser} 
                      onNavigateToChat={handleNavigateToChat}
                      activeCategoryFilter="all"
                      setActiveCategoryFilter={setActiveCategoryFilter}
                      isBookmarksOnly={true}
                    />
                  );
                case 'notifications':
                  return (
                    <Notifications />
                  );
                case 'profile':
                  return (
                    <Profiles
                      targetUserId={selectedUser}
                      onSelectUser={handleSelectUser}
                      onNavigateToChat={handleNavigateToChat}
                      onOpenAuth={handleOpenAuth}
                    />
                  );
                case 'admin':
                  return (
                    <AdminPanel
                      onSelectUser={handleSelectUser}
                    />
                  );
                case 'monetization':
                  return (
                    <MonetizationPanel />
                  );
                default:
                  return <Feed onSelectUser={handleSelectUser} onNavigateToChat={handleNavigateToChat} activeCategoryFilter="all" setActiveCategoryFilter={setActiveCategoryFilter} />;
              }
            })()}
          </Suspense>
        </motion.div>
      </main>

      {/* Unified Authentication Setup Portal */}
      {authOpen && (
        <Suspense fallback={null}>
          <Auth onClose={() => setAuthOpen(false)} />
        </Suspense>
      )}

      {/* PWA Smart Installation Banner */}
      <PWAInstallPrompt />

    </div>
  );
}

export default function App() {
  return (
    <SocialPlatformProvider>
      <AppContent />
    </SocialPlatformProvider>
  );
}
