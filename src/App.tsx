/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SocialPlatformProvider, useSocialPlatform } from './context/SocialPlatformContext';
import { Navigation } from './components/Navigation';
import { Auth } from './components/Auth';
import { Feed } from './components/Feed';
import { FreshLinkLogo } from './components/FreshLinkLogo';
import { motion } from 'motion/react';
import { CreatePost } from './components/CreatePost';
import { Chat } from './components/Chat';
import { Profiles } from './components/Profiles';
import { LandingPage } from './components/LandingPage';
import { OnboardingSetup } from './components/OnboardingSetup';
import { AdminPanel } from './components/AdminPanel';
import { VerificationSetup } from './components/VerificationSetup';
import { MonetizationPanel } from './components/MonetizationPanel';
import { AdBubblePortal } from './components/AdBubblePortal';
import { Notifications } from './components/Notifications';
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
  ShieldCheck,
  Coins,
  Bell,
  Gift
} from 'lucide-react';

function AppContent() {
  const { currentUser, logout, messages, notifications } = useSocialPlatform();
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [targetChatUserId, setTargetChatUserId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const [showBirthdayCard, setShowBirthdayCard] = useState<boolean>(() => {
    const dismissed = sessionStorage.getItem(`birthday_dismissed_${new Date().toDateString()}`);
    return !dismissed;
  });

  const isBirthdayToday = React.useMemo(() => {
    if (!currentUser?.dob) return false;
    try {
      const dobDate = new Date(currentUser.dob);
      const today = new Date();
      return dobDate.getMonth() === today.getMonth() && dobDate.getDate() === today.getDate();
    } catch (e) {
      return false;
    }
  }, [currentUser?.dob]);
  
  if (!currentUser) {
    return <LandingPage />;
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
    (!currentUser.phoneNumber || (!currentUser.panNumber && !currentUser.officialDocId) || currentUser.isApprovedByAdmin !== true);
  if (needsVerification) {
    return <VerificationSetup />;
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
    <div className="min-h-screen bg-stone-50 text-zinc-900 flex flex-col md:flex-row font-sans antialiased">
      
      {/* Real-time Setup Wizard Portal for First Login */}
      {currentUser.hasSetupAccount === false && (
        <OnboardingSetup />
      )}
      
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white/95 backdrop-blur-md border-b border-stone-200/50 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <FreshLinkLogo className="w-8 h-8 text-orange-500 transform hover:scale-105 transition-smooth" />
          <span className="font-display font-black text-lg tracking-tight text-zinc-950 uppercase">
            FRESHLINK <span className="text-orange-500">CONNECT</span>
          </span>
        </div>

        <button
          id="mobile-hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 px-2.5 text-zinc-500 hover:text-zinc-800 bg-zinc-50 rounded-lg hover:shadow-sm"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className="md:hidden fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-30" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 bg-white h-full shadow-2xl flex flex-col pt-20" onClick={(e) => e.stopPropagation()}>
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
                        isActive ? 'bg-orange-50 text-orange-700' : 'text-zinc-500 hover:bg-zinc-50'
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
                    activeTab === 'profile' ? 'bg-emerald-50 text-emerald-700' : 'text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  <User className="w-5 h-5" />
                  My Profile
                </button>
              )}
            </div>

            <div className="mt-auto p-4 border-t border-zinc-100 bg-zinc-50">
              {currentUser ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-700 truncate">{currentUser.name}</span>
                    <span className="text-[9.5px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-bold">online</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={handleOpenAuth}
                      className="py-1.5 px-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-[10px] font-bold rounded-lg transition-all"
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
        {/* Screen Routing logic */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="h-full"
        >
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
        </motion.div>
      </main>

      {/* Unified Authentication Setup Portal */}
      {authOpen && (
        <Auth onClose={() => setAuthOpen(false)} />
      )}

      {/* Interactive Ad Popping Bubble Portal System */}
      <AdBubblePortal />

      {/* AUTOMATIC BIRTHDAY CELEBRATION SENTINEL */}
      {isBirthdayToday && showBirthdayCard && (
        <div className="fixed inset-0 bg-[#0c0a09]/70 backdrop-blur-md flex items-center justify-center p-6 z-[200] animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#1c1917] text-white border border-amber-500/30 p-8 rounded-[2rem] max-w-md w-full shadow-2xl relative overflow-hidden text-center font-sans">
            
            {/* Animated Celebration Background Spheres */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative space-y-6">
              {/* Animated Floating Present Icon */}
              <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-amber-500 to-orange-500 text-zinc-950 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/20 transform hover:scale-110 transition duration-300">
                <Gift className="w-10 h-10 animate-bounce" />
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/20">
                  HAPPY BIRTHDAY TO YOU! 🎉
                </span>
                <h2 className="font-sans font-black text-2xl md:text-3xl tracking-tighter uppercase leading-none mt-2">
                  Have a great day, <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">
                    {currentUser.name}!
                  </span>
                </h2>
              </div>
              
              <p className="text-zinc-300 text-xs leading-relaxed max-w-sm mx-auto font-medium">
                FreshLink Connect wishes you a marvelous day filled with peace, spectacular creations, and premium residual payouts. Your continuous stories inspire readers worldwide! 🎂✨
              </p>
              
              <div className="pt-2">
                <button
                  onClick={() => {
                    sessionStorage.setItem(`birthday_dismissed_${new Date().toDateString()}`, 'true');
                    setShowBirthdayCard(false);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 text-zinc-950 font-sans font-black uppercase tracking-widest text-[11px] rounded-2xl transition duration-200 cursor-pointer shadow-lg shadow-orange-500/10"
                >
                  🍰 Thank you so much!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
